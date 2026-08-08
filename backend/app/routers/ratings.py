from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from ..database import get_db_pool
from ..schemas import CountResponse

import re
from pathlib import Path

router = APIRouter(tags=["ratings"])

_cache_time: datetime | None = None
_cache_count: int | None = None
_CACHE_DURATION = timedelta(minutes=10)

def _load_bad_words():
    words_file = Path(__file__).parent.parent / "filters" / "words.txt"
    if words_file.exists():
        with open(words_file, "r", encoding="utf-8") as f:
            return [line.strip().lower() for line in f if line.strip()]
    return []

_BAD_WORDS = _load_bad_words()

def _censor_comment(text: str) -> str:
  
    if not text or not _BAD_WORDS:
        return text

    def replace_func(match):
        return "*" * len(match.group(0))

    pattern = r"(?i)(" + "|".join(re.escape(word) for word in _BAD_WORDS) + ")"
    return re.sub(pattern, replace_func, text)

class CriterionRatingItem(BaseModel):
    criterionId: str = Field(..., example="product_quality")
    value: float = Field(..., ge=1, le=5, example=4.5)

class CreateRatingRequest(BaseModel):
    objectId: int
    criterionRatings: List[CriterionRatingItem]
    comment: Optional[str] = None
    photos: Optional[List[str]] = None

async def _fetch_ratings_count_from_db():
    pool = await get_db_pool()
    query = "SELECT COUNT(*) FROM ratings"
    async with pool.acquire() as conn:
        return await conn.fetchval(query)

@router.get("/ratings/count", response_model=CountResponse)
async def get_ratings_count():
    global _cache_time, _cache_count

    now = datetime.now()
    if _cache_time and (now - _cache_time) < _CACHE_DURATION and _cache_count is not None:
        return CountResponse(count=_cache_count)

    try:
        count = await _fetch_ratings_count_from_db()
        _cache_time = now
        _cache_count = count
        return CountResponse(count=count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
@router.post("/ratings", status_code=201)
async def create_rating(
    data: CreateRatingRequest,
    user_id: int = Query(..., description="ID пользователя (для MVP передаётся вручную)")
):
    
    try:
        clean_comment = _censor_comment(data.comment) if data.comment else None

        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.transaction():
                rating_query = """
                    INSERT INTO ratings (object_id, user_id, comment, photos)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                """
                rating_id = await conn.fetchval(
                    rating_query,
                    data.objectId,
                    user_id,
                    clean_comment,
                    data.photos or []
                )

                for cr in data.criterionRatings:
                    await conn.execute(
                        """
                        INSERT INTO criterion_ratings (rating_id, criterion_id, value)
                        VALUES ($1, $2, $3)
                        """,
                        rating_id,
                        cr.criterionId,
                        cr.value
                    )

               
                points = 30  
                if data.photos:
                    points += 20 

                await conn.execute(
                    "UPDATE yandex_users SET points = points + $1 WHERE id = $2",
                    points,
                    user_id
                )

        return {
            "message": "Оценка успешно создана",
            "data": {
                "id": rating_id,
                "objectId": data.objectId,
                "userId": user_id,
                "criterionRatings": [
                    {"criterionId": cr.criterionId, "value": cr.value}
                    for cr in data.criterionRatings
                ],
                "comment": clean_comment,  
                "photos": data.photos
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при создании оценки: {str(e)}")
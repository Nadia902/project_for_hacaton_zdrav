from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import List
from ..database import get_db_pool
from ..schemas import CountResponse, ObjectItem, ObjectDetail

router = APIRouter(tags=["objects"])


_cache_time: datetime | None = None
_cache_count: int | None = None
_CACHE_DURATION = timedelta(minutes=10)

async def _fetch_objects_count_from_db():
    pool = await get_db_pool()
    query = "SELECT COUNT(*) FROM infrastructure_objects"
    async with pool.acquire() as conn:
        return await conn.fetchval(query)

@router.get("/objects/count", response_model=CountResponse)
async def get_objects_count():
    global _cache_time, _cache_count

    now = datetime.now()
    if _cache_time and (now - _cache_time) < _CACHE_DURATION and _cache_count is not None:
        return CountResponse(count=_cache_count)

    try:
        count = await _fetch_objects_count_from_db()
        _cache_time = now
        _cache_count = count
        return CountResponse(count=count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/objects", response_model=List[ObjectItem])
async def get_objects():
    try:
        pool = await get_db_pool()
        query = 'select id, mo, "name", adres, tip, longitude, latitude, added from infrastructure_objects'
        async with pool.acquire() as conn:
            rows = await conn.fetch(query)
        return [ObjectItem(**dict(row)) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    

@router.get("/object/id/{object_id}", response_model=ObjectDetail)
async def get_object_by_id(object_id: int):
    try:
        pool = await get_db_pool()
        query = '''
            SELECT mo, "name", adres, tip, added
            FROM infrastructure_objects
            WHERE id = $1
        '''
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, object_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Object not found")
        return ObjectDetail(**dict(row))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
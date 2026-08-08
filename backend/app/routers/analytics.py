from fastapi import APIRouter, HTTPException
from typing import List
from ..database import get_db_pool
from ..schemas import HealthIndexResponse, HealthIndexByMoItem

router = APIRouter(tags=["analytics"])

@router.get("/analytics/health-index", response_model=HealthIndexResponse)
async def get_health_index_by_mo():
    
    try:
        pool = await get_db_pool()
        query = """
            WITH mo_stats AS (
                SELECT
                    io.mo,
                    AVG(io.health_index) AS health_index,
                    COUNT(DISTINCT r.id) AS total_ratings
                FROM infrastructure_objects io
                LEFT JOIN ratings r ON io.id = r.object_id
                WHERE io.mo IS NOT NULL AND io.health_index IS NOT NULL
                GROUP BY io.mo
            )
            SELECT
                m.name AS mo,
                ROUND(ms.health_index, 2) AS health_index,
                ms.total_ratings,
                m.population,
                ROUND(ms.total_ratings::NUMERIC / m.population * 1000, 2) AS ratings_per_1000
            FROM mo_stats ms
            JOIN municipalities m ON ms.mo = m.name
            ORDER BY ratings_per_1000 DESC;
        """
        async with pool.acquire() as conn:
            rows = await conn.fetch(query)

        data = [
            HealthIndexByMoItem(
                mo=row["mo"],
                health_index=row["health_index"],
                total_ratings=row["total_ratings"],
                population=row["population"],
                ratings_per_1000=row["ratings_per_1000"]
            )
            for row in rows
        ]
        return HealthIndexResponse(data=data)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при расчёте индекса здоровья: {str(e)}"
        )
from fastapi import APIRouter, HTTPException, Depends, Header, Query
from datetime import datetime, timedelta
from ..database import get_db_pool
from ..schemas import CountResponse, UserResponse, TopUsersResponse, TopUserItem
from jose import jwt
import os
from typing import Optional, List
import asyncpg

router = APIRouter(tags=["users"])

_cache_time: datetime | None = None
_cache_count: int | None = None
_CACHE_DURATION = timedelta(minutes=10)

async def _fetch_users_count_from_db():
    pool = await get_db_pool()
    query = "SELECT COUNT(*) AS total_users FROM yandex_users;"
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query)
        return row["total_users"]

@router.get("/users/count", response_model=CountResponse)
async def get_users_count():
    global _cache_time, _cache_count

    now = datetime.now()
    if _cache_time and (now - _cache_time) < _CACHE_DURATION and _cache_count is not None:
        return CountResponse(count=_cache_count)

    try:
        count = await _fetch_users_count_from_db()
        _cache_time = now
        _cache_count = count
        return CountResponse(count=count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

async def save_or_update_user_from_oauth(user_data: dict):
    
    pool = await get_db_pool()
    

    query_check = """
        SELECT id FROM yandex_users 
        WHERE email = $1 OR yandex_id = $2
    """
    
    async with pool.acquire() as conn:
       
        existing_user = await conn.fetchrow(
            query_check, 
            user_data.get('email'), 
            user_data.get('yandex_id')
        )
        
        if existing_user:
           
            query_update = """
                UPDATE yandex_users 
                SET username = $1, avatar = $2, updated_at = NOW()
                WHERE id = $3
                RETURNING id, username, email, avatar, points, badges, level, created_at
            """
            
            updated_user = await conn.fetchrow(
                query_update,
                user_data.get('username'),
                user_data.get('avatar'),
                existing_user['id']
            )
            
            return updated_user
        else:
           
            query_insert = """
                INSERT INTO yandex_users 
                (yandex_id, username, email, avatar, points, badges, level)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, username, email, avatar, points, badges, level, created_at
            """
            
            new_user = await conn.fetchrow(
                query_insert,
                user_data.get('yandex_id'),
                user_data.get('username'),
                user_data.get('email'),
                user_data.get('avatar'),
                user_data.get('points', 0),
                user_data.get('badges', []),
                user_data.get('level', 'Новичок')
            )
            
            return new_user


async def save_user_token(user_id: str, token: str, token_type: str = "jwt"):
   
    pool = await get_db_pool()
    
    query = """
        INSERT INTO user_tokens (user_id, token, token_type, expires_at)
        VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')
        ON CONFLICT (user_id, token_type) 
        DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at
    """
    
    async with pool.acquire() as conn:
        await conn.execute(query, user_id, token, token_type)


async def get_db_connection():
    from ..database import get_db_pool
    pool = await get_db_pool()
    return await pool.acquire()


@router.get("/users/me")
async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    token: Optional[str] = Query(None)
):
    
    
    jwt_token = None
    
    if authorization:
        if authorization.startswith("Bearer "):
            jwt_token = authorization.replace("Bearer ", "")
        else:
            jwt_token = authorization
    elif token:
        jwt_token = token
    
    if not jwt_token:
        raise HTTPException(
            status_code=401,
            detail="Токен не предоставлен. Используйте заголовок Authorization: Bearer {token} или query параметр ?token={token}"
        )
    
    try:
        secret_key = os.getenv("SECRET_KEY")
        if not secret_key:
            secret_key = "temporary-secret-key-for-development-only-change-this-in-production"
        
        algorithm = os.getenv("ALGORITHM", "HS256")
        
        payload = jwt.decode(jwt_token, secret_key, algorithms=[algorithm])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Неверный токен")
        
        conn = await get_db_connection()
        try:
            query = "SELECT * FROM yandex_users WHERE id = $1"
            user = await conn.fetchrow(query, int(user_id))
            
            if not user:
                raise HTTPException(status_code=404, detail="Пользователь не найден")
            
            user_response = UserResponse(
                token_id=user.get("token_id", ""),
                login=user.get("login", ""),
                email=user.get("email", ""),
                avatar_url=user.get("avatar_url"),
                points=user.get("points", 0),
                lvl=user.get("level", "Новичок"),
                badges=user.get("badges", ["Начало положено"])
            )
            
            return {"data": user_response.dict()}
        finally:
            await conn.close()
            
    except jwt.JWTError as e:
        raise HTTPException(status_code=401, detail=f"Неверный токен: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сервера: {str(e)}")

@router.get("/users/top", response_model=TopUsersResponse)
async def get_top_users(limit: int = 10):
   
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 100")

    try:
        pool = await get_db_pool()
        query = """
            SELECT login, avatar_url, points, lvl
            FROM yandex_users
            ORDER BY points DESC, created_at ASC
            LIMIT $1
        """
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, limit)

        data = [
            TopUserItem(
                login=row["login"],
                avatar_url=row["avatar_url"],
                points=row["points"],
                lvl=row["lvl"]
            )
            for row in rows
        ]
        return TopUsersResponse(data=data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
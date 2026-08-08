from fastapi import APIRouter, HTTPException, Response, Request, Depends, Query
from fastapi.responses import RedirectResponse, HTMLResponse, JSONResponse
from pydantic import BaseModel
import httpx
import os
import secrets
import json
import base64
from urllib.parse import urlencode, quote, urlparse, parse_qs
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from jose import jwt, JWTError
import asyncpg
import logging

router = APIRouter(tags=["auth"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CallbackRequest(BaseModel):
    code: str
    state: str
    cid: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    login: str
    email: str
    avatar_url: Optional[str] = None
    token_id: str
    created_at: str

class AuthResponse(BaseModel):
    user: UserResponse
    token: str

class AuthSuccessResponse(BaseModel):
    success: bool = True
    data: AuthResponse

class AuthErrorResponse(BaseModel):
    success: bool = False
    error: str
    error_code: Optional[str] = None

class TokenValidationRequest(BaseModel):
    token: str


state_store = {}
state_timeout = timedelta(minutes=10) 

def cleanup_expired_states():
   
    now = datetime.now()
    expired_states = []
    
    for state, data in list(state_store.items()):
        created_at = data.get("created_at")
        if created_at and (now - created_at) > state_timeout:
            expired_states.append(state)
    
    for state in expired_states:
        del state_store[state]
    
    if expired_states:
        logger.info(f"Очищено {len(expired_states)} устаревших state")

async def get_db_connection():
   
    from ..database import get_db_pool
    pool = await get_db_pool()
    return await pool.acquire()

async def find_or_create_user(yandex_user: dict, access_token: str) -> dict:
   
    user_email = yandex_user.get("default_email") or (
        yandex_user.get("emails")[0] if yandex_user.get("emails") else None
    )
    
    if not user_email:
        raise HTTPException(
            status_code=400,
            detail="Email не получен от Яндекс"
        )

    conn = None
    try:
        conn = await get_db_connection()
        
        query = "SELECT * FROM yandex_users WHERE email = $1"
        existing_user = await conn.fetchrow(query, user_email)
        
        if existing_user:
            update_query = """
                UPDATE yandex_users 
                SET token_id = $1, avatar_url = $2, login = $3
                WHERE email = $4 
                RETURNING *
            """
            updated_user = await conn.fetchrow(
                update_query,
                access_token,
                yandex_user.get("default_avatar_id"),
                yandex_user.get("login", ""),
                user_email
            )
            user = updated_user
            logger.info(f"Пользователь обновлен: {user_email}")
        else:
            insert_query = """
                INSERT INTO yandex_users (
                    token_id, 
                    login, 
                    email, 
                    avatar_url, 
                    points, 
                    lvl, 
                    badges
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            """
            new_user = await conn.fetchrow(
                insert_query,
                access_token,
                yandex_user.get("login", ""),
                user_email,
                yandex_user.get("default_avatar_id"),
                0,  
                'Новичок', 
                ['Начало положено']  
            )
            user = new_user
            logger.info(f"Создан новый пользователь: {user_email}")
            
    except asyncpg.UniqueViolationError:
        query = "SELECT * FROM yandex_users WHERE email = $1"
        user = await conn.fetchrow(query, user_email)
        logger.warning(f"Unique violation, получен существующий пользователь: {user_email}")
    except Exception as e:
        logger.error(f"Ошибка работы с БД: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка работы с БД: {str(e)}"
        )
    finally:
        if conn:
            await conn.close()
    
    if user:
        return dict(user)
    else:
        raise HTTPException(
            status_code=500,
            detail="Не удалось создать или получить пользователя"
        )

def create_jwt_token(user_id: int, email: str) -> str:
    secret_key = os.getenv("JWT_SECRET_KEY")
    
    if not secret_key:
        logger.warning("JWT_SECRET_KEY не установлен, использую временный ключ")
        secret_key = "temporary-secret-key-for-development-only-change-this-in-production"
    
    algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    expire_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    token_data = {
        "sub": str(user_id),
        "email": email,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=expire_minutes)
    }
    
    try:
        return jwt.encode(token_data, secret_key, algorithm=algorithm)
    except Exception as e:
        logger.error(f"Ошибка создания JWT токена: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка создания JWT токена: {str(e)}"
        )

def decode_jwt_token(token: str) -> dict:
    secret_key = os.getenv("JWT_SECRET_KEY")
    
    if not secret_key:
        secret_key = "temporary-secret-key-for-development-only-change-this-in-production"
    
    algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Токен истек")
    except jwt.JWTError as e:
        raise HTTPException(status_code=401, detail=f"Неверный токен: {str(e)}")

async def get_user_by_id(user_id: int) -> Optional[dict]:
    conn = None
    try:
        conn = await get_db_connection()
        query = """
            SELECT id, token_id, login, email, avatar_url, 
                   points, lvl, created_at, badges
            FROM yandex_users 
            WHERE id = $1
        """
        user = await conn.fetchrow(query, user_id)
        return dict(user) if user else None
    except Exception as e:
        logger.error(f"Ошибка получения пользователя: {str(e)}")
        return None
    finally:
        if conn:
            await conn.close()


@router.post("/auth/yandex")
async def initiate_yandex_auth():
    client_id = os.getenv("YANDEX_CLIENT_ID")
    redirect_uri = os.getenv("YANDEX_REDIRECT_URI")

    if not client_id:
        raise HTTPException(
            status_code=500,
            detail="YANDEX_CLIENT_ID не настроен в переменных окружения"
        )
    
    if not redirect_uri:
        raise HTTPException(
            status_code=500,
            detail="YANDEX_REDIRECT_URI не настроен в переменных окружения"
        )

    cleanup_expired_states()
    
    state = secrets.token_urlsafe(32)
    state_store[state] = {
        "created_at": datetime.now(),
        "stage": "created",  
        "code": None,
        "cid": None,
        "callback_received_at": None,
        "processed_at": None
    }

    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "state": state,
    }
    auth_url = f"https://oauth.yandex.ru/authorize?{urlencode(params)}"

    logger.info(f"Создан новый state: {state}")
    
    return {
        "success": True,
        "data": {
            "authUrl": auth_url,
            "state": state
        }
    }


@router.get("/auth/yandex/callback")
async def handle_yandex_callback_get(
    code: str,
    state: str,
    cid: Optional[str] = None,
    request: Request = None
):

    
    logger.info(f"Получен callback от Яндекс: code={code[:10]}..., state={state}")
    
    if not code or not state:
        frontend_url = os.getenv("FRONTEND_URL", "https://sololevelingzdravmaps.ru")
        error_redirect_url = f"{frontend_url}/auth-error?error=Отсутствуют обязательные параметры авторизации"
        return RedirectResponse(url=error_redirect_url, status_code=302)
    
    cleanup_expired_states()
    
    if state not in state_store:
        logger.warning(f"State не найден: {state}")
        frontend_url = os.getenv("FRONTEND_URL", "https://sololevelingzdravmaps.ru")
        error_redirect_url = f"{frontend_url}/auth-error?error=Неверный или истекший state параметр"
        return RedirectResponse(url=error_redirect_url, status_code=302)
    
    state_store[state].update({
        "stage": "callback_received",
        "code": code,
        "cid": cid,
        "callback_received_at": datetime.now()
    })
    
    logger.info(f"Callback получен, обновлен state: {state}")
    
    frontend_url = os.getenv("FRONTEND_URL", "https://sololevelingzdravmaps.ru")
    
    auth_params = {
        "code": code,
        "state": state,
        "cid": cid or "",
        "timestamp": datetime.now().isoformat()
    }
    
    encoded_params = base64.urlsafe_b64encode(
        json.dumps(auth_params).encode()
    ).decode()
    
    redirect_url = f"{frontend_url}/auth/callback?data={encoded_params}"
    
    logger.info(f"Редирект на фронтенд: {redirect_url[:100]}...")
    return RedirectResponse(url=redirect_url, status_code=302)


@router.post("/auth/yandex/callback")
async def handle_yandex_callback_post(request: CallbackRequest):
    return await process_yandex_callback(request.code, request.state, request.cid)


@router.get("/auth/process")
async def process_auth_code(
    code: str = Query(..., description="Код авторизации от Яндекс OAuth"),
    state: str = Query(..., description="State параметр для проверки CSRF"),
    cid: Optional[str] = Query(None, description="Client ID для отслеживания")
):
    
    try:
        logger.info(f"Обработка кода авторизации: code={code[:10]}..., state={state}")
        

        cleanup_expired_states()
        

        if state not in state_store:
            logger.warning(f"State не найден в store: {state}")
            return JSONResponse(
                status_code=400,
                content=AuthErrorResponse(
                    error="Неверный или истекший state параметр",
                    error_code="INVALID_STATE"
                ).dict()
            )
        

        state_data = state_store[state]
        state_stage = state_data.get("stage", "")
        

        if state_stage == "completed":
            logger.warning(f"State уже обработан: {state}")
            
            return JSONResponse(
                status_code=400,
                content=AuthErrorResponse(
                    error="Авторизация уже была выполнена. Пожалуйста, войдите снова.",
                    error_code="ALREADY_AUTHENTICATED"
                ).dict()
            )
        
        elif state_stage == "processing":
            logger.warning(f"State уже в обработке: {state}")
            
            return JSONResponse(
                status_code=429,
                content=AuthErrorResponse(
                    error="Авторизация уже выполняется. Пожалуйста, подождите.",
                    error_code="AUTH_IN_PROGRESS"
                ).dict()
            )

        state_store[state]["stage"] = "processing"
        state_store[state]["processing_started_at"] = datetime.now()
        
        try:

            result = await process_yandex_callback(code, state, cid)
            
            state_store[state]["stage"] = "completed"
            state_store[state]["processed_at"] = datetime.now()
            
            logger.info(f"Авторизация успешна для пользователя: {result['data']['user']['login']}")
            
            return JSONResponse(
                status_code=200,
                content=AuthSuccessResponse(
                    data=AuthResponse(
                        user=UserResponse(**result["data"]["user"]),
                        token=result["data"]["token"]
                    )
                ).dict()
            )
            
        except Exception as e:
            state_store[state]["stage"] = "callback_received"
            if "processing_started_at" in state_store[state]:
                del state_store[state]["processing_started_at"]
            raise
        
    except HTTPException as e:
        logger.error(f"HTTP ошибка при обработке авторизации: {e.detail}")
        return JSONResponse(
            status_code=e.status_code,
            content=AuthErrorResponse(
                error=e.detail,
                error_code="AUTH_PROCESS_ERROR"
            ).dict()
        )
    except Exception as e:
        logger.error(f"Неожиданная ошибка при обработке авторизации: {str(e)}")
        return JSONResponse(
            status_code=500,
            content=AuthErrorResponse(
                error="Внутренняя ошибка сервера при обработке авторизации",
                error_code="INTERNAL_SERVER_ERROR"
            ).dict()
        )


@router.get("/auth/simple-process")
async def simple_process_auth_code(
    code: str = Query(...),
    state: str = Query(...),
    cid: Optional[str] = Query(None)
):
    
    try:
        logger.info(f"обработка кода: code={code[:10]}..., state={state}")
        
        cleanup_expired_states()
        
        if state not in state_store:

            logger.warning(f"State не найден, но продолжаем: {state}")

        result = await process_yandex_callback(code, state, cid)
        
        logger.info(f"Авторизация успешна (упрощенная)")
        
        return JSONResponse(
            status_code=200,
            content=AuthSuccessResponse(
                data=AuthResponse(
                    user=UserResponse(**result["data"]["user"]),
                    token=result["data"]["token"]
                )
            ).dict()
        )
        
    except HTTPException as e:
        logger.error(f"Ошибка: {e.detail}")
        return JSONResponse(
            status_code=e.status_code,
            content=AuthErrorResponse(
                error=e.detail,
                error_code="AUTH_ERROR"
            ).dict()
        )
    except Exception as e:
        logger.error(f"Неожиданная ошибка: {str(e)}")
        return JSONResponse(
            status_code=500,
            content=AuthErrorResponse(
                error=str(e),
                error_code="SERVER_ERROR"
            ).dict()
        )


@router.get("/auth/me")
async def get_current_user(
    token: str = Query(..., description="JWT токен для аутентификации"),
    authorization: Optional[str] = Query(None, description="Bearer токен (альтернатива)")
):
    
    jwt_token = token
    if not jwt_token and authorization:
        if authorization.startswith("Bearer "):
            jwt_token = authorization.replace("Bearer ", "")
    
    if not jwt_token:
        return JSONResponse(
            status_code=401,
            content=AuthErrorResponse(
                error="Токен не предоставлен",
                error_code="TOKEN_REQUIRED"
            ).dict()
        )
    
    try:

        payload = decode_jwt_token(jwt_token)
        
        user_id = int(payload.get("sub"))
        user = await get_user_by_id(user_id)
        
        if not user:
            return JSONResponse(
                status_code=404,
                content=AuthErrorResponse(
                    error="Пользователь не найден",
                    error_code="USER_NOT_FOUND"
                ).dict()
            )
        
        user_response = UserResponse(
            id=user["id"],
            login=user["login"],
            email=user["email"],
            avatar_url=user.get("avatar_url"),
            token_id=user["token_id"],
            created_at=user.get("created_at", datetime.now()).isoformat()
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "user": user_response.dict()
                }
            }
        )
        
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content=AuthErrorResponse(
                error=e.detail,
                error_code="AUTH_ERROR"
            ).dict()
        )
    except Exception as e:
        logger.error(f"Ошибка получения данных пользователя: {str(e)}")
        return JSONResponse(
            status_code=500,
            content=AuthErrorResponse(
                error="Ошибка при получении данных пользователя",
                error_code="USER_DATA_ERROR"
            ).dict()
        )


@router.get("/auth/debug-state")
async def debug_state_endpoint():
    cleanup_expired_states()
    
    states_info = []
    for state, data in list(state_store.items())[:20]:  
        created_at = data.get("created_at")
        age_seconds = (datetime.now() - created_at).total_seconds() if created_at else 0
        
        states_info.append({
            "state": state[:20] + "...",
            "stage": data.get("stage", "unknown"),
            "has_code": "code" in data,
            "age_seconds": round(age_seconds, 1),
            "created_at": created_at.isoformat() if created_at else None,
            "callback_received_at": data.get("callback_received_at").isoformat() if data.get("callback_received_at") else None,
            "processed_at": data.get("processed_at").isoformat() if data.get("processed_at") else None,
        })
    
    return {
        "timestamp": datetime.now().isoformat(),
        "total_states": len(state_store),
        "states": states_info
    }


@router.get("/auth/clear-states")
async def clear_states_endpoint():
    count = len(state_store)
    state_store.clear()
    
    logger.info(f"Очищены все states: {count} записей")
    
    return {
        "success": True,
        "cleared_count": count,
        "message": f"Очищено {count} states"
    }


async def process_yandex_callback(code: str, state: str, cid: Optional[str] = None):

    client_id = os.getenv("YANDEX_CLIENT_ID")
    client_secret = os.getenv("YANDEX_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        logger.error("Yandex OAuth не настроен")
        raise HTTPException(
            status_code=500,
            detail="Yandex OAuth не настроен. Проверьте YANDEX_CLIENT_ID и YANDEX_CLIENT_SECRET."
        )

    try:
        async with httpx.AsyncClient() as client:
            logger.info("Получение токена у Яндекс OAuth...")
            token_response = await client.post(
                "https://oauth.yandex.ru/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "client_id": client_id,
                    "client_secret": client_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=30.0
            )

            if not token_response.is_success:
                error_detail = "Неизвестная ошибка"
                try:
                    error_data = token_response.json()
                    error_detail = error_data.get('error_description', str(error_data))
                except:
                    error_detail = token_response.text
                
                logger.error(f"Ошибка получения токена от Яндекс: {error_detail}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Ошибка получения токена от Яндекс: {error_detail}"
                )

            token_data = token_response.json()
            access_token = token_data.get("access_token")

            if not access_token:
                logger.error("Токен не получен от Яндекс")
                raise HTTPException(
                    status_code=400,
                    detail="Токен не получен от Яндекс"
                )

            logger.info("Получение информации о пользователе у Яндекс...")
            user_info_response = await client.get(
                "https://login.yandex.ru/info",
                headers={"Authorization": f"OAuth {access_token}"},
                params={"format": "json"},
                timeout=30.0
            )

            if not user_info_response.is_success:
                logger.error("Ошибка получения информации о пользователе")
                raise HTTPException(
                    status_code=400,
                    detail="Ошибка получения информации о пользователе от Яндекс"
                )

            yandex_user = user_info_response.json()
            logger.info(f"Получены данные пользователя: {yandex_user.get('login')}")
            
    except httpx.TimeoutException:
        logger.error("Таймаут при запросе к Яндекс OAuth")
        raise HTTPException(
            status_code=408,
            detail="Таймаут при запросе к Яндекс OAuth"
        )
    except Exception as e:
        logger.error(f"Ошибка при работе с Яндекс OAuth: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при работе с Яндекс OAuth: {str(e)}"
        )

    try:
        logger.info("Сохранение/обновление пользователя в БД...")
        db_user = await find_or_create_user(yandex_user, access_token)
        
        if not db_user:
            logger.error("Не удалось сохранить пользователя в БД")
            raise HTTPException(
                status_code=500,
                detail="Не удалось сохранить пользователя в БД"
            )
        
        logger.info(f"Пользователь сохранен в БД: ID={db_user['id']}, login={db_user.get('login')}")
        
    except Exception as e:
        logger.error(f"Ошибка работы с БД: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка работы с БД: {str(e)}"
        )

    try:
        logger.info("Создание JWT токена...")
        jwt_token = create_jwt_token(db_user["id"], db_user["email"])
        logger.info("JWT токен успешно создан")
        
    except Exception as e:
        logger.error(f"Ошибка создания токена: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка создания токена: {str(e)}"
        )

    user_response = UserResponse(
        id=db_user["id"],
        login=db_user["login"],
        email=db_user["email"],
        avatar_url=db_user.get("avatar_url"),
        token_id=db_user["token_id"],
        created_at=db_user.get("created_at", datetime.now()).isoformat()
    )

    return {
        "data": {
            "user": user_response.dict(),
            "token": jwt_token,
            "expires_in": int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")) * 60
        }
    }


@router.get("/auth/test-connection")
async def test_connection():
    try:
        conn = await get_db_connection()
        
        query = """
            SELECT 
                COUNT(*) as user_count,
                ARRAY_AGG(login) as logins
            FROM yandex_users
        """
        result = await conn.fetchrow(query)
        
        await conn.close()
        
        return {
            "success": True,
            "database": "connected",
            "users": {
                "count": result["user_count"],
                "sample_logins": result["logins"][:5] if result["logins"] else []
            },
            "columns": {
                "yandex_users": ["id", "token_id", "login", "email", "avatar_url", "points", "lvl", "created_at", "badges"]
            }
        }
        
    except Exception as e:
        logger.error(f"Ошибка тестирования соединения: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "database": "disconnected"
        }


@router.get("/auth/direct-callback")
async def direct_callback_handler(
    code: str = Query(...),
    state: str = Query(...),
    cid: Optional[str] = Query(None)
):
    
   
    try:
        logger.info(f"Прямая обработка callback: code={code[:10]}..., state={state}")
        
        result = await process_yandex_callback(code, state, cid)
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Тест авторизации</title>
            <style>
                body {{ font-family: Arial, sans-serif; padding: 20px; }}
                .success {{ color: green; }}
                .error {{ color: red; }}
                .data {{ 
                    background: #f5f5f5; 
                    padding: 15px; 
                    border-radius: 5px;
                    margin: 10px 0;
                    overflow-wrap: break-word;
                }}
                pre {{ white-space: pre-wrap; }}
            </style>
        </head>
        <body>
            <h1 class="success">✅ Авторизация успешна!</h1>
            
            <h3>Данные пользователя:</h3>
            <div class="data">
                <pre>{json.dumps(result['data']['user'], indent=2, ensure_ascii=False)}</pre>
            </div>
            
            <h3>JWT токен (первые 100 символов):</h3>
            <div class="data">
                {result['data']['token'][:100]}...
            </div>
            
            <h3>Инструкции:</h3>
            <p>Откройте консоль разработчика (F12) и выполните:</p>
            <div class="data">
                <code>
                // Сохраните токен<br>
                localStorage.setItem('auth_token', '{result['data']['token']}');<br>
                localStorage.setItem('user_data', JSON.stringify({json.dumps(result['data']['user'])}));<br>
                <br>
                // Проверьте сохранение<br>
                console.log('Токен сохранен:', localStorage.getItem('auth_token').substring(0, 50) + '...');<br>
                console.log('Пользователь:', JSON.parse(localStorage.getItem('user_data')));
                </code>
            </div>
            
            <button onclick="saveData()">Сохранить данные</button>
            <button onclick="window.location.href='/'">На главную</button>
            
            <script>
                function saveData() {{
                    localStorage.setItem('auth_token', '{result['data']['token']}');
                    localStorage.setItem('user_data', JSON.stringify({json.dumps(result['data']['user'])}));
                    alert('✅ Данные сохранены!');
                }}
            </script>
        </body>
        </html>
        """
        
        return HTMLResponse(content=html_content)
        
    except Exception as e:
        logger.error(f"Ошибка прямой обработки: {str(e)}")
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><title>Ошибка авторизации</title></head>
        <body>
            <h1 class="error">❌ Ошибка авторизации</h1>
            <p>{str(e)}</p>
            <button onclick="window.location.href='/login'">Вернуться на страницу входа</button>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content, status_code=500)
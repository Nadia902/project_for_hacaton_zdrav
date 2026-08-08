from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import close_db_pool
from .routers import objects, users, ratings, auth, analytics
from dotenv import load_dotenv
import os


load_dotenv()


required_env_vars = [
    "PG_HOST", "PG_PORT", "PG_DATABASE", "PG_USER", "PG_PASSWORD",
    "YANDEX_CLIENT_ID", "YANDEX_CLIENT_SECRET", "YANDEX_REDIRECT_URI",
    "SECRET_KEY"
]

missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    print(f"ВНИМАНИЕ: Отсутствуют переменные окружения: {missing_vars}")

@asynccontextmanager
async def lifespan(app: FastAPI):

    yield

    await close_db_pool()

app = FastAPI(lifespan=lifespan, root_path_in_servers=True, title="Health Map API", description="API для карты здоровой среды", version="1.0.0")

app.include_router(auth.router)
app.include_router(objects.router)
app.include_router(users.router)
app.include_router(ratings.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {"message": "FastAPI metrics API for landing page"}
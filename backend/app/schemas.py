from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
from datetime import date

class CountResponse(BaseModel):
    count: int

class ObjectItem(BaseModel):
    id: int
    mo: Optional[str] = None
    name: Optional[str] = None
    adres: Optional[str] = None
    tip: Optional[str] = None
    longitude: Optional[float] = None
    latitude: Optional[float] = None
    added: Optional[date] = None

class ObjectDetail(BaseModel):
    mo: Optional[str] = None
    name: Optional[str] = None
    adres: Optional[str] = None
    tip: Optional[str] = None
    added: Optional[date] = None

class HealthIndexByMoItem(BaseModel):
    mo: str
    health_index: float
    total_ratings: int
    population: int
    ratings_per_1000: float

class HealthIndexResponse(BaseModel):
    data: List[HealthIndexByMoItem]

class TopUserItem(BaseModel):
    login: str
    avatar_url: Optional[str] = None
    points: int
    lvl: str

class TopUsersResponse(BaseModel):
    data: List[TopUserItem]

class UserResponse(BaseModel):
    token_id: str
    login: str
    email: str
    avatar_url: Optional[str] = None
    points: int = 0
    lvl: str = "Новичок"
    badges: List[str] = ["Начало положено"]

class AuthResponse(BaseModel):
    user: UserResponse
    token: str
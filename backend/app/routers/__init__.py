from .objects import router as objects_router
from .users import router as users_router
from .ratings import router as ratings_router
from .auth import router as auth_router


__all__ = [
    'objects_router', 
    'users_router', 
    'ratings_router', 
    'auth_router',
]
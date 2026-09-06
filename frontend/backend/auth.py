import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import db
from models import UserDoc

JWT_SECRET = os.environ.get("JWT_SECRET") or "sd_secret_key_demo_2026_jwt"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24 * 7

security = HTTPBearer()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserDoc:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload["sub"]
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    try:
        doc = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")
    if not doc:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return UserDoc.from_mongo(doc)


def require_role(*roles):
    async def checker(current_user: UserDoc = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Permissão insuficiente para esta ação")
        return current_user
    return checker

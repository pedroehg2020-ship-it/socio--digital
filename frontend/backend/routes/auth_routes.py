from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from bson import ObjectId

from database import db
from models import UserDoc, CompanyDoc
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    company_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def _user_out(user_id: str, user: UserDoc):
    return {"id": user_id, "name": user.name, "email": user.email, "role": user.role, "company_id": user.company_id}


@router.post("/register")
async def register(payload: RegisterRequest):
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado")

    company = CompanyDoc(name=payload.company_name, owner_id="pending")
    company_result = await db.companies.insert_one(company.to_mongo())
    company_id = str(company_result.inserted_id)

    user = UserDoc(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        role="owner",
        company_id=company_id,
    )
    user_result = await db.users.insert_one(user.to_mongo())
    user_id = str(user_result.inserted_id)

    await db.companies.update_one({"_id": ObjectId(company_id)}, {"$set": {"owner_id": user_id}})

    token = create_access_token(user_id)
    return {"token": token, "user": _user_out(user_id, user)}


@router.post("/login")
async def login(payload: LoginRequest):
    doc = await db.users.find_one({"email": payload.email})
    if not doc or not verify_password(payload.password, doc["password_hash"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
    user = UserDoc.from_mongo(doc)
    token = create_access_token(user.id)
    return {"token": token, "user": _user_out(user.id, user)}


@router.get("/me")
async def me(current_user: UserDoc = Depends(get_current_user)):
    company_doc = await db.companies.find_one({"_id": ObjectId(current_user.company_id)})
    company = CompanyDoc.from_mongo(company_doc)
    return {
        "user": _user_out(current_user.id, current_user),
        "company": {"id": company.id, "name": company.name, "has_data": company.has_data},
    }

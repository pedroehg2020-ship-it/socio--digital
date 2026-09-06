from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from bson import ObjectId

from database import db
from models import UserDoc, CompanyDoc
from auth import get_current_user, require_role, hash_password

router = APIRouter(prefix="/company", tags=["company"])


@router.get("/me")
async def get_company(current_user: UserDoc = Depends(get_current_user)):
    doc = await db.companies.find_one({"_id": ObjectId(current_user.company_id)})
    company = CompanyDoc.from_mongo(doc)
    return {"id": company.id, "name": company.name, "has_data": company.has_data}


class UpdateCompanyRequest(BaseModel):
    name: str


@router.patch("/me")
async def update_company(payload: UpdateCompanyRequest, current_user: UserDoc = Depends(require_role("owner", "manager"))):
    await db.companies.update_one({"_id": ObjectId(current_user.company_id)}, {"$set": {"name": payload.name}})
    return {"success": True}


@router.get("/team")
async def get_team(current_user: UserDoc = Depends(get_current_user)):
    docs = await db.users.find({"company_id": current_user.company_id}).to_list(100)
    return [{"id": str(d["_id"]), "name": d["name"], "email": d["email"], "role": d["role"]} for d in docs]


class AddMemberRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


@router.post("/team")
async def add_member(payload: AddMemberRequest, current_user: UserDoc = Depends(require_role("owner", "manager"))):
    if payload.role not in ("manager", "member"):
        raise HTTPException(status_code=400, detail="Papel inválido. Use 'manager' ou 'member'.")
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado")
    user = UserDoc(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        role=payload.role,
        company_id=current_user.company_id,
    )
    result = await db.users.insert_one(user.to_mongo())
    return {"id": str(result.inserted_id), "name": user.name, "email": user.email, "role": user.role}


@router.delete("/team/{user_id}")
async def remove_member(user_id: str, current_user: UserDoc = Depends(require_role("owner", "manager"))):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Não é possível remover a si mesmo")
    target = await db.users.find_one({"_id": ObjectId(user_id), "company_id": current_user.company_id})
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if target["role"] == "owner":
        raise HTTPException(status_code=400, detail="Não é possível remover o proprietário da empresa")
    await db.users.delete_one({"_id": ObjectId(user_id)})
    return {"success": True}

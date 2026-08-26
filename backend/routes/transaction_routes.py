from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from database import db
from models import UserDoc
from auth import get_current_user, require_role

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("")
async def list_transactions(
    current_user: UserDoc = Depends(get_current_user),
    type: str = None,
    category: str = None,
    status: str = None,
    search: str = None,
    limit: int = 50,
    skip: int = 0,
):
    query = {"company_id": current_user.company_id}
    if type:
        query["type"] = type
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    if search:
        query["description"] = {"$regex": search, "$options": "i"}
    total = await db.transactions.count_documents(query)
    docs = await db.transactions.find(query).sort("date", -1).skip(skip).limit(limit).to_list(limit)
    items = [
        {
            "id": str(d["_id"]), "date": d["date"], "description": d["description"], "amount": d["amount"],
            "type": d["type"], "category": d["category"], "status": d["status"],
            "due_date": d.get("due_date"), "customer_name": d.get("customer_name"),
        }
        for d in docs
    ]
    return {"items": items, "total": total}


@router.get("/categories-list")
async def categories_list(current_user: UserDoc = Depends(get_current_user)):
    cats = await db.transactions.distinct("category", {"company_id": current_user.company_id})
    return sorted(cats)


@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: str, current_user: UserDoc = Depends(require_role("owner", "manager"))):
    result = await db.transactions.delete_one({"_id": ObjectId(transaction_id), "company_id": current_user.company_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return {"success": True}


@router.delete("")
async def clear_all_transactions(current_user: UserDoc = Depends(require_role("owner", "manager"))):
    await db.transactions.delete_many({"company_id": current_user.company_id})
    await db.customers.delete_many({"company_id": current_user.company_id})
    await db.alerts.delete_many({"company_id": current_user.company_id})
    await db.companies.update_one({"_id": ObjectId(current_user.company_id)}, {"$set": {"has_data": False}})
    return {"success": True}

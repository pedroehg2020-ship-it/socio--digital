from fastapi import APIRouter, Depends

from database import db
from models import UserDoc
from auth import get_current_user

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("")
async def list_customers(current_user: UserDoc = Depends(get_current_user), status: str = None):
    query = {"company_id": current_user.company_id}
    if status:
        query["status"] = status
    docs = await db.customers.find(query).sort("total_spent", -1).to_list(1000)
    return [
        {
            "id": str(d["_id"]), "name": d["name"], "total_spent": d["total_spent"],
            "purchase_count": d["purchase_count"], "last_purchase_date": d.get("last_purchase_date"),
            "first_purchase_date": d.get("first_purchase_date"), "status": d["status"],
        }
        for d in docs
    ]

from fastapi import APIRouter, Depends

from database import db
from models import UserDoc
from auth import get_current_user

router = APIRouter(prefix="/inventory", tags=["inventory"])


def _risk(d):
    if d.get("min_stock", 0) > 0 and d["stock_qty"] <= d["min_stock"]:
        return "ruptura"
    if d.get("avg_monthly_sales", 0) > 0 and d["stock_qty"] >= d["avg_monthly_sales"] * 3:
        return "parado"
    return "ok"


@router.get("")
async def list_inventory(current_user: UserDoc = Depends(get_current_user), low_stock: bool = None):
    docs = await db.products.find({"company_id": current_user.company_id}).to_list(1000)
    items = [
        {
            "id": str(d["_id"]), "name": d["name"], "stock_qty": d["stock_qty"],
            "min_stock": d["min_stock"], "avg_monthly_sales": d["avg_monthly_sales"], "risk": _risk(d),
        }
        for d in docs
    ]
    if low_stock:
        items = [i for i in items if i["risk"] != "ok"]
    return items

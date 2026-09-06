from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from bson import ObjectId

from database import db
from models import UserDoc
from auth import get_current_user, require_role

router = APIRouter(prefix="/sales", tags=["sales"])


class SaleCreate(BaseModel):
    date: str
    customer_name: str = "Cliente não informado"
    description: str = "Venda"
    amount: float = Field(gt=0)
    status: str = "pago"
    payment_method: str = "pix"
    item_count: int = Field(default=1, ge=1)
    notes: str | None = None


class SaleStatusUpdate(BaseModel):
    status: str


def _serialize(d):
    return {
        "id": str(d["_id"]),
        "sale_number": d.get("sale_number"),
        "date": d.get("date"),
        "customer_name": d.get("customer_name") or "Cliente não informado",
        "description": d.get("description") or "Venda",
        "amount": d.get("amount", 0),
        "status": d.get("status", "pago"),
        "payment_method": d.get("payment_method", "não informado"),
        "item_count": d.get("item_count", 1),
        "notes": d.get("notes"),
    }


@router.get("")
async def list_sales(
    current_user: UserDoc = Depends(get_current_user),
    status: str = None,
    search: str = None,
    limit: int = 100,
    skip: int = 0,
):
    query = {"company_id": current_user.company_id, "type": "receita"}
    if status and status != "todos":
        query["status"] = status
    if search:
        query["$or"] = [
            {"description": {"$regex": search, "$options": "i"}},
            {"customer_name": {"$regex": search, "$options": "i"}},
            {"sale_number": {"$regex": search, "$options": "i"}},
        ]
    total = await db.transactions.count_documents(query)
    docs = await db.transactions.find(query).sort("date", -1).skip(skip).limit(limit).to_list(limit)
    return {"items": [_serialize(d) for d in docs], "total": total}


@router.get("/summary")
async def sales_summary(current_user: UserDoc = Depends(get_current_user)):
    docs = await db.transactions.find({"company_id": current_user.company_id, "type": "receita"}).to_list(10000)
    now = datetime.now(timezone.utc)
    cur_month = now.strftime("%Y-%m")
    first = now.replace(day=1)
    prev_month = (first - timedelta(days=1)).strftime("%Y-%m")

    current = [d for d in docs if str(d.get("date", ""))[:7] == cur_month]
    previous = [d for d in docs if str(d.get("date", ""))[:7] == prev_month]
    faturamento = sum(float(d.get("amount", 0)) for d in current)
    faturamento_ant = sum(float(d.get("amount", 0)) for d in previous)
    vendas = len(current)
    ticket = faturamento / vendas if vendas else 0
    em_aberto = sum(float(d.get("amount", 0)) for d in current if d.get("status") == "pendente")
    recebidas = sum(float(d.get("amount", 0)) for d in current if d.get("status") == "pago")
    variacao = None if faturamento_ant == 0 else round(((faturamento - faturamento_ant) / faturamento_ant) * 100, 1)
    return {
        "faturamento_mes": round(faturamento, 2),
        "vendas_mes": vendas,
        "ticket_medio": round(ticket, 2),
        "em_aberto": round(em_aberto, 2),
        "recebidas": round(recebidas, 2),
        "variacao": variacao,
    }


@router.post("")
async def create_sale(payload: SaleCreate, current_user: UserDoc = Depends(require_role("owner", "manager"))):
    if payload.status not in {"pago", "pendente"}:
        raise HTTPException(status_code=400, detail="Status inválido")
    count = await db.transactions.count_documents({"company_id": current_user.company_id, "type": "receita"})
    sale_number = f"VD-{count + 1:05d}"
    doc = {
        "company_id": current_user.company_id,
        "date": payload.date,
        "description": payload.description,
        "amount": payload.amount,
        "type": "receita",
        "category": "Vendas",
        "status": payload.status,
        "customer_name": payload.customer_name,
        "payment_method": payload.payment_method,
        "item_count": payload.item_count,
        "notes": payload.notes,
        "sale_number": sale_number,
        "source": "sales_module",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.transactions.insert_one(doc)
    await db.companies.update_one({"_id": ObjectId(current_user.company_id)}, {"$set": {"has_data": True}})
    doc["_id"] = result.inserted_id
    return _serialize(doc)


@router.patch("/{sale_id}/status")
async def update_sale_status(
    sale_id: str,
    payload: SaleStatusUpdate,
    current_user: UserDoc = Depends(require_role("owner", "manager")),
):
    if payload.status not in {"pago", "pendente"}:
        raise HTTPException(status_code=400, detail="Status inválido")
    try:
        oid = ObjectId(sale_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Venda inválida")
    result = await db.transactions.update_one(
        {"_id": oid, "company_id": current_user.company_id, "type": "receita"},
        {"$set": {"status": payload.status}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    return {"success": True, "status": payload.status}

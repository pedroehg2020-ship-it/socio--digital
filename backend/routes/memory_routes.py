import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from database import db
from models import UserDoc
from anomaly_engine import compute_seasonality

router = APIRouter(prefix="/memory", tags=["memory"])


class MemoryUpdate(BaseModel):
    revenue_goal_monthly: Optional[float] = None
    margin_goal_pct: Optional[float] = None
    seasonality_notes: Optional[str] = None


class FactCreate(BaseModel):
    text: str


def _serialize(doc):
    if not doc:
        return {"revenue_goal_monthly": None, "margin_goal_pct": None, "seasonality_notes": None, "facts": []}
    return {
        "revenue_goal_monthly": doc.get("revenue_goal_monthly"),
        "margin_goal_pct": doc.get("margin_goal_pct"),
        "seasonality_notes": doc.get("seasonality_notes"),
        "facts": doc.get("facts", []),
    }


async def get_memory_doc(company_id: str):
    return await db.business_memory.find_one({"company_id": company_id})


async def upsert_memory(company_id: str, fields: dict):
    fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.business_memory.update_one({"company_id": company_id}, {"$set": fields}, upsert=True)


async def append_fact(company_id: str, text: str, source: str):
    fact = {"id": uuid.uuid4().hex[:12], "text": text.strip(), "source": source, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.business_memory.update_one(
        {"company_id": company_id},
        {"$push": {"facts": fact}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return fact


@router.get("")
async def get_memory(current_user: UserDoc = Depends(get_current_user)):
    doc = await get_memory_doc(current_user.company_id)
    txs = await db.transactions.find({"company_id": current_user.company_id}, {"_id": 0, "type": 1, "date": 1, "amount": 1}).to_list(10000)
    return {**_serialize(doc), "seasonality": compute_seasonality(txs)}


@router.put("")
async def update_memory(payload: MemoryUpdate, current_user: UserDoc = Depends(get_current_user)):
    await upsert_memory(current_user.company_id, payload.model_dump(exclude_unset=True))
    return _serialize(await get_memory_doc(current_user.company_id))


@router.post("/facts")
async def add_fact(payload: FactCreate, current_user: UserDoc = Depends(get_current_user)):
    if not payload.text.strip():
        raise HTTPException(status_code=422, detail="Texto do fato não pode ser vazio")
    return await append_fact(current_user.company_id, payload.text, "manual")


@router.delete("/facts/{fact_id}")
async def remove_fact(fact_id: str, current_user: UserDoc = Depends(get_current_user)):
    result = await db.business_memory.update_one(
        {"company_id": current_user.company_id},
        {"$pull": {"facts": {"id": fact_id}}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Fato não encontrado")
    return {"ok": True}

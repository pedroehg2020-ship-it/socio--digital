from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from bson import ObjectId

from database import db
from models import UserDoc
from auth import get_current_user
from csv_parser import parse_transactions_csv, parse_inventory_csv
from radar_engine import run_full_radar, recompute_alerts

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/transactions")
async def upload_transactions(file: UploadFile = File(...), current_user: UserDoc = Depends(get_current_user)):
    content = await file.read()
    try:
        transactions = parse_transactions_csv(content, current_user.company_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar o arquivo: {e}")
    if not transactions:
        raise HTTPException(status_code=400, detail="Nenhuma transação válida encontrada no arquivo")

    docs = [t.to_mongo() for t in transactions]
    await db.transactions.insert_many(docs)
    await db.companies.update_one({"_id": ObjectId(current_user.company_id)}, {"$set": {"has_data": True}})
    await run_full_radar(current_user.company_id)
    return {"imported": len(docs)}


@router.post("/inventory")
async def upload_inventory(file: UploadFile = File(...), current_user: UserDoc = Depends(get_current_user)):
    content = await file.read()
    try:
        products = parse_inventory_csv(content, current_user.company_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar o arquivo: {e}")
    if not products:
        raise HTTPException(status_code=400, detail="Nenhum produto válido encontrado no arquivo")

    names = [p.name for p in products]
    await db.products.delete_many({"company_id": current_user.company_id, "name": {"$in": names}})
    docs = [p.to_mongo() for p in products]
    await db.products.insert_many(docs)
    await recompute_alerts(current_user.company_id)
    return {"imported": len(docs)}

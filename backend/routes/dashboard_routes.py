from collections import defaultdict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends

from database import db
from models import UserDoc
from auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
async def summary(current_user: UserDoc = Depends(get_current_user)):
    txs = await db.transactions.find({"company_id": current_user.company_id}).to_list(10000)
    if not txs:
        return {"has_data": False}

    now = datetime.now(timezone.utc)
    cur_month = now.strftime("%Y-%m")
    first_of_month = now.replace(day=1)
    prev_month = (first_of_month.replace(day=1) - __import__("datetime").timedelta(days=1)).strftime("%Y-%m")

    def month_of(t):
        return t["date"][:7]

    receita_mes = sum(t["amount"] for t in txs if t["type"] == "receita" and month_of(t) == cur_month)
    despesa_mes = sum(t["amount"] for t in txs if t["type"] == "despesa" and month_of(t) == cur_month)
    receita_mes_ant = sum(t["amount"] for t in txs if t["type"] == "receita" and month_of(t) == prev_month)
    despesa_mes_ant = sum(t["amount"] for t in txs if t["type"] == "despesa" and month_of(t) == prev_month)
    lucro_mes = receita_mes - despesa_mes
    lucro_mes_ant = receita_mes_ant - despesa_mes_ant
    saldo_total = sum(t["amount"] if t["type"] == "receita" else -t["amount"] for t in txs if t["status"] == "pago")
    contas_pagar = sum(t["amount"] for t in txs if t["type"] == "despesa" and t["status"] == "pendente")
    contas_receber = sum(t["amount"] for t in txs if t["type"] == "receita" and t["status"] == "pendente")

    def pct_change(cur, prev):
        if prev == 0:
            return None
        return round(((cur - prev) / abs(prev)) * 100, 1)

    return {
        "has_data": True,
        "receita_mes": round(receita_mes, 2),
        "despesa_mes": round(despesa_mes, 2),
        "lucro_mes": round(lucro_mes, 2),
        "saldo_total": round(saldo_total, 2),
        "contas_pagar": round(contas_pagar, 2),
        "contas_receber": round(contas_receber, 2),
        "receita_variacao": pct_change(receita_mes, receita_mes_ant),
        "despesa_variacao": pct_change(despesa_mes, despesa_mes_ant),
        "lucro_variacao": pct_change(lucro_mes, lucro_mes_ant),
    }


@router.get("/cashflow")
async def cashflow(current_user: UserDoc = Depends(get_current_user), months: int = 6):
    txs = await db.transactions.find({"company_id": current_user.company_id}).to_list(10000)
    agg = defaultdict(lambda: {"receita": 0.0, "despesa": 0.0})
    for t in txs:
        key = t["date"][:7]
        agg[key]["receita" if t["type"] == "receita" else "despesa"] += t["amount"]

    keys = sorted(agg.keys())[-months:]
    result = []
    saldo_acumulado = 0.0
    for k in keys:
        receita = round(agg[k]["receita"], 2)
        despesa = round(agg[k]["despesa"], 2)
        saldo_acumulado += receita - despesa
        result.append({"mes": k, "receita": receita, "despesa": despesa, "saldo": round(receita - despesa, 2), "saldo_acumulado": round(saldo_acumulado, 2)})
    return result


@router.get("/categories")
async def categories(current_user: UserDoc = Depends(get_current_user), type: str = "despesa"):
    txs = await db.transactions.find({"company_id": current_user.company_id, "type": type}).to_list(10000)
    agg = defaultdict(float)
    for t in txs:
        agg[t.get("category", "Outros")] += t["amount"]
    return [{"category": k, "total": round(v, 2)} for k, v in sorted(agg.items(), key=lambda x: -x[1])]

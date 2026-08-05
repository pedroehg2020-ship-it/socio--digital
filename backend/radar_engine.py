from datetime import datetime, timezone
from collections import defaultdict

from database import db
from models import CustomerDoc, AlertDoc

INACTIVE_DAYS_THRESHOLD = 45
AUTO_ALERT_TYPES = ["queda_vendas", "conta_vencer", "ruptura_estoque", "estoque_parado", "cliente_inativo"]


async def recompute_customers(company_id: str):
    txs = await db.transactions.find(
        {"company_id": company_id, "type": "receita", "customer_name": {"$ne": None}}
    ).to_list(10000)
    await db.customers.delete_many({"company_id": company_id})
    if not txs:
        return

    agg = defaultdict(lambda: {"total_spent": 0.0, "purchase_count": 0, "first": None, "last": None})
    max_date = max(t["date"] for t in txs)
    for t in txs:
        name = t.get("customer_name")
        if not name:
            continue
        c = agg[name]
        c["total_spent"] += t["amount"]
        c["purchase_count"] += 1
        if c["first"] is None or t["date"] < c["first"]:
            c["first"] = t["date"]
        if c["last"] is None or t["date"] > c["last"]:
            c["last"] = t["date"]

    max_dt = datetime.strptime(max_date, "%Y-%m-%d")
    docs = []
    for name, c in agg.items():
        last_dt = datetime.strptime(c["last"], "%Y-%m-%d")
        status = "inativo" if (max_dt - last_dt).days > INACTIVE_DAYS_THRESHOLD else "ativo"
        doc = CustomerDoc(
            company_id=company_id,
            name=name,
            total_spent=round(c["total_spent"], 2),
            purchase_count=c["purchase_count"],
            first_purchase_date=c["first"],
            last_purchase_date=c["last"],
            status=status,
        )
        docs.append(doc.to_mongo())
    if docs:
        await db.customers.insert_many(docs)


async def recompute_alerts(company_id: str) -> int:
    await db.alerts.delete_many({"company_id": company_id, "resolved": False, "type": {"$in": AUTO_ALERT_TYPES}})
    new_alerts = []

    txs = await db.transactions.find({"company_id": company_id}).to_list(10000)
    receitas = [t for t in txs if t["type"] == "receita"]
    by_month = defaultdict(float)
    by_month_category = defaultdict(lambda: defaultdict(float))
    for t in receitas:
        month = t["date"][:7]
        by_month[month] += t["amount"]
        by_month_category[month][t.get("category", "Outros")] += t["amount"]

    months_sorted = sorted(by_month.keys())
    if len(months_sorted) >= 2:
        cur, prev = months_sorted[-1], months_sorted[-2]
        cur_total, prev_total = by_month[cur], by_month[prev]
        if prev_total > 0:
            drop = (prev_total - cur_total) / prev_total
            if drop >= 0.15:
                priority = "red" if drop >= 0.3 else "yellow"
                new_alerts.append(AlertDoc(
                    company_id=company_id, type="queda_vendas", priority=priority,
                    title=f"Queda de {round(drop * 100)}% nas vendas",
                    description=f"As vendas de {cur} somaram R$ {cur_total:,.2f}, uma queda de {round(drop * 100)}% em relação a {prev} (R$ {prev_total:,.2f}).",
                    action_label="Ver Financeiro", action_route="/financeiro",
                ))
        cats_cur = by_month_category.get(cur, {})
        cats_prev = by_month_category.get(prev, {})
        for cat, cur_val in cats_cur.items():
            prev_val = cats_prev.get(cat, 0)
            if prev_val > 0:
                cdrop = (prev_val - cur_val) / prev_val
                if cdrop >= 0.25:
                    new_alerts.append(AlertDoc(
                        company_id=company_id, type="queda_vendas",
                        priority="red" if cdrop >= 0.4 else "yellow",
                        title=f"Queda de vendas em '{cat}'",
                        description=f"A categoria '{cat}' caiu {round(cdrop * 100)}% em {cur} comparado a {prev}.",
                        action_label="Ver Financeiro", action_route="/financeiro",
                    ))

    today = datetime.now(timezone.utc)
    pendentes = [t for t in txs if t["type"] == "despesa" and t["status"] == "pendente" and t.get("due_date")]
    upcoming = []
    for t in pendentes:
        try:
            due = datetime.strptime(t["due_date"], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        days = (due - today).days
        if 0 <= days <= 7:
            upcoming.append((days, t))
    upcoming.sort(key=lambda x: x[0])
    for days, t in upcoming[:5]:
        priority = "red" if days <= 3 else "yellow"
        new_alerts.append(AlertDoc(
            company_id=company_id, type="conta_vencer", priority=priority,
            title=f"Conta vence hoje" if days == 0 else f"Conta a vencer em {days} dia(s)",
            description=f"{t['description']} — R$ {t['amount']:,.2f} vence em {t['due_date']}.",
            action_label="Ver Financeiro", action_route="/financeiro",
        ))
    if len(upcoming) > 5:
        rest = upcoming[5:]
        total_rest = sum(t["amount"] for _, t in rest)
        new_alerts.append(AlertDoc(
            company_id=company_id, type="conta_vencer", priority="yellow",
            title=f"Mais {len(rest)} contas a vencer",
            description=f"Existem outras {len(rest)} contas totalizando R$ {total_rest:,.2f} vencendo nos próximos 7 dias.",
            action_label="Ver Financeiro", action_route="/financeiro",
        ))

    products = await db.products.find({"company_id": company_id}).to_list(1000)
    for p in products:
        if p.get("min_stock", 0) > 0 and p["stock_qty"] <= p["min_stock"]:
            new_alerts.append(AlertDoc(
                company_id=company_id, type="ruptura_estoque", priority="red",
                title=f"Risco de ruptura: {p['name']}",
                description=f"Estoque atual de '{p['name']}' é {p['stock_qty']}, abaixo do mínimo de {p['min_stock']}.",
                action_label="Ver Estoque", action_route="/estoque",
            ))
        elif p.get("avg_monthly_sales", 0) > 0 and p["stock_qty"] >= p["avg_monthly_sales"] * 3:
            new_alerts.append(AlertDoc(
                company_id=company_id, type="estoque_parado", priority="yellow",
                title=f"Estoque parado: {p['name']}",
                description=f"'{p['name']}' tem {p['stock_qty']} unidades em estoque, mas vende em média {p['avg_monthly_sales']}/mês. Considere uma promoção.",
                action_label="Ver Estoque", action_route="/estoque",
            ))

    customers = await db.customers.find({"company_id": company_id, "status": "inativo"}).to_list(1000)
    for c in customers:
        if c["purchase_count"] >= 2 and c["total_spent"] > 0:
            new_alerts.append(AlertDoc(
                company_id=company_id, type="cliente_inativo", priority="yellow",
                title=f"Cliente inativo: {c['name']}",
                description=f"'{c['name']}' não compra desde {c['last_purchase_date']} (total histórico: R$ {c['total_spent']:,.2f}). Risco de churn.",
                action_label="Ver Clientes", action_route="/clientes",
            ))

    if new_alerts:
        await db.alerts.insert_many([a.to_mongo() for a in new_alerts])
    return len(new_alerts)


async def run_full_radar(company_id: str) -> int:
    await recompute_customers(company_id)
    return await recompute_alerts(company_id)

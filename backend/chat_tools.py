from datetime import datetime, timezone
from database import db

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_financial_summary",
            "description": "Retorna o resumo financeiro atual da empresa: receita e despesa do mês, lucro, saldo total, contas a pagar e a receber pendentes.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_transactions",
            "description": "Lista transações financeiras (receitas e despesas) da empresa, com filtros opcionais.",
            "parameters": {
                "type": "object",
                "properties": {
                    "type": {"type": "string", "enum": ["receita", "despesa"], "description": "Filtrar por tipo de transação"},
                    "category": {"type": "string", "description": "Filtrar por categoria"},
                    "status": {"type": "string", "enum": ["pago", "pendente"], "description": "Filtrar por status"},
                    "limit": {"type": "integer", "description": "Número máximo de resultados, padrão 20"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_customers",
            "description": "Lista clientes da empresa com total gasto, número de compras e status (ativo/inativo).",
            "parameters": {
                "type": "object",
                "properties": {"status": {"type": "string", "enum": ["ativo", "inativo"]}},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_inventory",
            "description": "Lista produtos em estoque da empresa, podendo filtrar apenas os com risco de ruptura.",
            "parameters": {
                "type": "object",
                "properties": {"low_stock_only": {"type": "boolean"}},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_alerts",
            "description": "Lista alertas ativos do Radar Inteligente da empresa, podendo filtrar por prioridade.",
            "parameters": {
                "type": "object",
                "properties": {"priority": {"type": "string", "enum": ["red", "yellow", "green"]}},
                "required": [],
            },
        },
    },
]


async def dispatch_tool(name: str, arguments: dict, company_id: str) -> dict:
    arguments = arguments or {}
    if name == "get_financial_summary":
        return await _get_financial_summary(company_id)
    if name == "get_transactions":
        return await _get_transactions(company_id, arguments)
    if name == "get_customers":
        return await _get_customers(company_id, arguments)
    if name == "get_inventory":
        return await _get_inventory(company_id, arguments)
    if name == "get_alerts":
        return await _get_alerts(company_id, arguments)
    return {"error": f"Ferramenta desconhecida: {name}"}


async def _get_financial_summary(company_id):
    txs = await db.transactions.find({"company_id": company_id}).to_list(10000)
    if not txs:
        return {"message": "Nenhum dado financeiro importado ainda. Oriente o empresário a fazer upload do CSV em Configurações."}
    cur_month = datetime.now(timezone.utc).strftime("%Y-%m")
    receita = sum(t["amount"] for t in txs if t["type"] == "receita" and t["date"][:7] == cur_month)
    despesa = sum(t["amount"] for t in txs if t["type"] == "despesa" and t["date"][:7] == cur_month)
    contas_pagar = sum(t["amount"] for t in txs if t["type"] == "despesa" and t["status"] == "pendente")
    contas_receber = sum(t["amount"] for t in txs if t["type"] == "receita" and t["status"] == "pendente")
    saldo = sum(t["amount"] if t["type"] == "receita" else -t["amount"] for t in txs if t["status"] == "pago")
    return {
        "mes_atual": cur_month,
        "receita_mes": round(receita, 2),
        "despesa_mes": round(despesa, 2),
        "lucro_mes": round(receita - despesa, 2),
        "saldo_total": round(saldo, 2),
        "contas_a_pagar_pendentes": round(contas_pagar, 2),
        "contas_a_receber_pendentes": round(contas_receber, 2),
    }


async def _get_transactions(company_id, args):
    query = {"company_id": company_id}
    if args.get("type"):
        query["type"] = args["type"]
    if args.get("category"):
        query["category"] = args["category"]
    if args.get("status"):
        query["status"] = args["status"]
    limit = min(int(args.get("limit", 20) or 20), 100)
    docs = await db.transactions.find(query).sort("date", -1).limit(limit).to_list(limit)
    return {
        "count": len(docs),
        "transactions": [
            {"date": d["date"], "description": d["description"], "amount": d["amount"], "type": d["type"], "category": d["category"], "status": d["status"]}
            for d in docs
        ],
    }


async def _get_customers(company_id, args):
    query = {"company_id": company_id}
    if args.get("status"):
        query["status"] = args["status"]
    docs = await db.customers.find(query).sort("total_spent", -1).limit(50).to_list(50)
    return {
        "count": len(docs),
        "customers": [
            {"name": d["name"], "total_spent": d["total_spent"], "purchase_count": d["purchase_count"], "last_purchase_date": d.get("last_purchase_date"), "status": d["status"]}
            for d in docs
        ],
    }


async def _get_inventory(company_id, args):
    docs = await db.products.find({"company_id": company_id}).to_list(500)
    items = [
        {"name": d["name"], "stock_qty": d["stock_qty"], "min_stock": d["min_stock"], "avg_monthly_sales": d["avg_monthly_sales"]}
        for d in docs
    ]
    if args.get("low_stock_only"):
        items = [i for i in items if i["min_stock"] > 0 and i["stock_qty"] <= i["min_stock"]]
    return {"count": len(items), "products": items}


async def _get_alerts(company_id, args):
    query = {"company_id": company_id, "resolved": False}
    if args.get("priority"):
        query["priority"] = args["priority"]
    docs = await db.alerts.find(query).sort("created_at", -1).limit(50).to_list(50)
    return {
        "count": len(docs),
        "alerts": [
            {"type": d["type"], "priority": d["priority"], "title": d["title"], "description": d["description"]}
            for d in docs
        ],
    }

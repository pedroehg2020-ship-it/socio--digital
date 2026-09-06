import calendar
from collections import defaultdict
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends

from auth import get_current_user
from database import db
from models import UserDoc
from anomaly_engine import detect_anomalies

router = APIRouter(prefix="/command-center", tags=["command-center"])


def _month_label(month_key: str) -> str:
    try:
        return datetime.strptime(month_key, "%Y-%m").strftime("%B de %Y")
    except ValueError:
        return month_key


def _greeting_word() -> str:
    hour = (datetime.now(timezone.utc) - timedelta(hours=3)).hour
    return "Bom dia" if hour < 12 else "Boa tarde" if hour < 18 else "Boa noite"


def _change(current: float, previous: float):
    if previous == 0:
        return None
    return round(((current - previous) / abs(previous)) * 100, 1)


def _health_score(txs, products, customers):
    if not txs and not products and not customers:
        return {"score": None, "status": "Aguardando dados", "components": []}

    paid_balance = sum(t["amount"] if t["type"] == "receita" else -t["amount"] for t in txs if t.get("status") == "pago")
    pending_expenses = sum(t["amount"] for t in txs if t["type"] == "despesa" and t.get("status") == "pendente")
    revenue = sum(t["amount"] for t in txs if t["type"] == "receita")
    expenses = sum(t["amount"] for t in txs if t["type"] == "despesa")
    margin = ((revenue - expenses) / revenue * 100) if revenue else 0
    low_stock = sum(1 for p in products if p.get("min_stock", 0) > 0 and p.get("stock_qty", 0) <= p.get("min_stock", 0))
    inactive = sum(1 for c in customers if c.get("status") == "inativo")

    finance = max(0, min(100, round(65 + (15 if paid_balance >= 0 else -20) - min(pending_expenses / max(revenue, 1) * 40, 30) - (20 if margin < 0 else 0))))
    sales = max(0, min(100, round(70 + max(-45, min(margin, 25)) - max(0, 20 - len(txs)))))
    customer_score = max(0, min(100, round(90 - (inactive / max(len(customers), 1) * 60))))
    inventory = max(0, min(100, round(92 - (low_stock / max(len(products), 1) * 65)))) if products else 70
    efficiency = max(0, min(100, round(70 + max(-45, min(margin, 20)))))
    components = [
        {"key": "financeiro", "label": "Financeiro", "score": finance, "reason": "Caixa pago e compromissos pendentes"},
        {"key": "vendas", "label": "Vendas", "score": sales, "reason": "Receita, margem e volume de transações"},
        {"key": "clientes", "label": "Clientes", "score": customer_score, "reason": "Recência e concentração da base"},
        {"key": "estoque", "label": "Estoque", "score": inventory, "reason": "Produtos abaixo do estoque mínimo"},
        {"key": "eficiencia", "label": "Eficiência", "score": efficiency, "reason": "Margem operacional observada"},
    ]
    score = round(sum(item["score"] for item in components) / len(components))
    status = "Saudável" if score >= 75 else "Merece atenção" if score >= 55 else "Em risco"
    return {"score": score, "status": status, "components": components}


def _anomaly_insights(txs, products):
    insights = []
    for a in detect_anomalies(txs, products)[:3]:
        insights.append({
            "id": f"anomaly-{a['key']}",
            "severity": a["severity"],
            "title": a["title"],
            "summary": a["summary"],
            "evidence": a["evidence"],
            "action": "Investigar anomalia",
            "prompt": f"Detectei esta anomalia: {a['title']}. Investigue as causas e me diga o que fazer.",
            "confidence": "Alta",
        })
    return insights


def _goal_insight(txs, memory):
    goal = (memory or {}).get("revenue_goal_monthly")
    if not goal:
        return None
    now = datetime.now(timezone.utc)
    cur = now.strftime("%Y-%m")
    revenue = sum(t["amount"] for t in txs if t["type"] == "receita" and t["date"][:7] == cur)
    days_in_month = calendar.monthrange(now.year, now.month)[1]
    expected = goal * now.day / days_in_month
    pace = (revenue / expected * 100) if expected else 0
    pct_goal = revenue / goal * 100
    if pace >= 100:
        severity, headline = "positive", f"Você está {pace - 100:.0f}% à frente da meta do mês"
    elif pace >= 85:
        severity, headline = "informative", "Meta do mês em ritmo próximo do esperado"
    else:
        severity, headline = "important", f"Meta do mês em risco: ritmo {100 - pace:.0f}% abaixo do esperado"
    return {
        "id": "goal-progress",
        "severity": severity,
        "title": headline,
        "summary": f"Faturamento até agora: R$ {revenue:,.2f} ({pct_goal:.0f}% da meta de R$ {goal:,.2f}). No dia {now.day} de {days_in_month}, o esperado seria R$ {expected:,.2f}.",
        "evidence": [f"Meta mensal: R$ {goal:,.2f}", f"Realizado: R$ {revenue:,.2f}", f"Ritmo: {pace:.0f}% do esperado", "Fonte: sua meta na Memória do Negócio"],
        "action": "Planejar o restante do mês",
        "prompt": "Como está meu progresso em relação à meta do mês e o que fazer para alcançá-la?",
        "confidence": "Alta",
    }


def _build_insights(txs, products, customers):
    insights = []
    months = defaultdict(lambda: {"receita": 0.0, "despesa": 0.0})
    for tx in txs:
        months[tx["date"][:7]][tx["type"]] += tx["amount"]
    ordered = sorted(months)
    if len(ordered) >= 2:
        current, previous = ordered[-1], ordered[-2]
        revenue_change = _change(months[current]["receita"], months[previous]["receita"])
        if revenue_change is not None and abs(revenue_change) >= 5:
            direction = "cresceram" if revenue_change > 0 else "caíram"
            insights.append({
                "id": "sales-change",
                "severity": "positive" if revenue_change > 0 else "important",
                "title": f"As vendas {direction} {abs(revenue_change)}%",
                "summary": f"A receita de {_month_label(current)} foi de R$ {months[current]['receita']:,.2f}, comparada a R$ {months[previous]['receita']:,.2f} no período anterior.",
                "evidence": [f"Período atual: {_month_label(current)}", f"Período comparado: {_month_label(previous)}", "Fonte: transações importadas"],
                "action": "Entender a mudança",
                "prompt": "Por que minhas vendas mudaram no período mais recente?",
                "confidence": "Alta" if len(txs) >= 10 else "Média",
            })
    low_stock = [p for p in products if p.get("min_stock", 0) > 0 and p.get("stock_qty", 0) <= p.get("min_stock", 0)]
    if low_stock:
        names = ", ".join(p["name"] for p in low_stock[:3])
        insights.append({
            "id": "inventory-risk", "severity": "critical", "title": f"{len(low_stock)} produto(s) em risco de ruptura",
            "summary": f"{names} já está(ão) no limite mínimo informado.",
            "evidence": [f"Estoque mínimo cadastrado: {len(low_stock)} produto(s)", "Fonte: base de estoque importada"],
            "action": "Preparar reposição", "prompt": "Quais produtos podem faltar e o que devo fazer agora?", "confidence": "Alta",
        })
    inactive = [c for c in customers if c.get("status") == "inativo"]
    if inactive:
        value = sum(c.get("total_spent", 0) for c in inactive)
        insights.append({
            "id": "customer-risk", "severity": "important", "title": f"{len(inactive)} cliente(s) relevante(s) estão inativos",
            "summary": f"A base inativa representa R$ {value:,.2f} em compras históricas.",
            "evidence": ["Critério atual: mais de 45 dias sem compra", "Fonte: clientes derivados das transações"],
            "action": "Preparar reativação", "prompt": "Quais clientes estão deixando de comprar e como reativá-los?", "confidence": "Média",
        })
    pending = sum(t["amount"] for t in txs if t["type"] == "despesa" and t.get("status") == "pendente")
    if pending:
        insights.append({
            "id": "cash-commitments", "severity": "informative", "title": "Há compromissos aguardando pagamento",
            "summary": f"O total pendente informado é de R$ {pending:,.2f}.",
            "evidence": ["Status usado no cálculo: pendente", "Fonte: transações importadas"],
            "action": "Avaliar caixa", "prompt": "Quanto posso gastar sem comprometer meu caixa?", "confidence": "Alta",
        })
    return insights[:5]


@router.get("/overview")
async def command_overview(current_user: UserDoc = Depends(get_current_user)):
    company_id = current_user.company_id
    txs = await db.transactions.find({"company_id": company_id}, {"_id": 0}).to_list(10000)
    products = await db.products.find({"company_id": company_id}, {"_id": 0}).to_list(1000)
    customers = await db.customers.find({"company_id": company_id}, {"_id": 0}).to_list(1000)
    memory = await db.business_memory.find_one({"company_id": company_id})
    insights = _anomaly_insights(txs, products)
    goal = _goal_insight(txs, memory)
    if goal:
        insights.append(goal)
    insights = (insights + _build_insights(txs, products, customers))[:6]
    health = _health_score(txs, products, customers)
    name = current_user.name.split()[0] if current_user.name else "gestor"
    if not txs and not products and not customers:
        return {"has_data": False, "is_demo": False, "health": health, "insights": [], "greeting": f"{_greeting_word()}, {name}.", "briefing": "Ainda estou conhecendo sua empresa. Conecte uma fonte de dados para eu começar a observar o negócio."}
    focus = insights[0]["summary"] if insights else "Não encontrei nenhuma anomalia grave nos dados disponíveis."
    return {
        "has_data": True, "is_demo": False, "health": health, "insights": insights,
        "greeting": f"{_greeting_word()}, {name}.",
        "briefing": f"Sua empresa está {health['status'].lower()} hoje. {focus}",
        "data_scope": {"transactions": len(txs), "products": len(products), "customers": len(customers)},
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
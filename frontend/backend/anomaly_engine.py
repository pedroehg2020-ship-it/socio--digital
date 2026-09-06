from collections import defaultdict
from datetime import datetime, timezone
from statistics import mean, pstdev

PT_MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]


def month_pt(key: str) -> str:
    y, m = key.split("-")
    return f"{PT_MONTHS[int(m) - 1]} de {y}"


def _complete_months(series: dict, current_key: str):
    return sorted(k for k in series if k != current_key)


def detect_anomalies(txs, products):
    anomalies = []
    current_key = datetime.now(timezone.utc).strftime("%Y-%m")
    rev = defaultdict(float)
    exp = defaultdict(lambda: defaultdict(float))
    cust = defaultdict(lambda: defaultdict(float))
    for t in txs:
        mk = t["date"][:7]
        if t["type"] == "receita":
            rev[mk] += t["amount"]
            if t.get("customer_name"):
                cust[mk][t["customer_name"]] += t["amount"]
        else:
            exp[t.get("category", "Outros")][mk] += t["amount"]

    months = _complete_months(rev, current_key)
    if len(months) >= 4:
        latest = months[-1]
        base = [rev[m] for m in months[:-1]]
        mu, sd = mean(base), pstdev(base)
        val = rev[latest]
        if mu > 0:
            dev = (val - mu) / mu * 100
            z = (val - mu) / sd if sd else 0
            if abs(z) >= 1.8 or abs(dev) >= 20:
                up = val > mu
                anomalies.append({
                    "key": "receita-fora-padrao",
                    "severity": "positive" if up else ("critical" if (abs(z) >= 2.5 or dev <= -30) else "important"),
                    "title": f"Faturamento de {month_pt(latest)} {'acima' if up else 'abaixo'} do padrão ({dev:+.0f}%)",
                    "summary": f"A receita de {month_pt(latest)} foi R$ {val:,.2f}, contra uma média histórica de R$ {mu:,.2f}. Esse desvio foge do comportamento normal do negócio.",
                    "evidence": [f"Média histórica: R$ {mu:,.2f}", f"Mês analisado: {month_pt(latest)}", f"Desvio: {dev:+.1f}% (z-score {z:+.1f})", "Fonte: transações importadas"],
                })

    for cat, series in exp.items():
        cmonths = _complete_months(series, current_key)
        if len(cmonths) < 4:
            continue
        latest = cmonths[-1]
        base = [series[m] for m in cmonths[:-1]]
        mu, sd = mean(base), pstdev(base)
        val = series[latest]
        if mu <= 0 or val < 300:
            continue
        dev = (val - mu) / mu * 100
        z = (val - mu) / sd if sd else 0
        if (z >= 1.8 and dev >= 15) or dev >= 35:
            anomalies.append({
                "key": f"despesa-{cat.lower().replace(' ', '-')}",
                "severity": "critical" if dev >= 50 else "important",
                "title": f"Custo de '{cat}' {dev:+.0f}% acima do padrão",
                "summary": f"Em {month_pt(latest)}, '{cat}' custou R$ {val:,.2f}, contra média histórica de R$ {mu:,.2f}.",
                "evidence": [f"Média histórica: R$ {mu:,.2f}", f"Mês analisado: {month_pt(latest)}", f"Desvio: {dev:+.1f}% (z-score {z:+.1f})", "Fonte: transações importadas"],
            })

    cmonths = _complete_months(cust, current_key)
    if cmonths:
        latest = cmonths[-1]
        total = sum(cust[latest].values())
        if total > 0 and cust[latest]:
            top_name, top_val = max(cust[latest].items(), key=lambda x: x[1])
            share = top_val / total * 100
            if share >= 40:
                anomalies.append({
                    "key": "concentracao-clientes",
                    "severity": "important",
                    "title": f"{share:.0f}% da receita veio de um único cliente",
                    "summary": f"Em {month_pt(latest)}, '{top_name}' representou R$ {top_val:,.2f} de R$ {total:,.2f}. Dependência alta é um risco.",
                    "evidence": [f"Cliente: {top_name}", f"Participação: {share:.0f}%", f"Mês analisado: {month_pt(latest)}", "Fonte: transações importadas"],
                })

    for p in products:
        ams = p.get("avg_monthly_sales", 0)
        if ams > 0 and p.get("stock_qty", 0) > p.get("min_stock", 0):
            coverage = p["stock_qty"] / (ams / 30)
            if coverage <= 10:
                anomalies.append({
                    "key": f"cobertura-{p['name'].lower().replace(' ', '-')[:30]}",
                    "severity": "important",
                    "title": f"'{p['name']}' cobre só {coverage:.0f} dias de venda",
                    "summary": f"No ritmo médio de {ams}/mês, as {p['stock_qty']:.0f} unidades atuais acabam em ~{coverage:.0f} dias, mesmo estando acima do mínimo cadastrado.",
                    "evidence": [f"Estoque atual: {p['stock_qty']:.0f}", f"Venda média: {ams}/mês", f"Cobertura: ~{coverage:.0f} dias", "Fonte: base de estoque"],
                })

    order = {"critical": 0, "important": 1, "positive": 2}
    anomalies.sort(key=lambda a: order.get(a["severity"], 3))
    return anomalies


def compute_seasonality(txs):
    by_cal_month = defaultdict(list)
    monthly = defaultdict(float)
    for t in txs:
        if t["type"] == "receita":
            monthly[t["date"][:7]] += t["amount"]
    for key, total in monthly.items():
        by_cal_month[int(key.split("-")[1])].append(total)
    if not by_cal_month:
        return []
    averages = {m: mean(vals) for m, vals in by_cal_month.items()}
    overall = mean(averages.values())
    return [
        {"month": m, "label": PT_MONTHS[m - 1], "avg_revenue": round(avg, 2), "index": round(avg / overall * 100) if overall else 100, "samples": len(by_cal_month[m])}
        for m, avg in sorted(averages.items())
    ]

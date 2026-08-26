import asyncio
import random
from datetime import datetime, timedelta, timezone

from auth import hash_password
from database import db
from models import CompanyDoc, ProductDoc, TransactionDoc, UserDoc
from radar_engine import run_full_radar

DEMO_EMAIL = "demo@sociodigital.com"
DEMO_PASSWORD = "Demo@123"

CUSTOMERS = [
    ("Empório Vila Rica", 1.6), ("Café & Prosa Ltda", 1.3), ("Mercearia São Bento", 1.1),
    ("Padaria Dona Alzira", 0.9), ("Restaurante Alecrim", 1.4), ("Hotel Serra Verde", 1.8),
    ("Doceria Flor de Lis", 0.7), ("Distribuidora Norte Sul", 2.1), ("Bistrô da Praça", 1.0),
    ("Cantina Bella Massa", 0.8),
]
PRODUCTS = [
    ("Café Especial Torrado 1kg", 18, 25, 140), ("Café Tradicional 500g", 320, 80, 260),
    ("Kit Presente Café + Caneca", 12, 15, 45), ("Cápsulas Espresso cx/10", 210, 60, 190),
    ("Filtro de Papel nº103", 95, 40, 120), ("Açúcar Mascavo 1kg", 8, 20, 60),
    ("Moedor Manual Inox", 26, 10, 18), ("Garrafa Térmica 1L", 44, 12, 30),
]
EXPENSE_CATEGORIES = [
    ("Fornecedores", 9500, 14000), ("Folha de Pagamento", 16000, 16000), ("Aluguel", 4200, 4200),
    ("Energia e Água", 900, 1500), ("Marketing", 1200, 2600), ("Logística", 1800, 3200),
    ("Impostos", 3800, 5600), ("Manutenção", 300, 1400),
]


async def seed():
    random.seed(42)
    existing = await db.users.find_one({"email": DEMO_EMAIL})
    if existing:
        company_id = existing["company_id"]
        for coll in ("transactions", "customers", "products", "alerts", "chat_messages"):
            await db[coll].delete_many({"company_id": company_id})
        await db.users.delete_many({"company_id": company_id})
        await db.companies.delete_one({"_id": __import__("bson").ObjectId(company_id)})

    company = CompanyDoc(name="Aroma Brasil Cafés Ltda", owner_id="pending", has_data=True)
    result = await db.companies.insert_one(company.to_mongo())
    company_id = str(result.inserted_id)

    user = UserDoc(email=DEMO_EMAIL, password_hash=hash_password(DEMO_PASSWORD), name="Ricardo Almeida", role="owner", company_id=company_id)
    user_result = await db.users.insert_one(user.to_mongo())
    await db.companies.update_one({"_id": result.inserted_id}, {"$set": {"owner_id": str(user_result.inserted_id)}})

    today = datetime.now(timezone.utc).date()
    txs = []
    for month_offset in range(6, -1, -1):
        month_start = (today.replace(day=1) - timedelta(days=month_offset * 30)).replace(day=1)
        growth = 1.0 + (6 - month_offset) * 0.045
        dip = 0.82 if month_offset == 1 else 1.0
        for name, weight in CUSTOMERS:
            n_sales = max(1, int(random.gauss(3.2, 1.0)))
            if month_offset >= 2 and name == "Doceria Flor de Lis":
                n_sales = 0 if month_offset < 3 else n_sales
            if month_offset <= 2 and name in ("Doceria Flor de Lis", "Bistrô da Praça"):
                continue
            for _ in range(n_sales):
                day = min(28, random.randint(1, 28))
                date = month_start.replace(day=day)
                if date > today:
                    continue
                amount = round(random.uniform(650, 2400) * weight * growth * dip, 2)
                txs.append(TransactionDoc(
                    company_id=company_id, date=date.isoformat(),
                    description=f"Venda — {name}", amount=amount, type="receita",
                    category="Vendas", status="pago", customer_name=name,
                ))
        for idx, (cat, lo, hi) in enumerate(EXPENSE_CATEGORIES):
            day = min(28, random.randint(3, 25))
            date = month_start.replace(day=day)
            if date > today:
                continue
            cost_pressure = 1.12 if month_offset <= 1 and cat == "Fornecedores" else 1.0
            is_pending = month_offset == 0 and idx < 4
            due = (today + timedelta(days=2 + idx * 2)).isoformat() if is_pending else None
            txs.append(TransactionDoc(
                company_id=company_id, date=date.isoformat(),
                description=f"{cat} — competência {month_start.strftime('%m/%Y')}",
                amount=round(random.uniform(lo, hi) * cost_pressure, 2), type="despesa",
                category=cat, status="pendente" if is_pending else "pago", due_date=due,
            ))

    await db.transactions.insert_many([t.to_mongo() for t in txs])
    await db.products.insert_many([
        ProductDoc(company_id=company_id, name=n, stock_qty=q, min_stock=m, avg_monthly_sales=s).to_mongo()
        for n, q, m, s in PRODUCTS
    ])
    alerts = await run_full_radar(company_id)
    print(f"Seed ok: company={company_id} txs={len(txs)} products={len(PRODUCTS)} alerts={alerts}")
    print(f"Login: {DEMO_EMAIL} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())

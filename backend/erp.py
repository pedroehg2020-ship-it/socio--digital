"""
Camada ERP do Sócio Digital — V5.

Acrescenta ao núcleo original (que era somente leitura) as operações que um
empresário espera de um ERP no padrão Conta Azul / Omie / Bling:

  - venda com baixa automática de estoque, geração de recebível e lançamento
    financeiro;
  - contas a receber e contas a pagar, com baixa e controle de vencimento;
  - emissão de nota fiscal (NF-e / NFS-e) em modo simulado, pronta para
    plugar um emissor real;
  - fluxo de caixa projetado e DRE simplificado;
  - cadastro de produtos e clientes.

O módulo não importa `backend.app` para evitar dependência circular: recebe os
utilitários (`db`, `auth_user`, `nowiso`) por injeção em `build_router`.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from datetime import datetime, timedelta, timezone, date
from typing import Optional, List
import uuid


# --------------------------------------------------------------------------
# Modelos de entrada
# --------------------------------------------------------------------------

class SaleItemIn(BaseModel):
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    quantity: int = Field(gt=0)
    unit_price: Optional[float] = None


class SaleIn(BaseModel):
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    items: List[SaleItemIn]
    payment_method: str = "pix"          # pix | dinheiro | debito | credito | boleto | prazo
    installments: int = 1
    discount: float = 0.0
    sold_at: Optional[str] = None
    note: Optional[str] = None
    issue_invoice: bool = False


class ProductIn(BaseModel):
    name: str
    price: float = 0.0
    cost: float = 0.0
    stock: int = 0
    min_stock: int = 0
    status: Optional[str] = None


class ProductPatch(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    stock: Optional[int] = None
    min_stock: Optional[int] = None
    status: Optional[str] = None


class CustomerIn(BaseModel):
    name: str
    email: Optional[str] = None
    city: Optional[str] = None
    document: Optional[str] = None
    phone: Optional[str] = None


class CustomerPatch(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    document: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None


class ReceivableIn(BaseModel):
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    description: str
    amount: float
    due_date: str
    method: str = "boleto"


class PayableIn(BaseModel):
    supplier: str
    category: str = "outros"
    description: Optional[str] = None
    amount: float
    due_date: str
    recurring: bool = False


class SettleIn(BaseModel):
    paid_at: Optional[str] = None
    amount: Optional[float] = None


class FinanceIn(BaseModel):
    description: str
    type: str            # receita | despesa_fixa | despesa_variavel
    amount: float
    date: Optional[str] = None


class InvoiceIn(BaseModel):
    sale_id: Optional[str] = None
    customer_name: Optional[str] = None
    amount: Optional[float] = None
    kind: str = "NFe"    # NFe | NFSe
    note: Optional[str] = None


# --------------------------------------------------------------------------
# Schema
# --------------------------------------------------------------------------

SCHEMA = """
CREATE TABLE IF NOT EXISTS receivables(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, sale_id TEXT,
  customer_id TEXT, customer_name TEXT, description TEXT,
  amount REAL NOT NULL, due_date TEXT NOT NULL, status TEXT NOT NULL,
  method TEXT, paid_at TEXT, installment INTEGER, installments INTEGER,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS payables(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, supplier TEXT,
  category TEXT, description TEXT, amount REAL NOT NULL,
  due_date TEXT NOT NULL, status TEXT NOT NULL, recurring INTEGER DEFAULT 0,
  paid_at TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS invoices(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, number INTEGER, series TEXT,
  kind TEXT, sale_id TEXT, customer_name TEXT, amount REAL,
  status TEXT NOT NULL, access_key TEXT, note TEXT,
  issued_at TEXT, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recv_user ON receivables(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_pay_user ON payables(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_inv_user ON invoices(user_id, created_at);
"""

# Colunas acrescentadas a tabelas que já existiam na V4.
EXTRA_COLUMNS = [
    ("sales", "payment_method", "TEXT"),
    ("sales", "status", "TEXT"),
    ("sales", "discount", "REAL"),
    ("sales", "note", "TEXT"),
    ("sales", "channel", "TEXT"),
    ("customers", "document", "TEXT"),
    ("customers", "phone", "TEXT"),
    ("products", "sku", "TEXT"),
    ("products", "category", "TEXT"),
    ("products", "unit", "TEXT"),
]


def _iso_day(value) -> str:
    if isinstance(value, (datetime, date)):
        return value.strftime("%Y-%m-%d")
    return str(value or "")[:10]


def _parse_day(value):
    try:
        return datetime.strptime(_iso_day(value), "%Y-%m-%d").date()
    except Exception:
        return None


def build_router(db, auth_user, nowiso):
    """Monta o router ERP recebendo os utilitários do app principal."""

    router = APIRouter(prefix="/api", tags=["erp"])

    # ---------------------------------------------------------------- setup
    def init_erp():
        con = db()
        con.executescript(SCHEMA)
        existing = {}
        for table, column, coltype in EXTRA_COLUMNS:
            if table not in existing:
                existing[table] = {
                    r[1] for r in con.execute(f"PRAGMA table_info({table})").fetchall()
                }
            if column not in existing[table]:
                con.execute(f"ALTER TABLE {table} ADD COLUMN {column} {coltype}")
                existing[table].add(column)
        con.commit()
        _seed_demo(con)
        con.close()

    def _seed_demo(con):
        """Deriva recebíveis, contas a pagar e notas do dataset demo, uma única vez."""
        demo = con.execute(
            "SELECT id FROM users WHERE email=?", ("demo@sociodigital.local",)
        ).fetchone()
        if not demo:
            return
        uid = demo["id"]
        if con.execute(
            "SELECT 1 FROM receivables WHERE user_id=? LIMIT 1", (uid,)
        ).fetchone():
            return

        today = datetime.now(timezone.utc).date()
        sales = con.execute(
            "SELECT * FROM sales WHERE user_id=? ORDER BY sold_at DESC LIMIT 24", (uid,)
        ).fetchall()

        # Uma parcela a prazo para cada terceira venda recente.
        for i, s in enumerate(sales):
            if i % 3:
                continue
            sold = _parse_day(s["sold_at"]) or today
            due = sold + timedelta(days=30)
            status = "pago" if due < today - timedelta(days=5) else "aberto"
            con.execute(
                """INSERT INTO receivables
                   (id,user_id,sale_id,customer_id,customer_name,description,amount,
                    due_date,status,method,paid_at,installment,installments,created_at)
                   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    str(uuid.uuid4()), uid, s["id"], s["customer_id"], s["customer_name"],
                    f"Venda {s['product_name']}", round(float(s["revenue"] or 0), 2),
                    _iso_day(due), status, "boleto",
                    _iso_day(due) if status == "pago" else None, 1, 1, nowiso(),
                ),
            )

        despesas_fixas = [
            ("Aluguel do ponto", "aluguel", 4200.0, 5),
            ("Folha de pagamento", "folha", 12800.0, 5),
            ("Energia elétrica", "utilidades", 980.0, 12),
            ("Internet e telefonia", "utilidades", 320.0, 15),
            ("Contabilidade", "servicos", 890.0, 10),
            ("Simples Nacional", "impostos", 3150.0, 20),
            ("Fornecedor Distribuidora Sul", "fornecedores", 7400.0, 25),
        ]
        for mes in (0, 1):
            base = (today.replace(day=1) + timedelta(days=32 * mes)).replace(day=1)
            for desc, cat, amount, dia in despesas_fixas:
                try:
                    due = base.replace(day=dia)
                except ValueError:
                    continue
                status = "pago" if due < today else "aberto"
                con.execute(
                    """INSERT INTO payables
                       (id,user_id,supplier,category,description,amount,due_date,
                        status,recurring,paid_at,created_at)
                       VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
                    (
                        str(uuid.uuid4()), uid, desc, cat, desc, amount,
                        _iso_day(due), status, 1,
                        _iso_day(due) if status == "pago" else None, nowiso(),
                    ),
                )

        numero = 1
        for s in sales[:8]:
            con.execute(
                """INSERT INTO invoices
                   (id,user_id,number,series,kind,sale_id,customer_name,amount,
                    status,access_key,note,issued_at,created_at)
                   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    str(uuid.uuid4()), uid, numero, "1", "NFe", s["id"],
                    s["customer_name"], round(float(s["revenue"] or 0), 2),
                    "autorizada", _fake_key(numero), None,
                    s["sold_at"], nowiso(),
                ),
            )
            numero += 1
        con.commit()

    def _fake_key(n: int) -> str:
        base = f"43{datetime.now().strftime('%y%m')}00000000000000550010000000{n:03d}"
        return (base + "0" * 44)[:44]

    def _uid(u):
        return u["id"]

    def _all(sql, params):
        con = db()
        rr = [dict(r) for r in con.execute(sql, params).fetchall()]
        con.close()
        return rr

    def _refresh_overdue(uid):
        """Marca como vencido o que passou do prazo e continua em aberto."""
        today = _iso_day(datetime.now(timezone.utc))
        con = db()
        for table in ("receivables", "payables"):
            con.execute(
                f"UPDATE {table} SET status='vencido' "
                f"WHERE user_id=? AND status='aberto' AND due_date < ?",
                (uid, today),
            )
        con.commit()
        con.close()

    # ------------------------------------------------------------- produtos
    @router.post("/products")
    def create_product(x: ProductIn, u=Depends(auth_user)):
        pid = str(uuid.uuid4())
        con = db()
        con.execute(
            """INSERT INTO products
               (id,user_id,name,price,cost,stock,min_stock,created_at,ai_suggestion,status)
               VALUES(?,?,?,?,?,?,?,?,?,?)""",
            (pid, _uid(u), x.name, x.price, x.cost, x.stock, x.min_stock,
             nowiso(), None, x.status or "ativo"),
        )
        con.commit()
        row = dict(con.execute("SELECT * FROM products WHERE id=?", (pid,)).fetchone())
        con.close()
        return row

    @router.patch("/products/{pid}")
    def patch_product(pid: str, x: ProductPatch, u=Depends(auth_user)):
        con = db()
        cur = con.execute(
            "SELECT * FROM products WHERE id=? AND user_id=?", (pid, _uid(u))
        ).fetchone()
        if not cur:
            con.close()
            raise HTTPException(404, "Produto não encontrado")
        data = {**dict(cur), **x.model_dump(exclude_none=True)}
        con.execute(
            """UPDATE products SET name=?,price=?,cost=?,stock=?,min_stock=?,status=?
               WHERE id=? AND user_id=?""",
            (data["name"], data["price"], data["cost"], data["stock"],
             data["min_stock"], data["status"], pid, _uid(u)),
        )
        con.commit()
        row = dict(con.execute("SELECT * FROM products WHERE id=?", (pid,)).fetchone())
        con.close()
        return row

    @router.delete("/products/{pid}")
    def delete_product(pid: str, u=Depends(auth_user)):
        con = db()
        con.execute("DELETE FROM products WHERE id=? AND user_id=?", (pid, _uid(u)))
        con.commit()
        con.close()
        return {"ok": True}

    # -------------------------------------------------------------- clientes
    @router.post("/customers")
    def create_customer(x: CustomerIn, u=Depends(auth_user)):
        cid = str(uuid.uuid4())
        con = db()
        con.execute(
            """INSERT INTO customers
               (id,user_id,name,email,city,last_purchase,lifetime_value,created_at,
                days_since_purchase,status,ai_suggestion,document,phone)
               VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (cid, _uid(u), x.name, x.email, x.city, None, 0.0, nowiso(),
             0, "novo", None, x.document, x.phone),
        )
        con.commit()
        row = dict(con.execute("SELECT * FROM customers WHERE id=?", (cid,)).fetchone())
        con.close()
        return row

    @router.patch("/customers/{cid}")
    def patch_customer(cid: str, x: CustomerPatch, u=Depends(auth_user)):
        con = db()
        cur = con.execute(
            "SELECT * FROM customers WHERE id=? AND user_id=?", (cid, _uid(u))
        ).fetchone()
        if not cur:
            con.close()
            raise HTTPException(404, "Cliente não encontrado")
        data = {**dict(cur), **x.model_dump(exclude_none=True)}
        con.execute(
            """UPDATE customers SET name=?,email=?,city=?,status=?,document=?,phone=?
               WHERE id=? AND user_id=?""",
            (data["name"], data["email"], data["city"], data["status"],
             data.get("document"), data.get("phone"), cid, _uid(u)),
        )
        con.commit()
        row = dict(con.execute("SELECT * FROM customers WHERE id=?", (cid,)).fetchone())
        con.close()
        return row

    # ----------------------------------------------------------------- venda
    @router.post("/sales")
    def create_sale(x: SaleIn, u=Depends(auth_user)):
        if not x.items:
            raise HTTPException(400, "Informe ao menos um item")
        uid = _uid(u)
        con = db()
        sold_at = x.sold_at or nowiso()
        created = []
        total_revenue = 0.0
        total_cost = 0.0
        first_id = None

        for item in x.items:
            product = None
            if item.product_id:
                product = con.execute(
                    "SELECT * FROM products WHERE id=? AND user_id=?",
                    (item.product_id, uid),
                ).fetchone()
            name = item.product_name or (product["name"] if product else "Item avulso")
            unit_price = item.unit_price
            if unit_price is None:
                unit_price = float(product["price"] or 0) if product else 0.0
            unit_cost = float(product["cost"] or 0) if product else 0.0
            revenue = round(unit_price * item.quantity, 2)
            cost = round(unit_cost * item.quantity, 2)

            if product is not None:
                estoque = int(product["stock"] or 0)
                if estoque < item.quantity:
                    con.close()
                    raise HTTPException(
                        400,
                        f"Estoque insuficiente de {name}: {estoque} disponível(is)",
                    )
                con.execute(
                    "UPDATE products SET stock=? WHERE id=?",
                    (estoque - item.quantity, product["id"]),
                )

            sid = str(uuid.uuid4())
            first_id = first_id or sid
            con.execute(
                """INSERT INTO sales
                   (id,user_id,product_id,product_name,customer_id,customer_name,
                    quantity,unit_price,unit_cost,revenue,profit,sold_at,
                    payment_method,status,discount,note,channel)
                   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    sid, uid, product["id"] if product else None, name,
                    x.customer_id, x.customer_name or "Consumidor final",
                    item.quantity, unit_price, unit_cost, revenue,
                    round(revenue - cost, 2), sold_at,
                    x.payment_method, "confirmada", 0.0, x.note, "manual",
                ),
            )
            created.append(sid)
            total_revenue += revenue
            total_cost += cost

        desconto = max(0.0, float(x.discount or 0))
        liquido = round(max(0.0, total_revenue - desconto), 2)

        # Cliente: atualiza recorrência e valor acumulado.
        if x.customer_id:
            cur = con.execute(
                "SELECT * FROM customers WHERE id=? AND user_id=?", (x.customer_id, uid)
            ).fetchone()
            if cur:
                con.execute(
                    """UPDATE customers
                       SET last_purchase=?, lifetime_value=?, days_since_purchase=0,
                           status='ativo' WHERE id=?""",
                    (sold_at, round(float(cur["lifetime_value"] or 0) + liquido, 2),
                     x.customer_id),
                )

        # Financeiro: à vista entra no caixa; a prazo vira parcela em aberto.
        a_vista = x.payment_method in ("pix", "dinheiro", "debito")
        parcelas = max(1, int(x.installments or 1))
        base_day = _parse_day(sold_at) or datetime.now(timezone.utc).date()

        if a_vista:
            con.execute(
                """INSERT INTO finance (id,user_id,description,type,amount,date,created_at)
                   VALUES(?,?,?,?,?,?,?)""",
                (str(uuid.uuid4()), uid,
                 f"Venda — {x.customer_name or 'Consumidor final'}",
                 "receita", liquido, _iso_day(base_day), nowiso()),
            )
            con.execute(
                """INSERT INTO receivables
                   (id,user_id,sale_id,customer_id,customer_name,description,amount,
                    due_date,status,method,paid_at,installment,installments,created_at)
                   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (str(uuid.uuid4()), uid, first_id, x.customer_id,
                 x.customer_name or "Consumidor final", "Venda à vista", liquido,
                 _iso_day(base_day), "pago", x.payment_method,
                 _iso_day(base_day), 1, 1, nowiso()),
            )
        else:
            valor_parcela = round(liquido / parcelas, 2)
            for n in range(1, parcelas + 1):
                due = base_day + timedelta(days=30 * n)
                # Ajuste de centavos na última parcela.
                valor = valor_parcela if n < parcelas else round(
                    liquido - valor_parcela * (parcelas - 1), 2
                )
                con.execute(
                    """INSERT INTO receivables
                       (id,user_id,sale_id,customer_id,customer_name,description,amount,
                        due_date,status,method,paid_at,installment,installments,created_at)
                       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (str(uuid.uuid4()), uid, first_id, x.customer_id,
                     x.customer_name or "Consumidor final",
                     f"Venda parcelada {n}/{parcelas}", valor,
                     _iso_day(due), "aberto", x.payment_method, None,
                     n, parcelas, nowiso()),
                )

        invoice = None
        if x.issue_invoice:
            invoice = _issue_invoice(
                con, uid, first_id, x.customer_name or "Consumidor final", liquido, "NFe", None
            )

        con.commit()
        con.close()
        return {
            "ok": True,
            "sale_ids": created,
            "total": liquido,
            "cost": round(total_cost, 2),
            "profit": round(liquido - total_cost, 2),
            "payment_method": x.payment_method,
            "installments": 1 if a_vista else parcelas,
            "invoice": invoice,
        }

    @router.delete("/sales/{sid}")
    def cancel_sale(sid: str, u=Depends(auth_user)):
        uid = _uid(u)
        con = db()
        row = con.execute(
            "SELECT * FROM sales WHERE id=? AND user_id=?", (sid, uid)
        ).fetchone()
        if not row:
            con.close()
            raise HTTPException(404, "Venda não encontrada")
        if row["product_id"]:
            con.execute(
                "UPDATE products SET stock=stock+? WHERE id=? AND user_id=?",
                (row["quantity"], row["product_id"], uid),
            )
        con.execute(
            "UPDATE receivables SET status='cancelado' WHERE sale_id=? AND user_id=?",
            (sid, uid),
        )
        con.execute("DELETE FROM sales WHERE id=? AND user_id=?", (sid, uid))
        con.commit()
        con.close()
        return {"ok": True}

    @router.get("/sales/summary")
    def sales_summary(u=Depends(auth_user)):
        uid = _uid(u)
        sales = _all("SELECT * FROM sales WHERE user_id=?", (uid,))
        now = datetime.now(timezone.utc)
        hoje = _iso_day(now)
        ini_mes = _iso_day(now.replace(day=1))

        def soma(rr, campo="revenue"):
            return round(sum(float(r.get(campo) or 0) for r in rr), 2)

        do_dia = [s for s in sales if _iso_day(s.get("sold_at")) == hoje]
        do_mes = [s for s in sales if _iso_day(s.get("sold_at")) >= ini_mes]
        ultimos30 = [
            s for s in sales
            if _iso_day(s.get("sold_at")) >= _iso_day(now - timedelta(days=30))
        ]

        por_pagamento = {}
        for s in ultimos30:
            k = s.get("payment_method") or "não informado"
            por_pagamento[k] = round(por_pagamento.get(k, 0) + float(s.get("revenue") or 0), 2)

        ranking = {}
        for s in ultimos30:
            k = s.get("product_name") or "—"
            item = ranking.setdefault(k, {"produto": k, "quantidade": 0, "receita": 0.0})
            item["quantidade"] += int(s.get("quantity") or 0)
            item["receita"] = round(item["receita"] + float(s.get("revenue") or 0), 2)
        top = sorted(ranking.values(), key=lambda r: r["receita"], reverse=True)[:5]

        ticket = round(soma(do_mes) / len(do_mes), 2) if do_mes else 0.0
        return {
            "hoje": soma(do_dia),
            "pedidos_hoje": len(do_dia),
            "mes": soma(do_mes),
            "pedidos_mes": len(do_mes),
            "lucro_mes": soma(do_mes, "profit"),
            "ticket_medio": ticket,
            "por_pagamento": [{"metodo": k, "valor": v} for k, v in por_pagamento.items()],
            "top_produtos": top,
        }

    # ------------------------------------------------------- contas a receber
    @router.get("/receivables")
    def list_receivables(u=Depends(auth_user), status: Optional[str] = None):
        uid = _uid(u)
        _refresh_overdue(uid)
        sql = "SELECT * FROM receivables WHERE user_id=?"
        params = [uid]
        if status:
            sql += " AND status=?"
            params.append(status)
        return _all(sql + " ORDER BY due_date", tuple(params))

    @router.post("/receivables")
    def create_receivable(x: ReceivableIn, u=Depends(auth_user)):
        rid = str(uuid.uuid4())
        con = db()
        con.execute(
            """INSERT INTO receivables
               (id,user_id,sale_id,customer_id,customer_name,description,amount,
                due_date,status,method,paid_at,installment,installments,created_at)
               VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (rid, _uid(u), None, x.customer_id, x.customer_name, x.description,
             x.amount, _iso_day(x.due_date), "aberto", x.method, None, 1, 1, nowiso()),
        )
        con.commit()
        row = dict(con.execute("SELECT * FROM receivables WHERE id=?", (rid,)).fetchone())
        con.close()
        return row

    @router.post("/receivables/{rid}/settle")
    def settle_receivable(rid: str, x: SettleIn, u=Depends(auth_user)):
        uid = _uid(u)
        con = db()
        row = con.execute(
            "SELECT * FROM receivables WHERE id=? AND user_id=?", (rid, uid)
        ).fetchone()
        if not row:
            con.close()
            raise HTTPException(404, "Título não encontrado")
        pago_em = _iso_day(x.paid_at or nowiso())
        valor = float(x.amount if x.amount is not None else row["amount"])
        con.execute(
            "UPDATE receivables SET status='pago', paid_at=? WHERE id=?", (pago_em, rid)
        )
        con.execute(
            """INSERT INTO finance (id,user_id,description,type,amount,date,created_at)
               VALUES(?,?,?,?,?,?,?)""",
            (str(uuid.uuid4()), uid, f"Recebimento — {row['description']}",
             "receita", valor, pago_em, nowiso()),
        )
        con.commit()
        out = dict(con.execute("SELECT * FROM receivables WHERE id=?", (rid,)).fetchone())
        con.close()
        return out

    # --------------------------------------------------------- contas a pagar
    @router.get("/payables")
    def list_payables(u=Depends(auth_user), status: Optional[str] = None):
        uid = _uid(u)
        _refresh_overdue(uid)
        sql = "SELECT * FROM payables WHERE user_id=?"
        params = [uid]
        if status:
            sql += " AND status=?"
            params.append(status)
        return _all(sql + " ORDER BY due_date", tuple(params))

    @router.post("/payables")
    def create_payable(x: PayableIn, u=Depends(auth_user)):
        pid = str(uuid.uuid4())
        con = db()
        con.execute(
            """INSERT INTO payables
               (id,user_id,supplier,category,description,amount,due_date,status,
                recurring,paid_at,created_at)
               VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
            (pid, _uid(u), x.supplier, x.category, x.description or x.supplier,
             x.amount, _iso_day(x.due_date), "aberto", 1 if x.recurring else 0,
             None, nowiso()),
        )
        con.commit()
        row = dict(con.execute("SELECT * FROM payables WHERE id=?", (pid,)).fetchone())
        con.close()
        return row

    @router.post("/payables/{pid}/settle")
    def settle_payable(pid: str, x: SettleIn, u=Depends(auth_user)):
        uid = _uid(u)
        con = db()
        row = con.execute(
            "SELECT * FROM payables WHERE id=? AND user_id=?", (pid, uid)
        ).fetchone()
        if not row:
            con.close()
            raise HTTPException(404, "Conta não encontrada")
        pago_em = _iso_day(x.paid_at or nowiso())
        valor = float(x.amount if x.amount is not None else row["amount"])
        con.execute(
            "UPDATE payables SET status='pago', paid_at=? WHERE id=?", (pago_em, pid)
        )
        tipo = "despesa_fixa" if row["recurring"] else "despesa_variavel"
        con.execute(
            """INSERT INTO finance (id,user_id,description,type,amount,date,created_at)
               VALUES(?,?,?,?,?,?,?)""",
            (str(uuid.uuid4()), uid, f"Pagamento — {row['supplier']}",
             tipo, valor, pago_em, nowiso()),
        )
        con.commit()
        out = dict(con.execute("SELECT * FROM payables WHERE id=?", (pid,)).fetchone())
        con.close()
        return out

    @router.post("/finance")
    def create_finance(x: FinanceIn, u=Depends(auth_user)):
        fid = str(uuid.uuid4())
        con = db()
        con.execute(
            """INSERT INTO finance (id,user_id,description,type,amount,date,created_at)
               VALUES(?,?,?,?,?,?,?)""",
            (fid, _uid(u), x.description, x.type, x.amount,
             _iso_day(x.date or nowiso()), nowiso()),
        )
        con.commit()
        row = dict(con.execute("SELECT * FROM finance WHERE id=?", (fid,)).fetchone())
        con.close()
        return row

    # ------------------------------------------------------- fluxo de caixa
    @router.get("/cashflow")
    def cashflow(u=Depends(auth_user), days: int = Query(90, ge=7, le=365)):
        uid = _uid(u)
        _refresh_overdue(uid)
        hoje = datetime.now(timezone.utc).date()
        limite = hoje + timedelta(days=days)

        recv = _all(
            "SELECT * FROM receivables WHERE user_id=? AND status IN ('aberto','vencido')",
            (uid,),
        )
        pay = _all(
            "SELECT * FROM payables WHERE user_id=? AND status IN ('aberto','vencido')",
            (uid,),
        )
        fin = _all("SELECT * FROM finance WHERE user_id=?", (uid,))

        # Saldo atual = movimentações já realizadas.
        # Entradas: receitas lançadas no financeiro + vendas que não geraram
        # título a receber (base histórica importada, já liquidada).
        # Saídas: despesas e investimentos lançados no financeiro. Baixas de
        # títulos criam lançamento em `finance`, então não são somadas de novo.
        vendas = _all("SELECT id, revenue FROM sales WHERE user_id=?", (uid,))
        com_titulo = {
            r["sale_id"] for r in _all(
                "SELECT DISTINCT sale_id FROM receivables WHERE user_id=? AND sale_id IS NOT NULL",
                (uid,),
            )
        }
        entradas = sum(
            float(f.get("amount") or 0) for f in fin if f.get("type") == "receita"
        ) + sum(
            float(v.get("revenue") or 0) for v in vendas if v["id"] not in com_titulo
        )
        saidas = sum(
            float(f.get("amount") or 0) for f in fin if f.get("type") != "receita"
        )
        saldo = round(entradas - saidas, 2)

        buckets = {}
        for r in recv:
            d = max(_parse_day(r["due_date"]) or hoje, hoje)
            if d > limite:
                continue
            b = buckets.setdefault(_iso_day(d), {"dia": _iso_day(d), "entradas": 0.0, "saidas": 0.0})
            b["entradas"] += float(r["amount"] or 0)
        for p in pay:
            d = max(_parse_day(p["due_date"]) or hoje, hoje)
            if d > limite:
                continue
            b = buckets.setdefault(_iso_day(d), {"dia": _iso_day(d), "entradas": 0.0, "saidas": 0.0})
            b["saidas"] += float(p["amount"] or 0)

        serie = []
        acumulado = saldo
        for chave in sorted(buckets):
            b = buckets[chave]
            liquido = round(b["entradas"] - b["saidas"], 2)
            acumulado = round(acumulado + liquido, 2)
            serie.append({
                "dia": b["dia"],
                "entradas": round(b["entradas"], 2),
                "saidas": round(b["saidas"], 2),
                "liquido": liquido,
                "saldo": acumulado,
            })

        negativo = next((s["dia"] for s in serie if s["saldo"] < 0), None)
        return {
            "saldo_atual": saldo,
            "a_receber": round(sum(float(r["amount"] or 0) for r in recv), 2),
            "a_pagar": round(sum(float(p["amount"] or 0) for p in pay), 2),
            "saldo_projetado": acumulado,
            "primeiro_dia_negativo": negativo,
            "vencidos_receber": round(
                sum(float(r["amount"] or 0) for r in recv if r["status"] == "vencido"), 2
            ),
            "vencidos_pagar": round(
                sum(float(p["amount"] or 0) for p in pay if p["status"] == "vencido"), 2
            ),
            "serie": serie,
        }

    # ------------------------------------------------------------------ DRE
    @router.get("/reports/dre")
    def dre(u=Depends(auth_user), months: int = Query(6, ge=1, le=24)):
        uid = _uid(u)
        sales = _all("SELECT * FROM sales WHERE user_id=?", (uid,))
        fin = _all("SELECT * FROM finance WHERE user_id=?", (uid,))
        hoje = datetime.now(timezone.utc).date()

        chaves = []
        ref = hoje.replace(day=1)
        for _ in range(months):
            chaves.append(ref.strftime("%Y-%m"))
            ref = (ref - timedelta(days=1)).replace(day=1)
        chaves.reverse()

        linhas = []
        for chave in chaves:
            receita = round(sum(
                float(s.get("revenue") or 0) for s in sales
                if _iso_day(s.get("sold_at"))[:7] == chave
            ), 2)
            custo = round(sum(
                float(s.get("unit_cost") or 0) * int(s.get("quantity") or 0)
                for s in sales if _iso_day(s.get("sold_at"))[:7] == chave
            ), 2)
            fixas = round(sum(
                float(f.get("amount") or 0) for f in fin
                if _iso_day(f.get("date"))[:7] == chave and f.get("type") == "despesa_fixa"
            ), 2)
            variaveis = round(sum(
                float(f.get("amount") or 0) for f in fin
                if _iso_day(f.get("date"))[:7] == chave and f.get("type") == "despesa_variavel"
            ), 2)
            bruto = round(receita - custo, 2)
            liquido = round(bruto - fixas - variaveis, 2)
            linhas.append({
                "mes": chave,
                "receita_bruta": receita,
                "custo_mercadoria": custo,
                "lucro_bruto": bruto,
                "margem_bruta": round((bruto / receita * 100) if receita else 0, 1),
                "despesas_fixas": fixas,
                "despesas_variaveis": variaveis,
                "lucro_liquido": liquido,
                "margem_liquida": round((liquido / receita * 100) if receita else 0, 1),
            })
        return {"linhas": linhas}

    # ---------------------------------------------------------- notas fiscais
    def _issue_invoice(con, uid, sale_id, customer_name, amount, kind, note):
        ultimo = con.execute(
            "SELECT MAX(number) AS n FROM invoices WHERE user_id=?", (uid,)
        ).fetchone()
        numero = int((ultimo["n"] if ultimo and ultimo["n"] else 0)) + 1
        iid = str(uuid.uuid4())
        con.execute(
            """INSERT INTO invoices
               (id,user_id,number,series,kind,sale_id,customer_name,amount,status,
                access_key,note,issued_at,created_at)
               VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (iid, uid, numero, "1", kind, sale_id, customer_name,
             round(float(amount or 0), 2), "autorizada", _fake_key(numero),
             note, nowiso(), nowiso()),
        )
        return dict(con.execute("SELECT * FROM invoices WHERE id=?", (iid,)).fetchone())

    @router.get("/invoices")
    def list_invoices(u=Depends(auth_user)):
        return _all(
            "SELECT * FROM invoices WHERE user_id=? ORDER BY number DESC", (_uid(u),)
        )

    @router.post("/invoices")
    def post_invoice(x: InvoiceIn, u=Depends(auth_user)):
        uid = _uid(u)
        con = db()
        nome = x.customer_name
        valor = x.amount
        if x.sale_id:
            s = con.execute(
                "SELECT * FROM sales WHERE id=? AND user_id=?", (x.sale_id, uid)
            ).fetchone()
            if s:
                nome = nome or s["customer_name"]
                valor = valor if valor is not None else s["revenue"]
        if valor is None:
            con.close()
            raise HTTPException(400, "Informe o valor da nota")
        out = _issue_invoice(con, uid, x.sale_id, nome or "Consumidor final",
                             valor, x.kind, x.note)
        con.commit()
        con.close()
        return out

    @router.post("/invoices/{iid}/cancel")
    def cancel_invoice(iid: str, u=Depends(auth_user)):
        con = db()
        con.execute(
            "UPDATE invoices SET status='cancelada' WHERE id=? AND user_id=?",
            (iid, _uid(u)),
        )
        con.commit()
        row = con.execute("SELECT * FROM invoices WHERE id=?", (iid,)).fetchone()
        con.close()
        if not row:
            raise HTTPException(404, "Nota não encontrada")
        return dict(row)

    # ------------------------------------------------------------ visão geral
    @router.get("/overview")
    def overview(u=Depends(auth_user)):
        """Resumo transversal usado pelos cards de topo e pelo Radar."""
        uid = _uid(u)
        _refresh_overdue(uid)
        hoje = datetime.now(timezone.utc).date()
        em7 = hoje + timedelta(days=7)

        recv = _all(
            "SELECT * FROM receivables WHERE user_id=? AND status IN ('aberto','vencido')",
            (uid,),
        )
        pay = _all(
            "SELECT * FROM payables WHERE user_id=? AND status IN ('aberto','vencido')",
            (uid,),
        )
        prod = _all("SELECT * FROM products WHERE user_id=?", (uid,))
        notas = _all(
            "SELECT * FROM invoices WHERE user_id=? AND status='autorizada'", (uid,)
        )

        def na_semana(rr):
            return round(sum(
                float(r["amount"] or 0) for r in rr
                if (_parse_day(r["due_date"]) or hoje) <= em7
            ), 2)

        return {
            "receber_total": round(sum(float(r["amount"] or 0) for r in recv), 2),
            "receber_semana": na_semana(recv),
            "receber_vencido": round(
                sum(float(r["amount"] or 0) for r in recv if r["status"] == "vencido"), 2
            ),
            "pagar_total": round(sum(float(p["amount"] or 0) for p in pay), 2),
            "pagar_semana": na_semana(pay),
            "pagar_vencido": round(
                sum(float(p["amount"] or 0) for p in pay if p["status"] == "vencido"), 2
            ),
            "estoque_baixo": [
                {"id": p["id"], "name": p["name"], "stock": p["stock"],
                 "min_stock": p["min_stock"]}
                for p in prod
                if int(p.get("stock") or 0) <= int(p.get("min_stock") or 0)
            ][:8],
            "notas_emitidas": len(notas),
            "valor_notas": round(sum(float(n["amount"] or 0) for n in notas), 2),
        }

    init_erp()
    return router

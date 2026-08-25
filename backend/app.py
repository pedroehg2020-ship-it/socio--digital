
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime, timedelta, timezone
import sqlite3, json, secrets, hashlib, hmac, base64, os, uuid, urllib.request, urllib.error
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parent.parent
DB = Path(__file__).resolve().parent / "socio_digital.sqlite3"
SEED = Path(__file__).resolve().parent / "data" / "seed.json"
FRONTEND = ROOT / "frontend"

app = FastAPI(title="Sócio Digital — backend reconstruído")

def nowiso():
    return datetime.now(timezone.utc).isoformat()

def db():
    con=sqlite3.connect(DB)
    con.row_factory=sqlite3.Row
    return con

def hash_password(password, salt=None):
    salt=salt or secrets.token_hex(16)
    dk=hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000)
    return salt + "$" + base64.urlsafe_b64encode(dk).decode()

def verify_password(password, encoded):
    salt, expected = encoded.split("$",1)
    got=hash_password(password,salt).split("$",1)[1]
    return hmac.compare_digest(got, expected)

def make_token(user_id):
    # Local opaque token. The original preview used JWT; this reconstruction avoids copying its secret.
    return secrets.token_urlsafe(32) + "." + user_id

def init_db():
    con=db()
    cur=con.cursor()
    cur.executescript("""
    CREATE TABLE IF NOT EXISTS users(
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, company_name TEXT, segment TEXT, whatsapp TEXT,
      whatsapp_prefs TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions(
      token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products(
      id TEXT PRIMARY KEY, user_id TEXT, name TEXT, price REAL, cost REAL,
      stock INTEGER, min_stock INTEGER, created_at TEXT, ai_suggestion TEXT, status TEXT
    );
    CREATE TABLE IF NOT EXISTS customers(
      id TEXT PRIMARY KEY, user_id TEXT, name TEXT, email TEXT, city TEXT,
      last_purchase TEXT, lifetime_value REAL, created_at TEXT,
      days_since_purchase INTEGER, status TEXT, ai_suggestion TEXT
    );
    CREATE TABLE IF NOT EXISTS sales(
      id TEXT PRIMARY KEY, user_id TEXT, product_id TEXT, product_name TEXT,
      customer_id TEXT, customer_name TEXT, quantity INTEGER, unit_price REAL,
      unit_cost REAL, revenue REAL, profit REAL, sold_at TEXT
    );
    CREATE TABLE IF NOT EXISTS finance(
      id TEXT PRIMARY KEY, user_id TEXT, description TEXT, type TEXT,
      amount REAL, date TEXT, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS alerts(
      id TEXT PRIMARY KEY, user_id TEXT, severity TEXT, type TEXT, category TEXT,
      title TEXT, message TEXT, read INTEGER, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS whatsapp_log(
      id TEXT PRIMARY KEY, user_id TEXT, message TEXT, kind TEXT, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS integrations(
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, provider TEXT NOT NULL,
      access_token TEXT, refresh_token TEXT, expires_at TEXT, status TEXT NOT NULL,
      connected_at TEXT, updated_at TEXT, UNIQUE(user_id, provider)
    );
    """)
    con.commit()

    # Seed one demo account + the captured demo business data.
    demo=cur.execute("SELECT id FROM users WHERE email=?",("demo@sociodigital.local",)).fetchone()
    if not demo:
        uid="demo-user"
        prefs={"enabled":True,"categories":["vendas","estoque","clientes","financeiro"],"immediate":True,"daily_summary":True}
        cur.execute("INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?)",(
            uid,"Usuário Demo","demo@sociodigital.local",hash_password("demo1234"),
            "Empresa Demo","Comércio",None,json.dumps(prefs,ensure_ascii=False),nowiso()
        ))
        data=json.loads(SEED.read_text(encoding="utf-8"))
        for p in data.get("products",[]):
            p["user_id"]=uid
            cur.execute("""INSERT OR REPLACE INTO products
            (id,user_id,name,price,cost,stock,min_stock,created_at,ai_suggestion,status)
            VALUES(?,?,?,?,?,?,?,?,?,?)""",(
                p.get("id",str(uuid.uuid4())),uid,p.get("name"),p.get("price"),p.get("cost"),
                p.get("stock"),p.get("min_stock"),p.get("created_at"),p.get("ai_suggestion"),p.get("status")
            ))
        for c in data.get("customers",[]):
            c["user_id"]=uid
            cur.execute("""INSERT OR REPLACE INTO customers
            (id,user_id,name,email,city,last_purchase,lifetime_value,created_at,days_since_purchase,status,ai_suggestion)
            VALUES(?,?,?,?,?,?,?,?,?,?,?)""",(
                c.get("id",str(uuid.uuid4())),uid,c.get("name"),c.get("email"),c.get("city"),
                c.get("last_purchase"),c.get("lifetime_value"),c.get("created_at"),
                c.get("days_since_purchase"),c.get("status"),c.get("ai_suggestion")
            ))
        for s in data.get("sales",[]):
            s["user_id"]=uid
            cur.execute("""INSERT OR REPLACE INTO sales
            (id,user_id,product_id,product_name,customer_id,customer_name,quantity,unit_price,unit_cost,revenue,profit,sold_at)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",(
                s.get("id",str(uuid.uuid4())),uid,s.get("product_id"),s.get("product_name"),
                s.get("customer_id"),s.get("customer_name"),s.get("quantity"),s.get("unit_price"),
                s.get("unit_cost"),s.get("revenue"),s.get("profit"),s.get("sold_at")
            ))
        for f in data.get("finance",[]):
            f["user_id"]=uid
            cur.execute("""INSERT OR REPLACE INTO finance
            (id,user_id,description,type,amount,date,created_at) VALUES(?,?,?,?,?,?,?)""",(
                f.get("id",str(uuid.uuid4())),uid,f.get("description"),f.get("type"),
                f.get("amount"),f.get("date"),f.get("created_at")
            ))
        for a in data.get("alerts",[]):
            a["user_id"]=uid
            cur.execute("""INSERT OR REPLACE INTO alerts
            (id,user_id,severity,type,category,title,message,read,created_at)
            VALUES(?,?,?,?,?,?,?,?,?)""",(
                a.get("id",str(uuid.uuid4())),uid,a.get("severity"),a.get("type"),a.get("category"),
                a.get("title"),a.get("message"),1 if a.get("read") else 0,a.get("created_at")
            ))
        con.commit()
    con.close()


def openai_enabled():
    return bool(os.environ.get("OPENAI_API_KEY"))

def call_openai_responses(prompt: str):
    """Calls the OpenAI Responses API when OPENAI_API_KEY is configured."""
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY não configurada")
    model = os.environ.get("OPENAI_MODEL", "gpt-5.6-luna")
    payload = json.dumps({
        "model": model,
        "input": prompt
    }, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=payload,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.loads(r.read().decode("utf-8"))
    # Responses API: collect output_text items robustly.
    texts = []
    for item in data.get("output", []):
        if item.get("type") == "message":
            for c in item.get("content", []):
                if c.get("type") == "output_text" and c.get("text"):
                    texts.append(c["text"])
    if not texts and data.get("output_text"):
        texts.append(data["output_text"])
    return "\n".join(texts).strip()

def whatsapp_enabled():
    return bool(os.environ.get("WHATSAPP_SEND_URL") and os.environ.get("WHATSAPP_TOKEN"))

def send_whatsapp_text(to_number: str, message: str):
    """
    Sends a WhatsApp text message through a configured Meta-compatible HTTPS endpoint.
    WHATSAPP_SEND_URL should be the complete provider endpoint ending in /messages.
    """
    url = os.environ.get("WHATSAPP_SEND_URL")
    token = os.environ.get("WHATSAPP_TOKEN")
    if not url or not token:
        raise RuntimeError("WhatsApp real não configurado")
    payload = json.dumps({
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {"body": message}
    }, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))

def company_context(user_row):
    """Build a compact live business context for the AI from this user's own database."""
    d = dashboard(user_row)
    products = get_products(user_row)
    customers = get_customers(user_row)
    low = [p for p in products if (p.get("stock") or 0) <= (p.get("min_stock") or 0)]
    inactive = [c for c in customers if (c.get("days_since_purchase") or 0) > 60]
    return {
        "dashboard": d,
        "low_stock": [
            {"name": p.get("name"), "stock": p.get("stock"), "min_stock": p.get("min_stock")}
            for p in low[:10]
        ],
        "inactive_customers": [
            {"name": c.get("name"), "days_since_purchase": c.get("days_since_purchase")}
            for c in inactive[:10]
        ],
    }


# ---- Conta Azul OAuth2 integration (adapted to this reconstructed SQLite/FastAPI app) ----
CONTAAZUL_AUTH_BASE_URL = "https://auth.contaazul.com"
CONTAAZUL_TOKEN_URL = f"{CONTAAZUL_AUTH_BASE_URL}/oauth2/token"
CONTAAZUL_DEFAULT_SCOPES = "openid profile aws.cognito.signin.user.admin"

def contaazul_config():
    client_id = os.environ.get("CONTAAZUL_CLIENT_ID")
    client_secret = os.environ.get("CONTAAZUL_CLIENT_SECRET")
    redirect_uri = os.environ.get("CONTAAZUL_REDIRECT_URI")
    return client_id, client_secret, redirect_uri

def contaazul_is_configured():
    return all(contaazul_config())

def contaazul_basic_auth(client_id, client_secret):
    raw = f"{client_id}:{client_secret}".encode("utf-8")
    return "Basic " + base64.b64encode(raw).decode("ascii")

def contaazul_authorize_url(state):
    client_id, _secret, redirect_uri = contaazul_config()
    if not contaazul_is_configured():
        raise HTTPException(400, "Integração Conta Azul não configurada")
    params = urlencode({
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "state": state,
        "scope": CONTAAZUL_DEFAULT_SCOPES,
    })
    return f"{CONTAAZUL_AUTH_BASE_URL}/login?{params}"

def contaazul_token_request(data):
    client_id, client_secret, _redirect_uri = contaazul_config()
    encoded = urlencode(data).encode("utf-8")
    req = urllib.request.Request(
        CONTAAZUL_TOKEN_URL,
        data=encoded,
        headers={
            "Authorization": contaazul_basic_auth(client_id, client_secret),
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))

def contaazul_exchange_code(code):
    _client_id, _client_secret, redirect_uri = contaazul_config()
    return contaazul_token_request({
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
    })

def _state_secret():
    return (os.environ.get("OAUTH_STATE_SECRET") or os.environ.get("CONTAAZUL_CLIENT_SECRET") or "socio-digital-local-state").encode("utf-8")

def make_oauth_state(user_id):
    payload = json.dumps({"user_id": user_id, "nonce": secrets.token_hex(8), "ts": int(datetime.now(timezone.utc).timestamp())}, separators=(",", ":")).encode("utf-8")
    encoded = base64.urlsafe_b64encode(payload).decode("ascii").rstrip("=")
    sig = hmac.new(_state_secret(), encoded.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{encoded}.{sig}"

def parse_oauth_state(state):
    try:
        encoded, sig = state.rsplit(".", 1)
        expected = hmac.new(_state_secret(), encoded.encode("ascii"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            raise ValueError("assinatura")
        raw = base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4))
        data = json.loads(raw.decode("utf-8"))
        if int(datetime.now(timezone.utc).timestamp()) - int(data.get("ts", 0)) > 900:
            raise ValueError("expirado")
        return data
    except Exception:
        raise HTTPException(400, "Parâmetro state inválido ou expirado")


init_db()

class RegisterIn(BaseModel):
    name:str
    email:str
    password:str
    company_name:str
    segment:str
    whatsapp:str|None=None

class LoginIn(BaseModel):
    email:str
    password:str

class ChatIn(BaseModel):
    session_id:str|None=None
    message:str

class ProfileIn(BaseModel):
    name:str|None=None
    company_name:str|None=None
    segment:str|None=None
    whatsapp:str|None=None
    whatsapp_prefs:dict|None=None

def user_out(r):
    return {
      "id":r["id"], "name":r["name"], "email":r["email"],
      "company_name":r["company_name"], "segment":r["segment"], "whatsapp":r["whatsapp"],
      "whatsapp_prefs":json.loads(r["whatsapp_prefs"]), "created_at":r["created_at"]
    }

def auth_user(authorization: str|None = Header(default=None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401,"Não autenticado")
    token=authorization.split(" ",1)[1]
    con=db()
    row=con.execute("""SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id
                       WHERE s.token=?""",(token,)).fetchone()
    con.close()
    if not row:
        raise HTTPException(401,"Sessão inválida")
    return row

@app.post("/api/auth/register")
def register(x:RegisterIn):
    con=db()
    if con.execute("SELECT 1 FROM users WHERE lower(email)=lower(?)",(x.email,)).fetchone():
        con.close(); raise HTTPException(400,"E-mail já cadastrado")
    uid=str(uuid.uuid4())
    prefs={"enabled":True,"categories":["vendas","estoque","clientes","financeiro"],"immediate":True,"daily_summary":True}
    con.execute("INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?)",(
        uid,x.name,x.email,hash_password(x.password),x.company_name,x.segment,x.whatsapp or None,
        json.dumps(prefs,ensure_ascii=False),nowiso()
    ))
    token=make_token(uid)
    con.execute("INSERT INTO sessions VALUES(?,?,?)",(token,uid,nowiso()))
    con.commit()
    row=con.execute("SELECT * FROM users WHERE id=?",(uid,)).fetchone()
    con.close()
    return {"token":token,"user":user_out(row)}

@app.post("/api/auth/login")
def login(x:LoginIn):
    con=db()
    row=con.execute("SELECT * FROM users WHERE lower(email)=lower(?)",(x.email,)).fetchone()
    if not row or not verify_password(x.password,row["password_hash"]):
        con.close(); raise HTTPException(401,"E-mail ou senha inválidos")
    token=make_token(row["id"])
    con.execute("INSERT INTO sessions VALUES(?,?,?)",(token,row["id"],nowiso()))
    con.commit(); con.close()
    return {"token":token,"user":user_out(row)}

@app.get("/api/auth/me")
def me(u=Depends(auth_user)):
    return user_out(u)

def rows(table,uid,order=""):
    con=db()
    q=f"SELECT * FROM {table} WHERE user_id=? {order}"
    rr=[dict(r) for r in con.execute(q,(uid,)).fetchall()]
    con.close()
    if table=="alerts":
        for r in rr: r["read"]=bool(r["read"])
    return rr

@app.get("/api/products")
def get_products(u=Depends(auth_user)):
    return rows("products",u["id"],"ORDER BY name")

@app.get("/api/customers")
def get_customers(u=Depends(auth_user)):
    return rows("customers",u["id"],"ORDER BY lifetime_value DESC")

@app.get("/api/sales")
def get_sales(u=Depends(auth_user)):
    return rows("sales",u["id"],"ORDER BY sold_at DESC")

@app.get("/api/finance")
def get_finance(u=Depends(auth_user)):
    return rows("finance",u["id"],"ORDER BY date DESC")

@app.get("/api/alerts")
def get_alerts(u=Depends(auth_user)):
    return rows("alerts",u["id"],"ORDER BY created_at DESC")

@app.get("/api/dashboard/summary")
def dashboard(u=Depends(auth_user)):
    uid=u["id"]; con=db()
    sales=[dict(r) for r in con.execute("SELECT * FROM sales WHERE user_id=?",(uid,)).fetchall()]
    fin=[dict(r) for r in con.execute("SELECT * FROM finance WHERE user_id=?",(uid,)).fetchall()]
    products=[dict(r) for r in con.execute("SELECT * FROM products WHERE user_id=?",(uid,)).fetchall()]
    customers=[dict(r) for r in con.execute("SELECT * FROM customers WHERE user_id=?",(uid,)).fetchall()]
    con.close()

    # The preview dataset is a rolling demo. We reproduce its 30-day aggregation from the stored rows.
    cutoff=datetime.now(timezone.utc)-timedelta(days=30)
    def dt(s):
        try:return datetime.fromisoformat(s.replace("Z","+00:00"))
        except:return datetime.min.replace(tzinfo=timezone.utc)
    s30=[s for s in sales if dt(s.get("sold_at",""))>=cutoff]
    f30=[f for f in fin if dt(f.get("date",""))>=cutoff]
    revenue=sum(float(s.get("revenue") or 0) for s in s30)
    profit=sum(float(s.get("profit") or 0) for s in s30)
    expenses=sum(float(f.get("amount") or 0) for f in f30 if str(f.get("type","")).startswith("despesa"))
    net=profit-expenses
    daily={}
    for s in s30:
        day=str(s.get("sold_at",""))[:10]
        d=daily.setdefault(day,{"day":day,"revenue":0.0,"profit":0.0,"orders":0})
        d["revenue"]+=float(s.get("revenue") or 0); d["profit"]+=float(s.get("profit") or 0); d["orders"]+=1
    daily_list=[daily[k] for k in sorted(daily)]
    for d in daily_list:
        d["revenue"]=round(d["revenue"],2); d["profit"]=round(d["profit"],2)
    rev7=sum(d["revenue"] for d in daily_list[-7:])
    prev7=sum(d["revenue"] for d in daily_list[-14:-7])
    trend=((rev7-prev7)/prev7*100) if prev7 else 0
    goal=45000.0
    return {
      "revenue_30":round(revenue,2),"profit_30":round(profit,2),"net_profit_30":round(net,2),
      "expenses_30":round(expenses,2),"orders_30":len(s30),"revenue_7":round(rev7,2),
      "sales_trend_pct":round(trend,1),"goal_monthly":goal,
      "goal_progress_pct":round((revenue/goal*100) if goal else 0,1),
      "projection_monthly":round(revenue,2),"daily":daily_list,
      "products_count":len(products),
      "low_stock_count":sum(1 for p in products if (p.get("stock") or 0) <= (p.get("min_stock") or 0)),
      "customers_count":len(customers),
      "inactive_customers_count":sum(1 for c in customers if (c.get("days_since_purchase") or 0)>60)
    }

@app.patch("/api/profile")
def patch_profile(x:ProfileIn,u=Depends(auth_user)):
    con=db()
    current=dict(con.execute("SELECT * FROM users WHERE id=?",(u["id"],)).fetchone())
    data=x.model_dump(exclude_none=True)
    for field in ("name","company_name","segment","whatsapp"):
        if field in data:
            current[field]=data[field]
    if "whatsapp_prefs" in data:
        current["whatsapp_prefs"]=json.dumps(data["whatsapp_prefs"],ensure_ascii=False)
    con.execute("""UPDATE users SET name=?,company_name=?,segment=?,whatsapp=?,whatsapp_prefs=? WHERE id=?""",
        (current["name"],current["company_name"],current["segment"],current["whatsapp"],current["whatsapp_prefs"],u["id"]))
    con.commit()
    row=con.execute("SELECT * FROM users WHERE id=?",(u["id"],)).fetchone()
    con.close()
    return user_out(row)

@app.get("/api/whatsapp/status")
def whatsapp_status(u=Depends(auth_user)):
    return {"mode":"mocked","configured_number":u["whatsapp"],"prefs":json.loads(u["whatsapp_prefs"])}

@app.get("/api/whatsapp/log")
def whatsapp_log(u=Depends(auth_user)):
    return rows("whatsapp_log",u["id"],"ORDER BY created_at DESC")

@app.post("/api/whatsapp/test")
def whatsapp_test(u=Depends(auth_user)):
    msg="Teste do Sócio Digital: integração de WhatsApp ativa."
    mode="mocked"
    provider_response=None
    if whatsapp_enabled() and u["whatsapp"]:
        try:
            provider_response=send_whatsapp_text(u["whatsapp"], msg)
            mode="real"
        except Exception:
            mode="error-fallback"
    con=db()
    con.execute("INSERT INTO whatsapp_log VALUES(?,?,?,?,?)",(str(uuid.uuid4()),u["id"],msg,"test",nowiso()))
    con.commit(); con.close()
    return {"ok":True,"mode":mode,"message":msg,"provider_response":provider_response}

@app.post("/api/whatsapp/daily-summary")
def whatsapp_daily(u=Depends(auth_user)):
    d=dashboard(u)
    msg=f"Resumo Sócio Digital: receita R$ {d['revenue_30']:.2f}; lucro líquido R$ {d['net_profit_30']:.2f}; pedidos {d['orders_30']}."
    mode="mocked"
    provider_response=None
    if whatsapp_enabled() and u["whatsapp"]:
        try:
            provider_response=send_whatsapp_text(u["whatsapp"], msg)
            mode="real"
        except Exception:
            mode="error-fallback"
    con=db()
    con.execute("INSERT INTO whatsapp_log VALUES(?,?,?,?,?)",(str(uuid.uuid4()),u["id"],msg,"daily_summary",nowiso()))
    con.commit(); con.close()
    return {"ok":True,"mode":mode,"message":msg,"provider_response":provider_response}

@app.post("/api/chat")
def chat(x:ChatIn,u=Depends(auth_user)):
    ctx = company_context(u)
    if openai_enabled():
        prompt = f"""Você é o Sócio Digital, um copiloto executivo para pequenas empresas.
Responda em português do Brasil, de forma objetiva, com leitura de negócio, prioridades,
riscos e próximos passos. Não invente números. Use apenas o contexto fornecido.
Formatação: nunca use títulos markdown (#, ##, ###), tabelas ou linhas divisórias (---).
Prefira parágrafos curtos, negrito apenas para rótulos breves e listas simples de um nível.
Quando fizer sentido, termine com **Ações sugeridas:** e de 1 a 3 ações concretas.

CONTEXTO ATUAL DA EMPRESA:
{json.dumps(ctx, ensure_ascii=False)}

PERGUNTA DO USUÁRIO:
{x.message}
"""
        try:
            answer = call_openai_responses(prompt)
            if answer:
                return {
                    "response": answer,
                    "session_id": x.session_id or "openai-session",
                    "mode": "openai"
                }
        except Exception as exc:
            # Fall back locally instead of breaking the app.
            pass

    d = ctx["dashboard"]
    m=x.message.lower()
    if "lucro" in m:
        resp=f"""**Lucro do mês**

Receita total: R$ {d['revenue_30']:,.2f}
Lucro bruto: R$ {d['profit_30']:,.2f}
Despesas: R$ {d['expenses_30']:,.2f}
**Lucro líquido:** R$ {d['net_profit_30']:,.2f}

**Ações sugeridas:**
- Revisar despesas de maior impacto.
- Acompanhar margem líquida.
- Trabalhar ticket médio e recorrência."""
    elif "estoque" in m:
        low = ctx["low_stock"]
        if low:
            itens = "\n".join(f"- {p['name']}: {p['stock']} un. (mínimo {p['min_stock']})" for p in low)
            resp = f"**Estoque — atenção**\n\n{itens}\n\n**Ações sugeridas:**\n- Priorize reposição e prazo de fornecedor."
        else:
            resp = "**Estoque**\n\nNenhum item está no mínimo ou abaixo dele neste momento."
    else:
        resp=f"""**Onde focar agora**

- Receita 30d: R$ {d['revenue_30']:,.2f}
- Lucro líquido: R$ {d['net_profit_30']:,.2f}
- Clientes inativos: {d['inactive_customers_count']}
- Estoque baixo: {d['low_stock_count']}

**Ações sugeridas:**
- Priorize margem.
- Reative clientes inativos.
- Garanta disponibilidade dos itens de maior giro."""
    resp=resp.replace(",", "X").replace(".", ",").replace("X",".")
    return {
        "response": resp,
        "session_id": x.session_id or "local-session",
        "mode": "local"
    }


@app.get("/api/integrations/contaazul/status")
def contaazul_status(u=Depends(auth_user)):
    if not contaazul_is_configured():
        return {"configured": False, "connected": False}
    con = db()
    row = con.execute("SELECT * FROM integrations WHERE user_id=? AND provider='contaazul'", (u["id"],)).fetchone()
    con.close()
    if not row or row["status"] != "connected":
        return {"configured": True, "connected": False}
    return {"configured": True, "connected": True, "connected_at": row["connected_at"], "updated_at": row["updated_at"]}

@app.get("/api/integrations/contaazul/connect")
def contaazul_connect(u=Depends(auth_user)):
    if not contaazul_is_configured():
        raise HTTPException(400, "Integração Conta Azul ainda não configurada (credenciais ausentes).")
    state = make_oauth_state(u["id"])
    return {"authorize_url": contaazul_authorize_url(state)}

@app.get("/api/integrations/contaazul/callback")
def contaazul_callback(code: str|None=None, state: str|None=None, error: str|None=None):
    frontend_url = os.environ.get("FRONTEND_URL", "").rstrip("/")
    target = (frontend_url or "") + "/app/configuracoes"
    if error or not code or not state:
        return RedirectResponse(target + "?contaazul=error")
    claims = parse_oauth_state(state)
    try:
        token_response = contaazul_exchange_code(code)
        expires_in = int(token_response.get("expires_in", 3600))
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat()
        now = nowiso()
        con = db()
        existing = con.execute("SELECT id FROM integrations WHERE user_id=? AND provider='contaazul'", (claims["user_id"],)).fetchone()
        if existing:
            con.execute("""UPDATE integrations SET access_token=?,refresh_token=?,expires_at=?,status='connected',updated_at=? WHERE id=?""",
                (token_response.get("access_token"), token_response.get("refresh_token"), expires_at, now, existing["id"]))
        else:
            con.execute("""INSERT INTO integrations(id,user_id,provider,access_token,refresh_token,expires_at,status,connected_at,updated_at)
                         VALUES(?,?,?,?,?,?, 'connected',?,?)""",
                (str(uuid.uuid4()), claims["user_id"], "contaazul", token_response.get("access_token"), token_response.get("refresh_token"), expires_at, now, now))
        con.commit(); con.close()
        return RedirectResponse(target + "?contaazul=connected")
    except Exception:
        return RedirectResponse(target + "?contaazul=error")

@app.post("/api/integrations/contaazul/disconnect")
def contaazul_disconnect(u=Depends(auth_user)):
    con = db()
    cur = con.execute("UPDATE integrations SET status='disconnected',access_token=NULL,refresh_token=NULL,updated_at=? WHERE user_id=? AND provider='contaazul'", (nowiso(), u["id"]))
    con.commit(); con.close()
    if cur.rowcount == 0:
        raise HTTPException(404, "Nenhuma conexão com a Conta Azul encontrada")
    return {"success": True}

@app.get("/api/integrations/status")
def integrations_status(u=Depends(auth_user)):
    return {
        "ai": {"configured": openai_enabled(), "provider": "openai" if openai_enabled() else "local"},
        "whatsapp": {"configured": whatsapp_enabled(), "provider": "http/meta-compatible" if whatsapp_enabled() else "mocked"},
        "contaazul": {"configured": contaazul_is_configured(), "provider": "contaazul"}
    }

@app.get("/api/webhooks/whatsapp")
def whatsapp_webhook_verify(
    hub_mode: str|None = None,
    hub_verify_token: str|None = None,
    hub_challenge: str|None = None
):
    # Kept generic so the deployment owner can configure their own verify token.
    expected = os.environ.get("WHATSAPP_VERIFY_TOKEN")
    if expected and hub_mode == "subscribe" and hub_verify_token == expected:
        return int(hub_challenge or "0")
    raise HTTPException(403, "Webhook verification failed")

@app.post("/api/webhooks/whatsapp")
def whatsapp_webhook(payload: dict):
    # Inbound webhook receiver. Persistence/automation can be added after a provider is chosen.
    return {"ok": True}

# Static frontend
app.mount("/static", StaticFiles(directory=FRONTEND/"static"), name="static")

@app.get("/{full_path:path}")
def spa(full_path:str):
    # React Router fallback
    return FileResponse(FRONTEND/"index.html")

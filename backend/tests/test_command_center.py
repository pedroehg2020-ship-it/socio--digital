"""Command Center + demo account regression tests (Fase 1)."""
import os
import re
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def demo_credentials():
    path = Path("/app/memory/test_credentials.md")
    if not path.exists():
        pytest.skip("missing test_credentials.md")
    content = path.read_text(encoding="utf-8")
    email = re.search(r'(?im)^\s*[-*]?\s*Email\s*:\s*`?([^`\s]+)', content)
    pwd = re.search(r'(?im)^\s*[-*]?\s*Senha\s*:\s*`?([^`\s]+)', content)
    if not email or not pwd:
        pytest.skip("no credentials parsed")
    return {"email": email.group(1), "password": pwd.group(1)}


@pytest.fixture(scope="session")
def demo_token(demo_credentials):
    r = requests.post(f"{API}/auth/login", json=demo_credentials, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"demo login failed {r.status_code}: {r.text[:300]}")
    body = r.json()
    token = body.get("token") or body.get("access_token")
    assert token, f"no token in login response: {body}"
    return token


@pytest.fixture(scope="session")
def demo_client(demo_token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {demo_token}", "Content-Type": "application/json"})
    return s


# ---------------- auth ----------------
class TestDemoAuth:
    def test_login_returns_user_and_company(self, demo_credentials):
        r = requests.post(f"{API}/auth/login", json=demo_credentials, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        user = data.get("user") or {}
        assert user.get("email") == demo_credentials["email"]
        assert user.get("role") == "owner"
        assert user.get("company_id")

    def test_me_endpoint(self, demo_client):
        r = demo_client.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 200
        body = r.json()
        assert "Ricardo" in body["user"]["name"], body
        assert body["company"]["name"] == "Aroma Brasil Cafés Ltda"
        assert body["company"]["has_data"] is True

    def test_overview_requires_auth(self):
        r = requests.get(f"{API}/command-center/overview", timeout=30)
        assert r.status_code in (401, 403)


# ---------------- command center overview ----------------
class TestCommandOverview:
    def test_overview_shape_and_scope(self, demo_client):
        r = demo_client.get(f"{API}/command-center/overview", timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert d["has_data"] is True
        assert d["is_demo"] is False
        assert d["greeting"].split(", ")[1].startswith("Ricardo")
        assert isinstance(d["briefing"], str) and len(d["briefing"]) > 10
        # health
        health = d["health"]
        assert isinstance(health["score"], int)
        assert 0 <= health["score"] <= 100
        assert health["status"] in ("Saudável", "Merece atenção", "Em risco")
        keys = [c["key"] for c in health["components"]]
        assert keys == ["financeiro", "vendas", "clientes", "estoque", "eficiencia"]
        for c in health["components"]:
            assert isinstance(c["score"], int) and 0 <= c["score"] <= 100
            assert c["label"] and c["reason"]
        # data scope from seed
        scope = d["data_scope"]
        assert scope["transactions"] >= 200, scope
        assert scope["products"] == 8, scope
        assert scope["customers"] == 10, scope
        assert "generated_at" in d

    def test_insights_contract(self, demo_client):
        d = demo_client.get(f"{API}/command-center/overview", timeout=60).json()
        insights = d["insights"]
        assert len(insights) >= 1
        assert len(insights) <= 6
        ids = [i["id"] for i in insights]
        assert len(ids) == len(set(ids)), "duplicate insight ids"
        for i in insights:
            assert i["severity"] in ("positive", "important", "critical", "informative")
            assert i["title"] and i["summary"]
            assert isinstance(i["evidence"], list) and len(i["evidence"]) >= 1
            assert i["prompt"] and i["action"] and i["confidence"]

    def test_no_mongo_object_id_leak(self, demo_client):
        raw = demo_client.get(f"{API}/command-center/overview", timeout=60).text
        assert '"_id"' not in raw


# ---------------- seeded data across modules ----------------
class TestSeededModules:
    def test_dashboard_summary(self, demo_client):
        r = demo_client.get(f"{API}/dashboard/summary", timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d, dict) and len(d) > 0

    def test_radar_alerts(self, demo_client):
        r = demo_client.get(f"{API}/radar/alerts", timeout=60)
        assert r.status_code == 200
        alerts = r.json()
        items = alerts if isinstance(alerts, list) else alerts.get("alerts", [])
        assert len(items) >= 1, alerts

    def test_customers_seeded(self, demo_client):
        r = demo_client.get(f"{API}/customers", timeout=60)
        assert r.status_code == 200
        body = r.json()
        items = body if isinstance(body, list) else body.get("customers", body.get("items", []))
        assert len(items) == 10, len(items)

    def test_inventory_seeded(self, demo_client):
        r = demo_client.get(f"{API}/inventory", timeout=60)
        assert r.status_code == 200
        body = r.json()
        items = body if isinstance(body, list) else body.get("products", body.get("items", []))
        assert len(items) == 8, len(items)

    def test_transactions_seeded(self, demo_client):
        r = demo_client.get(f"{API}/transactions?limit=500", timeout=60)
        assert r.status_code == 200
        body = r.json()
        items = body if isinstance(body, list) else body.get("transactions", body.get("items", []))
        assert len(items) > 0


# ---------------- new user empty state regression ----------------
class TestNewUserEmptyState:
    def test_register_then_empty_overview(self):
        email = f"TEST_cmd_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "name": "TEST Fulano Silva",
            "email": email,
            "password": "Teste@1234",
            "company_name": "TEST Empresa Ltda",
        }
        r = requests.post(f"{API}/auth/register", json=payload, timeout=60)
        assert r.status_code in (200, 201), f"{r.status_code}: {r.text[:300]}"
        token = r.json().get("token") or r.json().get("access_token")
        assert token
        s = requests.Session()
        s.headers.update({"Authorization": f"Bearer {token}"})
        o = s.get(f"{API}/command-center/overview", timeout=60)
        assert o.status_code == 200
        d = o.json()
        assert d["has_data"] is False
        assert d["insights"] == []
        assert d["health"]["score"] is None
        assert d["health"]["components"] == []
        assert d["greeting"].split(", ")[1].startswith(("Fulano", "TEST"))


# ---------------- chat with seeded data (AI) ----------------
class TestChatAI:
    def test_chat_stream_grounded_answer(self, demo_token):
        r = requests.post(
            f"{API}/chat/stream",
            headers={"Authorization": f"Bearer {demo_token}", "Content-Type": "application/json"},
            json={"message": "Qual meu faturamento do último mês?"},
            stream=True,
            timeout=180,
        )
        assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
        chunks = []
        for line in r.iter_lines(decode_unicode=True):
            if line:
                chunks.append(line)
            if len(chunks) > 400:
                break
        body = "\n".join(chunks)
        assert len(body) > 20, body
        assert "R$" in body or any(ch.isdigit() for ch in body), body[:500]

    def test_chat_history_persisted(self, demo_client):
        r = demo_client.get(f"{API}/chat/history", timeout=60)
        assert r.status_code == 200
        body = r.json()
        msgs = body if isinstance(body, list) else body.get("messages", [])
        assert len(msgs) >= 1, body

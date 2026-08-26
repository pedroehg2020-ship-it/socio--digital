"""Backend test suite for Sócio Digital MVP."""
import os
import io
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or \
    open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].split("\n")[0].strip()
API = f"{BASE_URL}/api"

# Demo seeded account (see /app/memory/test_credentials.md)
EXISTING_EMAIL = "demo@sociodigital.com"
EXISTING_PASSWORD = "Demo@123"


@pytest.fixture(scope="session")
def existing_token():
    r = requests.post(f"{API}/auth/login", json={"email": EXISTING_EMAIL, "password": EXISTING_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def new_user():
    email = f"test_{uuid.uuid4().hex[:8]}@teste.com"
    r = requests.post(f"{API}/auth/register", json={
        "name": "Test User", "email": email, "password": "senha123", "company_name": "TEST Empresa"
    })
    assert r.status_code == 200, f"Register failed: {r.text}"
    data = r.json()
    return {"email": email, "token": data["token"], "user": data["user"]}


# ---------- Auth ----------
class TestAuth:
    def test_root(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200

    def test_register_creates_owner(self, new_user):
        assert new_user["user"]["role"] == "owner"
        assert new_user["user"]["email"] == new_user["email"]
        assert new_user["token"]

    def test_register_duplicate_email_rejected(self, new_user):
        r = requests.post(f"{API}/auth/register", json={
            "name": "x", "email": new_user["email"], "password": "senha123", "company_name": "x"
        })
        assert r.status_code == 400

    def test_login_success(self, existing_token):
        assert existing_token

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": EXISTING_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_returns_user_and_company(self, existing_token):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {existing_token}"})
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["email"] == EXISTING_EMAIL
        assert "company" in data
        assert data["company"]["name"]

    def test_protected_without_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code in (401, 403)


# ---------- CSV Upload & Dashboard ----------
TX_CSV = """data,descricao,valor,tipo,categoria,cliente,status,vencimento
2026-01-05,Venda Padaria,500.00,receita,Vendas,Cliente A,pago,
2026-01-06,Aluguel,1200.00,despesa,Aluguel,,pago,
2026-01-10,Venda cliente B,300.00,receita,Vendas,Cliente B,pendente,2026-01-20
2025-12-15,Venda mes anterior,2000.00,receita,Vendas,Cliente A,pago,
2025-12-20,Fornecedor,800.00,despesa,Fornecedores,,pago,
"""


class TestUploadAndDashboard:
    def test_dashboard_empty_state(self, new_user):
        r = requests.get(f"{API}/dashboard/summary", headers={"Authorization": f"Bearer {new_user['token']}"})
        assert r.status_code == 200
        assert r.json().get("has_data") is False

    def test_upload_transactions(self, new_user):
        files = {"file": ("tx.csv", io.BytesIO(TX_CSV.encode()), "text/csv")}
        r = requests.post(f"{API}/upload/transactions", files=files,
                          headers={"Authorization": f"Bearer {new_user['token']}"})
        assert r.status_code == 200, r.text
        assert r.json()["imported"] == 5

    def test_upload_invalid_file(self, new_user):
        files = {"file": ("bad.csv", io.BytesIO(b"garbage content\nno headers"), "text/csv")}
        r = requests.post(f"{API}/upload/transactions", files=files,
                          headers={"Authorization": f"Bearer {new_user['token']}"})
        assert r.status_code == 400

    def test_dashboard_summary_after_upload(self, new_user):
        r = requests.get(f"{API}/dashboard/summary", headers={"Authorization": f"Bearer {new_user['token']}"})
        assert r.status_code == 200
        data = r.json()
        assert data["has_data"] is True
        for k in ("receita_mes", "despesa_mes", "lucro_mes", "saldo_total", "contas_pagar", "contas_receber"):
            assert k in data

    def test_cashflow(self, new_user):
        r = requests.get(f"{API}/dashboard/cashflow", headers={"Authorization": f"Bearer {new_user['token']}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_categories(self, new_user):
        r = requests.get(f"{API}/dashboard/categories?type=despesa",
                         headers={"Authorization": f"Bearer {new_user['token']}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- Transactions ----------
class TestTransactions:
    def test_list(self, existing_token):
        r = requests.get(f"{API}/transactions", headers={"Authorization": f"Bearer {existing_token}"})
        assert r.status_code == 200
        d = r.json()
        assert "items" in d and "total" in d
        assert d["total"] > 0

    def test_filter_type_receita(self, existing_token):
        r = requests.get(f"{API}/transactions?type=receita", headers={"Authorization": f"Bearer {existing_token}"})
        assert r.status_code == 200
        for it in r.json()["items"]:
            assert it["type"] == "receita"

    def test_delete_transaction(self, new_user):
        r = requests.get(f"{API}/transactions", headers={"Authorization": f"Bearer {new_user['token']}"})
        items = r.json()["items"]
        if not items:
            pytest.skip("No transactions to delete")
        tid = items[0]["id"]
        rd = requests.delete(f"{API}/transactions/{tid}", headers={"Authorization": f"Bearer {new_user['token']}"})
        assert rd.status_code == 200


# ---------- Radar ----------
class TestRadar:
    def test_alerts_list(self, existing_token):
        r = requests.get(f"{API}/radar/alerts", headers={"Authorization": f"Bearer {existing_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_recompute(self, existing_token):
        r = requests.post(f"{API}/radar/recompute", headers={"Authorization": f"Bearer {existing_token}"})
        assert r.status_code == 200
        assert "alerts_created" in r.json()

    def test_resolve_alert(self, new_user):
        # First trigger alerts by uploading data
        r = requests.get(f"{API}/radar/alerts", headers={"Authorization": f"Bearer {new_user['token']}"})
        alerts = r.json()
        if not alerts:
            pytest.skip("No alerts to resolve")
        aid = alerts[0]["id"]
        rr = requests.post(f"{API}/radar/alerts/{aid}/resolve",
                           headers={"Authorization": f"Bearer {new_user['token']}"})
        assert rr.status_code == 200


# ---------- Customers ----------
class TestCustomers:
    def test_list(self, existing_token):
        r = requests.get(f"{API}/customers", headers={"Authorization": f"Bearer {existing_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- Inventory ----------
INV_CSV = """produto,estoque_atual,estoque_minimo,vendas_mes
Pao Frances,5,10,300
Bolo,50,5,10
Cafe,20,10,25
"""


class TestInventory:
    def test_upload_and_list(self, new_user):
        files = {"file": ("inv.csv", io.BytesIO(INV_CSV.encode()), "text/csv")}
        r = requests.post(f"{API}/upload/inventory", files=files,
                          headers={"Authorization": f"Bearer {new_user['token']}"})
        assert r.status_code == 200, r.text
        assert r.json()["imported"] == 3

        rl = requests.get(f"{API}/inventory", headers={"Authorization": f"Bearer {new_user['token']}"})
        assert rl.status_code == 200
        items = rl.json()
        assert len(items) == 3
        risks = {i["name"]: i["risk"] for i in items}
        assert risks.get("Pao Frances") == "ruptura"
        assert risks.get("Bolo") == "parado"


# ---------- Team management ----------
class TestTeam:
    def test_get_team(self, existing_token):
        r = requests.get(f"{API}/company/team", headers={"Authorization": f"Bearer {existing_token}"})
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_add_and_remove_member(self, new_user):
        email = f"member_{uuid.uuid4().hex[:6]}@teste.com"
        r = requests.post(f"{API}/company/team", json={
            "name": "Membro", "email": email, "password": "senha123", "role": "member"
        }, headers={"Authorization": f"Bearer {new_user['token']}"})
        assert r.status_code == 200, r.text
        mid = r.json()["id"]
        rd = requests.delete(f"{API}/company/team/{mid}",
                             headers={"Authorization": f"Bearer {new_user['token']}"})
        assert rd.status_code == 200


# ---------- Chat ----------
class TestChat:
    def test_history(self, existing_token):
        r = requests.get(f"{API}/chat/history", headers={"Authorization": f"Bearer {existing_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_stream_basic(self, existing_token):
        r = requests.post(f"{API}/chat/stream", json={"message": "Oi"},
                          headers={"Authorization": f"Bearer {existing_token}"}, stream=True, timeout=60)
        assert r.status_code == 200
        got_delta = False
        got_done = False
        for line in r.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data:"):
                continue
            if '"type": "delta"' in line or '"type":"delta"' in line:
                got_delta = True
            if '"done"' in line:
                got_done = True
                break
        assert got_delta or got_done

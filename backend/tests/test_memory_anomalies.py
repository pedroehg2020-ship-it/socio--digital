"""Business Memory + Anomaly Detection tests (Fase 2).

Modules covered:
- routes/memory_routes.py: GET/PUT /api/memory, POST/DELETE /api/memory/facts
- anomaly_engine.py via /api/command-center/overview insights
- radar_engine.py 'anomalia' alerts via /api/radar/alerts

RUN SERIALLY: `pytest tests/test_memory_anomalies.py -n 0`.
Classes mutate the single demo business_memory doc, so xdist (-n 2) causes cross-worker races.
"""
import os
import re
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
def demo_client(demo_credentials):
    r = requests.post(f"{API}/auth/login", json=demo_credentials, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"demo login failed {r.status_code}: {r.text[:300]}")
    token = r.json().get("token") or r.json().get("access_token")
    assert token
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return s


# ---------------- GET /api/memory ----------------
class TestMemoryRead:
    def test_requires_auth(self):
        r = requests.get(f"{API}/memory", timeout=30)
        assert r.status_code in (401, 403), r.text[:200]

    def test_get_memory_seeded(self, demo_client):
        r = demo_client.get(f"{API}/memory", timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["revenue_goal_monthly"] == 60000, d["revenue_goal_monthly"]
        assert d["margin_goal_pct"] == 25, d["margin_goal_pct"]
        assert d.get("seasonality_notes"), "seasonality_notes empty"
        assert isinstance(d["facts"], list) and len(d["facts"]) >= 1
        for f in d["facts"]:
            assert set(["id", "text", "source"]).issubset(f.keys())
        seas = d["seasonality"]
        assert isinstance(seas, list) and len(seas) >= 1
        for s in seas:
            assert set(["month", "label", "avg_revenue", "index"]).issubset(s.keys())
            assert 1 <= s["month"] <= 12
            assert isinstance(s["avg_revenue"], (int, float))
        assert "_id" not in str(d)


# ---------------- PUT /api/memory + facts CRUD ----------------
class TestMemoryWrite:
    def test_update_goals_and_restore(self, demo_client):
        r = demo_client.put(f"{API}/memory", json={"revenue_goal_monthly": 88000, "margin_goal_pct": 31.5}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["revenue_goal_monthly"] == 88000
        g = demo_client.get(f"{API}/memory", timeout=30).json()
        assert g["revenue_goal_monthly"] == 88000
        assert g["margin_goal_pct"] == 31.5
        # restore demo baseline
        restore = demo_client.put(f"{API}/memory", json={"revenue_goal_monthly": 60000, "margin_goal_pct": 25}, timeout=30)
        assert restore.status_code == 200
        assert demo_client.get(f"{API}/memory", timeout=30).json()["revenue_goal_monthly"] == 60000

    def test_partial_update_does_not_wipe_other_fields(self, demo_client):
        before = demo_client.get(f"{API}/memory", timeout=30).json()
        r = demo_client.put(f"{API}/memory", json={"seasonality_notes": "TEST_nota sazonal"}, timeout=30)
        assert r.status_code == 200
        after = demo_client.get(f"{API}/memory", timeout=30).json()
        assert after["seasonality_notes"] == "TEST_nota sazonal"
        assert after["revenue_goal_monthly"] == before["revenue_goal_monthly"]
        assert after["margin_goal_pct"] == before["margin_goal_pct"]
        demo_client.put(f"{API}/memory", json={"seasonality_notes": before["seasonality_notes"]}, timeout=30)

    def test_add_and_delete_fact(self, demo_client):
        r = demo_client.post(f"{API}/memory/facts", json={"text": "TEST_ponto de equilibrio 40 mil"}, timeout=30)
        assert r.status_code in (200, 201), r.text[:300]
        fact = r.json()
        assert fact["text"] == "TEST_ponto de equilibrio 40 mil"
        assert fact["source"] == "manual"
        fid = fact["id"]
        facts = demo_client.get(f"{API}/memory", timeout=30).json()["facts"]
        assert any(f["id"] == fid for f in facts), "fact not persisted"
        d = demo_client.delete(f"{API}/memory/facts/{fid}", timeout=30)
        assert d.status_code == 200, d.text[:200]
        facts = demo_client.get(f"{API}/memory", timeout=30).json()["facts"]
        assert not any(f["id"] == fid for f in facts), "fact not removed"

    def test_delete_unknown_fact_404(self, demo_client):
        r = demo_client.delete(f"{API}/memory/facts/doesnotexist", timeout=30)
        assert r.status_code == 404, f"{r.status_code}: {r.text[:200]}"

    def test_goal_insight_absent_when_goal_cleared(self, demo_client):
        try:
            demo_client.put(f"{API}/memory", json={"revenue_goal_monthly": None}, timeout=30)
            ids = [i["id"] for i in demo_client.get(f"{API}/command-center/overview", timeout=60).json()["insights"]]
            assert "goal-progress" not in ids, ids
        finally:
            demo_client.put(f"{API}/memory", json={"revenue_goal_monthly": 60000}, timeout=30)
            assert demo_client.get(f"{API}/memory", timeout=30).json()["revenue_goal_monthly"] == 60000

    def test_empty_fact_rejected(self, demo_client):
        r = demo_client.post(f"{API}/memory/facts", json={"text": "   "}, timeout=30)
        assert r.status_code == 422, f"{r.status_code}: {r.text[:200]}"


# ---------------- anomaly insights in command center ----------------
class TestAnomalyInsights:
    def test_overview_anomaly_and_goal_insights(self, demo_client):
        r = demo_client.get(f"{API}/command-center/overview", timeout=60)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        insights = d["insights"]
        assert len(insights) <= 6, f"more than 6 insights: {len(insights)}"
        ids = [i["id"] for i in insights]
        assert "anomaly-receita-fora-padrao" in ids, ids
        assert "anomaly-despesa-marketing" in ids, ids
        assert "goal-progress" in ids, ids

        rev = next(i for i in insights if i["id"] == "anomaly-receita-fora-padrao")
        assert rev["severity"] == "critical", rev["severity"]
        assert "abaixo do padr" in rev["title"], rev["title"]
        assert len(rev["evidence"]) >= 3
        assert rev["action"] == "Investigar anomalia"
        assert rev["prompt"]

        mkt = next(i for i in insights if i["id"] == "anomaly-despesa-marketing")
        assert mkt["severity"] in ("critical", "important")
        assert "acima do padr" in mkt["title"], mkt["title"]

        goal = next(i for i in insights if i["id"] == "goal-progress")
        assert "60.000" in goal["summary"] or "60,000" in goal["summary"], goal["summary"]
        assert any("Ritmo" in e for e in goal["evidence"]), goal["evidence"]


# ---------------- radar anomaly alerts ----------------
class TestRadarAnomalyAlerts:
    def test_anomaly_alerts_exist(self, demo_client):
        r = demo_client.get(f"{API}/radar/alerts", timeout=60)
        assert r.status_code == 200, r.text[:300]
        body = r.json()
        alerts = body if isinstance(body, list) else body.get("alerts", [])
        anomalies = [a for a in alerts if a.get("type") == "anomalia"]
        assert len(anomalies) >= 2, f"expected >=2 anomalia alerts, got {len(anomalies)}"
        for a in anomalies:
            assert a["priority"] in ("red", "yellow"), a["priority"]
            assert a["title"].startswith("Anomalia:"), a["title"]
            assert a.get("action_label") == "Investigar no chat", a.get("action_label")
            assert a.get("description")
        assert any(a["priority"] == "red" for a in anomalies), "no red anomaly alert"

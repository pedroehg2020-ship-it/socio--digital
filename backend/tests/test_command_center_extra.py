"""Extra Fase 1 checks: radar alert volume, multi-turn chat grounding."""
import json
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
API = f"{base_url.rstrip('/')}/api"


@pytest.fixture(scope="module")
def demo_token():
    path = Path("/app/memory/test_credentials.md")
    if not path.exists():
        pytest.skip("missing test_credentials.md")
    content = path.read_text(encoding="utf-8")
    email = re.search(r'(?im)^\s*[-*]?\s*Email\s*:\s*`?([^`\s]+)', content)
    pwd = re.search(r'(?im)^\s*[-*]?\s*Senha\s*:\s*`?([^`\s]+)', content)
    if not email or not pwd:
        pytest.skip("no credentials parsed")
    r = requests.post(f"{API}/auth/login", json={"email": email.group(1), "password": pwd.group(1)}, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"demo login failed {r.status_code}: {r.text[:300]}")
    return r.json()["token"]


@pytest.fixture(scope="module")
def demo_client(demo_token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {demo_token}", "Content-Type": "application/json"})
    return s


def _stream(token, message):
    r = requests.post(
        f"{API}/chat/stream",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"message": message},
        stream=True,
        timeout=240,
    )
    assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
    text, tools, errors, done = "", [], [], False
    for line in r.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data: "):
            continue
        ev = json.loads(line[6:])
        if ev["type"] == "delta":
            text += ev["content"]
        elif ev["type"] == "tool_start":
            tools.append(ev["name"])
        elif ev["type"] == "error":
            errors.append(ev.get("message"))
        elif ev["type"] == "done":
            done = True
    return text, tools, errors, done


# ---------------- radar ----------------
class TestRadarSeededAlerts:
    def test_nine_alerts_with_priorities(self, demo_client):
        r = demo_client.get(f"{API}/radar/alerts", timeout=60)
        assert r.status_code == 200
        body = r.json()
        items = body if isinstance(body, list) else body.get("alerts", [])
        assert len(items) >= 9, f"expected >=9 seeded alerts, got {len(items)}"
        for a in items:
            assert a.get("title")
            assert a.get("severity") or a.get("priority"), a
        kinds = {a.get("type") or a.get("category") for a in items}
        assert len(kinds) >= 2, kinds


# ---------------- chat multi-turn ----------------
class TestChatMultiTurn:
    def test_two_turns_same_session(self, demo_token, demo_client):
        before = len(demo_client.get(f"{API}/chat/history", timeout=60).json())

        t1, tools1, err1, done1 = _stream(demo_token, "Qual foi minha receita no último mês?")
        assert not err1, err1
        assert done1
        assert len(t1) > 30, t1
        assert tools1 or "R$" in t1, "AI answered without tools and without grounded figures"

        t2, _, err2, done2 = _stream(demo_token, "E qual foi a margem nesse mesmo período?")
        assert not err2, err2
        assert done2
        assert len(t2) > 30, t2

        after = demo_client.get(f"{API}/chat/history", timeout=60).json()
        assert len(after) >= before + 4, f"history not persisted: {before} -> {len(after)}"
        assert after[-1]["role"] == "assistant"

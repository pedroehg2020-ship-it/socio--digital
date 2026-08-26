"""Chat + memory learning tests. RUN SERIALLY (-n 0): LLM key has concurrency limit."""
import json
import os
import re
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def demo_client():
    content = Path("/app/memory/test_credentials.md").read_text(encoding="utf-8")
    email = re.search(r'(?im)^\s*[-*]?\s*Email\s*:\s*`?([^`\s]+)', content).group(1)
    pwd = re.search(r'(?im)^\s*[-*]?\s*Senha\s*:\s*`?([^`\s]+)', content).group(1)
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": pwd}, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed {r.status_code}")
    token = r.json().get("token") or r.json().get("access_token")
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return s


def _stream_chat(client, message, timeout=180):
    """Returns (full_text, tool_names, raw_events)."""
    text, tools, events = "", [], []
    with client.post(f"{API}/chat/stream", json={"message": message}, stream=True, timeout=timeout) as resp:
        assert resp.status_code == 200, f"{resp.status_code}: {resp.text[:300]}"
        for line in resp.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data:"):
                continue
            raw = line[5:].strip()
            if not raw:
                continue
            try:
                ev = json.loads(raw)
            except json.JSONDecodeError:
                events.append(raw)
                continue
            events.append(ev)
            if isinstance(ev, dict):
                if ev.get("type") in ("delta", "text", "content"):
                    text += ev.get("content") or ev.get("text") or ""
                if ev.get("type") in ("tool", "tool_call", "tool_start", "tool_ready"):
                    tools.append(ev.get("name") or ev.get("tool") or "")
    return text, tools, events


class TestChatMemory:
    def test_chat_learns_revenue_goal(self, demo_client):
        try:
            text, tools, events = _stream_chat(demo_client, "Minha meta de faturamento mensal agora e 75 mil reais. Anote isso.")
            assert text.strip(), f"empty assistant response. events={str(events)[:500]}"
            mem = demo_client.get(f"{API}/memory", timeout=30).json()
            assert float(mem["revenue_goal_monthly"]) == 75000.0, (
                f"memory not updated by chat: {mem['revenue_goal_monthly']}; tools={tools}; reply={text[:400]}"
            )
        finally:
            demo_client.put(f"{API}/memory", json={"revenue_goal_monthly": 60000}, timeout=30)
            assert demo_client.get(f"{API}/memory", timeout=30).json()["revenue_goal_monthly"] == 60000

    def test_chat_uses_goal_in_advice(self, demo_client):
        text, tools, events = _stream_chat(demo_client, "Como esta meu progresso em relacao a minha meta do mes?")
        assert text.strip(), f"empty response. events={str(events)[:500]}"
        assert re.search(r"60[\.,]?000|60 mil", text), f"goal not cited in answer: {text[:600]}"

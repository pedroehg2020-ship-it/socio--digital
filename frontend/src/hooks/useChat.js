import { useState, useCallback, useRef } from "react";
import { API } from "@/lib/api";

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const historyPromiseRef = useRef(null);
  const sendingRef = useRef(false);

  const loadHistory = useCallback(() => {
    if (!historyPromiseRef.current) {
      historyPromiseRef.current = (async () => {
        try {
          const token = localStorage.getItem("sd_token");
          const res = await fetch(`${API}/chat/history`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          if (Array.isArray(data)) setMessages((prev) => (prev.length ? prev : data));
        } catch {
          historyPromiseRef.current = null;
        }
      })();
    }
    return historyPromiseRef.current;
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || sendingRef.current) return;
    sendingRef.current = true;
    setLoading(true);
    try {
      if (historyPromiseRef.current) await historyPromiseRef.current;
      const msgId = `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "", _cid: msgId }]);
      const patch = (updater) => setMessages((prev) => prev.map((m) => (m._cid === msgId ? updater(m) : m)));
      const token = localStorage.getItem("sd_token");
      const res = await fetch(`${API}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok || !res.body) throw new Error("stream failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop();
          for (const part of parts) {
            if (!part.startsWith("data: ")) continue;
            let evt;
            try {
              evt = JSON.parse(part.slice(6));
            } catch {
              continue;
            }
            if (evt.type === "delta") {
              patch((m) => ({ ...m, content: (m.content || "") + evt.content }));
            } else if (evt.type === "tool_start") {
              patch((m) => ({ ...m, toolStatus: "Consultando dados da empresa..." }));
            } else if (evt.type === "error") {
              patch((m) => ({ ...m, content: evt.message, toolStatus: null }));
            }
          }
        }
      } catch (streamError) {
        patch((m) => (m.content ? m : { ...m, content: "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.", toolStatus: null }));
      }
    } catch (e) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant" && !last.content) {
          updated[updated.length - 1] = { role: "assistant", content: "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente." };
          return updated;
        }
        return [...prev, { role: "assistant", content: "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente." }];
      });
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  }, []);

  return { messages, sendMessage, loading, loadHistory };
}

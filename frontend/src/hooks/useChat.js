import { useState, useCallback, useRef } from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const busyRef = useRef(false);

  const loadHistory = useCallback(async () => {
    if (historyLoaded || busyRef.current) return;
    busyRef.current = true;
    try {
      const token = localStorage.getItem("sd_token");
      const res = await fetch(`${BACKEND_URL}/api/chat/history`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } finally {
      setHistoryLoaded(true);
      busyRef.current = false;
    }
  }, [historyLoaded]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setLoading(true);
    try {
      const token = localStorage.getItem("sd_token");
      const res = await fetch(`${BACKEND_URL}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok || !res.body) throw new Error("stream failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
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
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = { ...last, content: (last.content || "") + evt.content };
              return updated;
            });
          } else if (evt.type === "tool_start") {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], toolStatus: "Consultando dados da empresa..." };
              return updated;
            });
          } else if (evt.type === "error") {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: evt.message };
              return updated;
            });
          }
        }
      }
    } catch (e) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente." };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { messages, sendMessage, loading, loadHistory };
}

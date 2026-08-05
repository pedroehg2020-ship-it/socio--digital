import { useState, useEffect } from "react";
import { ChatCircleDots, X } from "@phosphor-icons/react";
import { useChat } from "@/hooks/useChat";
import { ChatWindow } from "./ChatWindow";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { messages, sendMessage, loading, loadHistory } = useChat();

  useEffect(() => {
    if (open) loadHistory();
  }, [open, loadHistory]);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        data-testid="chat-widget-toggle-btn"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        {open ? <X size={24} /> : <ChatCircleDots size={26} weight="fill" />}
      </button>
      {open && (
        <div
          className="fixed bottom-24 right-6 z-40 w-[380px] max-w-[90vw] h-[560px] max-h-[70vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col p-4"
          data-testid="chat-widget-panel"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <span className="font-heading font-bold text-sm">Sócio Digital</span>
            <a href="/chat" className="text-xs text-primary hover:underline" data-testid="chat-widget-expand-link">
              Tela completa
            </a>
          </div>
          <ChatWindow messages={messages} loading={loading} onSend={sendMessage} />
        </div>
      )}
    </>
  );
}

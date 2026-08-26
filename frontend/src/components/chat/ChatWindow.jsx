import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PaperPlaneRight, Sparkle, ChatCircleDots } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTIONS = [
  "Como estão minhas vendas esse mês?",
  "Quais clientes sumiram?",
  "Posso pagar o aluguel esse mês?",
  "Tenho algum produto em risco de ruptura?",
];

export function ChatWindow({ messages, loading, onSend }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full" data-testid="chat-window">
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ChatCircleDots size={28} className="text-primary" weight="duotone" />
            </div>
            <div>
              <p className="font-heading font-bold text-base">Pergunte ao seu Sócio Digital</p>
              <p className="text-sm text-muted-foreground mt-1">Converse em linguagem natural sobre vendas, clientes, estoque e finanças.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  data-testid="chat-suggestion-chip"
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-accent transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`chat-message-${m.role}`}>
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              {m.role === "assistant" && m.toolStatus && !m.content && (
                <span className="flex items-center gap-2 text-muted-foreground italic text-xs">
                  <Sparkle size={14} className="animate-pulse" /> {m.toolStatus}
                </span>
              )}
              {m.content ? (
                <div className="prose-chat">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              ) : (
                !m.toolStatus && (
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.3s]" />
                  </span>
                )
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-end gap-2 pt-3 border-t border-border mt-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Pergunte algo sobre sua empresa..."
          className="min-h-[44px] max-h-32 resize-none"
          data-testid="chat-input"
        />
        <Button size="icon" onClick={submit} disabled={loading || !input.trim()} data-testid="chat-send-btn">
          <PaperPlaneRight size={18} />
        </Button>
      </div>
    </div>
  );
}

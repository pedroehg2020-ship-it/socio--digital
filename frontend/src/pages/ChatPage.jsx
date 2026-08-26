import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Card } from "@/components/ui/card";

export default function ChatPage({ mode = "chat" }) {
  const { messages, sendMessage, loading, loadHistory } = useChat();
  const [searchParams, setSearchParams] = useSearchParams();
  const prompt = searchParams.get("prompt");
  const sentRef = useRef(null);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prompt && sentRef.current !== prompt) {
      sentRef.current = prompt;
      sendMessage(prompt);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col gap-4" data-testid={`chat-page-${mode}`}>
      {mode !== "chat" && <div className="border border-primary/25 bg-primary/[0.04] p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Modo {mode === "simulate" ? "E se?" : "investigação"}</p><h1 className="mt-2 font-heading text-2xl font-bold tracking-tight">{mode === "simulate" ? "Vamos testar uma hipótese juntos" : "Vamos descobrir o que está por trás do sinal"}</h1><p className="mt-1 text-sm text-muted-foreground">A IA vai usar os dados disponíveis, mostrar premissas e deixar claro o que ainda não sabe.</p></div>}
      <Card className="h-full p-6 flex flex-col">
        <ChatWindow messages={messages} loading={loading} onSend={sendMessage} />
      </Card>
    </div>
  );
}

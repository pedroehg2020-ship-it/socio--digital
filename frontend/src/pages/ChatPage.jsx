import { useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Card } from "@/components/ui/card";

export default function ChatPage() {
  const { messages, sendMessage, loading, loadHistory } = useChat();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)]" data-testid="chat-page">
      <Card className="h-full p-6 flex flex-col">
        <ChatWindow messages={messages} loading={loading} onSend={sendMessage} />
      </Card>
    </div>
  );
}

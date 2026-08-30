import { useEffect, useRef, useState } from "react";
import api, { apiError } from "@/lib/api";
import Icon from "./Icons";

const SUGESTOES = [
  "Como foram as vendas deste mês?",
  "O que vence esta semana?",
  "Posso pagar o fornecedor agora?",
  "Que produto está parado no estoque?",
];

export default function ChatDrawer({ open, onClose }) {
  const [mensagens, setMensagens] = useState([
    {
      role: "ai",
      text:
        "Oi! Sou o seu sócio digital. Já olhei as vendas, o caixa e o estoque. Pode perguntar em português mesmo — por exemplo: “como foi a semana?”.",
    },
  ]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fim = useRef(null);

  useEffect(() => {
    if (open) fim.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, open]);

  const enviar = async (pergunta) => {
    const conteudo = (pergunta ?? texto).trim();
    if (!conteudo || enviando) return;
    setMensagens((m) => [...m, { role: "user", text: conteudo }]);
    setTexto("");
    setEnviando(true);
    try {
      const { data } = await api.post("/chat", { message: conteudo });
      setMensagens((m) => [...m, { role: "ai", text: data.reply || data.message || "…" }]);
    } catch (e) {
      setMensagens((m) => [...m, { role: "ai", text: apiError(e, "Não consegui responder agora.") }]);
    } finally {
      setEnviando(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(10,17,40,.45)", zIndex: 110 }}
      />
      <aside className="chat-drawer">
        <div className="chat-head">
          <Icon name="robot" size={19} />
          <div>
            <b style={{ fontFamily: "Outfit, sans-serif" }}>Falar com a IA</b>
            <div style={{ fontSize: 11.5, color: "#a9c0ec" }}>Responde com os dados da sua empresa</div>
          </div>
          <button
            onClick={onClose}
            style={{ marginLeft: "auto", background: "rgba(255,255,255,.16)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: 8, cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        <div className="chat-body">
          {mensagens.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role}`}>
              <div className="bubble">{m.text}</div>
            </div>
          ))}
          {enviando && (
            <div className="chat-msg ai">
              <div className="bubble muted">Consultando os seus números…</div>
            </div>
          )}
          <div ref={fim} />

          {mensagens.length <= 1 && (
            <div className="row row-wrap mt12" style={{ gap: 7 }}>
              {SUGESTOES.map((s) => (
                <button key={s} className="chip" onClick={() => enviar(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="chat-foot">
          <input
            className="input"
            placeholder="Pergunte alguma coisa…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviar()}
          />
          <button className="btn btn-primary" onClick={() => enviar()} disabled={enviando}>
            <Icon name="send" size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}

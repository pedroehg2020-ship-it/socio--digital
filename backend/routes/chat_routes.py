import os
import json
import logging
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, ToolCallStart, ToolCallReady, StreamDone

from database import db
from models import UserDoc, ChatMessageDoc
from auth import get_current_user
from chat_tools import TOOLS, dispatch_tool

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]

SYSTEM_MESSAGE = """Você é o Sócio Digital, um assistente executivo de IA que atua como co-administrador de uma pequena ou média empresa brasileira. Você conversa exclusivamente com o empresário ou a gestão da empresa (nunca com clientes finais).

Seu objetivo é: monitorar dados financeiros e operacionais em tempo real, antecipar problemas antes que aconteçam, e sugerir ações concretas e claras.

Regras:
- Sempre use as ferramentas disponíveis para consultar dados reais da empresa antes de responder perguntas sobre números, vendas, clientes, estoque ou alertas. Nunca invente valores.
- Explique o "porquê" das suas respostas e recomendações com transparência, citando os dados usados.
- Seja direto, objetivo e use linguagem natural em português do Brasil. Evite jargão técnico.
- Quando fizer sentido, termine a resposta com uma seção "Ações sugeridas:" listando de 1 a 3 ações concretas e específicas.
- Se não houver dados suficientes (empresa sem CSV importado), oriente o empresário a fazer o upload da planilha na tela de Configurações."""

HISTORY_LIMIT = 20


class ChatRequest(BaseModel):
    message: str


@router.get("/history")
async def get_history(current_user: UserDoc = Depends(get_current_user)):
    docs = await db.chat_messages.find({"company_id": current_user.company_id}).sort("created_at", 1).to_list(1000)
    return [{"role": d["role"], "content": d["content"]} for d in docs]


@router.post("/stream")
async def chat_stream(payload: ChatRequest, current_user: UserDoc = Depends(get_current_user)):
    company_id = current_user.company_id
    user_text = payload.message

    history_docs = await db.chat_messages.find({"company_id": company_id}).sort("created_at", -1).limit(HISTORY_LIMIT).to_list(HISTORY_LIMIT)
    history_docs.reverse()
    initial_messages = [{"role": "system", "content": SYSTEM_MESSAGE}]
    for m in history_docs:
        initial_messages.append({"role": m["role"], "content": m["content"]})

    user_doc = ChatMessageDoc(company_id=company_id, user_id=current_user.id, role="user", content=user_text)
    await db.chat_messages.insert_one(user_doc.to_mongo())

    async def event_generator():
        full_response = ""
        try:
            chat = (
                LlmChat(api_key=EMERGENT_LLM_KEY, session_id=company_id, system_message=SYSTEM_MESSAGE, initial_messages=initial_messages)
                .with_model("anthropic", "claude-sonnet-5")
                .with_tools(TOOLS, tool_choice="auto")
            )
            user_msg = UserMessage(text=user_text)
            while True:
                pending = []
                async for ev in chat.stream_message(user_msg):
                    if isinstance(ev, TextDelta):
                        full_response += ev.content
                        yield f"data: {json.dumps({'type': 'delta', 'content': ev.content})}\n\n"
                    elif isinstance(ev, ToolCallStart):
                        yield f"data: {json.dumps({'type': 'tool_start', 'name': ev.name})}\n\n"
                    elif isinstance(ev, ToolCallReady):
                        pending.append(ev.tool_call)
                    elif isinstance(ev, StreamDone):
                        break
                if not pending:
                    break
                for tc in pending:
                    result = await dispatch_tool(tc.name, tc.arguments, company_id)
                    chat.add_tool_result(tc.id, json.dumps(result))
                user_msg = None

            if full_response:
                assistant_doc = ChatMessageDoc(company_id=company_id, user_id=current_user.id, role="assistant", content=full_response)
                await db.chat_messages.insert_one(assistant_doc.to_mongo())
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            logger.error(f"Chat stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

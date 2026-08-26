import os
import json
import logging
import asyncio
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import google.generativeai as genai

from database import db
from models import UserDoc, ChatMessageDoc
from auth import get_current_user
from chat_tools import TOOLS, dispatch_tool

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)

SYSTEM_MESSAGE = """Você é o Sócio Digital, um assistente executivo de IA que atua como co-administrador de uma pequena ou média empresa brasileira. Você conversa exclusivamente com o empresário ou a gestão da empresa (nunca com clientes finais).

Seu objetivo é: monitorar dados financeiros e operacionais em tempo real, antecipar problemas antes que aconteçam, e sugerir ações concretas e claras.

Regras:
- Sempre use as ferramentas disponíveis para consultar dados reais da empresa antes de responder perguntas sobre números, vendas, clientes, estoque ou alertas. Nunca invente valores.
- Explique o "porquê" das suas respostas e recomendações com transparência, citando os dados usados.
- Seja direto, objetivo e use linguagem natural em português do Brasil. Evite jargão técnico.
- Quando fizer sentido, termine a resposta com uma seção "Ações sugeridas:" listando de 1 a 3 ações concretas e específicas.
- Você tem memória do negócio: quando o empresário mencionar metas (faturamento, margem), sazonalidade ou fatos importantes da empresa, salve-os com a ferramenta save_business_memory e confirme que anotou. Consulte get_business_memory para personalizar seus conselhos com base nas metas e nos padrões aprendidos.
- Se não houver dados suficientes (empresa sem CSV importado), oriente o empresário a fazer o upload da planilha na tela de Configurações."""

HISTORY_LIMIT = 20


class ChatRequest(BaseModel):
    message: str


def _get_gemini_tools():
    gemini_tools = []
    for t in TOOLS:
        fn = t.get("function", {})
        gemini_tools.append({
            "name": fn.get("name"),
            "description": fn.get("description"),
            "parameters": fn.get("parameters", {"type": "object", "properties": {}})
        })
    return gemini_tools


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

    user_doc = ChatMessageDoc(company_id=company_id, user_id=current_user.id, role="user", content=user_text)
    await db.chat_messages.insert_one(user_doc.to_mongo())

    async def event_generator():
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY", "")
        if not api_key:
            msg = "Chave da API do Gemini (GEMINI_API_KEY) não configurada no servidor. Configure a variável GEMINI_API_KEY no painel do Render para ativar o Chat com IA."
            yield f"data: {json.dumps({'type': 'delta', 'content': msg})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            assistant_doc = ChatMessageDoc(company_id=company_id, user_id=current_user.id, role="assistant", content=msg)
            await db.chat_messages.insert_one(assistant_doc.to_mongo())
            return

        full_response = ""
        try:
            genai.configure(api_key=api_key)
            tools = _get_gemini_tools()
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=SYSTEM_MESSAGE,
                tools=tools,
            )

            formatted_history = []
            for m in history_docs:
                role = "user" if m.get("role") == "user" else "model"
                if m.get("content"):
                    formatted_history.append({"role": role, "parts": [m["content"]]})

            chat = model.start_chat(history=formatted_history)
            response = chat.send_message(user_text)

            # Loop para processar tool calls (até 5 passos)
            for _ in range(5):
                has_tool_call = False
                if response.candidates and response.candidates[0].content.parts:
                    for part in response.candidates[0].content.parts:
                        if fn_call := getattr(part, "function_call", None):
                            has_tool_call = True
                            fn_name = fn_call.name
                            fn_args = dict(fn_call.args) if fn_call.args else {}
                            yield f"data: {json.dumps({'type': 'tool_start', 'name': fn_name})}\n\n"
                            tool_result = await dispatch_tool(fn_name, fn_args, company_id)
                            
                            response = chat.send_message({
                                "role": "function",
                                "parts": [{
                                    "function_response": {
                                        "name": fn_name,
                                        "response": {"result": tool_result}
                                    }
                                }]
                            })
                            break
                if not has_tool_call:
                    break

                # Extrai o texto final da resposta
            text = ""
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if getattr(part, "text", None):
                        text += part.text

            if text:
                full_response = text
                words = text.split(" ")
                for i, w in enumerate(words):
                    content = w + (" " if i < len(words) - 1 else "")
                    yield f"data: {json.dumps({'type': 'delta', 'content': content})}\n\n"
                    await asyncio.sleep(0.01)

            if full_response:
                assistant_doc = ChatMessageDoc(company_id=company_id, user_id=current_user.id, role="assistant", content=full_response)
                await db.chat_messages.insert_one(assistant_doc.to_mongo())

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            logger.error(f"Chat stream error (Gemini): {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': f'Desculpe, ocorreu um erro ao processar sua pergunta. Detalhes: {str(e)}'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

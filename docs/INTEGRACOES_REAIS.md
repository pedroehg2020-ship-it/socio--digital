# Integrações reais — V4

## IA
O backend agora suporta a OpenAI Responses API. Se `OPENAI_API_KEY` estiver configurada,
`POST /api/chat` envia à IA um contexto calculado do próprio banco do usuário:
dashboard, estoque baixo e clientes inativos. Sem chave, o sistema continua funcionando
com a análise local.

Variáveis:
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (padrão: `gpt-5.6-luna`)

## WhatsApp
O backend está preparado para um endpoint HTTPS compatível com o formato da WhatsApp
Cloud API/Meta:
- `WHATSAPP_SEND_URL`: URL completa do endpoint `/messages`
- `WHATSAPP_TOKEN`: token da conta/provedor
- `WHATSAPP_VERIFY_TOKEN`: token definido por você para validar webhook

Rotas:
- `POST /api/whatsapp/test`
- `POST /api/whatsapp/daily-summary`
- `GET /api/webhooks/whatsapp`
- `POST /api/webhooks/whatsapp`
- `GET /api/integrations/status`

Sem credenciais, o WhatsApp permanece no modo mocked observado no preview recuperado.

## Segurança
Não coloque chaves em GitHub. Use variáveis de ambiente do serviço de hospedagem.
Credenciais antigas/expostas não devem ser reutilizadas.

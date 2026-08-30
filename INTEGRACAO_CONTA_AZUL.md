# Integração Conta Azul — versão adaptada ao Sócio Digital reconstruído

Este projeto recebeu a integração OAuth2 da Conta Azul adaptada ao backend FastAPI/SQLite existente.

## Variáveis no Render
- `CONTAAZUL_CLIENT_ID`
- `CONTAAZUL_CLIENT_SECRET`
- `CONTAAZUL_REDIRECT_URI` — ex.: `https://SEU_DOMINIO/api/integrations/contaazul/callback`
- `FRONTEND_URL` — ex.: `https://SEU_DOMINIO`
- `OAUTH_STATE_SECRET` — segredo aleatório forte para assinar o state OAuth

## Endpoints
- `GET /api/integrations/contaazul/status`
- `GET /api/integrations/contaazul/connect`
- `GET /api/integrations/contaazul/callback`
- `POST /api/integrations/contaazul/disconnect`

A conexão OAuth fica persistida na tabela SQLite `integrations`. A sincronização de vendas/financeiro ainda não é feita automaticamente; essa era uma etapa posterior também indicada no patch original.

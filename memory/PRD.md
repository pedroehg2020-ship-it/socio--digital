# PRD — Sócio Digital (Assistente Executivo com IA)

## Problem Statement (original)
Web app que atua como co-administrador da empresa ("Sócio Digital"): monitora dados em tempo real, antecipa problemas, sugere ações e conversa com o empresário em linguagem natural. Público: empresários/gestores de PMEs brasileiras que usam ERPs (Conta Azul, Omie, Bling, Asaas). MVP definido em fases: auth/empresa, upload CSV + dashboard, chat com IA (tool calling), Radar Inteligente (alertas), integração real Conta Azul, estoque/clientes/metas, painel de equipe.

## User Choices Confirmed
- Escopo do primeiro MVP: upload de CSV/planilhas + Dashboard + Chat + Radar (SEM integração real Conta Azul OAuth, SEM Resend e-mail por agora)
- Sem credenciais Conta Azul disponíveis — fallback CSV é a única fonte de dados por agora
- Sem dados de demonstração pré-carregados — usuário sobe seu próprio CSV
- IA: Claude Sonnet 5 via Emergent Universal LLM Key
- Idioma: pt-BR em toda a interface

## Architecture
- Frontend: React (CRA/craco) JS/JSX + TailwindCSS + shadcn/ui + Recharts + @phosphor-icons/react + react-markdown + next-themes (dark mode)
  - Nota: stack original pedia TypeScript; implementado em JS puro pois o template da plataforma é CRA JS (sem impacto funcional)
- Backend: FastAPI + Motor (MongoDB async) + emergentintegrations (LlmChat) + APScheduler
- Auth: JWT (pyjwt + bcrypt), roles owner/manager/member
- DB: MongoDB — collections: users, companies, transactions, customers, products, alerts, chat_messages

## Core Requirements (static)
1. Chat conversacional com IA (tool calling sobre dados reais da empresa, histórico persistente)
2. Dashboard financeiro (KPIs, fluxo de caixa, categorias)
3. Radar Inteligente (queda de vendas, contas a vencer, ruptura/estoque parado, clientes inativos)
4. Upload de CSV (transações + estoque) com parser flexível de colunas pt-BR
5. Painel de equipe (multiusuário, papéis)

## Implemented (2026-08-05)
- Fase 1: Auth JWT completo (register/login/me), modelo de dados Mongo (BaseDocument/PyObjectId pattern), cadastro de empresa no registro
- Fase 2: Upload CSV de transações com parser flexível (aliases pt-BR/en, datas BR e ISO, valores com vírgula), Dashboard (summary, cashflow, categorias) com Recharts
- Fase 3: Chat com Claude Sonnet 5 (emergentintegrations), streaming SSE, 5 tools (get_financial_summary, get_transactions, get_customers, get_inventory, get_alerts), histórico persistido em MongoDB, ChatWidget flutuante + tela dedicada /chat
- Fase 4: Radar Inteligente — regras: queda vendas ≥15% (geral e por categoria), contas a vencer em 7 dias, estoque ruptura/parado, clientes inativos (>45 dias); recomputação automática pós-upload + job APScheduler a cada 6h; resolver alertas
- Fase 6 (parcial): Módulo Clientes (agregação automática via coluna cliente do CSV) e Estoque (upload CSV dedicado + badges de risco)
- Fase 7 (parcial): Painel de equipe — adicionar/remover membros (owner/manager), papéis
- UI: tema claro/escuro, sidebar cockpit executivo, mobile nav (Sheet), fontes Manrope+IBM Plex Sans, cores semânticas (credit/debit/warning)
- Testado via testing_agent: 100% backend (pytest) e frontend (Playwright) nos fluxos principais. RBAC de exclusão de transação restrito a owner/manager (fix pós-teste). CORS ajustado (allow_credentials=False, já que auth é via Bearer token).

## Explicitly NOT implemented (by user's explicit MVP choice)
- Integração real Conta Azul (OAuth) — Fase 5, requer credenciais do usuário
- Resend (resumo diário por e-mail) — requer API key
- Omie/Bling/Asaas, Open Finance, WhatsApp/Twilio, voice input, marketplace de skills — Fases futuras (Melhorias Futuras)
- Projeção de metas diária detalhada — não implementada nesta rodada

## Backlog Prioritizado
- P0: nenhum bloqueador conhecido
- P1: Integração real Conta Azul (aguardando credenciais do usuário), Resend para resumo diário por e-mail (aguardando API key), deduplicação de CSV re-importado
- P2: projeção diária de metas, Omie/Bling/Asaas, ações automatizadas com aprovação (WhatsApp/Twilio), voice input no chat

## Next Tasks
- Aguardar decisão do usuário sobre priorizar Conta Azul OAuth ou Resend e-mail como próximo passo
- Avaliar necessidade de deduplicação/idempotência no upload de CSV se usuário reimportar planilhas com sobreposição de datas

# Estado do projeto — V5

## O que mudou em relação à V4

A V4 continha apenas o `bundle.js` compilado (4,1 MB, build de desenvolvimento
recuperado do navegador). Não havia `src/`, `package.json` nem qualquer forma de
editar o frontend. O backend era somente de leitura: só `GET`.

A V5 reconstrói o código-fonte e acrescenta as operações de ERP.

## Frontend

Código-fonte em `frontend/src/`, compilado por esbuild (`node build.mjs`).

| Arquivo | Papel |
|---|---|
| `src/pages/Landing.jsx` | Página inicial com cena 3D e revelações por rolagem |
| `src/components/Scene3D.jsx` | Cena React Three Fiber (dashboard 3D, elementos financeiros) |
| `src/lib/animacoes.js` | Hooks `useRevelar` e `useContador` |
| `src/pages/Sales.jsx` | Frente de vendas (PDV) — rota padrão do app |
| `src/pages/Finance.jsx` | Receber, pagar, fluxo de caixa e DRE |
| `src/pages/Modules.jsx` | Estoque, clientes, notas fiscais e configurações |
| `src/pages/Dashboard.jsx` | Painel do sócio |
| `src/styles.css` | Design system (paleta ampliada, KPIs coloridos) |

Saída do build:

- `static/js/bundle.js` — 732 KB (app)
- `static/js/chunks/Scene3D-*.js` — 805 KB (three.js + R3F, carregado sob demanda)
- `static/js/bundle.css` — 21 KB

O chunk 3D só é baixado na página inicial, e apenas quando há WebGL e o usuário
não pediu movimento reduzido.

## Backend

`backend/erp.py` acrescenta ao núcleo original:

- venda com baixa de estoque, geração de parcelas e lançamento no caixa
- contas a receber e a pagar, com baixa e marcação automática de atraso
- emissão de NF-e / NFS-e (numeração e chave; transmissão à SEFAZ pendente)
- fluxo de caixa projetado para 90 dias
- DRE simplificado dos últimos meses
- CRUD de produtos e clientes

## Pendências conhecidas

- Emissão fiscal é simulada: falta plugar um emissor com certificado A1.
- A cena 3D não foi validada visualmente em navegador (o ambiente de
  desenvolvimento usado não tinha WebGL); a lógica foi testada em jsdom, que
  exercita o caminho de fallback.
- Não há testes automatizados de backend além da verificação manual dos
  endpoints.

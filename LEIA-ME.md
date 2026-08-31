# Redesign da landing page — Sócio Digital

Pacote gerado a partir de `pedroehg2020-ship-it/socio--digital`.
A estrutura de pastas aqui dentro é a mesma do projeto: dá para copiar por cima
da raiz do repositório.

---

## Duas formas de aplicar

### A) Copiar por cima (mais simples)

Da raiz do seu repositório:

```bash
cp -r caminho/do/zip/socio-digital-redesign/* .
```

Depois faça as **duas remoções manuais** descritas abaixo.

### B) Aplicar o patch (mais limpo, mostra o diff antes)

O arquivo `redesign.patch` traz todas as alterações de **código-fonte**. Ele
não inclui `frontend/static/`, que é resultado de build — sem os 1,6 MB de
JavaScript minificado o diff fica legível.

```bash
git apply --stat redesign.patch    # confere o que vai mudar
git apply redesign.patch
cd frontend && npm ci && npm run build   # regenera frontend/static/
```

O `build.mjs` limpa a pasta de saída antes de compilar, então os chunks antigos
somem sozinhos e você não precisa das remoções manuais.

---

## Remoções manuais (só se você usou a opção A)

Os nomes dos chunks levam hash. Os dois arquivos abaixo são da versão antiga e
continuariam ocupando espaço no repositório sem nunca serem carregados:

```bash
git rm frontend/static/js/chunks/Scene3D-K2FDJEUY.js
git rm frontend/static/js/chunks/chunk-H3N4NT2J.js
```

O `frontend/build.mjs` deste pacote já limpa a pasta de saída antes de cada
build, então isso não volta a acontecer.

---

## O que tem em cada pasta

### Alterado ou criado neste redesign

| Caminho | Situação |
|---|---|
| `frontend/src/components/landing/` | **novo** — 8 arquivos: palco 3D, primitivas, composições, slots e blocos de UI |
| `frontend/src/data/landing.js` | **novo** — todo o conteúdo da página |
| `frontend/src/styles/landing.css` | **novo** — design system da landing |
| `frontend/src/pages/Landing.jsx` | reescrito |
| `frontend/src/styles.css` | bloco antigo da landing removido |
| `frontend/build.mjs` | limpa a pasta de saída antes do build |
| `frontend/public/index.html` | removidos o script `assets.emergent.sh`, o PostHog e o título "Emergent \| Fullstack App" |
| `backend/app.py` | `/healthz`, `FRONTEND_URL` não derruba mais o processo, index sem cache |
| `Dockerfile` | multi-stage: compila o frontend e respeita `$PORT` |
| `render.yaml` | `dockerfilePath` explícito e `healthCheckPath: /healthz` |
| `frontend/static/js/` | bundle recompilado |

### Incluído só porque o build precisa (não foi alterado)

`frontend/package.json`, `frontend/package-lock.json`, `frontend/index.html`,
`frontend/src/index.jsx`, `frontend/src/App.jsx`,
`frontend/src/components/Icons.jsx`, `frontend/src/lib/animacoes.js`,
`frontend/static/favicon.svg`, `backend/requirements.txt`.

Se esses arquivos já estiverem iguais no seu repositório, copiá-los não muda
nada — estão aqui para que o `Dockerfile` funcione mesmo em um clone limpo.

---

## Testar localmente antes do deploy

```bash
cd frontend
npm ci
npm run build
cd ..
pip install -r backend/requirements.txt
python -m uvicorn backend.app:app --reload --port 8000
```

Abra `http://localhost:8000`. Confira principalmente:

- a cena 3D acompanha a rolagem e troca a cada seção;
- nada de erro no console;
- as âncoras do menu e do rodapé rolam para a seção certa;
- login e cadastro continuam entrando no dashboard;
- redimensione para a largura de celular e verifique se as cenas encolhem em
  vez de sumir.

---

## Depois do deploy no Render

Confira no painel, em Environment:

- **`SQLITE_PATH`** — precisa apontar para dentro de um disco persistente.
  Sem isso o banco é recriado a cada deploy e as contas cadastradas somem.
- **`OAUTH_STATE_SECRET`** e **`TOKEN_ENCRYPTION_KEY`** — obrigatórias se for
  usar a integração com a Conta Azul.
- **`FRONTEND_URL`** — agora é opcional. Sem ela o backend usa a
  `RENDER_EXTERNAL_URL`, que a plataforma injeta sozinha. Só preencha se o
  frontend for servido em outro domínio.

O health check passou a ser `/healthz`. Se você configurou o caminho pela
interface do Render em vez do `render.yaml`, atualize lá também.

---

## Duas observações

**`frontend/src/components/Scene3D.jsx` ficou órfão.** É a cena 3D antiga, de
514 linhas, que ninguém mais importa. Não incluí uma remoção dela para não
mexer no que não precisava, mas você pode apagá-la com segurança.

**O comportamento visual do 3D não foi testado em navegador.** Validei o build,
os imports, o registro das 11 composições e a renderização do HTML, mas não
havia GPU no ambiente onde isso foi feito. O encaixe das cenas nos slots, o fade
entre seções e o paralaxe do mouse só dá para conferir abrindo a página.

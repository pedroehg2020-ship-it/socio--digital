# Correção da tela branca — `t.filter is not a function`

Pacote gerado a partir de `pedroehg2020-ship-it/socio--digital`.
A estrutura de pastas é a do projeto: copie por cima da raiz do repositório.

O design da landing **não foi alterado**. Backend, autenticação, banco e rotas
também não — a única mudança no backend é a guarda descrita abaixo, que afeta
apenas caminhos que hoje respondem a coisa errada.

---

## Onde o erro estava, exatamente

Compilei o bundle de produção com sourcemap e mapeei **todas as 26 chamadas a
`.filter()`** de volta ao arquivo de origem. O resultado:

```
7  src/pages/Modules.jsx     ← linhas 81, 93, 261, 266, 439, 460, 620
4  src/pages/Sales.jsx       ← linhas 78, 199, 315, 406
1  src/pages/Finance.jsx     ← linha 226
0  qualquer arquivo da landing
```

**Nenhum arquivo da landing page contém `.filter()`.** O redesign não era a
causa.

Das nove chamadas cujo receptor minificado é exatamente `t` — o nome que aparece
na sua mensagem de erro — a que roda ao abrir o endereço público é
**`src/pages/Sales.jsx`, linha 315, dentro de um `useMemo`**:

```js
const filtradas = useMemo(() => {
  ...
  return vendas.filter((v) => new Date(v.sold_at) >= corte)  // ← aqui
}, [vendas, busca, periodo]);
```

Isso bate com o `useMemo` do seu stack trace.

### Por que uma tela do sistema roda ao abrir o endereço público

Em `App.jsx`, a rota `/` é envolvida por `SomentePublico`, que redireciona quem
já tem sessão:

```js
if (user) return <Navigate to="/app/vendas" replace />;
```

Como você estava logado dos testes, o link público não abre a landing: manda
direto para `/app/vendas`, que é o `Sales.jsx`. A landing estava íntegra — você
nunca chegou a vê-la.

### Por que `vendas` não era um array

Esta é a causa raiz, e ela estava no `backend/app.py` que eu escrevi na rodada
do Render. O fallback da SPA era:

```python
@app.get("/{full_path:path}")
def spa(full_path: str):
    return FileResponse(INDEX, media_type="text/html", ...)
```

Esse `catch-all` engolia **qualquer** caminho que não casasse com uma rota
registrada — inclusive os que começam com `/api`. Medido no servidor real,
antes da correção:

```
/api/sales/                status=200  content-type=text/html  ← 200, não 404
/api/vendas                status=200  content-type=text/html
/api/rota-que-nao-existe   status=200  content-type=text/html
```

Um `200` é sucesso para o axios. Então `response.data` chegava contendo a
**string do HTML da página**, `setVendas()` guardava a string onde deveria haver
uma lista, e no primeiro `.filter()` vinha o `TypeError`. Como não havia
fronteira de erro, o React desmontava a árvore inteira: tela branca.

Vale notar que isso só apareceu agora porque, até a rodada anterior, o Docker
servia o bundle antigo comitado no repositório. Passou a compilar o código-fonte
no deploy — e o problema, que já existia, ficou visível.

---

## As três correções

### 1. Causa raiz — `backend/app.py`

Rotas sob `/api` não caem mais no fallback da SPA:

```python
if full_path == "api" or full_path.startswith("api/"):
    raise HTTPException(404, f"Rota de API inexistente: /{full_path}")
```

Agora um caminho de API inexistente vira uma promessa rejeitada, tratada pelos
`.catch()` que já existiam. Medido depois da correção:

```
/api/sales/                404  application/json   {"detail":"Rota de API inexistente: ..."}
/api/rota-que-nao-existe   404  application/json
/                          200  text/html   ← SPA intacta
/login  /cadastro  /app/vendas  /qualquer/coisa   200  text/html
/healthz                   200  {"status":"ok"}
```

Nenhuma rota real de API mudou de comportamento.

### 2. Segunda linha de defesa — `frontend/src/lib/api.js`

Duas funções novas, `lista()` e `objeto()`, normalizam o payload antes de ele
entrar no estado. Aplicadas em `Sales.jsx`, `Modules.jsx`, `Finance.jsx`,
`Dashboard.jsx` e `AppLayout.jsx`:

```js
setVendas(lista(v));   // era setVendas(v.data)
setResumo(objeto(r));  // era setResumo(r.data)
```

Comportamento verificado com o payload exato que quebrava:

| entrada | resultado |
|---|---|
| HTML com status 200 | `[]` |
| lista real | a lista |
| `null` / `undefined` | `[]` |
| objeto solto | `[]` |
| `{ items: [...] }` | os itens |

Um payload malformado agora vira "sem registros" na tela, não um crash.

### 3. Fronteira de erro — `frontend/src/components/FronteiraDeErro.jsx`

`App.jsx` passou a ser envolvido por um error boundary. Foi a **ausência dele**
que transformou um erro pontual numa página em branco. Agora um erro de render
mostra uma tela legível com a mensagem real e um caminho de volta, em vez de
apagar o site.

---

## Aplicar

```bash
cp -r caminho/do/zip/socio-digital-redesign/* .
```

Se o seu repositório ainda tiver chunks de builds antigos (levam hash no nome),
remova-os — um ZIP não consegue apagar arquivos:

```bash
git rm -f frontend/static/js/chunks/Scene3D-*.js 2>/dev/null
git rm -f frontend/static/js/chunks/Palco3D-LGQG4CPY.js 2>/dev/null
git rm -f frontend/static/js/chunks/chunk-H3N4NT2J.js 2>/dev/null
git rm -f frontend/static/js/chunks/chunk-QSSBDCCJ.js 2>/dev/null
```

Os chunks válidos desta versão são `Palco3D-5XQ6WYLX.js` e `chunk-L2SIKMD5.js`.

### Testar antes de subir

```bash
cd frontend && npm ci && npm run build && cd ..
python -m uvicorn backend.app:app --reload --port 8000
```

Depois de fazer o deploy, para ver a landing você precisa **sair da sessão** ou
abrir numa janela anônima — senão o `SomentePublico` continua te mandando para
`/app/vendas`. Se quiser limpar direto pelo console do navegador:

```js
localStorage.removeItem("sd_token"); location.reload();
```

---

## Arquivos alterados nesta correção

| Arquivo | Mudança |
|---|---|
| `backend/app.py` | guarda `/api` no fallback da SPA |
| `frontend/src/lib/api.js` | `lista()` e `objeto()` |
| `frontend/src/components/FronteiraDeErro.jsx` | **novo** — error boundary |
| `frontend/src/App.jsx` | envolve a árvore na fronteira |
| `frontend/src/styles.css` | estilos da tela de erro (ao final) |
| `Sales.jsx`, `Modules.jsx`, `Finance.jsx`, `Dashboard.jsx`, `AppLayout.jsx` | normalização nos `set*` |

Os arquivos da landing vão no pacote sem nenhuma alteração — estão aqui só para
o conjunto ficar completo.

---

## Verificações

- Build de produção passa: `bundle.js` 751 kb, `bundle.css` 37 kb, chunk do
  palco 845 kb.
- Backend real levantado e medido antes/depois: `/api` inexistente saiu de
  `200 text/html` para `404 application/json`; as cinco rotas da SPA continuam
  em `200 text/html`.
- Landing renderizada com o bundle minificado de produção em jsdom, com WebGL
  presente: 58 kb de HTML, palco 3D montado, `<canvas>` presente, zero erros de
  console.
- `lista()` exercitada com os seis formatos de payload da tabela acima.
- Fronteira de erro: renderiza os filhos quando não há erro; com o `TypeError`
  real, produz a tela com a mensagem e as ações.

## O que continua sem verificação

O comportamento visual do 3D em navegador — não há GPU neste ambiente. Isso não
mudou nesta rodada, já que nenhum arquivo da landing foi tocado.

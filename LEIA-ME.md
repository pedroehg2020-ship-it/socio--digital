# Redesign visual da landing page — Sócio Digital

Pacote gerado a partir de `pedroehg2020-ship-it/socio--digital`.
A estrutura de pastas é a mesma do projeto: dá para copiar por cima da raiz do
repositório.

Backend, login, rotas, banco e área autenticada **não foram tocados**, com uma
exceção deliberada em `backend/app.py`, descrita mais abaixo.

---

## Aplicar

```bash
cp -r caminho/do/zip/socio-digital-redesign/* .
```

Depois, **duas remoções manuais** (um ZIP não consegue apagar arquivos). Os
chunks levam hash no nome, então as versões antigas continuariam no repositório
sem nunca serem carregadas:

```bash
git rm -f frontend/static/js/chunks/Scene3D-K2FDJEUY.js
git rm -f frontend/static/js/chunks/chunk-H3N4NT2J.js
git rm -f frontend/static/js/chunks/Palco3D-LGQG4CPY.js
git rm -f frontend/static/js/chunks/chunk-QSSBDCCJ.js
```

Se algum desses arquivos não existir no seu repositório, ignore o erro. O
`build.mjs` limpa a pasta de saída antes de cada build, então isso não volta a
acontecer.

---

## O que mudou nesta rodada

### O 3D deixou de ser ilustração

O ponto de partida foi trocar o objeto central das cenas. Antes eram formas
geométricas coloridas flutuando; agora cada cena é construída em torno de uma
**tela do próprio ERP**, desenhada em Canvas2D em 1280×800 e aplicada como
textura num monitor 3D com moldura metálica, bisel e lâmina de vidro por cima.

São sete telas: painel geral, contas a receber, frente de vendas, estoque,
agenda de vencimentos, assistente e radar. Ficam em
`frontend/src/components/landing/telas.js`.

### Três planos de profundidade

Cada cena distribui os objetos em fundo, meio e frente. Os três recebem o mesmo
progresso de rolagem, mas o consomem com amplitudes diferentes — é isso que
produz paralaxe de verdade, e não um deslocamento uniforme. O plano da frente
também reage cinco vezes mais ao mouse que o do fundo.

O componente responsável é `Camada`, em `primitivas3d.jsx`.

### Animação ligada ao scroll, não ao relógio

`progressoDoRect()` (em `palco.js`) calcula quanto a seção já percorreu a
janela: 0 quando entra pela base, 1 quando sai pelo topo. As barras dos
gráficos crescem, as curvas se desenham e as camadas derivam em função desse
número. O movimento parece conduzido por quem rola a página.

### Acabamento

- **Mapa de ambiente** gerado por PMREM a partir de um céu desenhado em canvas.
  É de onde vem o reflexo real no metal e no vidro — sem baixar nenhum HDR.
- **Rig de três luzes**: chave quente que projeta sombra, preenchimento frio e
  contraluz verde que recorta a silhueta.
- **Tone mapping ACES** com espaço de cor sRGB, no lugar do contraste plano do
  padrão do WebGL.
- **Sombra de contato** sob cada cena, além do shadow map.
- **Poeira luminosa** em três profundidades, com blending aditivo.

### Cor: escuro como base

A crítica estava certa — "poucas cores" tinha virado "página branca". Agora a
base é escura e existem cinco tratamentos de fundo que se alternam: `tinta`,
`noite`, `abismo` (os momentos de maior impacto), `claro` e `papel`. As duas
seções claras entram como respiro, não como padrão.

As cores da marca continuam sendo duas — verde e azul — mas em escala completa
(`--marca-50` até `--marca-900`), com gradientes, vidro, halos e neon.

### Quatro momentos de maior impacto

Hero, Vendas, Relatórios e Automação. No hero, o gráfico de barras emerge da
superfície da tela e a curva de receita atravessa a moldura e continua no
espaço. Em Relatórios, três telas em leque com a curva costurando as três.
Em Automação, engrenagens metálicas grandes em profundidades diferentes,
ligadas por filetes de luz. O CTA final ganhou cena própria de largura cheia.

### Performance

Continua havendo **um único contexto WebGL**. `nivelQualidade()` classifica o
aparelho por largura de tela, núcleos e memória em três faixas:

| Faixa | Sombra projetada | Poeira | Objetos decorativos | dpr |
|---|---|---|---|---|
| alta | sim | 240 | completos | até 1,9 |
| média | não (só sombra de contato) | 120 | completos | até 1,5 |
| baixa | não | nenhuma | reduzidos | 1 |

No celular a cena é simplificada, não escondida. A aba em segundo plano para de
renderizar. Sem WebGL, os slots caem num fallback em CSS com três lâminas em
perspectiva.

`prefers-reduced-motion` desliga oscilação, giro e paralaxe, mas mantém a cena
montada e posicionada.

---

## Arquivos

### Criados nesta rodada

| Caminho | Papel |
|---|---|
| `frontend/src/components/landing/telas.js` | As sete telas do ERP em Canvas2D |
| `frontend/src/components/landing/ambiente3d.jsx` | Env map, luzes, sombra de contato, poeira, halos |

### Reescritos nesta rodada

`primitivas3d.jsx` (materiais por família, `Tela`, `Camada`, gráficos
volumétricos), `composicoes.jsx` (12 cenas completas), `Palco3D.jsx`
(progresso, mouse, sombras, qualidade), `styles/landing.css`.

### Ajustados

`Blocos.jsx` (textura de grade, novo CTA), `pages/Landing.jsx` (sequência de
fundos), `palco.js` (progresso e qualidade).

### Da rodada anterior, incluídos aqui

`Cabecalho.jsx`, `Rodape.jsx`, `Slot3D.jsx`, `data/landing.js`, `styles.css`,
`build.mjs`, `Dockerfile`, `render.yaml`, `backend/app.py`,
`frontend/public/index.html`.

### Incluídos porque o build precisa (não alterados)

`package.json`, `package-lock.json`, `frontend/index.html`, `index.jsx`,
`App.jsx`, `Icons.jsx`, `lib/animacoes.js`, `requirements.txt`, `favicon.svg`.

---

## A exceção no backend

`backend/app.py` foi alterado na rodada anterior, não nesta. As mudanças são de
infraestrutura, não de funcionalidade:

- `/healthz` como rota de health check;
- `FRONTEND_URL` ausente não derruba mais o processo (usa `RENDER_EXTERNAL_URL`);
- `index.html` servido com `no-store`.

Nenhuma rota de API, modelo ou regra de negócio foi tocada.

---

## Verificações feitas

- Build de produção passa: `bundle.js` 750 kb, `bundle.css` 36 kb, chunk do
  palco 845 kb carregado sob demanda apenas onde há WebGL.
- Renderização em Node: 17 seções, 12 slots, todos com cena correspondente.
- Nenhuma âncora quebrada — os `href="#..."` batem com os `id` das seções.
- As sete telas do ERP foram executadas contra um stub que registra chamadas ao
  Canvas2D: nenhuma usa método inexistente.
- Geometrias conferidas fora do React: moldura, escudo, tubo da curva e o
  quaternion das conexões, sem `NaN`.

---

## O que não foi verificado

**O comportamento visual em navegador.** Não havia GPU no ambiente onde isto
foi feito. Compilação, imports, cenas, telas e geometrias foram validados; o
encaixe das cenas nos slots, os reflexos, as sombras e o paralaxe só dá para
conferir abrindo a página.

Rode local antes de subir:

```bash
cd frontend && npm ci && npm run build && cd ..
pip install -r backend/requirements.txt
python -m uvicorn backend.app:app --reload --port 8000
```

Olhe principalmente: se o console fica limpo, se as cenas não invadem o texto
em larguras intermediárias (900–1100 px) e como fica a fluidez no celular. Se
travar em algum aparelho, o ajuste mais direto é baixar os limites em
`nivelQualidade()`, dentro de `palco.js`.

---

## Depois do deploy no Render

Confira em Environment:

- **`SQLITE_PATH`** apontando para um disco persistente — sem isso o banco é
  recriado a cada deploy.
- **`OAUTH_STATE_SECRET`** e **`TOKEN_ENCRYPTION_KEY`**, obrigatórias para a
  integração com a Conta Azul.
- **`FRONTEND_URL`** é opcional agora.

O health check passou a ser `/healthz`. Se você o configurou pela interface do
Render em vez do `render.yaml`, atualize lá também.

---

## Observação

`frontend/src/components/Scene3D.jsx` continua órfão no repositório — é a cena
3D da versão original, que ninguém mais importa. Não incluí a remoção para não
mexer no que não precisava, mas pode apagar com segurança.

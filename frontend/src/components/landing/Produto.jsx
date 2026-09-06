/**
 * COMPONENTES DE PRODUTO.
 *
 * Não são ilustrações nem prints: são pedaços de interface construídos com o
 * mesmo vocabulário do ERP — tabela, filete, indicador, barra de saldo,
 * pílula de status. É o produto servindo de imagem para si mesmo.
 *
 * Duas regras estruturais que valem para todos:
 *
 *  · DUAS PELES. Cada um aceita `pele="escura"` ou `pele="clara"` e assume a
 *    superfície da seção em que está. É isso que impede a leitura de "print
 *    colado sobre um fundo" — o componente pertence à faixa, não flutua nela.
 *
 *  · NADA DE CARTÃO SOLTO. A separação é feita por filete de 1px e por
 *    diferença de luminância entre superfícies, nunca por caixa arredondada
 *    com sombra. Raio máximo aqui é 8px, e só no contorno externo.
 */

import { useEffect, useRef, useState } from "react";
import Numero from "@/components/landing/Numero";

/* ---------------------------------------------------------- utilitário */

/** Dispara uma vez quando entra na viewport. */
export function useAoEntrar(limiar = 0.2) {
  const alvo = useRef(null);
  const [dentro, setDentro] = useState(false);
  useEffect(() => {
    const el = alvo.current;
    if (!el || dentro) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setDentro(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setDentro(true);
          obs.disconnect();
        }
      },
      { threshold: limiar }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [dentro, limiar]);
  return [alvo, dentro];
}

const brl = (v, d = 0) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

/* ================================================ painel de comando ===== */

/**
 * HERO. Um recorte do painel executivo: quatro indicadores, a curva de caixa
 * e a fila de alertas. Sem moldura de screenshot — a superfície é contínua e
 * sangra para fora da margem.
 */
export function PainelComando({ ativo }) {
  return (
    <div className="pd pd-escura pd-comando">
      <header className="pd-topo">
        <span className="pd-topo-titulo">Painel executivo</span>
        <span className="pd-topo-nota">Atualizado agora</span>
      </header>

      <div className="pd-comando-kpis">
        <div className="pd-kpi">
          <span className="pd-kpi-rotulo">Receita do mês</span>
          <span className="pd-kpi-valor">
            <Numero valor={193220} de={0} moeda ativo={ativo} duracao={1100} />
          </span>
          <span className="sd-sinal sd-sinal-pos">+12,4%</span>
        </div>
        <div className="pd-kpi">
          <span className="pd-kpi-rotulo">Caixa projetado</span>
          <span className="pd-kpi-valor">
            <Numero valor={74850} de={0} moeda ativo={ativo} duracao={1200} atraso={90} />
          </span>
          <span className="pd-kpi-nota">Próximos 30 dias</span>
        </div>
        <div className="pd-kpi">
          <span className="pd-kpi-rotulo">Vendas</span>
          <span className="pd-kpi-valor">
            <Numero valor={412} de={0} ativo={ativo} duracao={1000} atraso={180} />
          </span>
          <span className="sd-sinal sd-sinal-pos">+38</span>
        </div>
        <div className="pd-kpi">
          <span className="pd-kpi-rotulo">A receber</span>
          <span className="pd-kpi-valor">
            <Numero valor={128400} de={0} moeda ativo={ativo} duracao={1100} atraso={270} />
          </span>
          <span className="pd-kpi-nota">18 títulos</span>
        </div>
      </div>

      <div className="pd-comando-grafico">
        <div className="pd-secao-rotulo">
          <span>Fluxo de caixa projetado</span>
          <span className="pd-topo-nota">90 dias</span>
        </div>
        <GraficoCaixa ativo={ativo} compacto />
      </div>

      <ul className="pd-alertas">
        <li>
          <span className="pd-ponto pd-ponto-ate" aria-hidden="true" />
          <span className="pd-alerta-texto">3 produtos abaixo do ponto mínimo</span>
          <span className="pd-alerta-acao">Repor</span>
        </li>
        <li>
          <span className="pd-ponto pd-ponto-neg" aria-hidden="true" />
          <span className="pd-alerta-texto">2 títulos vencidos há mais de 15 dias</span>
          <span className="pd-alerta-acao">Cobrar</span>
        </li>
      </ul>
    </div>
  );
}

/* ================================================= gráfico de caixa ===== */

const CAIXA = [
  { m: "Jan", e: 148, s: 96 },
  { m: "Fev", e: 162, s: 104 },
  { m: "Mar", e: 155, s: 118 },
  { m: "Abr", e: 178, s: 112 },
  { m: "Mai", e: 184, s: 126 },
  { m: "Jun", e: 193, s: 121 },
];

/**
 * Barras de entrada e saída com a linha de saldo por cima. O saldo é a única
 * coisa em teal: num gráfico financeiro, cor é significado, não enfeite.
 */
export function GraficoCaixa({ ativo, compacto = false }) {
  const L = 640;
  const A = compacto ? 150 : 260;
  const base = A - 26;
  const topo = 14;
  const max = 210;
  const larguraGrupo = L / CAIXA.length;
  const bw = compacto ? 13 : 20;

  const y = (v) => base - (v / max) * (base - topo);
  const saldo = CAIXA.map((d, i) => {
    const acumulado = CAIXA.slice(0, i + 1).reduce((t, x) => t + (x.e - x.s), 0);
    return { x: larguraGrupo * i + larguraGrupo / 2, v: acumulado };
  });
  const maxSaldo = Math.max(...saldo.map((s) => s.v));
  const linha = saldo
    .map((s, i) => `${i ? "L" : "M"}${s.x.toFixed(1)} ${(base - (s.v / maxSaldo) * (base - topo) * 0.82).toFixed(1)}`)
    .join(" ");

  return (
    <svg
      className={`pd-grafico${ativo ? " pd-grafico-ativo" : ""}`}
      viewBox={`0 0 ${L} ${A}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Fluxo de caixa dos últimos seis meses"
    >
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1="0"
          x2={L}
          y1={y(max * f)}
          y2={y(max * f)}
          className="pd-grade"
        />
      ))}

      {CAIXA.map((d, i) => {
        const cx = larguraGrupo * i + larguraGrupo / 2;
        return (
          <g key={d.m} style={{ "--i": i }}>
            <rect
              className="pd-barra pd-barra-entrada"
              x={cx - bw - 2}
              y={y(d.e)}
              width={bw}
              height={base - y(d.e)}
            />
            <rect
              className="pd-barra pd-barra-saida"
              x={cx + 2}
              y={y(d.s)}
              width={bw}
              height={base - y(d.s)}
            />
            {!compacto ? (
              <text className="pd-eixo" x={cx} y={A - 6} textAnchor="middle">
                {d.m}
              </text>
            ) : null}
          </g>
        );
      })}

      <path className="pd-linha-saldo" d={linha} />
    </svg>
  );
}

/* =============================================== reação de uma venda ===== */

const REACOES = [
  { rotulo: "Estoque", de: 28, para: 27, sufixo: "un.", detalhe: "Camiseta Premium P" },
  { rotulo: "Contas a receber", de: 119500, para: 128400, moeda: true, detalhe: "Parcela em 30 dias" },
  { rotulo: "Receita do mês", de: 184320, para: 193220, moeda: true, detalhe: "Indicador do painel" },
  { rotulo: "Caixa projetado", de: 65950, para: 74850, moeda: true, detalhe: "Projeção recalculada" },
];

/**
 * PROVA DE INTEGRAÇÃO. Um evento à esquerda; à direita, quatro indicadores
 * que reagem em sequência. O atraso entre eles é o argumento — se tudo
 * acendesse junto, a relação de causa se perderia.
 */
export function ReacaoVenda() {
  const [alvo, dentro] = useAoEntrar(0.3);
  const [passo, setPasso] = useState(-1);

  useEffect(() => {
    if (!dentro) return undefined;
    const reduz =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduz) {
      setPasso(REACOES.length - 1);
      return undefined;
    }
    const ts = REACOES.map((_, i) =>
      setTimeout(() => setPasso((v) => Math.max(v, i)), 420 + i * 340)
    );
    return () => ts.forEach(clearTimeout);
  }, [dentro]);

  return (
    <div className="reacao" ref={alvo}>
      <div className="reacao-evento">
        <span className="reacao-etiqueta">Venda registrada</span>
        <span className="reacao-valor sd-num">{brl(8900)}</span>
        <span className="reacao-detalhe">Marina Alves · 3 itens · a prazo</span>
        <span className="reacao-selo">Único passo manual</span>
      </div>

      <div className="reacao-seta" aria-hidden="true">
        <span className={dentro ? "reacao-seta-linha reacao-seta-ativa" : "reacao-seta-linha"} />
      </div>

      <div className="reacao-efeitos">
        {REACOES.map((r, i) => (
          <div
            key={r.rotulo}
            className={`reacao-item${i <= passo ? " reacao-item-aceso" : ""}`}
          >
            <span className="reacao-item-rotulo">{r.rotulo}</span>
            <span className="reacao-item-valor">
              <span className="reacao-antes sd-num">
                {r.moeda ? brl(r.de) : r.de}
              </span>
              <span className="reacao-flecha" aria-hidden="true">→</span>
              <Numero valor={r.para} de={r.de} moeda={r.moeda} ativo={i <= passo} duracao={480} />
              {r.sufixo ? <span className="reacao-sufixo">{r.sufixo}</span> : null}
            </span>
            <span className="reacao-item-detalhe">{r.detalhe}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================================================== tabela de vendas ===== */

const VENDAS = [
  { n: "#4824", cli: "Marina Alves", itens: 3, forma: "A prazo", v: 8900, m: 31, nova: true },
  { n: "#4823", cli: "Bruno Tavares", itens: 1, forma: "Pix", v: 1240, m: 42 },
  { n: "#4821", cli: "Ateliê Norte", itens: 7, forma: "Cartão", v: 15480, m: 28 },
  { n: "#4818", cli: "Carla Menezes", itens: 2, forma: "Pix", v: 2360, m: 39 },
  { n: "#4815", cli: "Distribuidora Sul", itens: 12, forma: "A prazo", v: 27900, m: 22 },
];

export function TabelaVendas({ pele = "clara" }) {
  const [alvo, dentro] = useAoEntrar(0.25);
  const [filtro, setFiltro] = useState(false);

  useEffect(() => {
    if (!dentro) return undefined;
    const t = setTimeout(() => setFiltro(true), 700);
    return () => clearTimeout(t);
  }, [dentro]);

  return (
    <div className={`pd pd-${pele} pd-tabela-caixa`} ref={alvo}>
      <header className="pd-topo">
        <span className="pd-topo-titulo">Vendas</span>
        <div className="pd-filtros">
          <span className={`pd-filtro${filtro ? " pd-filtro-ativo" : ""}`}>Este mês</span>
          <span className="pd-filtro">Todos os vendedores</span>
          <span className="pd-topo-nota">412 registros</span>
        </div>
      </header>

      <table className="pd-tabela">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th className="pd-col-num">Itens</th>
            <th>Pagamento</th>
            <th className="pd-col-num">Valor</th>
            <th className="pd-col-num">Margem</th>
          </tr>
        </thead>
        <tbody>
          {VENDAS.map((v) => (
            <tr
              key={v.n}
              className={v.nova ? `pd-linha-nova${dentro ? " pd-linha-entrou" : ""}` : ""}
            >
              <td className="sd-num pd-fraco">{v.n}</td>
              <td className="pd-forte">{v.cli}</td>
              <td className="pd-col-num sd-num">{v.itens}</td>
              <td>
                <span className="pd-pilula">{v.forma}</span>
              </td>
              <td className="pd-col-num sd-num pd-forte">{brl(v.v)}</td>
              <td className="pd-col-num sd-num">{v.m}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ==================================================== lista de clientes ===== */

const CLIENTES = [
  { nome: "Distribuidora Sul", total: 148900, dias: 3, estado: "ativo" },
  { nome: "Ateliê Norte", total: 96400, dias: 11, estado: "ativo" },
  { nome: "Marina Alves", total: 74200, dias: 1, estado: "ativo" },
  { nome: "Carla Menezes", total: 38700, dias: 46, estado: "risco" },
  { nome: "Bruno Tavares", total: 21500, dias: 92, estado: "inativo" },
];

const ROTULO_ESTADO = { ativo: "Ativo", risco: "Em risco", inativo: "Inativo" };

export function ListaClientes({ pele = "escura" }) {
  const [alvo, dentro] = useAoEntrar(0.25);
  const maior = Math.max(...CLIENTES.map((c) => c.total));

  return (
    <div className={`pd pd-${pele} pd-clientes`} ref={alvo}>
      <header className="pd-topo">
        <span className="pd-topo-titulo">Carteira de clientes</span>
        <span className="pd-topo-nota">248 cadastrados</span>
      </header>

      <div className="pd-segmentos">
        {[
          { r: "Ativos", n: 186, cls: "pos" },
          { r: "Em risco", n: 41, cls: "ate" },
          { r: "Inativos", n: 21, cls: "neg" },
        ].map((s, i) => (
          <div key={s.r} className="pd-segmento">
            <span className="pd-segmento-num sd-num">
              <Numero valor={s.n} de={0} ativo={dentro} duracao={800} atraso={i * 110} />
            </span>
            <span className="pd-segmento-rotulo">{s.r}</span>
            <span className={`pd-segmento-barra pd-segmento-${s.cls}`} aria-hidden="true" />
          </div>
        ))}
      </div>

      <ul className="pd-clientes-lista">
        {CLIENTES.map((c, i) => (
          <li key={c.nome} className="pd-cliente">
            <span className="pd-cliente-nome">{c.nome}</span>
            <span className="pd-cliente-barra" aria-hidden="true">
              <span
                className={`pd-cliente-preenche${dentro ? " pd-cliente-preenche-ativa" : ""}`}
                style={{ width: `${(c.total / maior) * 100}%`, transitionDelay: `${i * 80}ms` }}
              />
            </span>
            <span className="pd-cliente-total sd-num">{brl(c.total)}</span>
            <span className={`pd-estado pd-estado-${c.estado}`}>{ROTULO_ESTADO[c.estado]}</span>
            <span className="pd-cliente-dias sd-num">{c.dias}d</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ====================================================== faixa de estoque ===== */

const PRODUTOS = [
  { nome: "Camiseta Premium P", saldo: 27, min: 20, custo: 38.4 },
  { nome: "Camiseta Premium M", saldo: 12, min: 20, custo: 38.4 },
  { nome: "Moletom Linha Inverno", saldo: 64, min: 25, custo: 92.0 },
  { nome: "Boné Trucker", saldo: 8, min: 15, custo: 24.5 },
  { nome: "Caneca Cerâmica 400ml", saldo: 143, min: 40, custo: 11.9 },
];

export function FaixaEstoque({ pele = "clara" }) {
  const [alvo, dentro] = useAoEntrar(0.25);
  return (
    <div className={`pd pd-${pele} pd-estoque`} ref={alvo}>
      <header className="pd-topo">
        <span className="pd-topo-titulo">Produtos</span>
        <span className="pd-topo-nota">2 itens abaixo do mínimo</span>
      </header>
      <div className="pd-estoque-grade">
        {PRODUTOS.map((p, i) => {
          const abaixo = p.saldo < p.min;
          const pct = Math.min(100, (p.saldo / (p.min * 2.4)) * 100);
          return (
            <div key={p.nome} className={`pd-produto${abaixo ? " pd-produto-alerta" : ""}`}>
              <span className="pd-produto-nome">{p.nome}</span>
              <span className="pd-produto-saldo sd-num">
                {p.saldo}
                <span className="pd-produto-un">un.</span>
              </span>
              <span className="pd-produto-barra" aria-hidden="true">
                <span
                  className={`pd-produto-preenche${dentro ? " pd-produto-preenche-ativa" : ""}`}
                  style={{ width: `${pct}%`, transitionDelay: `${i * 70}ms` }}
                />
                <span className="pd-produto-minimo" style={{ left: `${(p.min / (p.min * 2.4)) * 100}%` }} />
              </span>
              <span className="pd-produto-nota">
                Mínimo {p.min} · custo {brl(p.custo, 2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================ DRE ===== */

const DRE = [
  { linha: "Receita bruta", v: 193220, forte: true },
  { linha: "Custo dos produtos", v: -78440 },
  { linha: "Lucro bruto", v: 114780, forte: true },
  { linha: "Despesas fixas", v: -41200 },
  { linha: "Despesas variáveis", v: -25900 },
  { linha: "Lucro líquido", v: 47680, forte: true, destaque: true },
];

export function TabelaDRE({ pele = "escura" }) {
  const [alvo, dentro] = useAoEntrar(0.25);
  return (
    <div className={`pd pd-${pele} pd-dre`} ref={alvo}>
      <header className="pd-topo">
        <span className="pd-topo-titulo">Demonstrativo do mês</span>
        <span className="pd-topo-nota">Junho · fechado</span>
      </header>
      <table className="pd-tabela pd-tabela-dre">
        <tbody>
          {DRE.map((d) => (
            <tr key={d.linha} className={d.destaque ? "pd-dre-destaque" : ""}>
              <td className={d.forte ? "pd-forte" : ""}>{d.linha}</td>
              <td className={`pd-col-num sd-num ${d.v < 0 ? "pd-negativo" : ""} ${d.forte ? "pd-forte" : ""}`}>
                {d.v < 0 ? `(${brl(Math.abs(d.v))})` : brl(d.v)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pd-dre-rodape">
        <span>Margem líquida</span>
        <span className="sd-num pd-forte">
          <Numero valor={24.7} de={0} decimais={1} ativo={dentro} duracao={900} />%
        </span>
      </div>
    </div>
  );
}

/* ============================================================= IA ===== */

const RESPOSTA =
  "Seu faturamento cresceu 12,4% em relação a maio, mas a margem líquida caiu 2,1 pontos. O impacto veio do custo de fornecedores, que subiu 18% no período. Os títulos a receber estão saudáveis: 86% dentro do prazo.";

const INDICADORES_IA = [
  { r: "Faturamento", v: "+12,4%", cls: "pos", apos: 40 },
  { r: "Margem líquida", v: "−2,1 p.p.", cls: "neg", apos: 96 },
  { r: "Custo de fornecedores", v: "+18%", cls: "neg", apos: 168 },
];

export function DialogoIA() {
  const [alvo, dentro] = useAoEntrar(0.3);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!dentro) return undefined;
    const reduz =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduz) {
      setN(RESPOSTA.length);
      return undefined;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setN(i);
      if (i >= RESPOSTA.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [dentro]);

  return (
    <div className="ia" ref={alvo}>
      <div className="ia-conversa">
        <div className="ia-pergunta">
          <span className="ia-quem">Você</span>
          <p>Como está minha empresa este mês?</p>
        </div>
        <div className="ia-resposta">
          <span className="ia-quem ia-quem-sistema">Sócio Digital</span>
          <p>
            {RESPOSTA.slice(0, n)}
            {n < RESPOSTA.length ? <span className="ia-cursor" aria-hidden="true" /> : null}
          </p>
        </div>
      </div>

      {/* Os indicadores aparecem conforme a frase os cita — só os citados. */}
      <div className="ia-indicadores">
        {INDICADORES_IA.map((ind) => (
          <div
            key={ind.r}
            className={`ia-indicador${n > ind.apos ? " ia-indicador-visivel" : ""}`}
          >
            <span className="ia-indicador-rotulo">{ind.r}</span>
            <span className={`ia-indicador-valor ia-indicador-${ind.cls}`}>{ind.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================== do pedido ao caixa ===== */

const ESTACOES = [
  { rotulo: "Pedido", artefato: "#4824", nota: "3 itens · a prazo" },
  { rotulo: "Estoque", artefato: "−1 un.", nota: "Camiseta Premium P" },
  { rotulo: "A receber", artefato: brl(8900), nota: "Vence em 30 dias" },
  { rotulo: "Caixa", artefato: "+ " + brl(8900), nota: "Projeção de 30 dias" },
  { rotulo: "Resultado", artefato: "+2,4%", nota: "Margem do mês" },
];

/**
 * O trilho é HORIZONTAL e ocupa a largura toda — deliberadamente diferente da
 * reação em cascata da seção 3, que é compacta e simultânea. Aqui o assunto é
 * o percurso: onde o dado nasce e onde ele termina.
 */
export function TrilhoPedido() {
  const [alvo, dentro] = useAoEntrar(0.3);
  const [ate, setAte] = useState(-1);

  useEffect(() => {
    if (!dentro) return undefined;
    const reduz =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduz) {
      setAte(ESTACOES.length - 1);
      return undefined;
    }
    const ts = ESTACOES.map((_, i) =>
      setTimeout(() => setAte((v) => Math.max(v, i)), 300 + i * 460)
    );
    return () => ts.forEach(clearTimeout);
  }, [dentro]);

  const progresso = ate < 0 ? 0 : (ate + 0.5) / (ESTACOES.length - 0.5);

  return (
    <div className="trilho" ref={alvo}>
      <div className="trilho-fio" aria-hidden="true">
        {/* progresso vai por variável CSS: no desktop o fio cresce em X,
            no celular ele vira vertical e cresce em Y. */}
        <span className="trilho-fio-ativo" style={{ "--p": Math.min(1, progresso) }} />
      </div>
      <ol className="trilho-estacoes">
        {ESTACOES.map((e, i) => (
          <li key={e.rotulo} className={`trilho-estacao${i <= ate ? " trilho-estacao-acesa" : ""}`}>
            <span className="trilho-marco" aria-hidden="true" />
            <span className="trilho-rotulo">{e.rotulo}</span>
            <span className="trilho-artefato sd-num">{e.artefato}</span>
            <span className="trilho-nota">{e.nota}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

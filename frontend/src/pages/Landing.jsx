import { lazy, Suspense, useRef } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/Icons";
import { useContador, useRevelar } from "@/lib/animacoes";

/**
 * A cena 3D carrega em um chunk separado (three.js é pesado). Enquanto ela
 * não chega, o hero exibe o fundo em degradê — nada quebra sem ela.
 */
const Scene3D = lazy(() => import("@/components/Scene3D"));

/**
 * As 12 funcionalidades exibidas ao visitante. Cada uma recebe uma cor
 * própria — a versão anterior mostrava tudo em cartões brancos iguais.
 */
const FUNCIONALIDADES = [
  {
    tone: "emerald",
    icon: "cart",
    titulo: "Frente de vendas (PDV)",
    texto:
      "Registre a venda em segundos: escolhe o produto, a forma de pagamento e pronto. O estoque baixa sozinho e o recebimento já entra no financeiro.",
    tag: "Módulo principal",
  },
  {
    tone: "blue",
    icon: "wallet",
    titulo: "Contas a receber",
    texto:
      "Cada venda a prazo vira parcela com vencimento. Você vê quem deve, quanto e quando — e dá baixa com um clique quando o dinheiro cai.",
    tag: "Financeiro",
  },
  {
    tone: "rose",
    icon: "arrowUpRight",
    titulo: "Contas a pagar",
    texto:
      "Aluguel, folha, fornecedor e imposto em uma agenda só. Despesas fixas se repetem automaticamente e o sistema avisa antes de vencer.",
    tag: "Financeiro",
  },
  {
    tone: "violet",
    icon: "bank",
    titulo: "Fluxo de caixa projetado",
    texto:
      "A curva do saldo dos próximos 90 dias, já considerando o que entra e o que sai. Se o caixa vai ficar negativo, o dia aparece marcado.",
    tag: "Previsão",
  },
  {
    tone: "amber",
    icon: "invoice",
    titulo: "Notas fiscais",
    texto:
      "Emita NF-e e NFS-e a partir da venda, com numeração sequencial, chave de acesso e histórico completo para o contador.",
    tag: "Fiscal",
  },
  {
    tone: "cyan",
    icon: "box",
    titulo: "Estoque inteligente",
    texto:
      "Saldo por produto, ponto de reposição e curva ABC. A IA aponta o que está parado, o que vai faltar e o que merece promoção.",
    tag: "Operação",
  },
  {
    tone: "teal",
    icon: "users",
    titulo: "Carteira de clientes",
    texto:
      "Histórico de compras, valor acumulado e tempo desde a última venda. O radar avisa quando um bom cliente some.",
    tag: "Relacionamento",
  },
  {
    tone: "midnight",
    icon: "doc",
    titulo: "DRE e relatórios",
    texto:
      "Receita, custo da mercadoria, despesas e lucro líquido mês a mês, com margem calculada. Sem montar planilha.",
    tag: "Gestão",
  },
  {
    tone: "emerald",
    icon: "robot",
    titulo: "Sócio de IA",
    texto:
      "Pergunte em português: “como foi a semana?”, “posso pagar o fornecedor agora?”. A resposta usa os dados reais da sua empresa.",
    tag: "Diferencial",
  },
  {
    tone: "blue",
    icon: "whatsapp",
    titulo: "Avisos no WhatsApp",
    texto:
      "Resumo diário e alertas imediatos direto no celular. Você não precisa abrir o sistema para saber que algo saiu do lugar.",
    tag: "Diferencial",
  },
  {
    tone: "violet",
    icon: "radar",
    titulo: "Radar de problemas",
    texto:
      "Queda de vendas, estoque no limite, cliente inativo, título vencido: o sistema procura o problema antes de você.",
    tag: "Diferencial",
  },
  {
    tone: "slate",
    icon: "link",
    titulo: "Integrações",
    texto:
      "Conexão com a Conta Azul via OAuth para importar o financeiro, além de webhooks para plugar outros sistemas que você já usa.",
    tag: "Conectado",
  },
];

const MODULOS = [
  { icon: "cart", cor: "linear-gradient(135deg,#059669,#10b981)", nome: "Vendas", desc: "PDV, pedidos, formas de pagamento e parcelamento." },
  { icon: "wallet", cor: "linear-gradient(135deg,#1d4ed8,#3b82f6)", nome: "Financeiro", desc: "Receber, pagar, fluxo de caixa e DRE." },
  { icon: "invoice", cor: "linear-gradient(135deg,#b45309,#f59e0b)", nome: "Fiscal", desc: "NF-e e NFS-e com histórico e cancelamento." },
  { icon: "box", cor: "linear-gradient(135deg,#0e7490,#06b6d4)", nome: "Estoque", desc: "Saldo, custo, reposição e produtos parados." },
  { icon: "users", cor: "linear-gradient(135deg,#0d9488,#14b8a6)", nome: "Clientes", desc: "Carteira, recorrência e clientes em risco." },
  { icon: "gauge", cor: "linear-gradient(135deg,#6d28d9,#a855f7)", nome: "Painel", desc: "Indicadores do mês, metas e projeção." },
  { icon: "robot", cor: "linear-gradient(135deg,#0a1128,#1e3a8a)", nome: "Assistente", desc: "Conversa com IA sobre os seus números." },
  { icon: "gear", cor: "linear-gradient(135deg,#334155,#64748b)", nome: "Configurações", desc: "Empresa, avisos e integrações." },
];

const DORES = [
  ["Queda nas vendas sem aviso", "Radar acompanha e avisa no mesmo dia"],
  ["Não saber o lucro real", "Lucro por venda e DRE em tempo real"],
  ["Descobrir o problema no fim do mês", "Monitoramento contínuo, alerta imediato"],
  ["Estoque acaba na hora errada", "Previsão de ruptura por produto"],
  ["Cliente bom que parou de comprar", "Radar de clientes inativos"],
  ["Relatório demais, resposta de menos", "Pergunta em linguagem natural"],
];

const METRICAS = [
  { valor: 8, sufixo: "", rotulo: "módulos integrados" },
  { valor: 90, sufixo: " dias", rotulo: "de caixa projetado" },
  { valor: 24, sufixo: "/7", rotulo: "radar monitorando" },
  { valor: 0, sufixo: "", rotulo: "planilha necessária" },
];

/* ---------------------------------------------------------- auxiliares */

/** Envolve um bloco com a animação de entrada por rolagem. */
function Revelar({ children, atraso = 0, variante = "sobe", className = "" }) {
  const [ref, visivel] = useRevelar();
  return (
    <div
      ref={ref}
      className={`revelar revelar-${variante} ${visivel ? "visivel" : ""} ${className}`}
      style={{ transitionDelay: `${atraso}ms` }}
    >
      {children}
    </div>
  );
}

/** Número do hero que sobe de 0 até o valor final quando entra na tela. */
function Metrica({ valor, sufixo, rotulo }) {
  const [ref, visivel] = useRevelar();
  const atual = useContador(valor, { ativo: visivel });
  return (
    <div className="lp-metric" ref={ref}>
      <b className="num">
        {Math.round(atual)}
        {sufixo}
      </b>
      <span>{rotulo}</span>
    </div>
  );
}

/* -------------------------------------------------------------- página */

export default function Landing() {
  const hero = useRef(null);

  return (
    <div className="lp-root">
      {/* A cena 3D fica fixa atrás do conteúdo do topo. */}
      <Suspense fallback={<div className="cena3d-fallback" aria-hidden="true" />}>
        <Scene3D alvoRolagem={hero} />
      </Suspense>

      <nav className="lp-nav">
        <div className="row" style={{ gap: 9 }}>
          <span
            style={{
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(135deg,#10b981,#3b82f6)",
              display: "grid", placeItems: "center", color: "#04122a",
              fontWeight: 700, fontFamily: "Outfit, sans-serif",
            }}
          >
            SD
          </span>
          <b style={{ fontFamily: "Outfit, sans-serif" }}>Sócio Digital</b>
        </div>
        <div className="spacer" />
        <Link to="/login" className="btn btn-ghost btn-sm">Entrar</Link>
        <Link to="/cadastro" className="btn btn-primary btn-sm">Criar conta grátis</Link>
      </nav>

      {/* ------------------------------------------------------------ hero */}
      <header className="lp-hero lp-hero-3d" ref={hero}>
        <div className="lp-wrap">
          <div className="lp-hero-texto">
            <Revelar variante="fade">
              <span className="lp-pill">
                <Icon name="sparkles" size={14} /> ERP completo + assistente de IA
              </span>
            </Revelar>

            <Revelar atraso={90}>
              <h1>
                Um ERP que faz a gestão <em>e um sócio que avisa</em> quando algo sai do lugar.
              </h1>
            </Revelar>

            <Revelar atraso={180}>
              <p className="lead">
                Vendas, contas a receber, contas a pagar, notas fiscais, estoque e fluxo de caixa
                em um só lugar — com uma IA que lê os seus números todos os dias e fala com você
                em português.
              </p>
            </Revelar>

            <Revelar atraso={260}>
              <div className="row row-wrap" style={{ gap: 11 }}>
                <Link to="/cadastro" className="btn btn-primary btn-lg">
                  <Icon name="bolt" size={17} /> Começar agora
                </Link>
                <Link
                  to="/login"
                  className="btn btn-ghost btn-lg"
                  style={{ background: "rgba(255,255,255,.1)", color: "#fff", borderColor: "rgba(255,255,255,.28)" }}
                >
                  Ver demonstração
                </Link>
              </div>
            </Revelar>
          </div>

          <div className="lp-metrics">
            {METRICAS.map((m) => (
              <Metrica key={m.rotulo} valor={m.valor} sufixo={m.sufixo} rotulo={m.rotulo} />
            ))}
          </div>

          <div className="lp-scroll-dica" aria-hidden="true">
            <span>role para explorar</span>
            <i />
          </div>
        </div>
      </header>

      {/* --------------------------------------------- funcionalidades */}
      <section className="lp-section tinted">
        <div className="lp-wrap">
          <Revelar>
            <div className="lp-eyebrow">Funcionalidades</div>
            <h2 className="lp-h2">Tudo o que um ERP precisa ter — e o que nenhum deles faz</h2>
            <p className="lp-sub">
              As primeiras oito colunas você reconhece de qualquer sistema de gestão. As quatro
              últimas são o motivo de o Sócio Digital existir.
            </p>
          </Revelar>

          <div className="feat-grid">
            {FUNCIONALIDADES.map((f, i) => (
              <Revelar key={f.titulo} atraso={(i % 3) * 90}>
                <article className={`feat f-${f.tone}`}>
                  <span className="fi"><Icon name={f.icon} size={20} /></span>
                  <h4>{f.titulo}</h4>
                  <p>{f.texto}</p>
                  <span className="tag">{f.tag}</span>
                </article>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ módulos */}
      <section className="lp-section white">
        <div className="lp-wrap">
          <Revelar>
            <div className="lp-eyebrow">Módulos</div>
            <h2 className="lp-h2">Oito áreas, um sistema só</h2>
            <p className="lp-sub">
              Você entra pela tela de vendas — que é onde o dia começa — e o resto do sistema é
              alimentado automaticamente a partir dali.
            </p>
          </Revelar>
          <div className="mod-grid">
            {MODULOS.map((m, i) => (
              <Revelar key={m.nome} atraso={(i % 4) * 70} variante="escala">
                <div className="mod">
                  <span className="mi" style={{ background: m.cor }}><Icon name={m.icon} size={17} /></span>
                  <b>{m.nome}</b>
                  <span>{m.desc}</span>
                </div>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- dores */}
      <section className="lp-section tinted">
        <div className="lp-wrap">
          <Revelar>
            <div className="lp-eyebrow">O problema real</div>
            <h2 className="lp-h2">O empresário não precisa de mais relatório. Precisa de aviso.</h2>
          </Revelar>
          <Revelar atraso={120}>
            <table className="cmp-table">
              <thead>
                <tr>
                  <th style={{ width: "45%" }}>A dor do dia a dia</th>
                  <th className="hi">Como o Sócio Digital resolve</th>
                </tr>
              </thead>
              <tbody>
                {DORES.map(([dor, solucao]) => (
                  <tr key={dor}>
                    <td>{dor}</td>
                    <td className="hi">{solucao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Revelar>
        </div>
      </section>

      {/* ----------------------------------------------------------- CTA */}
      <section className="lp-section white">
        <div className="lp-wrap">
          <Revelar variante="escala">
            <div className="lp-cta">
              <h2 style={{ fontSize: 30, maxWidth: 640, lineHeight: 1.16 }}>
                Comece pela tela de vendas. O resto o sistema preenche sozinho.
              </h2>
              <p style={{ color: "#b9c8e6", fontSize: 15.5, maxWidth: 580, margin: "14px 0 24px", lineHeight: 1.6 }}>
                Conta de demonstração já vem com produtos, clientes, vendas, títulos e notas para
                você navegar por tudo antes de cadastrar a sua empresa.
              </p>
              <div className="row row-wrap" style={{ gap: 11 }}>
                <Link to="/cadastro" className="btn btn-primary btn-lg">Criar conta grátis</Link>
                <Link
                  to="/login"
                  className="btn btn-ghost btn-lg"
                  style={{ background: "rgba(255,255,255,.1)", color: "#fff", borderColor: "rgba(255,255,255,.28)" }}
                >
                  Entrar na demonstração
                </Link>
              </div>
            </div>
          </Revelar>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap row row-wrap">
          <span>Sócio Digital — assistente executivo com IA para pequenas empresas.</span>
          <span className="spacer">Versão 5.0</span>
        </div>
      </footer>
    </div>
  );
}

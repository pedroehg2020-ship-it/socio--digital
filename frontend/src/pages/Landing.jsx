/**
 * Página pública.
 *
 * As seções 1 a 11 são a reconstrução nova: faixas de cor alternadas, com o
 * próprio produto servindo de elemento visual. As seções 12 a 18 continuam
 * NO AR com o conteúdo e os blocos atuais até serem redesenhadas — a página
 * nunca fica incompleta enquanto a reconstrução avança.
 *
 * Regra estrutural: em toda seção, texto e visual ocupam faixas diferentes do
 * grid. Nenhum elemento usa posicionamento absoluto para cruzar a coluna do
 * texto, e não há camada escura atrás de letra em lugar nenhum.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/Icons";
import Numero from "@/components/landing/Numero";
import {
  DialogoIA,
  FaixaEstoque,
  GraficoCaixa,
  ListaClientes,
  PainelComando,
  ReacaoVenda,
  TabelaDRE,
  TabelaVendas,
  TrilhoPedido,
  useAoEntrar,
} from "@/components/landing/Produto";
import {
  AudienceCard,
  BenefitCard,
  CTASection,
  FAQ,
  SectionHeader,
  StepCard,
} from "@/components/landing/Blocos";
import Rodape from "@/components/landing/Rodape";
import {
  BENEFICIOS,
  FUNCIONALIDADES,
  PASSOS,
  PERGUNTAS,
  PILARES,
  PUBLICO,
  SEGURANCA,
} from "@/data/landing";
import "@/styles/landing.css";

const modulo = (id) => FUNCIONALIDADES.find((f) => f.id === id) || {};

/* =================================================== 1 · header ===== */

function Header() {
  const [fixo, setFixo] = useState(false);
  useEffect(() => {
    const aoRolar = () => setFixo(window.scrollY > 8);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header className={`lp-topo${fixo ? " lp-topo-fixo" : ""}`}>
      <div className="sd-container lp-topo-interno">
        <Link className="lp-marca" to="/">
          <span className="lp-marca-simbolo" aria-hidden="true" />
          Sócio Digital
        </Link>

        <nav className="lp-nav" aria-label="Seções do site">
          <a className="lp-link" href="#plataforma">Plataforma</a>
          <a className="lp-link" href="#financeiro">Financeiro</a>
          <a className="lp-link" href="#ia">Inteligência</a>
          <a className="lp-link" href="#faq">Dúvidas</a>
        </nav>

        <div className="lp-topo-acoes">
          <Link className="lp-link" to="/login">Entrar</Link>
          <Link className="sd-btn sd-btn-principal" to="/cadastro">Começar agora</Link>
        </div>
      </div>
    </header>
  );
}

/* ===================================================== 2 · hero ===== */

function Hero() {
  const [alvo, dentro] = useAoEntrar(0.05);
  return (
    <section className="sd-faixa sd-faixa-abismo hero" aria-labelledby="hero-titulo">
      <div className="sd-container">
        <div className="sd-grid hero-grid" ref={alvo}>
          <div className="hero-texto">
            <p className="sd-olho">Gestão + inteligência</p>
            <h1 id="hero-titulo" className="sd-h1">
              Sua empresa inteira.
              <br />
              Uma única inteligência.
            </h1>
            <p className="sd-lead">
              Financeiro, vendas, clientes e estoque trabalhando juntos em um só
              sistema — com uma camada de análise que lê os seus números e diz o
              que mudou.
            </p>
            <div className="hero-acoes">
              <Link className="sd-btn sd-btn-principal" to="/cadastro">Começar agora</Link>
              <Link className="sd-btn sd-btn-secundario" to="/login">Conhecer a plataforma</Link>
            </div>
            <p className="sd-nota">Conta de demonstração pronta. Sem cartão de crédito.</p>
          </div>

          <div className="hero-produto" aria-hidden="true">
            <PainelComando ativo={dentro} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ======================================= 3 · prova de integração ===== */

function Integracao() {
  return (
    <section className="sd-faixa sd-faixa-teal integracao" aria-labelledby="integracao-titulo">
      <div className="sd-container">
        <div className="secao-cabeca secao-cabeca-centro">
          <p className="sd-olho">Dados conectados</p>
          <h2 id="integracao-titulo" className="sd-h2">
            Uma venda. Quatro consequências automáticas.
          </h2>
          <p className="sd-lead">
            Registrar é o único passo manual. O resto o sistema recalcula na
            mesma hora, na ordem em que as informações dependem umas das outras.
          </p>
        </div>
        <ReacaoVenda />
      </div>
    </section>
  );
}

/* ================================ 4 · visão geral da plataforma ===== */

function Plataforma() {
  return (
    <section id="plataforma" className="sd-faixa sd-faixa-clara plataforma" aria-labelledby="plataforma-titulo">
      <div className="sd-container">
        <div className="secao-cabeca">
          <p className="sd-olho">A plataforma</p>
          <h2 id="plataforma-titulo" className="sd-h2">
            Oito módulos, um banco de dados só.
          </h2>
          <p className="sd-lead">
            Nada de exportar de um lugar para importar em outro. O que muda em
            um módulo já está mudado nos outros.
          </p>
        </div>

        {/* Grade separada por filete, sem cartão. */}
        <div className="modulos">
          {FUNCIONALIDADES.map((f) => (
            <a key={f.id} className="modulo" href={`#${f.id}`}>
              <span className="modulo-icone"><Icon name={f.icone} size={18} /></span>
              <span className="modulo-nome">{f.sobretitulo}</span>
              <span className="modulo-frase">{f.frase}</span>
            </a>
          ))}
          <div className="modulo modulo-ia">
            <span className="modulo-icone"><Icon name="bolt" size={18} /></span>
            <span className="modulo-nome">Inteligência</span>
            <span className="modulo-frase">A leitura dos seus números, em português.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================ 5 · financeiro ===== */

function Financeiro() {
  const f = modulo("financeiro");
  const [alvo, dentro] = useAoEntrar(0.2);
  return (
    <section id="financeiro" className="sd-faixa sd-faixa-base financeiro" aria-labelledby="financeiro-titulo">
      <div className="sd-container">
        <div className="sd-grid financeiro-grid" ref={alvo}>
          <div className="financeiro-texto">
            <p className="sd-olho">{f.sobretitulo}</p>
            <h2 id="financeiro-titulo" className="sd-h2">{f.titulo}</h2>
            <p className="sd-lead">{f.frase}</p>
            <ul className="lista-marcada">
              {(f.beneficios || []).map((b) => (
                <li key={b}><Icon name="check" size={14} />{b}</li>
              ))}
            </ul>
          </div>

          <div className="financeiro-visual">
            <div className="pd pd-escura">
              <header className="pd-topo">
                <span className="pd-topo-titulo">Entradas e saídas</span>
                <span className="pd-topo-nota">Últimos 6 meses</span>
              </header>
              <div className="pd-corpo">
                <GraficoCaixa ativo={dentro} />
                <div className="pd-legenda">
                  <span><i className="pd-chave pd-chave-entrada" />Entradas</span>
                  <span><i className="pd-chave pd-chave-saida" />Saídas</span>
                  <span><i className="pd-chave pd-chave-saldo" />Saldo acumulado</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Faixa de indicadores de largura total, abaixo do gráfico. */}
        <div className="financeiro-faixa">
          {[
            { r: "A receber", v: 128400, n: "18 títulos em aberto" },
            { r: "A pagar", v: 76900, n: "11 compromissos" },
            { r: "Vencido", v: 9350, n: "2 títulos", alerta: true },
            { r: "Saldo projetado", v: 74850, n: "Em 30 dias" },
          ].map((k, i) => (
            <div key={k.r} className={`financeiro-kpi${k.alerta ? " financeiro-kpi-alerta" : ""}`}>
              <span className="financeiro-kpi-rotulo">{k.r}</span>
              <span className="financeiro-kpi-valor">
                <Numero valor={k.v} de={0} moeda ativo={dentro} duracao={900} atraso={i * 100} />
              </span>
              <span className="sd-nota">{k.n}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==================================================== 6 · vendas ===== */

function Vendas() {
  const f = modulo("vendas");
  return (
    <section id="vendas" className="sd-faixa sd-faixa-clara vendas" aria-labelledby="vendas-titulo">
      <div className="sd-container">
        {/* Empilhada, não em duas colunas: título estreito e tabela larga. */}
        <div className="secao-cabeca secao-cabeca-centro">
          <p className="sd-olho">{f.sobretitulo}</p>
          <h2 id="vendas-titulo" className="sd-h2">{f.titulo}</h2>
          <p className="sd-lead">{f.texto}</p>
        </div>
        <TabelaVendas pele="clara" />
        <ul className="lista-inline">
          {(f.beneficios || []).map((b) => (
            <li key={b}><Icon name="check" size={14} />{b}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ================================================== 7 · clientes ===== */

function Clientes() {
  const f = modulo("clientes");
  return (
    <section id="clientes" className="sd-faixa sd-faixa-azul clientes" aria-labelledby="clientes-titulo">
      <div className="sd-container">
        {/* Espelhada: visual à esquerda, texto à direita. */}
        <div className="sd-grid clientes-grid">
          <div className="clientes-visual">
            <ListaClientes pele="escura" />
          </div>
          <div className="clientes-texto">
            <p className="sd-olho">{f.sobretitulo}</p>
            <h2 id="clientes-titulo" className="sd-h2">{f.titulo}</h2>
            <p className="sd-lead">{f.frase}</p>
            <ul className="lista-marcada">
              {(f.beneficios || []).map((b) => (
                <li key={b}><Icon name="check" size={14} />{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =================================================== 8 · estoque ===== */

function Estoque() {
  const f = modulo("estoque");
  return (
    <section id="estoque" className="sd-faixa sd-faixa-clara estoque" aria-labelledby="estoque-titulo">
      <div className="sd-container">
        <div className="secao-cabeca">
          <p className="sd-olho">{f.sobretitulo}</p>
          <h2 id="estoque-titulo" className="sd-h2">{f.titulo}</h2>
          <p className="sd-lead">{f.texto}</p>
        </div>
        <FaixaEstoque pele="clara" />
      </div>
    </section>
  );
}

/* =============================================== 9 · relatórios ===== */

function Relatorios() {
  const f = modulo("relatorios");
  const [alvo, dentro] = useAoEntrar(0.2);
  return (
    <section id="relatorios" className="sd-faixa sd-faixa-teal relatorios" aria-labelledby="relatorios-titulo">
      <div className="sd-container">
        <div className="secao-cabeca">
          <p className="sd-olho">{f.sobretitulo}</p>
          <h2 id="relatorios-titulo" className="sd-h2">{f.titulo}</h2>
        </div>

        {/* Dois terços de tabela, um terço de indicadores. */}
        <div className="sd-grid relatorios-grid" ref={alvo}>
          <div className="relatorios-tabela">
            <TabelaDRE pele="escura" />
          </div>
          <div className="relatorios-lado">
            <p className="sd-lead">{f.frase}</p>
            {[
              { r: "Ticket médio", v: 1874, moeda: true, d: "+4,2% vs. maio" },
              { r: "Margem bruta", v: 59.4, dec: 1, sufixo: "%", d: "Estável" },
              { r: "Custo por venda", v: 683, moeda: true, d: "+18% vs. maio" },
            ].map((k, i) => (
              <div key={k.r} className="relatorios-kpi">
                <span className="relatorios-kpi-rotulo">{k.r}</span>
                <span className="relatorios-kpi-valor">
                  <Numero
                    valor={k.v}
                    de={0}
                    moeda={k.moeda}
                    decimais={k.dec || 0}
                    ativo={dentro}
                    duracao={900}
                    atraso={i * 120}
                  />
                  {k.sufixo}
                </span>
                <span className="sd-nota">{k.d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================================================= 10 · IA ===== */

function Inteligencia() {
  return (
    <section id="ia" className="sd-faixa sd-faixa-abismo ia-secao" aria-labelledby="ia-titulo">
      <div className="sd-container">
        <div className="secao-cabeca secao-cabeca-centro">
          <p className="sd-olho">Inteligência</p>
          <h2 id="ia-titulo" className="sd-h2">
            Pergunte em português. A resposta vem com os números.
          </h2>
          <p className="sd-lead">
            A camada de análise lê o que já está no sistema — vendas, títulos,
            custos e estoque — e responde com o dado que sustenta a frase.
          </p>
        </div>
        <DialogoIA />
      </div>
    </section>
  );
}

/* ========================================= 11 · do pedido ao caixa ===== */

function PedidoAoCaixa() {
  return (
    <section className="sd-faixa sd-faixa-clara pedido" aria-labelledby="pedido-titulo">
      <div className="sd-container">
        <div className="secao-cabeca">
          <p className="sd-olho">Do pedido ao caixa</p>
          <h2 id="pedido-titulo" className="sd-h2">
            Onde o dado nasce e onde ele termina.
          </h2>
          <p className="sd-lead">
            O mesmo registro atravessa cinco áreas da empresa sem ninguém
            redigitar nada. Este é o caminho completo de uma venda.
          </p>
        </div>
        <TrilhoPedido />
      </div>
    </section>
  );
}

/* ============================ 12 a 18 · ainda com o layout atual ===== */

/**
 * Estas seções continuam funcionais com os blocos existentes até serem
 * redesenhadas. Ficam em faixa escura para não quebrar o ritmo de cor da
 * página nova.
 */
function SecoesPendentes() {
  return (
    <>
      <section id="como-funciona" className="sd-faixa sd-faixa-base secao-legada">
        <div className="sd-container">
          <SectionHeader
            sobretitulo="Como funciona"
            titulo="Da conta criada ao primeiro lançamento"
            texto="Três passos e o sistema começa a se alimentar sozinho."
          />
          <div className="legado-grade legado-grade-3">
            {PASSOS.map((p) => (
              <StepCard key={p.numero} {...p} />
            ))}
          </div>
        </div>
      </section>

      <section id="beneficios" className="sd-faixa sd-faixa-clara secao-legada">
        <div className="sd-container">
          <SectionHeader sobretitulo="Benefícios" titulo="O que muda no seu dia" />
          <div className="legado-grade legado-grade-3">
            {BENEFICIOS.map((b) => (
              <BenefitCard key={b.titulo} {...b} />
            ))}
          </div>
        </div>
      </section>

      <section id="para-quem" className="sd-faixa sd-faixa-azul secao-legada">
        <div className="sd-container">
          <SectionHeader sobretitulo="Para quem é" titulo="Feito para empresa pequena que quer crescer organizada" />
          <div className="legado-grade legado-grade-3">
            {PUBLICO.map((p) => (
              <AudienceCard key={p.titulo} {...p} />
            ))}
          </div>
        </div>
      </section>

      <section id="seguranca" className="sd-faixa sd-faixa-base secao-legada">
        <div className="sd-container">
          <SectionHeader sobretitulo="Segurança" titulo="Os seus dados são seus" />
          <div className="legado-grade legado-grade-3">
            {SEGURANCA.map((s) => (
              <BenefitCard key={s.titulo} {...s} />
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="sd-faixa sd-faixa-clara secao-legada">
        <div className="sd-container">
          <SectionHeader sobretitulo="Dúvidas" titulo="Perguntas frequentes" centralizado />
          <div className="legado-faq">
            <FAQ itens={PERGUNTAS} />
          </div>
        </div>
      </section>

      <section id="cta" className="sd-faixa sd-faixa-cta secao-legada">
        <div className="sd-container">
          <CTASection />
        </div>
      </section>
    </>
  );
}

/* ==================================================== a página ===== */

export default function Landing() {
  return (
    <div className="sd">
      <Header />
      <main>
        <Hero />
        <Integracao />
        <Plataforma />
        <Financeiro />
        <Vendas />
        <Clientes />
        <Estoque />
        <Relatorios />
        <Inteligencia />
        <PedidoAoCaixa />
        <SecoesPendentes />
      </main>
      <Rodape />
    </div>
  );
}

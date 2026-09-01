import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/Icons";
import Cabecalho from "@/components/landing/Cabecalho";
import Rodape from "@/components/landing/Rodape";
import Slot3D from "@/components/landing/Slot3D";
import {
  AudienceCard,
  BenefitCard,
  CTASection,
  FAQ,
  FeatureSection,
  Revelar,
  SectionHeader,
  StepCard,
} from "@/components/landing/Blocos";
import { temWebGL } from "@/components/landing/palco";
import {
  BENEFICIOS,
  FUNCIONALIDADES,
  INDICADORES,
  PASSOS,
  PERGUNTAS,
  PILARES,
  PUBLICO,
  SEGURANCA,
} from "@/data/landing";
import { useContador, useRevelar } from "@/lib/animacoes";
import "@/styles/landing.css";

/**
 * O palco 3D (three.js + React Three Fiber) sai em um chunk separado e só é
 * baixado quando o dispositivo tem WebGL. Em quem não tem, a página cai no
 * fallback em CSS dos próprios slots e nem chega a pedir o arquivo.
 */
const Palco3D = lazy(() => import("@/components/landing/Palco3D"));

/** Sequência de fundos das seções de funcionalidade. */
const FUNDOS_FEATURE = ["noite", "tinta", "abismo", "tinta", "noite", "abismo", "tinta", "noite"];

/** Indicador do hero: o número sobe de zero quando entra na tela. */
function Indicador({ valor, sufixo, rotulo }) {
  const [ref, visivel] = useRevelar();
  const atual = useContador(valor, { ativo: visivel });
  return (
    <div className="lp-indicador" ref={ref}>
      <b className="num">
        {Math.round(atual)}
        {sufixo}
      </b>
      <span>{rotulo}</span>
    </div>
  );
}

export default function Landing() {
  const [ativo3d, setAtivo3d] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setAtivo3d(temWebGL());
    setMontado(true);
  }, []);

  // Rolagem suave nas âncoras do menu.
  useEffect(() => {
    const anterior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = anterior;
    };
  }, []);

  const classes = useMemo(
    () => `lp-root ${montado && !ativo3d ? "sem-3d" : ""}`,
    [montado, ativo3d]
  );

  return (
    <div className={classes}>
      {ativo3d ? (
        <Suspense fallback={null}>
          <Palco3D />
        </Suspense>
      ) : null}

      <Cabecalho />

      {/* ---------------------------------------------------------- hero */}
      <section className="lp-hero">
        <div className="lp-wrap">
          <div className="lp-hero-grade">
            <div className="lp-hero-texto">
              <Revelar variante="fade">
                <span className="lp-selo">
                  <Icon name="sparkles" size={14} /> Gestão + assistente executivo de IA
                </span>
              </Revelar>

              <Revelar atraso={80}>
                <h1>
                  Um sistema que organiza a empresa <em>e um sócio que avisa</em> quando
                  algo sai do lugar.
                </h1>
              </Revelar>

              <Revelar atraso={150}>
                <p className="lp-lead">
                  Vendas, contas a receber, contas a pagar, estoque, clientes e fluxo de
                  caixa em um lugar só — com uma IA que lê os seus números e fala com
                  você em português.
                </p>
              </Revelar>

              <Revelar atraso={220}>
                <div className="lp-botoes">
                  <Link to="/cadastro" className="lp-btn lp-btn-principal lp-btn-lg">
                    <Icon name="bolt" size={17} /> Criar conta grátis
                  </Link>
                  <Link to="/login" className="lp-btn lp-btn-vidro lp-btn-lg">
                    Ver a demonstração
                  </Link>
                </div>
              </Revelar>

              <Revelar atraso={280}>
                <ul className="lp-confianca">
                  <li>
                    <Icon name="check" size={14} /> Sem cartão de crédito
                  </li>
                  <li>
                    <Icon name="check" size={14} /> Conta de demonstração pronta
                  </li>
                  <li>
                    <Icon name="check" size={14} /> Funciona no celular
                  </li>
                </ul>
              </Revelar>
            </div>

            <Revelar variante="escala" atraso={120} className="lp-hero-visual">
              <Slot3D chave="hero" icone="gauge" altura="alta" />
            </Revelar>
          </div>

          <div className="lp-indicadores">
            {INDICADORES.map((m) => (
              <Indicador key={m.rotulo} valor={m.valor} sufixo={m.sufixo} rotulo={m.rotulo} />
            ))}
          </div>
        </div>

        <span className="lp-dica-rolagem" aria-hidden="true">
          <i />
        </span>
      </section>

      {/* ------------------------------------------------- visão geral */}
      <section id="funcionalidades" className="lp-secao fundo-tinta">
        <span className="lp-grade" aria-hidden="true" />
        <div className="lp-wrap">
          <SectionHeader
            centralizado
            sobretitulo="A plataforma"
            titulo="Tudo que a sua empresa precisa em um só lugar"
            texto="Três camadas que trabalham sobre a mesma base de dados: o que você faz no dia, o dinheiro que isso movimenta e a leitura de negócio em cima dos dois."
          />
          <div className="lp-pilares">
            {PILARES.map((p, i) => (
              <Revelar key={p.titulo} atraso={i * 90} variante="escala">
                <article className="lp-pilar">
                  <span className="lp-pilar-icone">
                    <Icon name={p.icone} size={20} />
                  </span>
                  <h3>{p.titulo}</h3>
                  <p>{p.texto}</p>
                </article>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- funcionalidades em seções */}
      {/* Cada funcionalidade recebe um fundo da sequência: noite, tinta e
          abismo se alternam para que duas seções vizinhas nunca tenham o mesmo
          tratamento. "abismo" marca os momentos de maior impacto. */}
      {FUNCIONALIDADES.map((f, i) => (
        <FeatureSection key={f.id} {...f} fundo={FUNDOS_FEATURE[i % FUNDOS_FEATURE.length]} />
      ))}

      {/* ------------------------------------------------------ painel */}
      <section id="painel" className="lp-secao fundo-abismo lp-painel-secao">
        <span className="lp-grade" aria-hidden="true" />
        <div className="lp-wrap">
          <div className="lp-feature-grade invertida">
            <div className="lp-feature-texto">
              <Revelar variante="fade">
                <div className="lp-sobretitulo">
                  <Icon name="gauge" size={14} /> Painel geral
                </div>
              </Revelar>
              <Revelar atraso={70}>
                <h2 className="lp-h2">A empresa inteira em uma tela só.</h2>
              </Revelar>
              <Revelar atraso={130}>
                <p className="lp-texto">
                  O painel junta o que os módulos produziram: receita e lucro do período,
                  tendência das últimas semanas, progresso da meta, total a receber e a
                  pagar da semana, títulos vencidos e produtos abaixo do mínimo. É a
                  primeira tela para quem quer saber, em trinta segundos, se o mês está
                  de pé.
                </p>
              </Revelar>
              <Revelar atraso={190}>
                <ul className="lp-beneficios">
                  <li>
                    <Icon name="check" size={15} />
                    <span>Receita, lucro bruto e lucro líquido do período</span>
                  </li>
                  <li>
                    <Icon name="check" size={15} />
                    <span>Curva diária de receita e de pedidos</span>
                  </li>
                  <li>
                    <Icon name="check" size={15} />
                    <span>Vencimentos da semana e títulos em atraso</span>
                  </li>
                  <li>
                    <Icon name="check" size={15} />
                    <span>Reposição de estoque e clientes inativos</span>
                  </li>
                </ul>
              </Revelar>
            </div>

            <Revelar variante="escala" atraso={120} className="lp-feature-visual">
              <Slot3D chave="dashboard" icone="gauge" altura="media" />
            </Revelar>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ como funciona */}
      <section id="como-funciona" className="lp-secao fundo-noite">
        <span className="lp-grade" aria-hidden="true" />
        <div className="lp-wrap">
          <SectionHeader
            centralizado
            sobretitulo="Como funciona"
            titulo="Três passos até o primeiro número no painel"
            texto="Nenhum deles exige consultor, migração de planilha ou treinamento."
          />
          <div className="lp-passos">
            {PASSOS.map((p, i) => (
              <Revelar key={p.numero} atraso={i * 110}>
                <StepCard {...p} />
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- benefícios */}
      <section id="beneficios" className="lp-secao fundo-claro">
        <div className="lp-wrap">
          <SectionHeader
            centralizado
            sobretitulo="Benefícios"
            titulo="O que muda na rotina de quem toca o negócio"
          />
          <div className="lp-beneficios-grade">
            {BENEFICIOS.map((b, i) => (
              <Revelar key={b.titulo} atraso={(i % 3) * 90} variante="escala">
                <BenefitCard {...b} />
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- para quem */}
      <section id="para-quem" className="lp-secao fundo-noite">
        <span className="lp-grade" aria-hidden="true" />
        <div className="lp-wrap">
          <SectionHeader
            centralizado
            sobretitulo="Para quem é"
            titulo="Feito para empresa pequena de verdade"
            texto="Quem tem uma equipe de gestão dedicada já tem ERP. O Sócio Digital é para quem acumula a operação e a decisão na mesma pessoa."
          />
          <div className="lp-publicos">
            {PUBLICO.map((p, i) => (
              <Revelar key={p.titulo} atraso={(i % 3) * 80}>
                <AudienceCard {...p} />
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ segurança */}
      <section id="seguranca" className="lp-secao fundo-abismo">
        <span className="lp-grade" aria-hidden="true" />
        <div className="lp-wrap">
          <div className="lp-feature-grade">
            <div className="lp-feature-texto">
              <Revelar variante="fade">
                <div className="lp-sobretitulo">
                  <Icon name="shield" size={14} /> Segurança
                </div>
              </Revelar>
              <Revelar atraso={70}>
                <h2 className="lp-h2">Os seus dados ficam separados e a sua senha, ilegível.</h2>
              </Revelar>
              <Revelar atraso={120}>
                <p className="lp-texto">
                  Abaixo está o que o sistema faz hoje, descrito sem eufemismo. Não há
                  certificação de terceiro a exibir — quando houver, ela aparece aqui.
                </p>
              </Revelar>

              <div className="lp-seguranca-lista">
                {SEGURANCA.map((s, i) => (
                  <Revelar key={s.titulo} atraso={150 + i * 80}>
                    <article className="lp-seguranca-item">
                      <span>
                        <Icon name={s.icone} size={17} />
                      </span>
                      <div>
                        <h3>{s.titulo}</h3>
                        <p>{s.texto}</p>
                      </div>
                    </article>
                  </Revelar>
                ))}
              </div>
            </div>

            <Revelar variante="escala" atraso={120} className="lp-feature-visual">
              <Slot3D chave="seguranca" icone="shield" altura="media" />
            </Revelar>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ FAQ */}
      <section id="faq" className="lp-secao fundo-papel">
        <div className="lp-wrap lp-wrap-estreito">
          <SectionHeader
            centralizado
            sobretitulo="FAQ"
            titulo="Perguntas frequentes"
            texto="As respostas descrevem o sistema como ele está hoje."
          />
          <FAQ itens={PERGUNTAS} />
        </div>
      </section>

      {/* ------------------------------------------------------ CTA final */}
      <CTASection
        titulo="Comece pela tela de vendas. O resto o sistema preenche sozinho."
        texto="Crie a conta em menos de um minuto ou entre na demonstração, que já vem com produtos, clientes, vendas, títulos e notas para você navegar por tudo antes de cadastrar a sua empresa."
        rodape="Sem cartão de crédito. Sem instalação."
      />

      <Rodape />
    </div>
  );
}

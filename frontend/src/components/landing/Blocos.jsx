/**
 * Blocos reutilizáveis da página inicial.
 *
 * A landing inteira é montada com estes componentes — nenhuma seção repete
 * marcação. Trocar o espaçamento, a tipografia ou o ritmo de animação aqui
 * muda a página toda.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/Icons";
import Slot3D from "@/components/landing/Slot3D";
import { useRevelar } from "@/lib/animacoes";

/* -------------------------------------------------------- AnimatedSection */

/** Revela o conteúdo quando ele entra na tela. Respeita movimento reduzido. */
export function Revelar({ children, atraso = 0, variante = "sobe", className = "", tag: Tag = "div" }) {
  const [ref, visivel] = useRevelar();
  return (
    <Tag
      ref={ref}
      className={`revelar revelar-${variante} ${visivel ? "visivel" : ""} ${className}`}
      style={{ transitionDelay: `${atraso}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ----------------------------------------------------------- SectionHeader */

export function SectionHeader({ sobretitulo, titulo, texto, centralizado = false, claro = false }) {
  return (
    <Revelar className={`lp-cabecalho ${centralizado ? "centro" : ""} ${claro ? "claro" : ""}`}>
      {sobretitulo ? <div className="lp-sobretitulo">{sobretitulo}</div> : null}
      <h2 className="lp-h2">{titulo}</h2>
      {texto ? <p className="lp-sub">{texto}</p> : null}
    </Revelar>
  );
}

/* ---------------------------------------------------------- FeatureSection */

/**
 * Seção completa de uma funcionalidade: texto de um lado, cena 3D do outro.
 * `inverter` troca os lados — é o que cria o ritmo alternado da rolagem.
 */
export function FeatureSection({
  id,
  chave3d,
  icone,
  sobretitulo,
  titulo,
  frase,
  texto,
  beneficios = [],
  cta,
  inverter = false,
  fundo = "claro",
}) {
  return (
    <section id={id} className={`lp-secao lp-feature fundo-${fundo}`}>
      {fundo !== "claro" && fundo !== "papel" ? <span className="lp-grade" aria-hidden="true" /> : null}
      <div className="lp-wrap">
        <div className={`lp-feature-grade ${inverter ? "invertida" : ""}`}>
          <div className="lp-feature-texto">
            <Revelar variante="fade">
              <div className="lp-sobretitulo">
                <Icon name={icone} size={14} /> {sobretitulo}
              </div>
            </Revelar>

            <Revelar atraso={70}>
              <h2 className="lp-h2">{titulo}</h2>
            </Revelar>

            <Revelar atraso={120}>
              <p className="lp-frase">{frase}</p>
            </Revelar>

            <Revelar atraso={170}>
              <p className="lp-texto">{texto}</p>
            </Revelar>

            <Revelar atraso={220}>
              <ul className="lp-beneficios">
                {beneficios.map((b) => (
                  <li key={b}>
                    <Icon name="check" size={15} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </Revelar>

            {cta ? (
              <Revelar atraso={280}>
                <Link to={cta.para} className="lp-link-cta">
                  {cta.texto} <Icon name="arrowUpRight" size={15} />
                </Link>
              </Revelar>
            ) : null}
          </div>

          <Revelar variante="escala" atraso={120} className="lp-feature-visual">
            <Slot3D chave={chave3d} icone={icone} altura="media" />
          </Revelar>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- BenefitCard */

export function BenefitCard({ icone, titulo, texto }) {
  return (
    <article className="lp-beneficio">
      <span className="lp-beneficio-icone">
        <Icon name={icone} size={19} />
      </span>
      <h3>{titulo}</h3>
      <p>{texto}</p>
    </article>
  );
}

/* ---------------------------------------------------------------- StepCard */

export function StepCard({ numero, titulo, texto }) {
  return (
    <article className="lp-passo">
      <span className="lp-passo-num">{numero}</span>
      <h3>{titulo}</h3>
      <p>{texto}</p>
    </article>
  );
}

/* --------------------------------------------------------------- Audience */

export function AudienceCard({ icone, titulo, texto }) {
  return (
    <article className="lp-publico">
      <span className="lp-publico-icone">
        <Icon name={icone} size={17} />
      </span>
      <div>
        <h3>{titulo}</h3>
        <p>{texto}</p>
      </div>
    </article>
  );
}

/* --------------------------------------------------------------------- FAQ */

export function FAQ({ itens }) {
  const [aberto, setAberto] = useState(0);

  return (
    <div className="lp-faq">
      {itens.map((item, i) => {
        const ativo = aberto === i;
        return (
          <Revelar key={item.pergunta} atraso={i * 45}>
            <div className={`lp-faq-item ${ativo ? "aberto" : ""}`}>
              <button
                type="button"
                className="lp-faq-pergunta"
                aria-expanded={ativo}
                onClick={() => setAberto(ativo ? -1 : i)}
              >
                <span>{item.pergunta}</span>
                <Icon name={ativo ? "x" : "plus"} size={16} />
              </button>
              <div className="lp-faq-resposta" role="region">
                <p>{item.resposta}</p>
              </div>
            </div>
          </Revelar>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- CTASection */

export function CTASection({
  titulo,
  texto,
  principal = { texto: "Criar conta grátis", para: "/cadastro" },
  secundario = { texto: "Entrar", para: "/login" },
  rodape,
  chave3d = "convite",
}) {
  return (
    <section className="lp-secao fundo-abismo lp-cta-secao">
      <span className="lp-grade" aria-hidden="true" />
      <div className="lp-wrap">
        <div className="lp-cta">
          <Revelar variante="fade">
            <h2>{titulo}</h2>
          </Revelar>
          <Revelar atraso={90}>
            <p>{texto}</p>
          </Revelar>
          <Revelar atraso={160}>
            <div className="lp-botoes">
              <Link to={principal.para} className="lp-btn lp-btn-principal lp-btn-lg">
                <Icon name="bolt" size={17} /> {principal.texto}
              </Link>
              <Link to={secundario.para} className="lp-btn lp-btn-vidro lp-btn-lg">
                {secundario.texto}
              </Link>
            </div>
          </Revelar>
          {rodape ? (
            <Revelar atraso={210}>
              <span className="lp-cta-rodape">{rodape}</span>
            </Revelar>
          ) : null}

          {/* A cena de encerramento fica embaixo do texto e ocupa a largura
              toda: é o último momento de impacto antes do rodapé. */}
          {chave3d ? (
            <Revelar variante="escala" atraso={140} className="lp-cta-visual">
              <Slot3D chave={chave3d} icone="bolt" altura="alta" />
            </Revelar>
          ) : null}
        </div>
      </div>
    </section>
  );
}

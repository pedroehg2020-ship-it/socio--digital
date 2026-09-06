/**
 * Blocos reutilizáveis da página inicial.
 *
 * Mudança de conceito em relação à versão anterior: a coluna que antes
 * recebia uma "ilustração 3D dentro de uma caixa" agora é uma **janela** —
 * um espaço deliberadamente vazio no HTML por onde o mundo 3D aparece. Quem
 * desenha ali é a câmera, que enquadra a região daquela seção exatamente
 * naquele lado da tela.
 *
 * O texto sempre viaja dentro de uma zona segura (`lp-veu`), um véu de
 * gradiente que mora na camada de conteúdo, acima do canvas. É ele que
 * garante contraste de leitura sem precisar escurecer a cena inteira.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/Icons";
import { useRevelar } from "@/lib/animacoes";

/* -------------------------------------------------------------- Revelar */

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

/* --------------------------------------------------------------- Janela */

/**
 * Espaço reservado para o mundo 3D. Não desenha nada e não recebe evento:
 * existe só para que o grid mantenha metade da largura livre e a câmera
 * tenha para onde mandar a cena.
 */
export function Janela({ altura = "media" }) {
  return <div className={`lp-janela lp-janela-${altura}`} aria-hidden="true" />;
}

/* ----------------------------------------------------------- SectionHeader */

export function SectionHeader({ sobretitulo, titulo, texto, centralizado = false }) {
  return (
    <Revelar className={`lp-cabecalho ${centralizado ? "centro" : ""}`}>
      <div className="lp-veu">
        {sobretitulo ? <div className="lp-sobretitulo">{sobretitulo}</div> : null}
        <h2 className="lp-h2">{titulo}</h2>
        {texto ? <p className="lp-sub">{texto}</p> : null}
      </div>
    </Revelar>
  );
}

/* ---------------------------------------------------------- FeatureSection */

/**
 * Seção de funcionalidade: texto de um lado, janela para o mundo do outro.
 * `inverter` troca os lados — e o marco correspondente em `rota.js` usa o
 * mesmo sinal, para que câmera e layout nunca discordem sobre onde há espaço.
 */
export function FeatureSection({
  id,
  icone,
  sobretitulo,
  titulo,
  frase,
  texto,
  beneficios = [],
  cta,
  inverter = false,
}) {
  return (
    <section id={id} className="lp-secao lp-feature">
      <div className="lp-wrap">
        <div className={`lp-feature-grade ${inverter ? "invertida" : ""}`}>
          <div className="lp-feature-texto">
            <div className="lp-veu">
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
          </div>

          <Janela />
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
}) {
  return (
    <section id="cta" className="lp-secao lp-cta-secao">
      <div className="lp-wrap">
        <div className="lp-cta">
          <div className="lp-veu lp-veu-forte">
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
          </div>
        </div>
      </div>
    </section>
  );
}

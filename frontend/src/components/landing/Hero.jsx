/**
 * HERO.
 *
 * A composição é duas áreas IRMÃS do mesmo grid de 12 colunas: o texto ocupa
 * as colunas 1–5, o painel ocupa as 7–12, e a coluna 6 fica vazia como calha.
 * Não existe sobreposição possível — não porque foi evitada com z-index, mas
 * porque as duas áreas nunca compartilham espaço. Nenhum filho usa
 * `position: absolute` para escapar da própria faixa.
 *
 * Sobre o painel: a instrução foi que ele não pareça "um print dentro de um
 * card gigante". Por isso ele NÃO tem moldura externa. Não há um retângulo
 * branco com sombra em volta de uma imagem. O que existe é um conjunto de
 * blocos de dado assentados diretamente sobre o fundo da página, separados
 * por filetes de 1px — a mesma linguagem de superfície do resto do site.
 * O painel não é uma figura colada na página: ele é a página continuando.
 *
 * Movimento: os valores contam UMA vez, ao entrar, e param. Depois disso a
 * primeira tela fica completamente parada. Nada pulsa, nada gira, nada fica
 * em laço. A calma é o argumento.
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Numero from "@/components/landing/Numero";

/** Dispara uma vez quando o elemento entra na viewport. */
function useEntrouUmaVez(margem = "-12% 0px") {
  const alvo = useRef(null);
  const [entrou, setEntrou] = useState(false);

  useEffect(() => {
    const el = alvo.current;
    if (!el || entrou) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setEntrou(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setEntrou(true);
          obs.disconnect();
        }
      },
      { rootMargin: margem, threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [entrou, margem]);

  return [alvo, entrou];
}

/**
 * Bloco de indicador. Sem card, sem sombra, sem raio grande: um rótulo, um
 * valor em dígito tabular e uma variação. A hierarquia inteira é tipográfica.
 */
function Indicador({ rotulo, children, variacao, tom = "pos", detalhe }) {
  return (
    <div className="hero-indicador">
      <p className="hero-indicador-rotulo">{rotulo}</p>
      <div className="hero-indicador-valor">{children}</div>
      <div className="hero-indicador-rodape">
        {variacao ? (
          <span className={`sd-sinal sd-sinal-${tom}`}>{variacao}</span>
        ) : null}
        {detalhe ? <span className="sd-nota">{detalhe}</span> : null}
      </div>
    </div>
  );
}

/**
 * Curva de caixa em SVG. Traço fino, sem preenchimento chapado, sem brilho.
 * Desenha-se uma vez na entrada usando `stroke-dashoffset` e depois fica
 * estática — o gráfico é informação, não animação de fundo.
 */
function Curva({ ativo }) {
  const pontos = [4, 9, 7, 14, 12, 19, 17, 24, 28, 26, 33, 38];
  const largura = 260;
  const altura = 64;
  const max = Math.max(...pontos);
  const min = Math.min(...pontos);
  const d = pontos
    .map((p, i) => {
      const x = (i / (pontos.length - 1)) * largura;
      const y = altura - ((p - min) / (max - min)) * (altura - 8) - 4;
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className="hero-curva"
      viewBox={`0 0 ${largura} ${altura}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={d}
        fill="none"
        stroke="var(--teal-600)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={ativo ? "hero-curva-traco hero-curva-traco-ativo" : "hero-curva-traco"}
      />
    </svg>
  );
}

export default function Hero() {
  const [alvo, entrou] = useEntrouUmaVez("0px");

  return (
    <section className="hero" aria-labelledby="hero-titulo">
      <div className="sd-container">
        <div className="sd-grid hero-grid" ref={alvo}>
          {/* ---------- coluna do texto: 1 a 5 ---------- */}
          <div className="hero-texto">
            <p className="sd-olho">Gestão + inteligência</p>

            {/* A quebra é decidida aqui, não deixada ao acaso da medida: as
                duas frases são as duas ideias, e soltas o navegador deixava
                "única" sozinha numa linha. */}
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
              <Link className="sd-btn sd-btn-principal" to="/cadastro">
                Começar agora
              </Link>
              <Link className="sd-btn sd-btn-secundario" to="/login">
                Conhecer a plataforma
              </Link>
            </div>

            <p className="sd-nota hero-ressalva">
              Conta de demonstração pronta. Sem cartão de crédito.
            </p>
          </div>

          {/* ---------- coluna do produto: 7 a 12 ---------- */}
          {/* `aria-hidden`: é uma amostra ilustrativa da interface, e os
              números não acrescentam nada a quem usa leitor de tela. */}
          <div className="hero-produto" aria-hidden="true">
            <div className="hero-painel">
              <div className="hero-painel-topo">
                <span className="hero-painel-titulo">Visão geral</span>
                <span className="sd-nota">Últimos 30 dias</span>
              </div>

              <div className="hero-painel-grade">
                <Indicador
                  rotulo="Receita"
                  variacao="+12,4%"
                  tom="pos"
                >
                  <Numero valor={193220} de={0} moeda ativo={entrou} duracao={1100} />
                </Indicador>

                <Indicador
                  rotulo="Vendas"
                  variacao="+38"
                  tom="pos"
                >
                  <Numero valor={412} de={0} ativo={entrou} duracao={1000} atraso={90} />
                </Indicador>

                <Indicador rotulo="Fluxo de caixa" detalhe="Projeção 30 dias">
                  <Numero valor={74850} de={0} moeda ativo={entrou} duracao={1200} atraso={180} />
                  <Curva ativo={entrou} />
                </Indicador>

                <Indicador
                  rotulo="Estoque"
                  variacao="3 em reposição"
                  tom="ate"
                >
                  <Numero valor={1284} de={0} ativo={entrou} duracao={1000} atraso={270} />
                </Indicador>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

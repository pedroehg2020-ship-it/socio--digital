/**
 * CASCATA DE CONSEQUÊNCIA.
 *
 * Uma venda entra e o sistema inteiro reage, na ordem em que realmente
 * calcula. Cada etapa acende depois da anterior, ligada por um fio vertical
 * que se preenche entre elas.
 *
 * Por que assim, e não com cards flutuando:
 *
 *  · A ORDEM É O CONTEÚDO. O que se quer provar é que uma venda não é um
 *    número isolado — ela move cliente, estoque, contas, receita e caixa.
 *    Se tudo acendesse junto, a mensagem se perderia. O atraso entre etapas
 *    não é enfeite: é o argumento.
 *
 *  · O FIO NÃO DECORA. Ele ocupa uma coluna própria do grid, à esquerda das
 *    etapas, e nunca cruza texto. Ele mostra por onde o dado passou.
 *
 *  · POUCA INFORMAÇÃO POR ETAPA. Um rótulo, uma frase curta e um valor. Quem
 *    nunca usou um ERP precisa entender só de olhar: "vendeu, e aconteceu
 *    isso". Cada etapa que ganhasse uma segunda métrica tiraria clareza.
 *
 * Dispara uma vez, quando a seção entra na tela, e para. Sem laço.
 */

import { useEffect, useRef, useState } from "react";
import Numero from "@/components/landing/Numero";

/** Etapas na ordem real de processamento do sistema. */
const ETAPAS = [
  {
    id: "venda",
    rotulo: "Venda confirmada",
    frase: "Pedido registrado no balcão.",
    tipo: "valor",
    valor: 8900,
    moeda: true,
    marca: true,
  },
  {
    id: "cliente",
    rotulo: "Cliente",
    frase: "Compra entra no histórico de Marina Alves.",
    tipo: "texto",
    texto: "18ª compra",
  },
  {
    id: "estoque",
    rotulo: "Estoque",
    frase: "Baixa automática do item vendido.",
    tipo: "transicao",
    de: 28,
    para: 27,
    sufixo: "un.",
  },
  {
    id: "receber",
    rotulo: "Contas a receber",
    frase: "Parcela criada com vencimento em 30 dias.",
    tipo: "valor",
    valor: 8900,
    moeda: true,
    prefixoSinal: "+",
  },
  {
    id: "receita",
    rotulo: "Receita do mês",
    frase: "Indicador do painel atualizado.",
    tipo: "transicao",
    de: 184320,
    para: 193220,
    moeda: true,
  },
  {
    id: "caixa",
    rotulo: "Caixa projetado",
    frase: "Projeção de 30 dias recalculada.",
    tipo: "transicao",
    de: 65950,
    para: 74850,
    moeda: true,
  },
];

/** Intervalo entre etapas. Rápido o bastante para não cansar, lento o
    bastante para o olho acompanhar a causa e o efeito. */
const PASSO_MS = 620;

export default function Cascata() {
  const alvo = useRef(null);
  const [ativa, setAtiva] = useState(-1);

  useEffect(() => {
    const el = alvo.current;
    if (!el) return undefined;

    const reduz =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const iniciar = () => {
      if (reduz) {
        setAtiva(ETAPAS.length - 1);
        return;
      }
      ETAPAS.forEach((_, i) => {
        setTimeout(() => setAtiva((v) => Math.max(v, i)), i * PASSO_MS);
      });
    };

    if (typeof IntersectionObserver === "undefined") {
      iniciar();
      return undefined;
    }

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          iniciar();
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const progresso =
    ativa < 0 ? 0 : Math.min(1, (ativa + 0.5) / (ETAPAS.length - 0.5));

  return (
    <section className="cascata" aria-labelledby="cascata-titulo">
      <div className="sd-container">
        <div className="sd-grid cascata-grid">
          {/* ---------- coluna do texto: 1 a 4 ---------- */}
          <div className="cascata-texto">
            <p className="sd-olho">Do pedido ao caixa</p>
            <h2 id="cascata-titulo" className="sd-h2">
              Uma venda não é só um número.
            </h2>
            <p className="sd-lead">
              Registrar a venda é o único passo manual. O resto o sistema faz
              sozinho, na mesma hora — e você vê o efeito em cada área da
              empresa.
            </p>
          </div>

          {/* ---------- coluna da cascata: 6 a 12 ---------- */}
          <ol className="cascata-lista" ref={alvo}>
            {/* Fio de dados: vive em faixa própria, nunca sob o texto. */}
            <span className="cascata-fio" aria-hidden="true">
              <span
                className="cascata-fio-ativo"
                style={{ transform: `scaleY(${progresso})` }}
              />
            </span>

            {ETAPAS.map((e, i) => {
              const acesa = i <= ativa;
              return (
                <li
                  key={e.id}
                  className={`cascata-etapa${acesa ? " cascata-etapa-acesa" : ""}${
                    e.marca ? " cascata-etapa-origem" : ""
                  }`}
                >
                  <span className="cascata-marco" aria-hidden="true" />

                  <div className="cascata-conteudo">
                    <div className="cascata-cabeca">
                      <span className="cascata-rotulo">{e.rotulo}</span>

                      <span className="cascata-valor">
                        {e.tipo === "valor" ? (
                          <>
                            {e.prefixoSinal}
                            <Numero
                              valor={e.valor}
                              de={e.valor}
                              moeda={e.moeda}
                              ativo={acesa}
                            />
                          </>
                        ) : null}

                        {e.tipo === "texto" ? (
                          <span className="cascata-texto-valor">{e.texto}</span>
                        ) : null}

                        {e.tipo === "transicao" ? (
                          <>
                            <span className="cascata-antes sd-num">
                              {e.moeda
                                ? e.de.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                    maximumFractionDigits: 0,
                                  })
                                : e.de}
                            </span>
                            <span className="cascata-seta" aria-hidden="true">
                              →
                            </span>
                            <Numero
                              valor={e.para}
                              de={e.de}
                              moeda={e.moeda}
                              ativo={acesa}
                              duracao={520}
                            />
                            {e.sufixo ? (
                              <span className="cascata-sufixo">{e.sufixo}</span>
                            ) : null}
                          </>
                        ) : null}
                      </span>
                    </div>

                    <p className="cascata-frase">{e.frase}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

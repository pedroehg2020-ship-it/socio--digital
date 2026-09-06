/**
 * Número financeiro animado.
 *
 * Faz uma coisa só e faz bem: transita de um valor a outro em fonte de dígito
 * fixo, sem que a linha mude de largura no caminho. É o oposto do contador
 * genérico de landing page, que anima de zero e faz o texto pular.
 *
 * Duas regras de acabamento embutidas:
 *
 *  · A largura é RESERVADA. Antes de animar, o componente já ocupa o espaço
 *    do maior valor que vai exibir, então nada ao redor se desloca. É o que
 *    permite ter números mudando dentro de uma composição estável.
 *
 *  · A curva desacelera no fim (`easeOutCubic`). Contagem linear parece
 *    contador de esporte; desacelerada parece valor sendo apurado.
 *
 * Respeita `prefers-reduced-motion`: nesse caso o valor final aparece direto.
 */

import { useEffect, useRef, useState } from "react";

function formatar(valor, { moeda, decimais }) {
  if (moeda) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: decimais,
      maximumFractionDigits: decimais,
    });
  }
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  });
}

export default function Numero({
  valor,
  de = null,
  moeda = false,
  decimais = 0,
  duracao = 900,
  atraso = 0,
  ativo = true,
  className = "",
}) {
  const [atual, setAtual] = useState(de ?? valor);
  const quadro = useRef(0);
  const anterior = useRef(de ?? valor);

  useEffect(() => {
    if (!ativo) return undefined;

    const reduz =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduz) {
      setAtual(valor);
      anterior.current = valor;
      return undefined;
    }

    const origem = anterior.current;
    if (origem === valor) return undefined;

    let inicio = null;
    let temporizador = null;

    const passo = (agora) => {
      if (inicio === null) inicio = agora;
      const t = Math.min(1, (agora - inicio) / duracao);
      const suave = 1 - Math.pow(1 - t, 3);
      setAtual(origem + (valor - origem) * suave);
      if (t < 1) {
        quadro.current = requestAnimationFrame(passo);
      } else {
        anterior.current = valor;
      }
    };

    temporizador = setTimeout(() => {
      quadro.current = requestAnimationFrame(passo);
    }, atraso);

    return () => {
      clearTimeout(temporizador);
      cancelAnimationFrame(quadro.current);
    };
  }, [valor, duracao, atraso, ativo]);

  /* Reserva de largura: o maior entre origem e destino define o espaço, de
     modo que a composição não se mexe enquanto o número muda. */
  const referencia = formatar(Math.max(Math.abs(de ?? valor), Math.abs(valor)), {
    moeda,
    decimais,
  });

  return (
    <span className={`sd-num sd-numero ${className}`}>
      <span aria-hidden="true" className="sd-numero-reserva">
        {referencia}
      </span>
      <span className="sd-numero-valor">{formatar(atual, { moeda, decimais })}</span>
    </span>
  );
}

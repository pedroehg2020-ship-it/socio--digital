/**
 * Leitura do aparelho — decide quanto mundo cabe nele.
 *
 *   "alta"  → experiência completa: bloom, 1000 partículas, 46 pilares,
 *             instâncias em resolução cheia, dpr até 1.75
 *   "media" → mantém profundidade e bloom em resolução reduzida, com menos
 *             instâncias; dpr até 1.35
 *   "baixa" → celulares e máquinas fracas: sem pós-processamento, cena enxuta,
 *             dpr 1. Continua sendo o mesmo mundo, com menos detalhe — o 3D
 *             nunca é simplesmente desligado.
 */

export function nivelQualidade() {
  if (typeof window === "undefined") return "media";

  const largura = window.innerWidth;
  const nucleos = navigator.hardwareConcurrency || 4;
  const memoria = navigator.deviceMemory || 4;

  if (largura < 760 || nucleos <= 2 || memoria <= 2) return "baixa";
  if (largura < 1180 || nucleos <= 4 || memoria <= 4) return "media";
  return "alta";
}

/** WebGL disponível? Sem ele a página cai no fundo animado em CSS. */
export function temWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}

/** O visitante pediu menos movimento? */
export function movimentoReduzido() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

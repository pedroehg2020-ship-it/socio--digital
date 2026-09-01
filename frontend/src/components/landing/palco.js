/**
 * Registro dos "slots" 3D da página inicial.
 *
 * Cada seção reserva um retângulo vazio no layout (o componente `Slot3D`) e
 * registra o elemento DOM aqui. O canvas único (`Palco3D`) lê esse registro a
 * cada quadro, descobre qual slot está mais próximo do centro da tela e move a
 * composição 3D para exatamente aquela posição.
 *
 * O registro vive fora do React de propósito: `Palco3D` é carregado por
 * `lazy()` em um chunk separado, e um contexto de React não atravessaria esse
 * limite sem obrigar a página inteira a re-renderizar a cada rolagem.
 */

const slots = new Map();

/** Registra um slot e devolve a função de limpeza. */
export function registrarSlot(chave, elemento) {
  if (!chave || !elemento) return () => {};
  slots.set(chave, elemento);
  return () => {
    if (slots.get(chave) === elemento) slots.delete(chave);
  };
}

export function slotsRegistrados() {
  return slots;
}

/**
 * Decide qual slot deve receber a cena: o que estiver visível e mais próximo
 * do centro vertical da janela. Devolve `null` quando nenhum está na tela.
 */
export function slotAtivo() {
  const centro = window.innerHeight / 2;
  let melhor = null;
  let menorDistancia = Infinity;

  slots.forEach((el, chave) => {
    if (!el || !el.isConnected) return;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    const distancia = Math.abs(r.top + r.height / 2 - centro);
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      melhor = { chave, rect: r };
    }
  });

  if (melhor) melhor.progresso = progressoDoRect(melhor.rect);
  return melhor;
}

/**
 * Quanto o slot já percorreu a janela: 0 quando o topo dele acabou de entrar
 * pela base da tela, 1 quando a base dele saiu pelo topo.
 *
 * É este número que as cenas usam para animar — crescimento das barras,
 * desenho das curvas, deriva das camadas de paralaxe. Ligar a animação à
 * rolagem, e não ao relógio, é o que faz o movimento parecer conduzido pelo
 * visitante.
 */
export function progressoDoRect(r) {
  const alcance = window.innerHeight + r.height;
  const percorrido = window.innerHeight - r.top;
  const p = percorrido / alcance;
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

/**
 * Classifica o aparelho para decidir quanto detalhe a cena pode ter.
 *
 * "alta"  — sombras projetadas, objetos decorativos completos, dpr até 1.9
 * "media" — sem sombra projetada (fica só a sombra de contato), dpr até 1.5
 * "baixa" — cenas enxutas, dpr 1
 */
export function nivelQualidade() {
  if (typeof window === "undefined") return "media";
  const largura = window.innerWidth;
  const nucleos = navigator.hardwareConcurrency || 4;
  const memoria = navigator.deviceMemory || 4;

  if (largura < 620 || nucleos <= 2 || memoria <= 2) return "baixa";
  if (largura < 1024 || nucleos <= 4 || memoria <= 4) return "media";
  return "alta";
}

/** WebGL disponível? Usado para escolher entre canvas e fallback em CSS. */
export function temWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
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

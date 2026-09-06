/**
 * Controlador de rolagem.
 *
 * Traduz a rolagem da página em um número contínuo `t` dentro da rota da
 * câmera: 0 = primeiro marco, N-1 = último. Quando o centro da janela está
 * exatamente sobre a seção `#vendas`, `t` vale o índice de `vendas`; entre
 * duas seções, vale a fração correspondente.
 *
 * Por que medir o DOM e não usar `scrollY / alturaTotal`: as seções têm
 * alturas muito diferentes, e conteúdo novo em qualquer ponto da página
 * deslocaria a viagem inteira. Ancorando nos elementos reais, a rota continua
 * correta mesmo que alguém edite um texto no meio do caminho.
 *
 * Vive fora do React de propósito — o palco 3D é carregado em um chunk
 * separado e nenhum quadro pode disparar re-render da página.
 */

import { IDS } from "@/components/landing/mundo/rota";

let centros = [];
let alvo = 0;

/** Recalcula o centro de cada seção em coordenadas do documento. */
export function medir() {
  const rolagem = window.scrollY || window.pageYOffset || 0;
  const lidos = [];

  IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const r = el.getBoundingClientRect();
    lidos.push(rolagem + r.top + r.height / 2);
  });

  // Só troca a medição se todas as seções foram encontradas; assim uma
  // medição feita antes da montagem completa não estraga a rota.
  if (lidos.length === IDS.length) centros = lidos;
  atualizar();
}

/** Recalcula `t` a partir da posição atual da rolagem. */
export function atualizar() {
  if (centros.length < 2) return;

  const centro = (window.scrollY || window.pageYOffset || 0) + window.innerHeight / 2;

  if (centro <= centros[0]) {
    alvo = 0;
    return;
  }
  const ultimo = centros.length - 1;
  if (centro >= centros[ultimo]) {
    alvo = ultimo;
    return;
  }

  for (let i = 0; i < ultimo; i += 1) {
    const a = centros[i];
    const b = centros[i + 1];
    if (centro >= a && centro <= b) {
      const u = b - a > 0 ? (centro - a) / (b - a) : 0;
      alvo = i + u;
      return;
    }
  }
}

/** Posição desejada na rota (sem suavização — quem suaviza é a câmera). */
export function alvoDaRota() {
  return alvo;
}

export function totalDeMarcos() {
  return IDS.length;
}

/**
 * Liga os ouvintes. Devolve a função de limpeza.
 *
 * `scroll` é passivo e não faz conta nenhuma além de ler `scrollY`; a
 * interpolação acontece no laço de render, que é onde ela pode ser suavizada
 * sem travar a rolagem do navegador.
 */
export function observar() {
  medir();

  const aoRolar = () => atualizar();
  const aoRedimensionar = () => medir();

  window.addEventListener("scroll", aoRolar, { passive: true });
  window.addEventListener("resize", aoRedimensionar);

  // A altura muda quando fontes carregam, imagens entram e o FAQ abre.
  const obs =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => medir())
      : null;
  if (obs) obs.observe(document.body);

  // Rede de segurança para mudanças que nenhum evento acima cobre.
  const relogio = setInterval(medir, 1500);

  return () => {
    window.removeEventListener("scroll", aoRolar);
    window.removeEventListener("resize", aoRedimensionar);
    if (obs) obs.disconnect();
    clearInterval(relogio);
  };
}

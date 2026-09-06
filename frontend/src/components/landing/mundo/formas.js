/**
 * FORMAS — os destinos que o campo de partículas assume.
 *
 * A ideia central da página: existe UM campo de partículas, e ele nunca é
 * substituído. O que muda é para onde as partículas são atraídas. Em repouso
 * elas fluem livres, como tinta na água; quando uma seção pede, elas se
 * organizam e viram um dado legível; depois voltam a se soltar.
 *
 * Cada função aqui devolve, para a partícula `i` de `n`, uma posição-destino.
 * Todas são calculadas uma única vez na CPU e enviadas como atributos, então
 * a troca entre formas custa apenas uma interpolação no shader — é de graça,
 * independentemente da quantidade de partículas.
 *
 * A ordem importa: ela é a narrativa.
 *   0 fluxo        · hero — nenhuma organização, só corrente
 *   1 curva        · vendas/receita — a corrente vira uma série temporal
 *   2 correntes    · financeiro — entrada e saída se cruzando
 *   3 constelação  · clientes — nós e vizinhança
 *   4 malha        · estoque/relatórios — grade ordenada
 *   5 convergência · a IA — tudo colapsa num campo único e estável
 */

/** Ruído determinístico: o mesmo campo em toda visita e em todo aparelho. */
function r(i, s = 1) {
  const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** 0 · FLUXO — nuvem alongada; o shader é quem dá o movimento. */
export function fluxo(i, n) {
  const a = r(i, 1) * Math.PI * 2;
  const raio = Math.pow(r(i, 2), 0.55) * 26;
  return [
    Math.cos(a) * raio * 1.05,
    Math.sin(a) * raio * 0.62,
    (r(i, 3) - 0.5) * 70,
  ];
}

/** 1 · CURVA — série temporal com volume: a linha ganha espessura e área. */
export function curva(i, n) {
  const t = i / n;
  const x = (t - 0.5) * 64;
  // tendência de alta com ondulação, como um gráfico de receita real
  const base = Math.sin(t * 7.5) * 3.2 + Math.sin(t * 19.0) * 1.1 + t * 15 - 6;
  const espessura = r(i, 4);
  // metade das partículas desenha a linha, metade preenche a área abaixo
  const naLinha = espessura > 0.45;
  const y = naLinha
    ? base + (r(i, 5) - 0.5) * 1.1
    : base - r(i, 6) * (base + 14);
  return [x, y, (r(i, 7) - 0.5) * 5];
}

/** 2 · CORRENTES — dois fluxos que se cruzam: entrada e saída de caixa. */
export function correntes(i, n) {
  const cima = i % 2 === 0;
  const t = r(i, 8);
  const x = (t - 0.5) * 70;
  const curvaY = Math.sin(t * Math.PI) * 13 * (cima ? 1 : -1);
  return [
    x,
    curvaY + (r(i, 9) - 0.5) * 3.4,
    Math.sin(t * Math.PI * 2) * 8 * (cima ? 1 : -1) + (r(i, 10) - 0.5) * 4,
  ];
}

/** 3 · CONSTELAÇÃO — nós distribuídos em Fibonacci, com halo em cada nó. */
export function constelacao(i, n) {
  const nos = 90;
  const no = i % nos;
  const dourado = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (no / (nos - 1)) * 2;
  const raio = Math.sqrt(Math.max(0, 1 - y * y));
  const a = dourado * no;
  const R = 22;
  // dispersão local: cria o "peso" visual do nó sem precisar de outro objeto
  const d = Math.pow(r(i, 11), 2.4) * 4.2;
  const da = r(i, 12) * Math.PI * 2;
  const db = r(i, 13) * Math.PI;
  return [
    Math.cos(a) * raio * R + Math.sin(db) * Math.cos(da) * d,
    y * R * 0.72 + Math.cos(db) * d,
    Math.sin(a) * raio * R + Math.sin(db) * Math.sin(da) * d,
  ];
}

/** 4 · MALHA — grade ordenada, com altura por célula. É o "sistema em ordem". */
export function malha(i, n) {
  const colunas = 44;
  const linhas = 26;
  const c = i % colunas;
  const l = Math.floor(i / colunas) % linhas;
  const alt = r(c * 31 + l * 7, 14);
  return [
    (c / (colunas - 1) - 0.5) * 62,
    (l / (linhas - 1) - 0.5) * 30 + alt * 1.6,
    (r(i, 15) - 0.5) * 3 + alt * 6 - 3,
  ];
}

/** 5 · CONVERGÊNCIA — disco denso e estável: tudo num lugar só. */
export function convergencia(i, n) {
  const a = r(i, 16) * Math.PI * 2;
  const raio = Math.pow(r(i, 17), 0.42) * 21;
  const esp = (r(i, 18) - 0.5) * (2.6 + (1 - raio / 21) * 5);
  return [Math.cos(a) * raio, Math.sin(a) * raio * 0.86, esp];
}

export const GERADORES = [fluxo, curva, correntes, constelacao, malha, convergencia];
export const TOTAL_FORMAS = GERADORES.length;

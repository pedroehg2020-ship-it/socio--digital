/**
 * Paleta do ambiente 3D.
 *
 * Regra de composição: a base é azul-marinho quase preto, a energia é ciano,
 * o azul faz o volume e violeta/verde entram só como acento pontual. Nenhuma
 * cena usa mais de três cores ao mesmo tempo.
 */

export const COR = {
  /* base — o "vazio" do ambiente */
  vazio: "#02060f",
  abismo: "#040b1c",
  casco: "#0a1430",
  casco2: "#101d42",
  estrutura: "#16244f",

  /* energia principal */
  ciano: "#22d3ee",
  cianoForte: "#06b6d4",
  cianoClaro: "#a5f3fc",

  /* volume */
  azul: "#3b82f6",
  azulForte: "#1d4ed8",
  azulClaro: "#93c5fd",

  /* acentos — uso pontual */
  violeta: "#8b5cf6",
  verde: "#34d399",
  ambar: "#fbbf24",

  /* superfícies */
  aco: "#7f93bd",
  branco: "#eaf3ff",
};

/** Névoa da cena: mesma família da base, senão o horizonte "descola". */
export const NEVOA = "#03081a";

export default COR;

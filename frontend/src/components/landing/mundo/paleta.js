/**
 * Paleta do ambiente 3D — direção de arte arquitetônica.
 *
 * A versão anterior partia de um vazio quase preto (#02060f) e construía tudo
 * com ciano e violeta emissivos. O resultado lia como videogame. Aqui a lógica
 * é invertida e passa a ser a de fotografia de arquitetura:
 *
 *   1. A COR VEM DA LUZ, não do material. As superfícies são neutras — pedra,
 *      concreto, nogueira, metal escovado, vidro. Quem as tinge de azul é o
 *      céu; quem as aquece é a luz que entra pela janela.
 *   2. NENHUMA BASE ABAIXO DE ~12% DE LUMINÂNCIA. O ambiente mais fechado da
 *      página ainda é azul-marinho legível, nunca preto.
 *   3. CIANO É DETALHE. Ele aparece em traços finos de interface e em nada
 *      mais. Violeta e verde-neon saíram da paleta; o verde que restou é o
 *      verde sóbrio de indicador financeiro positivo.
 *
 * Regra prática ao criar material novo: escolha a cor nesta lista, deixe o
 * `emissive` em zero e resolva o brilho com iluminação. Emissivo só para o
 * que é literalmente uma tela ou uma luminária.
 */

export const COR = {
  /* --------------------------------------------------------- atmosfera */
  /** Céu limpo de fim de tarde — topo, meio e horizonte. */
  ceuAlto: "#41669c",
  ceuMeio: "#7d9dc4",
  ceuBaixo: "#cfdcea",
  /** Luz natural: branco levemente quente, como sol filtrado por vidro. */
  luzDia: "#fff2e0",
  /** Bruma da cidade ao longe. */
  bruma: "#93aac6",

  /* ----------------------------------------------- base arquitetônica */
  /** Azul-marinho da identidade. É o tom mais escuro que a cena alcança. */
  marinho: "#16233d",
  marinhoClaro: "#25355a",
  /** Azul petróleo — paredes e volumes em sombra. */
  petroleo: "#1d3a49",
  /** Cinza arquitetônico, do grafite ao concreto claro. */
  grafite: "#2f384a",
  concreto: "#6d7788",
  concretoClaro: "#a7b0bf",
  /** Pedra dos pisos e bancadas. */
  pedra: "#8b8c87",
  pedraClara: "#b9bab4",

  /* ---------------------------------------------------------- materiais */
  nogueira: "#402c21",
  nogueiraClara: "#6a4832",
  metal: "#98a3b3",
  metalEscuro: "#4b5462",
  /** Vidro arquitetônico visto de fora: escuro e muito reflexivo. */
  vidro: "#22354b",
  vidroClaro: "#4d6a86",

  /* ------------------------------------------------------------ acentos */
  /** Ciano dessaturado — só interface, sempre em traço fino. */
  ciano: "#59b6c9",
  cianoClaro: "#a9dbe5",
  /** Azul de dado, o acento de maior área permitido. */
  azul: "#4a7fb5",
  azulClaro: "#9dbede",
  /** Indicadores financeiros — sóbrios, não neon. */
  positivo: "#5f9e7f",
  negativo: "#b5705f",
  ambar: "#d3a253",

  /* ---------------------------------------------------------- superfície */
  branco: "#eef3f8",
  texto: "#dbe6f2",
};

/**
 * Névoa por clima. A cena não usa mais uma cor única: ela viaja do dia
 * (escritório, cidade) para o crepúsculo (dados) e volta a abrir no final.
 * Os marcos da rota escolhem qual usar; o Cinema interpola entre elas.
 */
export const NEVOA = {
  dia: "#b9cbe0",
  tarde: "#8fa6c2",
  fundo: "#3a4d6b",
  noite: "#22314c",
};

export default COR;

/**
 * Paleta — manhã de nove horas, clara e sóbria.
 *
 * Duas regras que governam tudo:
 *
 *  1. CLARO, NUNCA ESTOURADO. O ponto mais luminoso da cena é o céu, e ele
 *     fica em torno de 88% — não em branco puro. Superfície clara com um
 *     resto de cor lê como fotografia; superfície em 100% lê como falha de
 *     exposição. Nenhuma cor aqui é #ffffff.
 *
 *  2. O AZUL-MARINHO É DA MARCA, NÃO DO AMBIENTE. Ele continua nos textos,
 *     nos traços de interface e nos detalhes de dado — que é onde a
 *     identidade do Sócio Digital deve aparecer. O ambiente construído é
 *     neutro: vidro, alumínio, nogueira, concreto claro, mármore.
 *
 * Ao criar material novo: escolha a cor daqui, deixe `emissive` em zero e
 * resolva o brilho com iluminação e reflexo. Emissivo só no que é literalmente
 * luminária ou tela.
 */

export const COR = {
  /* ------------------------------------------------- céu e atmosfera */
  ceuAlto: "#8fb2d8",
  ceuMeio: "#c2d6e9",
  ceuBaixo: "#e2e9ef",
  /** Sol de manhã: quente, mas discreto. */
  sol: "#ffeeda",
  /** Bruma matinal — é ela que separa os planos de cidade. */
  bruma: "#ccd8e4",

  /* ---------------------------------------------------- identidade */
  /** Azul-marinho do Sócio Digital. Texto, traço e detalhe. */
  marinho: "#16233d",
  marinhoMedio: "#263career",
  azulDado: "#2f5c95",
  azulClaro: "#8fb0d6",

  /* ---------------------------------------------------- materiais */
  concretoClaro: "#b3b7b8",
  concretoSombra: "#8f9297",
  marmore: "#dcdbd6",
  marmoreVeio: "#b4b3ad",
  nogueira: "#4a3226",
  nogueiraClara: "#7a5539",
  aluminio: "#b6bcc4",
  aluminioEscuro: "#5a6068",
  /** Caixilho: o perfil preto fino das referências. */
  caixilho: "#22262b",

  /* -------------------------------------------------------- vidro */
  vidro: "#cfdce8",
  vidroTorre: "#6f8dae",

  /* ------------------------------------------------------ acentos */
  positivo: "#4f8f72",
  negativo: "#a9685c",
  branco: "#f2f4f6",
  texto: "#e8eef5",
};

/* corrige o descuido acima de forma explícita, para não ficar valor inválido */
COR.marinhoMedio = "#26365a";

/** Névoa: sempre manhã. O fim só abre o alcance, não escurece a cor. */
export const NEVOA = {
  interior: "#cdd9e6",
  manha: "#b9cadd",
  cidade: "#9db4cd",
  amplo: "#aac0d6",
};

export default COR;

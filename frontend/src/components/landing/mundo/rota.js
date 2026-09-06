/**
 * Mapa do mundo — fonte única de verdade da experiência.
 *
 * O ambiente é um corredor em "U" com cerca de 600 unidades de profundidade.
 * A câmera sai da entrada, percorre a via da direita passando por seis
 * estruturas, contorna o fundo e volta pela via da esquerda até o núcleo de
 * IA. No último marco ela sobe e recua para revelar o conjunto inteiro.
 *
 * ESTES NÚMEROS NÃO FORAM ESCRITOS À MÃO. Foram gerados a partir da via e
 * verificados por cálculo: para cada marco confere-se, no pior aspecto de
 * tela do modo desktop (4:3), que a região focada cabe na metade livre e não
 * cruza a borda da coluna de texto, e que a câmera não está dentro de nenhuma
 * região. Ao mexer em qualquer valor daqui, refaça essa conta.
 *
 * REGIOES = onde cada estrutura mora no mundo.
 * MARCOS  = onde a câmera está quando aquela seção da página está no centro
 *           da janela. `lado` diz de que lado da tela o assunto deve aparecer:
 *
 *              lado = +1 → texto à esquerda, cena à direita
 *              lado = -1 → texto à direita,  cena à esquerda
 *              lado =  0 → texto centralizado, cena ao fundo
 *
 * O deslocamento lateral NÃO é feito movendo a estrutura: é a câmera que mira
 * fora do eixo, e o quanto ela desvia é calculado em tempo real a partir do
 * raio da região e da largura real do frustum. Por isso a zona segura do
 * texto continua livre em qualquer tamanho de janela.
 */

/* ------------------------------------------------------------- regiões */

export const REGIOES = {
  nucleo: { pos: [32, -2, -10], raio: 11 },
  financeiro: { pos: [23, 2, -98], raio: 11 },
  vendas: { pos: [32, -3, -186], raio: 12 },
  clientes: { pos: [22.8, 3, -274], raio: 11 },
  estoque: { pos: [31.3, -2, -362], raio: 12 },
  console: { pos: [18.6, 2, -447.7], raio: 13 },
  agenda: { pos: [15.7, -2, -532], raio: 10 },
  radar: { pos: [-16.5, -5, -482.1], raio: 14 },
  documentos: { pos: [-32, 0, -392.8], raio: 9 },
  painel: { pos: [-22, 2, -306.8], raio: 12 },
  ia: { pos: [-31, 2, -106.8], raio: 14 },
};

/* -------------------------------------------------------------- marcos */

/**
 * `id` é o id real da <section> na página, e a ordem aqui precisa ser a ordem
 * em que as seções aparecem no documento — é ela que vira o trilho da câmera.
 *
 * `nevoa` é [perto, longe]. Fechar a névoa nas seções do meio é o que dá a
 * sensação de corredor; abri-la no final é o que permite a revelação.
 */
export const MARCOS = [
  { id: "hero", cam: [27, 3, 46], foco: "nucleo", lado: 1, fov: 40, nevoa: [46, 260], expo: 1.05 },
  { id: "funcionalidades", cam: [28, 5, 14], foco: [27, -1, -64], lado: 0, fov: 46, nevoa: [40, 250], expo: 1.0 },
  { id: "financeiro", cam: [27, 3, -45], foco: "financeiro", lado: 1, fov: 42, nevoa: [30, 230], expo: 1.08 },
  { id: "vendas", cam: [27, 1, -128], foco: "vendas", lado: -1, fov: 42, nevoa: [30, 230], expo: 1.1 },
  { id: "clientes", cam: [27, 3, -221], foco: "clientes", lado: 1, fov: 42, nevoa: [30, 230], expo: 1.06 },
  { id: "estoque", cam: [26.6, 1, -304], foco: "estoque", lado: -1, fov: 42, nevoa: [30, 230], expo: 1.06 },
  { id: "relatorios", cam: [26.1, 3, -386], foco: "console", lado: 1, fov: 42, nevoa: [30, 230], expo: 1.08 },
  { id: "agenda", cam: [21.8, 1, -484.9], foco: "agenda", lado: -1, fov: 44, nevoa: [28, 220], expo: 1.04 },
  { id: "automacao", cam: [-4.9, 3, -542.8], foco: "radar", lado: 1, fov: 43, nevoa: [30, 240], expo: 1.12 },
  { id: "documentos", cam: [-26.3, 1, -437.8], foco: "documentos", lado: -1, fov: 42, nevoa: [26, 220], expo: 1.04 },
  { id: "painel", cam: [-27, 3, -364.8], foco: "painel", lado: -1, fov: 42, nevoa: [28, 230], expo: 1.08 },
  { id: "como-funciona", cam: [-27, 1, -282.8], foco: "ia", lado: 0, fov: 46, nevoa: [50, 330], expo: 1.02 },
  { id: "beneficios", cam: [-27, 3, -246.8], foco: "ia", lado: 0, fov: 45, nevoa: [44, 310], expo: 1.05 },
  { id: "para-quem", cam: [-27, 1, -218.8], foco: "ia", lado: 0, fov: 44, nevoa: [38, 290], expo: 1.06 },
  { id: "seguranca", cam: [-27, 3, -194.8], foco: "ia", lado: 1, fov: 42, nevoa: [34, 280], expo: 1.1 },
  { id: "faq", cam: [-27, 28, -168.8], foco: "ia", lado: 0, fov: 52, nevoa: [40, 320], expo: 1.0 },
  { id: "cta", cam: [0, 62, 118], foco: [0, -12, -250], lado: 0, fov: 62, nevoa: [110, 760], expo: 1.14 },
];

/** Resolve o foco de um marco (chave de região ou coordenada literal). */
export function pontoDeFoco(marco) {
  if (Array.isArray(marco.foco)) return marco.foco;
  const r = REGIOES[marco.foco];
  return r ? r.pos : [0, 0, 0];
}

/** Raio do assunto do marco — entra na conta do desvio lateral da câmera. */
export function raioDoFoco(marco) {
  if (Array.isArray(marco.foco)) return 0;
  const r = REGIOES[marco.foco];
  return r ? r.raio : 0;
}

/** Ordem dos ids, usada pelo controlador de rolagem. */
export const IDS = MARCOS.map((m) => m.id);

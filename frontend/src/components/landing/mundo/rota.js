/**
 * Rota — uma tomada só, do interior do escritório à visão ampla.
 *
 * Não existem cenas nem cortes: existe UMA câmera percorrendo uma curva
 * contínua. Os marcos abaixo são apenas os pontos por onde ela passa quando
 * cada seção da página está no centro da janela.
 *
 * ── Q7 e a exigência de não parecer a mesma tela por seis seções ──
 *
 * O painel curvo é um objeto só, e continua sendo. O que impede a monotonia é
 * a COREOGRAFIA em torno dele, que aqui é explícita, marco a marco:
 *
 *   painel         aproximação frontal, ainda longe, o conjunto se formando
 *   como-funciona  deslocamento lateral — a câmera desliza para a direita e
 *                  o painel abre em perspectiva, deixando de ser frontal
 *   beneficios     a câmera passa POR TRÁS do painel e olha através dele:
 *                  os dados aparecem espelhados, vistos pelo verso do vidro
 *   para-quem      mudança de foco — volta à frente, bem perto, e o painel
 *                  passa a preencher o quadro
 *   seguranca      detalhe: a câmera vai à borda do painel, quase rasante,
 *                  e o que se vê é a espessura do vidro e um traço de dado
 *   faq            recuo, subindo — o painel inteiro volta ao quadro
 *
 * Seis enquadramentos francamente diferentes, zero objetos novos.
 *
 * `lado` diz de que lado da tela o assunto aparece (+1 cena à direita, -1 à
 * esquerda, 0 ao fundo). O desvio é calculado em tempo real a partir do raio
 * do assunto e da largura real do frustum, então a zona de texto continua
 * livre em qualquer janela.
 */

/**
 * Onde o painel curvo mora. Fica aqui, e não no componente, porque a rota é a
 * fonte de verdade das posições — e assim este arquivo não depende de nada,
 * o que permite verificá-lo por script sem montar a cena.
 */
export const PAINEL = { pos: [0, 6, -380], raio: 18, largura: 36, altura: 22 };

export const REGIOES = {
  painel: { pos: PAINEL.pos, raio: PAINEL.raio },
};

export const MARCOS = [
  /* ---------------------------------------------- Q1 · dentro da sala */
  { id: "hero", cam: [-3.5, 1.2, 15], foco: [5.6, -3.0, 0.5], raio: 3.6, lado: 1, fov: 38, clima: "interior", nevoa: [24, 190], expo: 0.94 },

  /* ------------------------------------------------- Q2 · aproximação */
  { id: "funcionalidades", cam: [-1, 2.2, 5], foco: [0, 2.4, -60], raio: 11, lado: 0, fov: 44, clima: "interior", nevoa: [40, 520], expo: 0.94 },

  /* --------------------------------------------- Q3 · o vidro acorda */
  { id: "financeiro", cam: [3.5, 3.0, 2.0], foco: [-4.2, 3.4, -12.9], raio: 3.4, lado: -1, fov: 42, clima: "interior", nevoa: [26, 460], expo: 0.94 },
  { id: "vendas", cam: [-3.5, 2.2, 0.0], foco: [4.8, 1.0, -12.9], raio: 3.4, lado: 1, fov: 42, clima: "manha", nevoa: [26, 460], expo: 0.94 },

  /* ------------------------------------------------- Q4 · atravessar */
  { id: "clientes", cam: [0, 5, -34], foco: [-46, 10, -120], raio: 22, lado: -1, fov: 46, clima: "manha", nevoa: [120, 1500], expo: 0.94 },
  { id: "estoque", cam: [0, 9, -74], foco: [48, 16, -172], raio: 22, lado: 1, fov: 46, clima: "cidade", nevoa: [140, 1700], expo: 0.94 },

  /* --------------------------------- Q5 · a cidade recebe os dados */
  { id: "relatorios", cam: [4, 10, -116], foco: [-52, 8, -196], raio: 22, lado: -1, fov: 45, clima: "cidade", nevoa: [140, 1700], expo: 0.94 },
  { id: "agenda", cam: [-4, 13, -160], foco: [56, 18, -246], raio: 22, lado: 1, fov: 45, clima: "cidade", nevoa: [140, 1700], expo: 0.94 },

  /* ------------------------------------------ Q6 · planos de vidro */
  { id: "automacao", cam: [6, 12, -206], foco: [-26, 10, -282], raio: 18, lado: -1, fov: 46, clima: "cidade", nevoa: [110, 1500], expo: 0.94 },
  { id: "documentos", cam: [-6, 10, -250], foco: [24, 6, -318], raio: 18, lado: 1, fov: 46, clima: "cidade", nevoa: [100, 1400], expo: 0.94 },

  /* ------------------------------------------- Q7 · a coreografia */
  /* aproximação frontal */
  { id: "painel", cam: [-4, 8, -290], foco: "painel", lado: -1, fov: 44, clima: "cidade", nevoa: [90, 1300], expo: 0.94 },
  /* deslocamento lateral: a câmera desliza e o painel abre em perspectiva */
  { id: "como-funciona", cam: [52, 7, -312], foco: "painel", lado: 1, fov: 42, clima: "cidade", nevoa: [90, 1300], expo: 0.94 },
  /* por trás do painel, olhando através do vidro */
  { id: "beneficios", cam: [30, 9, -456], foco: "painel", lado: 1, fov: 44, clima: "amplo", nevoa: [90, 1300], expo: 0.94 },
  /* de volta à frente, perto: o painel preenche o quadro */
  { id: "para-quem", cam: [0, 6.5, -318], foco: "painel", lado: 0, fov: 48, clima: "amplo", nevoa: [70, 1100], expo: 0.94 },
  /* detalhe rasante na borda do painel */
  { id: "seguranca", cam: [-30, 6, -352], foco: [-15, 6, -378], raio: 5, lado: -1, fov: 40, clima: "amplo", nevoa: [50, 900], expo: 0.94 },
  /* recuo subindo: o conjunto volta ao quadro */
  { id: "faq", cam: [0, 34, -280], foco: "painel", lado: 0, fov: 50, clima: "amplo", nevoa: [100, 1400], expo: 0.94 },

  /* ------------------------------------------- Q8 · visão ampla */
  { id: "cta", cam: [0, 150, 60], foco: [0, -6, -320], raio: 60, lado: 0, fov: 58, clima: "amplo", nevoa: [320, 3000], expo: 0.94 },
];

export function pontoDeFoco(marco) {
  if (Array.isArray(marco.foco)) return marco.foco;
  const r = REGIOES[marco.foco];
  return r ? r.pos : [0, 0, 0];
}

export function raioDoFoco(marco) {
  if (marco.raio != null) return marco.raio;
  const r = REGIOES[marco.foco];
  return r ? r.raio : 0;
}

export const IDS = MARCOS.map((m) => m.id);

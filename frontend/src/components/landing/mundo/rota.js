/**
 * Rota — a viagem da câmera e a coreografia das formas.
 *
 * Não há mais mundo modelado: existe um campo de partículas e uma câmera
 * orbitando lentamente em torno dele. Cada marco declara três coisas:
 *
 *   `forma`     qual destino o campo assume (índice em formas.js)
 *   `corrente`  0 = forma firme e legível · 1 = corrente solta, puro fluxo
 *   `lado`      de que lado da tela o campo aparece (+1 direita, -1 esquerda,
 *               0 centralizado), para o texto ficar na metade livre
 *
 * O ritmo da narrativa está na alternância entre soltar e firmar: o hero é
 * fluxo puro, cada seção de produto puxa o campo para um dado legível, e as
 * seções de apoio deixam respirar de novo. O final converge e fica firme.
 */

export const REGIOES = {
  campo: { pos: [0, 0, 0], raio: 30 },
};

export const MARCOS = [
  /* fluxo puro — nenhuma organização ainda */
  { id: "hero", cam: [18, 6, 113], foco: [0, 0, 0], raio: 27, lado: 1, fov: 46, forma: 0, corrente: 1.0, clima: "fundo", nevoa: [80, 500], expo: 1.0 },
  { id: "funcionalidades", cam: [-10, 26, 100], foco: [0, 0, 0], raio: 27, lado: 0, fov: 50, forma: 0, corrente: 0.85, clima: "fundo", nevoa: [80, 500], expo: 1.0 },

  /* As oito funcionalidades. `lado` segue a alternância REAL do documento:
     vendas, estoque, agenda e documentos têm o texto à direita (inverter:
     true em data/landing.js), as outras quatro têm o texto à esquerda. */
  { id: "financeiro", cam: [46, 10, 134], foco: [0, 0, 0], raio: 35, lado: 1, fov: 46, forma: 2, corrente: 0.12, clima: "fundo", nevoa: [80, 520], expo: 1.02 },
  { id: "vendas", cam: [-40, 8, 124], foco: [0, 2, 0], raio: 32, lado: -1, fov: 46, forma: 1, corrente: 0.1, clima: "meio", nevoa: [80, 520], expo: 1.02 },
  { id: "clientes", cam: [34, 18, 92], foco: [0, 0, 0], raio: 24, lado: 1, fov: 46, forma: 3, corrente: 0.16, clima: "meio", nevoa: [70, 480], expo: 1.03 },
  { id: "estoque", cam: [-38, 10, 120], foco: [0, 0, 0], raio: 31, lado: -1, fov: 46, forma: 4, corrente: 0.14, clima: "meio", nevoa: [70, 480], expo: 1.02 },
  { id: "relatorios", cam: [40, 22, 116], foco: [0, 1, 0], raio: 31, lado: 1, fov: 46, forma: 4, corrente: 0.2, clima: "meio", nevoa: [70, 480], expo: 1.03 },
  { id: "agenda", cam: [-44, 6, 122], foco: [0, 0, 0], raio: 32, lado: -1, fov: 46, forma: 1, corrente: 0.3, clima: "alto", nevoa: [66, 460], expo: 1.04 },
  { id: "automacao", cam: [30, -14, 94], foco: [0, 0, 0], raio: 24, lado: 1, fov: 46, forma: 3, corrente: 0.35, clima: "alto", nevoa: [66, 460], expo: 1.05 },
  { id: "documentos", cam: [-34, 16, 119], foco: [0, 0, 0], raio: 31, lado: -1, fov: 46, forma: 4, corrente: 0.28, clima: "alto", nevoa: [66, 460], expo: 1.04 },

  /* o painel: a corrente colapsa e o campo firma */
  { id: "painel", cam: [30, 8, 82], foco: [0, 0, 0], raio: 21, lado: 1, fov: 46, forma: 5, corrente: 0.4, clima: "alto", nevoa: [60, 440], expo: 1.05 },

  /* seções de apoio: a câmera continua orbitando a mesma forma */
  { id: "como-funciona", cam: [-6, 34, 78], foco: [0, 0, 0], raio: 21, lado: 0, fov: 52, forma: 5, corrente: 0.34, clima: "alto", nevoa: [60, 440], expo: 1.04 },
  { id: "beneficios", cam: [-40, 10, 74], foco: [0, 0, 0], raio: 21, lado: -1, fov: 46, forma: 5, corrente: 0.26, clima: "alto", nevoa: [58, 420], expo: 1.05 },
  { id: "para-quem", cam: [0, -30, 82], foco: [0, 0, 0], raio: 21, lado: 0, fov: 50, forma: 5, corrente: 0.2, clima: "alto", nevoa: [58, 420], expo: 1.05 },
  { id: "seguranca", cam: [36, 6, 80], foco: [0, 0, 0], raio: 21, lado: 1, fov: 44, forma: 5, corrente: 0.14, clima: "alto", nevoa: [56, 400], expo: 1.06 },
  { id: "faq", cam: [-12, 38, 86], foco: [0, 0, 0], raio: 21, lado: 0, fov: 52, forma: 5, corrente: 0.1, clima: "alto", nevoa: [60, 440], expo: 1.04 },

  /* firme e amplo */
  { id: "cta", cam: [0, 8, 130], foco: [0, 0, 0], raio: 21, lado: 0, fov: 50, forma: 5, corrente: 0.06, clima: "fundo", nevoa: [90, 560], expo: 1.08 },
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

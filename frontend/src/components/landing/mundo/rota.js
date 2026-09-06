/**
 * Mapa do mundo — fonte única de verdade da experiência.
 *
 * NARRATIVA. A página conta uma transformação em quatro tempos:
 *
 *     espaço físico  →  empresa  →  dados  →  inteligência
 *
 * A câmera começa DENTRO de uma sala executiva de último andar, ao fim da
 * tarde. Ela avança em direção à parede de vidro, atravessa e revela o
 * edifício da empresa. Dali segue voando para fora da cidade, e o que era
 * arquitetura vai virando estrutura de dados: as regiões de vendas,
 * financeiro, clientes, estoque, relatórios, agenda, automação e documentos
 * se alternam à esquerda e à direita do percurso, como pavilhões ao longo de
 * uma avenida. No fim tudo converge para um núcleo único, e a câmera sobe
 * para revelar que escritório, edifício e sistemas sempre estiveram no mesmo
 * terreno — que é a frase "toda a sua empresa em um só lugar", dita em
 * imagem.
 *
 * Por isso a alternância esquerda/direita não é só ritmo visual: ela existe
 * para que cada estrutura seja vista DE PASSAGEM, com a anterior ainda
 * recuando no quadro. Uma coisa puxa a outra.
 *
 * ESTES NÚMEROS NÃO FORAM ESCRITOS À MÃO. Foram gerados a partir do traçado e
 * verificados por cálculo: para cada marco confere-se, no pior aspecto do
 * modo desktop (4:3), que a região focada cabe na metade livre da tela sem
 * cruzar a borda da coluna de texto, e que a câmera não está dentro de nenhum
 * volume. Ao mexer em qualquer valor daqui, refaça essa conta.
 *
 * `lado` diz de que lado da tela o assunto aparece:
 *      +1 → texto à esquerda, cena à direita
 *      -1 → texto à direita,  cena à esquerda
 *       0 → texto centralizado, cena ao fundo
 *
 * O deslocamento lateral NÃO é feito movendo a estrutura: é a câmera que mira
 * fora do eixo, e o quanto ela desvia é calculado em tempo real a partir do
 * raio do assunto e da largura real do frustum. Por isso a zona segura do
 * texto continua livre em qualquer tamanho de janela.
 *
 * `clima` escolhe a cor da névoa (ver NEVOA na paleta) e, junto com a tabela
 * de climas da Iluminação, é o que faz a página começar de dia e só depois
 * aprofundar — sem nunca ficar escura a ponto de comprometer a leitura.
 */

/* ------------------------------------------------------------- regiões */

export const REGIOES = {
  /* espaço físico */
  escritorio: { pos: [0, 0, 4], raio: 17 },
  /* empresa */
  edificio: { pos: [30, -8, -168], raio: 44, raioLargura: 26 },
  /* dados */
  financeiro: { pos: [-22, 4, -252], raio: 12 },
  vendas: { pos: [22, 2, -314], raio: 13 },
  clientes: { pos: [-22, 6, -376], raio: 12 },
  estoque: { pos: [22, 0, -438], raio: 13 },
  console: { pos: [-23, 6, -500], raio: 13 },
  agenda: { pos: [21, 2, -560], raio: 10 },
  radar: { pos: [-22, 8, -620], raio: 12 },
  documentos: { pos: [21, 4, -678], raio: 10 },
  painel: { pos: [-22, 6, -736], raio: 12 },
  /* inteligência */
  ia: { pos: [0, 10, -858], raio: 18 },
};

/* -------------------------------------------------------------- marcos */

/**
 * `id` é o id real da <section> na página, e a ordem aqui precisa ser a ordem
 * em que as seções aparecem no documento — é ela que vira o trilho da câmera.
 *
 * `raio` só aparece quando o assunto do marco não é a região inteira. No
 * hero, por exemplo, o assunto é a composição da mesa, não a sala toda: a
 * câmera está dentro dela.
 */
export const MARCOS = [
  { id: "hero", cam: [-5, 1.5, 22], foco: [5, -1.5, -1], raio: 3.5, lado: 1, fov: 40, clima: "dia", nevoa: [30, 620], expo: 1.0 },
  { id: "funcionalidades", cam: [-6, 4, -34], foco: "edificio", lado: 1, fov: 46, clima: "dia", nevoa: [70, 900], expo: 1.0 },
  { id: "financeiro", cam: [3, 4, -196], foco: "financeiro", lado: -1, fov: 44, clima: "dia", nevoa: [70, 900], expo: 1.02 },
  { id: "vendas", cam: [-3, 3, -256], foco: "vendas", lado: 1, fov: 44, clima: "tarde", nevoa: [60, 760], expo: 1.02 },
  { id: "clientes", cam: [3, 6, -320], foco: "clientes", lado: -1, fov: 44, clima: "tarde", nevoa: [60, 760], expo: 1.03 },
  { id: "estoque", cam: [-3, 2, -380], foco: "estoque", lado: 1, fov: 44, clima: "tarde", nevoa: [60, 760], expo: 1.02 },
  { id: "relatorios", cam: [3, 6, -442], foco: "console", lado: -1, fov: 44, clima: "tarde", nevoa: [60, 760], expo: 1.03 },
  { id: "agenda", cam: [-3, 3, -508], foco: "agenda", lado: 1, fov: 44, clima: "fundo", nevoa: [50, 560], expo: 1.04 },
  { id: "automacao", cam: [3, 8, -564], foco: "radar", lado: -1, fov: 44, clima: "fundo", nevoa: [50, 560], expo: 1.05 },
  { id: "documentos", cam: [-3, 5, -626], foco: "documentos", lado: 1, fov: 44, clima: "fundo", nevoa: [50, 560], expo: 1.04 },
  { id: "painel", cam: [3, 6, -680], foco: "painel", lado: -1, fov: 44, clima: "fundo", nevoa: [50, 560], expo: 1.05 },
  { id: "como-funciona", cam: [0, 14, -688], foco: "ia", lado: 0, fov: 48, clima: "fundo", nevoa: [50, 560], expo: 1.02 },
  { id: "beneficios", cam: [0, 13, -720], foco: "ia", lado: 0, fov: 47, clima: "noite", nevoa: [46, 470], expo: 1.04 },
  { id: "para-quem", cam: [0, 12, -748], foco: "ia", lado: 0, fov: 46, clima: "noite", nevoa: [46, 470], expo: 1.05 },
  { id: "seguranca", cam: [4, 11, -772], foco: "ia", lado: 1, fov: 44, clima: "noite", nevoa: [46, 470], expo: 1.06 },
  { id: "faq", cam: [0, 26, -794], foco: "ia", lado: 0, fov: 52, clima: "noite", nevoa: [46, 470], expo: 1.03 },
  /* revelação: a câmera sobe e volta, e o terreno inteiro entra no quadro */
  { id: "cta", cam: [0, 215, 150], foco: [0, -18, -380], lado: 0, fov: 62, clima: "tarde", nevoa: [140, 1500], expo: 1.1 },
];

/** Resolve o foco de um marco (chave de região ou coordenada literal). */
export function pontoDeFoco(marco) {
  if (Array.isArray(marco.foco)) return marco.foco;
  const r = REGIOES[marco.foco];
  return r ? r.pos : [0, 0, 0];
}

/**
 * Raio do assunto do marco — entra na conta do desvio lateral da câmera.
 *
 * Usa `raioLargura` quando existe: para um volume alto e estreito como a
 * torre, o raio da esfera envolvente é dominado pela altura e produziria um
 * desvio muito maior do que o necessário.
 */
export function raioDoFoco(marco) {
  if (marco.raio != null) return marco.raio;
  const r = REGIOES[marco.foco];
  if (!r) return 0;
  return r.raioLargura ?? r.raio;
}

/** Ordem dos ids, usada pelo controlador de rolagem. */
export const IDS = MARCOS.map((m) => m.id);

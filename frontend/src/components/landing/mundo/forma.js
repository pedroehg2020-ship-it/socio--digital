/**
 * Geometrias de acabamento.
 *
 * A diferença entre "renderização arquitetônica" e "jogo antigo" quase nunca
 * está na quantidade de objetos — está na ARESTA. Uma caixa perfeitamente viva
 * devolve uma linha dura e sem informação; uma aresta com 2 a 6 mm de raio
 * captura um filete de luz especular ao longo de toda a extensão, e é esse
 * filete que o olho lê como material real.
 *
 * O three não traz uma caixa arredondada no núcleo (só o drei traz, e não
 * queremos a dependência). Esta é construída com ExtrudeGeometry e bisel, o
 * que dá o mesmo resultado usando só o que já está instalado.
 *
 * Tudo aqui é memoizado por assinatura: a mesma medida pedida duas vezes
 * devolve a MESMA geometria, então repetir um móvel não custa memória.
 */

import * as THREE from "three";

const cache = new Map();

function memo(chave, fabrica) {
  if (!cache.has(chave)) cache.set(chave, fabrica());
  return cache.get(chave);
}

/**
 * Caixa com arestas arredondadas, centrada na origem.
 * `raio` é o raio da aresta; mantenha-o pequeno em relação à peça (2% a 8%).
 */
export function caixaMacia(largura, altura, profundidade, raio = 0.06, segmentos = 2) {
  const r = Math.min(raio, largura / 2.05, altura / 2.05, profundidade / 2.05);
  return memo(`caixa-${largura}-${altura}-${profundidade}-${r}-${segmentos}`, () => {
    // perfil no plano XY, com os cantos já arredondados
    const w = largura / 2 - r;
    const h = altura / 2 - r;
    const forma = new THREE.Shape();
    forma.moveTo(-w, -h - r);
    forma.lineTo(w, -h - r);
    forma.absarc(w, -h, r, -Math.PI / 2, 0, false);
    forma.lineTo(w + r, h);
    forma.absarc(w, h, r, 0, Math.PI / 2, false);
    forma.lineTo(-w, h + r);
    forma.absarc(-w, h, r, Math.PI / 2, Math.PI, false);
    forma.lineTo(-w - r, -h);
    forma.absarc(-w, -h, r, Math.PI, Math.PI * 1.5, false);

    const geo = new THREE.ExtrudeGeometry(forma, {
      depth: profundidade - r * 2,
      bevelEnabled: true,
      bevelThickness: r,
      bevelSize: r,
      bevelSegments: segmentos,
      curveSegments: segmentos + 2,
      steps: 1,
    });
    geo.translate(0, 0, -(profundidade - r * 2) / 2);
    geo.computeVertexNormals();
    return geo;
  });
}

/** Plano simples, reaproveitado por todo o vidro e todo painel de dado. */
export function plano(largura = 1, altura = 1) {
  return memo(`plano-${largura}-${altura}`, () => new THREE.PlaneGeometry(largura, altura));
}

/**
 * Painel de vidro levemente CURVO. É a forma da parede de dados da referência:
 * um plano curvo lê como superfície óptica, um plano reto lê como cartaz.
 */
export function planoCurvo(largura, altura, curvatura = 0.12, segmentos = 24) {
  return memo(`curvo-${largura}-${altura}-${curvatura}-${segmentos}`, () => {
    const g = new THREE.PlaneGeometry(largura, altura, segmentos, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i += 1) {
      const x = p.getX(i) / (largura / 2); // -1 .. 1
      p.setZ(i, -x * x * curvatura * largura * 0.5);
    }
    p.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  });
}

/**
 * CAMPO — a página inteira é este objeto, e só ele.
 *
 * Não há modelo 3D em lugar nenhum. O que se vê é um único sistema de
 * partículas rodando em shader, e é justamente por isso que ele pode parecer
 * caro: geometria modelada sem equipe de modelagem e textura sempre lê como
 * jogo antigo, enquanto matemática rodando na GPU não tem como parecer pobre.
 *
 * Como funciona
 * -------------
 * Cada partícula carrega TODOS os destinos possíveis como atributos fixos
 * (`aF0`…`aF5`). O shader recebe seis pesos uniformes e monta a posição-alvo
 * como uma combinação linear deles — na prática só dois estão ativos por vez,
 * e a rolagem faz a passagem de um para o outro. Trocar de forma não recalcula
 * nada nem realoca nada: custa uma interpolação por vértice.
 *
 * Sobre a posição-alvo aplica-se ainda a CORRENTE: um deslocamento contínuo
 * derivado de ruído, que nunca desliga. É ela que dá a sensação de tinta na
 * água. Quando uma forma está firme, a corrente encolhe e o dado fica legível;
 * quando nenhuma forma está ativa, ela domina e tudo volta a fluir.
 *
 * A cor não é atribuída por partícula: ela nasce da VELOCIDADE e da
 * profundidade. Partícula que está sendo puxada com força vai para o ciano
 * claro; partícula em repouso volta ao azul-marinho. É o mesmo princípio de
 * uma foto de longa exposição, e é o que produz o cromatismo sem custo.
 */

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GERADORES } from "@/components/landing/mundo/formas";
import { MARCOS } from "@/components/landing/mundo/rota";

const VERT = /* glsl */ `
  attribute vec3 aF0; attribute vec3 aF1; attribute vec3 aF2;
  attribute vec3 aF3; attribute vec3 aF4; attribute vec3 aF5;
  attribute float aSemente;

  uniform float uTempo;
  uniform float uPesos[6];
  uniform float uCorrente;   // 0 = forma firme, 1 = corrente solta
  uniform float uTamanho;
  uniform float uDpr;

  varying float vEnergia;
  varying float vSemente;

  /* Ruído barato o bastante para 120 mil pontos e suave o bastante para não
     granular. Três oitavas de seno cruzado — não é Perlin, e não precisa ser. */
  vec3 corrente(vec3 p, float t) {
    float a = p.x * 0.055 + t * 0.22;
    float b = p.y * 0.062 - t * 0.17;
    float c = p.z * 0.048 + t * 0.13;
    return vec3(
      sin(b * 1.7 + cos(c * 1.1)) + 0.5 * sin(c * 2.3 - t * 0.4),
      sin(c * 1.5 + cos(a * 1.3)) + 0.5 * sin(a * 2.1 + t * 0.3),
      sin(a * 1.6 + cos(b * 1.2)) + 0.5 * sin(b * 1.9 - t * 0.5)
    );
  }

  void main() {
    vec3 alvo =
      aF0 * uPesos[0] + aF1 * uPesos[1] + aF2 * uPesos[2] +
      aF3 * uPesos[3] + aF4 * uPesos[4] + aF5 * uPesos[5];

    /* amplitude da corrente: forte quando solta, um respiro quando firme */
    float amp = mix(0.7, 9.0, uCorrente);
    vec3 desl = corrente(alvo + aSemente * 3.0, uTempo) * amp;

    vec3 pos = alvo + desl;

    /* a energia é o quanto a partícula está sendo deslocada — vira cor */
    vEnergia = clamp(length(desl) / (amp * 1.9 + 1.0), 0.0, 1.0);
    vSemente = aSemente;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    /* atenuação por distância, com piso para não sumir ao longe */
    gl_PointSize = uTamanho * uDpr * (150.0 / max(10.0, -mv.z));
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uCorFria;
  uniform vec3 uCorQuente;
  uniform vec3 uCorAcento;
  uniform vec3 uCorBrasa;
  uniform float uOpacidade;

  varying float vEnergia;
  varying float vSemente;

  void main() {
    /* ponto redondo com queda suave: sem textura, sem chamada extra */
    /* Queda gaussiana em vez de disco: é o que faz partículas vizinhas se
       somarem numa corrente contínua em vez de aparecerem como pontinhos.
       O expoente alto concentra o núcleo e alonga a cauda. */
    vec2 d = gl_PointCoord - 0.5;
    float r2 = dot(d, d);
    if (r2 > 0.25) discard;
    float alfa = pow(smoothstep(0.25, 0.0, r2), 1.35);

    /* Cromatismo: a cor varre fria → quente pela energia, e a semente
       desloca a varredura por partícula. É isso que produz a faixa
       iridescente das bordas em vez de um ciano chapado. */
    float faixa = clamp(vEnergia * 0.75 + vSemente * 0.4, 0.0, 1.0);
    vec3 cor = mix(uCorFria, uCorQuente, smoothstep(0.0, 0.72, faixa));
    cor = mix(cor, uCorAcento, smoothstep(0.62, 1.0, faixa));
    cor = mix(cor, uCorBrasa, smoothstep(0.88, 1.0, vSemente) * vEnergia);

    gl_FragColor = vec4(cor, alfa * uOpacidade * (0.45 + 0.55 * vEnergia));
  }
`;

export default function Campo({ quantidade = 120000, parado = false }) {
  const { camera, gl } = useThree();
  const material = useRef();

  const geometria = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = quantidade;
    const base = new Float32Array(n * 3);
    const semente = new Float32Array(n);
    const alvos = GERADORES.map(() => new Float32Array(n * 3));

    for (let i = 0; i < n; i += 1) {
      GERADORES.forEach((gerar, f) => {
        const p = gerar(i, n);
        alvos[f][i * 3] = p[0];
        alvos[f][i * 3 + 1] = p[1];
        alvos[f][i * 3 + 2] = p[2];
      });
      base[i * 3] = alvos[0][i * 3];
      base[i * 3 + 1] = alvos[0][i * 3 + 1];
      base[i * 3 + 2] = alvos[0][i * 3 + 2];
      semente[i] = (Math.sin(i * 43.21) * 0.5 + 0.5);
    }

    g.setAttribute("position", new THREE.BufferAttribute(base, 3));
    g.setAttribute("aSemente", new THREE.BufferAttribute(semente, 1));
    alvos.forEach((a, f) =>
      g.setAttribute(`aF${f}`, new THREE.BufferAttribute(a, 3))
    );
    /* esfera generosa: as formas se espalham muito além da posição base */
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 90);
    return g;
  }, [quantidade]);

  const uniformes = useMemo(
    () => ({
      uTempo: { value: 0 },
      uPesos: { value: [1, 0, 0, 0, 0, 0] },
      uCorrente: { value: 1 },
      uTamanho: { value: 2.0 },
      uDpr: { value: 1 },
      uCorFria: { value: new THREE.Color("#16305e") },
      uCorQuente: { value: new THREE.Color("#5fd8f5") },
      uCorAcento: { value: new THREE.Color("#8f6cf0") },
      uCorBrasa: { value: new THREE.Color("#f06ca8") },
      uOpacidade: { value: 0.9 },
    }),
    []
  );

  useLayoutEffect(() => {
    uniformes.uDpr.value = Math.min(2, gl.getPixelRatio());
  }, [gl, uniformes]);

  /* Cada marco declara qual forma e quanta corrente quer. */
  const trilha = useMemo(
    () => ({
      forma: MARCOS.map((m) => m.forma ?? 0),
      corrente: MARCOS.map((m) => m.corrente ?? 1),
      ultimo: MARCOS.length - 1,
    }),
    []
  );

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    if (!parado) uniformes.uTempo.value += d;

    const t = THREE.MathUtils.clamp(camera.userData.rota ?? 0, 0, trilha.ultimo);
    const i = Math.floor(t);
    const j = Math.min(trilha.ultimo, i + 1);
    const f = t - i;

    /* pesos: só dois ativos, e a transição é a própria rolagem */
    const p = uniformes.uPesos.value;
    for (let k = 0; k < 6; k += 1) p[k] = 0;
    p[trilha.forma[i]] += 1 - f;
    p[trilha.forma[j]] += f;

    uniformes.uCorrente.value =
      trilha.corrente[i] * (1 - f) + trilha.corrente[j] * f;
  });

  return (
    <points geometry={geometria} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniformes}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * EDIFÍCIO — a empresa, vista de fora.
 *
 * Segundo termo da transformação: a câmera atravessa a janela do escritório e
 * o espaço que era interior vira volume. O prédio é deliberadamente sóbrio —
 * uma torre de vidro com lajes expostas e um embasamento em pedra. Nada de
 * silhueta cartoon, nada de topo pontudo, nada de letreiro.
 *
 * A fachada usa `MODULO` do escritório multiplicado por `ESCALA`. É o mesmo
 * ritmo de caixilho da sala onde a página começou, agora em tamanho de
 * arquitetura — e é essa repetição que faz a transição significar "a mesma
 * empresa, outro nível de abstração" em vez de "outra cena qualquer".
 */

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COR } from "@/components/landing/mundo/paleta";
import { REGIOES } from "@/components/landing/mundo/rota";
import { MODULO } from "@/components/landing/mundo/regioes/Escritorio";
import { useMetal, usePedra, useVidro, useConcreto } from "@/components/landing/mundo/comuns";

/** Quantas vezes o módulo do escritório cabe num módulo de fachada. */
const ESCALA = 6;

const TORRE = { largura: 26, profundidade: 20, altura: 108, base: -60 };

/** Lajes horizontais expostas — o elemento que dá escala e leitura de andar. */
function Lajes() {
  const malha = useRef();
  const concreto = useConcreto(COR.concretoClaro, { roughness: 0.8 });

  const alturas = useMemo(() => {
    const passo = MODULO.vao * MODULO.proporcao * (ESCALA / 3.4); // ~3.4 m/andar
    const lista = [];
    for (let y = 0; y < TORRE.altura; y += passo) lista.push(y);
    return lista;
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    alturas.forEach((y, i) => {
      p.set(0, TORRE.base + y, 0);
      s.set(TORRE.largura + 0.7, 0.42, TORRE.profundidade + 0.7);
      m.compose(p, q, s);
      malha.current.setMatrixAt(i, m);
    });
    malha.current.instanceMatrix.needsUpdate = true;
  }, [alturas]);

  return (
    <instancedMesh ref={malha} args={[null, null, alturas.length]} material={concreto} frustumCulled>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

/** Montantes verticais da fachada, nas quatro faces. */
function Montantes() {
  const malha = useRef();
  const metal = useMetal(COR.metalEscuro, 0.32);

  const dados = useMemo(() => {
    const vao = MODULO.vao * (ESCALA / 3.4);
    const lista = [];
    const nx = Math.round(TORRE.largura / vao);
    const nz = Math.round(TORRE.profundidade / vao);
    for (let i = 0; i <= nx; i += 1) {
      const x = -TORRE.largura / 2 + i * (TORRE.largura / nx);
      [-1, 1].forEach((s) =>
        lista.push({ p: [x, TORRE.base + TORRE.altura / 2, (s * TORRE.profundidade) / 2], e: [0.3, TORRE.altura, 0.3] })
      );
    }
    for (let i = 0; i <= nz; i += 1) {
      const z = -TORRE.profundidade / 2 + i * (TORRE.profundidade / nz);
      [-1, 1].forEach((s) =>
        lista.push({ p: [(s * TORRE.largura) / 2, TORRE.base + TORRE.altura / 2, z], e: [0.3, TORRE.altura, 0.3] })
      );
    }
    return lista;
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    dados.forEach((d, i) => {
      p.set(...d.p);
      s.set(...d.e);
      m.compose(p, q, s);
      malha.current.setMatrixAt(i, m);
    });
    malha.current.instanceMatrix.needsUpdate = true;
  }, [dados]);

  return (
    <instancedMesh ref={malha} args={[null, null, dados.length]} material={metal} frustumCulled>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

export default function Edificio({ qualidade = "alta" }) {
  const pos = REGIOES.edificio.pos;
  const rico = qualidade === "alta";

  const vidro = useVidro(COR.vidro, 0.5);
  const pedra = usePedra(COR.pedra);
  const concreto = useConcreto(COR.concreto, { roughness: 0.88 });

  return (
    <group position={pos}>
      {/* corpo de vidro */}
      <mesh material={vidro} position={[0, TORRE.base + TORRE.altura / 2, 0]}>
        <boxGeometry args={[TORRE.largura, TORRE.altura, TORRE.profundidade]} />
      </mesh>
      {/* núcleo opaco: sem ele o vidro lê como caixa vazia */}
      <mesh material={concreto} position={[0, TORRE.base + TORRE.altura / 2, 0]}>
        <boxGeometry args={[TORRE.largura * 0.42, TORRE.altura, TORRE.profundidade * 0.42]} />
      </mesh>

      <Lajes />
      {rico ? <Montantes /> : null}

      {/* coroamento: um recuo, como em torre corporativa de verdade */}
      <mesh material={concreto} position={[0, TORRE.base + TORRE.altura + 2.2, 0]}>
        <boxGeometry args={[TORRE.largura * 0.74, 4.4, TORRE.profundidade * 0.74]} />
      </mesh>

      {/* embasamento em pedra, mais largo que a torre */}
      <mesh material={pedra} position={[0, TORRE.base - 3, 0]}>
        <boxGeometry args={[TORRE.largura * 1.8, 6, TORRE.profundidade * 1.8]} />
      </mesh>

      {/* volume vizinho mais baixo: dá contexto urbano e escala à torre */}
      <mesh material={vidro} position={[-26, TORRE.base + 22, -14]}>
        <boxGeometry args={[18, 46, 16]} />
      </mesh>
      <mesh material={concreto} position={[-26, TORRE.base + 22, -14]}>
        <boxGeometry args={[7.5, 46, 6.7]} />
      </mesh>
    </group>
  );
}

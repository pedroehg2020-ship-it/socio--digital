/**
 * CIDADE — quadros 4, 5 e 8.
 *
 * Um tipo de objeto só: volumes de fachada. Cada torre é um prisma de vidro
 * com lajes horizontais expostas e montantes verticais no mesmo vão do
 * escritório (MODULO). Não há coroamento, antena, letreiro nem silhueta
 * "característica" — a elegância aqui vem da repetição regular e da bruma que
 * separa os planos, exatamente como numa fotografia de manhã.
 *
 * Tudo instanciado: a cidade inteira sai em três chamadas de desenho,
 * independentemente da quantidade de torres.
 */

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COR } from "@/components/landing/mundo/paleta";
import { MODULO } from "@/components/landing/mundo/regioes/Escritorio";
import { useAluminio, useConcreto, useVidroTorre } from "@/components/landing/mundo/materiais";

function ruido(i, s = 1) {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * As torres ficam fora do corredor por onde a câmera viaja, e nunca à frente
 * do painel de dados. `corredor` é a meia-largura livre.
 */
function useTorres(quantidade) {
  return useMemo(() => {
    const lista = [];
    for (let i = 0; i < quantidade; i += 1) {
      const perto = i < quantidade * 0.45;
      const lado = ruido(i, 3) > 0.5 ? 1 : -1;
      const corredor = perto ? 52 : 120;
      const x = lado * (corredor + ruido(i, 5) * (perto ? 90 : 240));
      const z = 20 - ruido(i, 7) * (perto ? 480 : 1000);
      const altura = (perto ? 60 : 40) + ruido(i, 11) * (perto ? 130 : 90);
      const largura = MODULO * (4 + Math.floor(ruido(i, 13) * 5));
      const prof = MODULO * (4 + Math.floor(ruido(i, 17) * 4));
      lista.push({ x, z, altura, largura, prof, giro: (ruido(i, 19) - 0.5) * 0.42 });
    }
    return lista;
  }, [quantidade]);
}

export default function Cidade({ quantidade = 90, qualidade = "alta" }) {
  const corpo = useRef();
  const lajes = useRef();
  const torres = useTorres(quantidade);
  const rico = qualidade === "alta";

  const vidro = useVidroTorre();
  const concreto = useConcreto(COR.concretoClaro, 0.8, 0.05);
  const base = useConcreto(COR.concretoSombra, 0.94, 0.02);

  /* Uma laje a cada 3 andares: o suficiente para dar escala, longe de virar
     listra. Em qualidade baixa a densidade cai pela metade. */
  const passo = MODULO * (rico ? 1.05 : 2.1);

  const dadosLajes = useMemo(() => {
    const lista = [];
    torres.forEach((t) => {
      for (let y = passo; y < t.altura; y += passo) {
        lista.push({ ...t, y });
      }
    });
    return lista;
  }, [torres, passo]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();

    torres.forEach((t, i) => {
      e.set(0, t.giro, 0);
      q.setFromEuler(e);
      p.set(t.x, -60 + t.altura / 2, t.z);
      s.set(t.largura, t.altura, t.prof);
      m.compose(p, q, s);
      corpo.current.setMatrixAt(i, m);
    });
    corpo.current.instanceMatrix.needsUpdate = true;

    dadosLajes.forEach((d, i) => {
      e.set(0, d.giro, 0);
      q.setFromEuler(e);
      p.set(d.x, -60 + d.y, d.z);
      s.set(d.largura + 0.5, 0.34, d.prof + 0.5);
      m.compose(p, q, s);
      lajes.current.setMatrixAt(i, m);
    });
    lajes.current.instanceMatrix.needsUpdate = true;
  }, [torres, dadosLajes]);

  return (
    <group>
      {/* solo: fecha o campo para baixo e some na bruma */}
      <mesh material={base} rotation={[-Math.PI / 2, 0, 0]} position={[0, -60.5, -320]}>
        <planeGeometry args={[2200, 2400]} />
      </mesh>

      <instancedMesh ref={corpo} args={[null, null, torres.length]} material={vidro} frustumCulled>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      <instancedMesh ref={lajes} args={[null, null, dadosLajes.length]} material={concreto} frustumCulled>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
}

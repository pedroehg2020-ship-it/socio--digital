/**
 * ESTRUTURA — o sítio onde a página inteira acontece.
 *
 * A versão anterior construía um túnel: pilares de altura aleatória com
 * faixas acesas, arcos de neon ciano cruzando o caminho e um chão em grade.
 * Aquilo era ficção científica, e era também o que fazia a cena parecer um
 * jogo. Saiu inteiro.
 *
 * No lugar entra o contexto que a narrativa pede: uma cidade ao longe, um
 * terreno e a bruma de distância. A cidade não é cenário aleatório — ela é a
 * razão de o escritório estar num último andar e de o edifício do cliente ter
 * escala. E ela some progressivamente sob a névoa conforme a câmera avança
 * para a região de dados, o que é o que permite a atmosfera mudar sem que a
 * página fique escura.
 *
 * Tudo instanciado: a cidade sai em duas chamadas de desenho.
 */

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COR } from "@/components/landing/mundo/paleta";
import { texturaBrilho } from "@/components/landing/mundo/comuns";

/** Ruído determinístico: a mesma cidade em toda visita e em todo aparelho. */
function ruido(i, s = 1) {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/* --------------------------------------------------------------- cidade */

/**
 * Malha urbana em duas faixas: uma próxima, com volumes altos e legíveis, e
 * uma distante que a névoa quase apaga. Os prédios ficam FORA do corredor por
 * onde a câmera passa — a cidade emoldura a viagem, não a obstrui.
 */
function Cidade({ quantidade = 130 }) {
  const corpo = useRef();
  const topo = useRef();

  const materialCorpo = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COR.marinhoClaro,
        roughness: 0.62,
        metalness: 0.35,
        envMapIntensity: 0.9,
      }),
    []
  );

  /* As lajes de topo pegam a luz do céu e desenham o skyline sem emissivo. */
  const materialTopo = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COR.concreto,
        roughness: 0.75,
        metalness: 0.1,
        envMapIntensity: 1.1,
      }),
    []
  );

  const dados = useMemo(() => {
    const lista = [];
    for (let i = 0; i < quantidade; i += 1) {
      const perto = i < quantidade * 0.4;
      // afastamento lateral: nunca menos de 58, que é a borda do corredor
      const lado = ruido(i, 3) > 0.5 ? 1 : -1;
      const x = lado * (58 + ruido(i, 5) * (perto ? 70 : 210));
      const z = 60 - ruido(i, 7) * (perto ? 420 : 900);
      const altura = (perto ? 34 : 22) + ruido(i, 11) * (perto ? 92 : 60);
      const largura = 12 + ruido(i, 13) * 20;
      const profundidade = 12 + ruido(i, 17) * 20;
      lista.push({ x, z, altura, largura, profundidade, giro: (ruido(i, 19) - 0.5) * 0.5 });
    }
    return lista;
  }, [quantidade]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();

    dados.forEach((d, i) => {
      e.set(0, d.giro, 0);
      q.setFromEuler(e);

      p.set(d.x, -70 + d.altura / 2, d.z);
      s.set(d.largura, d.altura, d.profundidade);
      m.compose(p, q, s);
      corpo.current.setMatrixAt(i, m);

      p.set(d.x, -70 + d.altura + 0.4, d.z);
      s.set(d.largura * 1.06, 0.8, d.profundidade * 1.06);
      m.compose(p, q, s);
      topo.current.setMatrixAt(i, m);
    });

    corpo.current.instanceMatrix.needsUpdate = true;
    topo.current.instanceMatrix.needsUpdate = true;
  }, [dados]);

  return (
    <>
      <instancedMesh
        ref={corpo}
        args={[null, null, dados.length]}
        material={materialCorpo}
        frustumCulled
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      <instancedMesh
        ref={topo}
        args={[null, null, dados.length]}
        material={materialTopo}
        frustumCulled
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </>
  );
}

/* -------------------------------------------------------------- terreno */

/**
 * O chão da cidade, lá embaixo. É um plano só, fosco e escuro, cuja função é
 * fechar o campo de visão para baixo: sem ele a cidade flutua no vazio.
 */
function Terreno() {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COR.marinho,
        roughness: 0.95,
        metalness: 0.05,
        envMapIntensity: 0.4,
      }),
    []
  );

  return (
    <mesh material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, -70.5, -320]}>
      <planeGeometry args={[1600, 1900]} />
    </mesh>
  );
}

/* ---------------------------------------------------------------- bruma */

/**
 * Partículas de atmosfera. Caíram de 1000 para 260 e deixaram de ser
 * aditivas: o que se quer é poeira suspensa na luz da tarde, não faísca.
 */
function Bruma({ quantidade = 260, parado = false }) {
  const ref = useRef();

  const geo = useMemo(() => {
    const pos = new Float32Array(quantidade * 3);
    for (let i = 0; i < quantidade; i += 1) {
      pos[i * 3] = (ruido(i, 11) - 0.5) * 190;
      pos[i * 3 + 1] = -30 + ruido(i, 13) * 90;
      pos[i * 3 + 2] = 40 - ruido(i, 7) * 760;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [quantidade]);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.85,
        map: texturaBrilho(),
        color: new THREE.Color(COR.branco),
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        sizeAttenuation: true,
        fog: true,
      }),
    []
  );

  useFrame((_, delta) => {
    if (parado || !ref.current) return;
    ref.current.rotation.y += Math.min(delta, 0.05) * 0.004;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

/* ------------------------------------------------------------ exportado */

export default function Estrutura({ qualidade = "alta", parado = false }) {
  const rico = qualidade === "alta";
  const medio = qualidade !== "baixa";

  return (
    <group>
      <Terreno />
      <Cidade quantidade={rico ? 140 : medio ? 90 : 50} />
      {medio ? <Bruma quantidade={rico ? 280 : 150} parado={parado} /> : null}
    </group>
  );
}

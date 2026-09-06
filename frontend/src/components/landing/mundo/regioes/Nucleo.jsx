/**
 * Núcleo — o objeto principal do hero.
 *
 * Não é um dashboard inclinado em perspectiva: é uma composição tridimensional
 * de verdade, com um centro sólido, cascas em rotação diferente, um cinturão
 * de painéis de dados voltados para fora e fluxos luminosos ligando o
 * cinturão ao centro. Tem uns 22 unidades de diâmetro, então a câmera nunca
 * consegue enquadrá-lo como "ícone".
 *
 * A leitura pretendida é a do produto: dados que chegam de várias frentes,
 * são processados no centro e voltam como decisão.
 */

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COR } from "@/components/landing/mundo/paleta";
import {
  Anel,
  Brilho,
  Fluxo,
  Painel,
  geoEsferaFina,
  useLonge,
} from "@/components/landing/mundo/comuns";
import { REGIOES } from "@/components/landing/mundo/rota";

const { pos: POS } = REGIOES.nucleo;

/* ------------------------------------------------------ centro do núcleo */

function Centro({ parado }) {
  const casca = useRef();
  const interno = useRef();

  useFrame((state, delta) => {
    if (parado) return;
    const d = Math.min(delta, 0.05);
    if (casca.current) {
      casca.current.rotation.y += d * 0.16;
      casca.current.rotation.x += d * 0.06;
    }
    if (interno.current) {
      interno.current.rotation.y -= d * 0.3;
      const p = 1 + Math.sin(state.clock.elapsedTime * 0.9) * 0.035;
      interno.current.scale.setScalar(p);
    }
  });

  return (
    <group>
      {/* casca facetada: a silhueta que o contraluz recorta */}
      <mesh ref={casca}>
        <icosahedronGeometry args={[3.5, 1]} />
        <meshStandardMaterial
          color={COR.casco2}
          roughness={0.14}
          metalness={0.92}
          envMapIntensity={1.3}
          flatShading
          transparent
          opacity={0.62}
        />
      </mesh>

      {/* arestas acesas sobre a casca */}
      <lineSegments>
        <edgesGeometry args={[new THREE.IcosahedronGeometry(3.52, 1)]} />
        <lineBasicMaterial
          color={COR.ciano}
          transparent
          opacity={0.55}
          toneMapped={false}
        />
      </lineSegments>

      {/* miolo emissivo — a fonte de luz da composição */}
      <mesh ref={interno}>
        <icosahedronGeometry args={[2.05, 2]} />
        <meshStandardMaterial
          color={COR.cianoClaro}
          emissive={new THREE.Color(COR.ciano)}
          emissiveIntensity={2.6}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>

      <Brilho cor={COR.ciano} tamanho={17} opacidade={0.34} />
      <Brilho cor={COR.azulClaro} tamanho={30} opacidade={0.11} />
    </group>
  );
}

/* ------------------------------------------------- cinturão de painéis */

function Cinturao({ parado }) {
  const grupo = useRef();

  const painéis = useMemo(() => {
    const lista = [];
    const total = 7;
    for (let i = 0; i < total; i += 1) {
      const a = (i / total) * Math.PI * 2;
      const raio = 8.4;
      lista.push({
        pos: [Math.cos(a) * raio, Math.sin(i * 2.1) * 2.4, Math.sin(a) * raio],
        giro: [0, -a + Math.PI / 2, 0],
        tipo: i % 3,
        largura: 4.4 + (i % 2) * 0.9,
        altura: 2.7 + (i % 3) * 0.35,
      });
    }
    return lista;
  }, []);

  useFrame((_, delta) => {
    if (parado || !grupo.current) return;
    grupo.current.rotation.y += Math.min(delta, 0.05) * 0.075;
  });

  return (
    <group ref={grupo}>
      {painéis.map((p, i) => (
        <Painel
          key={i}
          position={p.pos}
          rotation={p.giro}
          largura={p.largura}
          altura={p.altura}
          tipo={p.tipo}
          cor={i % 4 === 0 ? COR.verde : COR.ciano}
          opacidade={0.92}
        />
      ))}
    </group>
  );
}

/* ---------------------------------------------------- satélites de dado */

function Satelites({ quantidade = 54, parado }) {
  const malha = useRef();
  const longe = useLonge(POS, 120);

  const semente = useMemo(() => {
    const lista = [];
    for (let i = 0; i < quantidade; i += 1) {
      lista.push({
        raio: 5.4 + ((i * 37) % 90) / 10,
        alt: (((i * 53) % 100) / 100 - 0.5) * 9,
        fase: ((i * 71) % 100) / 100 * Math.PI * 2,
        vel: 0.1 + (((i * 29) % 60) / 600),
        tam: 0.08 + (((i * 17) % 40) / 400),
      });
    }
    return lista;
  }, [quantidade]);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!malha.current || parado || longe.current) return;
    const t = state.clock.elapsedTime;
    semente.forEach((s, i) => {
      const a = s.fase + t * s.vel;
      v.set(Math.cos(a) * s.raio, s.alt + Math.sin(a * 2) * 0.5, Math.sin(a) * s.raio);
      e.setScalar(s.tam);
      m.compose(v, q, e);
      malha.current.setMatrixAt(i, m);
    });
    malha.current.instanceMatrix.needsUpdate = true;
  });

  useLayoutEffect(() => {
    const mm = new THREE.Matrix4();
    const vv = new THREE.Vector3();
    const qq = new THREE.Quaternion();
    const ee = new THREE.Vector3();
    semente.forEach((s, i) => {
      vv.set(Math.cos(s.fase) * s.raio, s.alt, Math.sin(s.fase) * s.raio);
      ee.setScalar(s.tam);
      mm.compose(vv, qq, ee);
      malha.current.setMatrixAt(i, mm);
    });
    malha.current.instanceMatrix.needsUpdate = true;
  }, [semente]);

  return (
    <instancedMesh ref={malha} args={[geoEsferaFina(), null, quantidade]}>
      <meshBasicMaterial color={COR.cianoClaro} toneMapped={false} />
    </instancedMesh>
  );
}

/* -------------------------------------------------------------- região */

export default function Nucleo({ parado = false, qualidade = "alta" }) {
  const rico = qualidade === "alta";
  const aneis = useRef();

  useFrame((_, delta) => {
    if (parado || !aneis.current) return;
    const d = Math.min(delta, 0.05);
    aneis.current.rotation.z += d * 0.05;
    aneis.current.rotation.x += d * 0.02;
  });

  // Fluxos do cinturão para o centro: entrada de dado virando decisão.
  const fluxos = useMemo(
    () =>
      [0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + 0.4;
        const r = 8.2;
        return [
          [Math.cos(a) * r, Math.sin(i * 1.7) * 2.2, Math.sin(a) * r],
          [Math.cos(a) * r * 0.62, Math.sin(i * 1.7) * 1.1 + 1.2, Math.sin(a) * r * 0.62],
          [Math.cos(a) * 2.4, 0.2, Math.sin(a) * 2.4],
        ];
      }),
    []
  );

  return (
    <group position={POS}>
      <Centro parado={parado} />

      <group ref={aneis}>
        <Anel raio={5.6} espessura={0.035} cor={COR.ciano} opacidade={0.6} rotation={[1.35, 0.2, 0]} />
        <Anel raio={7.2} espessura={0.03} cor={COR.azul} opacidade={0.45} rotation={[0.5, 0.9, 0.4]} />
        <Anel raio={9.4} espessura={0.025} cor={COR.violeta} opacidade={0.3} rotation={[1.9, 0.3, 1.1]} />
      </group>

      <Cinturao parado={parado} />

      {fluxos.map((pontos, i) => (
        <Fluxo
          key={i}
          pontos={pontos}
          cor={i % 3 === 0 ? COR.verde : COR.ciano}
          espessura={0.045}
          velocidade={0.5 + i * 0.06}
          opacidade={0.8}
          segmentos={rico ? 48 : 24}
          parado={parado}
        />
      ))}

      {rico ? <Satelites parado={parado} /> : null}
    </group>
  );
}

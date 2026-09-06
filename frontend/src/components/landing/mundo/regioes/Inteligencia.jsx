/**
 * Regiões de inteligência: Radar e IA.
 *
 *   Radar → um disco horizontal com anéis concêntricos, varredura girando e
 *           sinais que acendem quando o feixe passa por cima. É a leitura
 *           literal do "radar inteligente": alguém varrendo os dados atrás do
 *           problema antes de você.
 *   IA    → o objeto terminal da viagem. Um núcleo emissivo dentro de uma
 *           casca de nós ligados, alimentado por fluxos que vêm de longe.
 *           A câmera passa cinco seções se aproximando dele.
 *
 * A IA é a região mais pesada da cena, e de propósito: ela só entra no campo
 * de visão na segunda metade da página, quando as regiões da primeira metade
 * já saíram do enquadramento.
 */

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COR } from "@/components/landing/mundo/paleta";
import {
  Anel,
  Brilho,
  Fluxo,
  Grade,
  Painel,
  geoEsferaFina,
  texturaBrilho,
  useLonge,
} from "@/components/landing/mundo/comuns";
import { REGIOES } from "@/components/landing/mundo/rota";

function ruido(i, s = 1) {
  const v = Math.sin(i * 41.7 + s * 83.3) * 43758.5453;
  return v - Math.floor(v);
}

/* ============================================================ RADAR === */

export function Radar({ parado = false, qualidade = "alta" }) {
  const { pos } = REGIOES.radar;
  const longe = useLonge(pos, 160);
  const rico = qualidade === "alta";
  const totalSinais = rico ? 26 : 14;

  const varredura = useRef();
  const sinais = useRef();
  const matSinais = useRef();

  /** Sinais em coordenadas polares — o ângulo é o que o feixe vai cruzar. */
  const alvos = useMemo(
    () =>
      Array.from({ length: totalSinais }, (_, i) => {
        const a = ruido(i, 1) * Math.PI * 2;
        const r = 2.4 + ruido(i, 2) * 10.2;
        return {
          a,
          p: [Math.cos(a) * r, ruido(i, 5) * 0.6 - 0.3, Math.sin(a) * r],
          grave: ruido(i, 7) > 0.78,
          tam: 0.2 + ruido(i, 9) * 0.24,
        };
      }),
    [totalSinais]
  );

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const v = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const e = new THREE.Vector3();
    const cor = new THREE.Color();
    alvos.forEach((s, i) => {
      v.set(s.p[0], s.p[1], s.p[2]);
      e.setScalar(s.tam);
      m.compose(v, q, e);
      sinais.current.setMatrixAt(i, m);
      cor.set(s.grave ? COR.ambar : COR.cianoClaro);
      sinais.current.setColorAt(i, cor);
    });
    sinais.current.instanceMatrix.needsUpdate = true;
    if (sinais.current.instanceColor) sinais.current.instanceColor.needsUpdate = true;
  }, [alvos]);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (parado || longe.current) return;
    const t = state.clock.elapsedTime;
    const angulo = (t * 0.55) % (Math.PI * 2);

    if (varredura.current) varredura.current.rotation.z = -angulo;

    // cada sinal cresce quando o feixe acabou de passar e decai depois
    if (sinais.current) {
      alvos.forEach((s, i) => {
        let d = angulo - s.a;
        while (d < 0) d += Math.PI * 2;
        const brilho = Math.exp(-d * 1.9);
        const escala = s.tam * (1 + brilho * 2.1);
        v.set(s.p[0], s.p[1], s.p[2]);
        e.setScalar(escala);
        m.compose(v, q, e);
        sinais.current.setMatrixAt(i, m);
      });
      sinais.current.instanceMatrix.needsUpdate = true;
    }
  });

  /** Retículas radiais do disco. */
  const reticulas = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      pts.push(0, 0, 0, Math.cos(a) * 12.6, 0, Math.sin(a) * 12.6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  return (
    <group position={pos}>
      {/* disco: anéis concêntricos deitados */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        {[3.6, 6.6, 9.6, 12.6].map((r, i) => (
          <Anel
            key={r}
            raio={r}
            espessura={i === 3 ? 0.05 : 0.025}
            cor={COR.ciano}
            opacidade={0.55 - i * 0.08}
          />
        ))}

        {/* setor de varredura */}
        <group ref={varredura}>
          <mesh>
            <circleGeometry args={[12.6, 40, 0, Math.PI / 3.4]} />
            <meshBasicMaterial
              color={COR.ciano}
              transparent
              opacity={0.14}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          {/* borda de ataque do feixe */}
          <mesh position={[6.3, 0, 0.02]}>
            <planeGeometry args={[12.6, 0.09]} />
            <meshBasicMaterial
              color={COR.cianoClaro}
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>

      <lineSegments geometry={reticulas}>
        <lineBasicMaterial
          color={COR.azul}
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <instancedMesh ref={sinais} args={[geoEsferaFina(), null, totalSinais]}>
        <meshBasicMaterial ref={matSinais} transparent opacity={0.95} toneMapped={false} />
      </instancedMesh>

      {/* mastro central do radar */}
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.12, 0.2, 5.2, 8]} />
        <meshStandardMaterial color={COR.casco2} roughness={0.3} metalness={0.9} />
      </mesh>
      <Brilho position={[0, 5.4, 0]} cor={COR.ciano} tamanho={7} opacidade={0.5} />
      <Brilho cor={COR.azul} tamanho={26} opacidade={0.12} />

      <Painel
        position={[-8.4, 5.4, 4.6]}
        rotation={[0, 0.85, 0]}
        largura={4.8}
        altura={2.9}
        tipo={2}
        cor={COR.ambar}
      />
    </group>
  );
}

/* =============================================================== IA === */

/** Enxame que orbita o núcleo — o "processamento" visível. */
function Enxame({ quantidade = 420, parado, longe }) {
  const ref = useRef();

  const geo = useMemo(() => {
    const p = new Float32Array(quantidade * 3);
    for (let i = 0; i < quantidade; i += 1) {
      const a = ruido(i, 1) * Math.PI * 2;
      const b = Math.acos(2 * ruido(i, 2) - 1);
      const r = 4.4 + ruido(i, 3) * 7.4;
      p[i * 3] = Math.sin(b) * Math.cos(a) * r;
      p[i * 3 + 1] = Math.cos(b) * r * 0.8;
      p[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, [quantidade]);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.32,
        map: texturaBrilho(),
        color: new THREE.Color(COR.cianoClaro),
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );

  useFrame((state, delta) => {
    if (parado || longe.current || !ref.current) return;
    const d = Math.min(delta, 0.05);
    ref.current.rotation.y += d * 0.13;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.14;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

export function IA({ parado = false, qualidade = "alta" }) {
  const { pos } = REGIOES.ia;
  const longe = useLonge(pos, 190);
  const rico = qualidade === "alta";
  const totalNos = rico ? 96 : 48;

  const casca = useRef();
  const nucleo = useRef();
  const nos = useRef();

  const pontos = useMemo(() => {
    const lista = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < totalNos; i += 1) {
      const y = 1 - (i / (totalNos - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = phi * i;
      const raio = 8.6;
      lista.push([Math.cos(th) * r * raio, y * raio, Math.sin(th) * r * raio]);
    }
    return lista;
  }, [totalNos]);

  const ligacoes = useMemo(() => {
    const seg = [];
    const limite = rico ? 3.4 : 4.4;
    for (let i = 0; i < pontos.length; i += 1) {
      for (let j = i + 1; j < pontos.length; j += 1) {
        const a = pontos[i];
        const b = pontos[j];
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        const dz = a[2] - b[2];
        if (dx * dx + dy * dy + dz * dz < limite * limite) {
          seg.push(a[0], a[1], a[2], b[0], b[1], b[2]);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
    return g;
  }, [pontos, rico]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const v = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const e = new THREE.Vector3();
    pontos.forEach((p, i) => {
      v.set(p[0], p[1], p[2]);
      e.setScalar(0.19);
      m.compose(v, q, e);
      nos.current.setMatrixAt(i, m);
    });
    nos.current.instanceMatrix.needsUpdate = true;
  }, [pontos]);

  useFrame((state, delta) => {
    if (parado || longe.current) return;
    const d = Math.min(delta, 0.05);
    if (casca.current) {
      casca.current.rotation.y += d * 0.055;
      casca.current.rotation.z += d * 0.02;
    }
    if (nucleo.current) {
      const p = 1 + Math.sin(state.clock.elapsedTime * 1.3) * 0.06;
      nucleo.current.scale.setScalar(p);
      nucleo.current.rotation.y -= d * 0.22;
    }
  });

  /** Seis afluentes vindo de fora do campo de visão para dentro do núcleo. */
  const afluentes = useMemo(
    () =>
      [0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        const r = 22;
        return [
          [Math.cos(a) * r, Math.sin(i * 1.3) * 9, Math.sin(a) * r],
          [Math.cos(a) * 13, Math.sin(i * 1.3) * 4.5, Math.sin(a) * 13],
          [Math.cos(a + 0.4) * 6, Math.sin(i) * 1.6, Math.sin(a + 0.4) * 6],
          [0, 0, 0],
        ];
      }),
    []
  );

  return (
    <group position={pos}>
      {/* núcleo */}
      <group ref={nucleo}>
        <mesh>
          <icosahedronGeometry args={[2.9, 3]} />
          <meshStandardMaterial
            color={COR.cianoClaro}
            emissive={new THREE.Color(COR.ciano)}
            emissiveIntensity={2.9}
            roughness={0.25}
            toneMapped={false}
          />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[4.1, 1]} />
          <meshStandardMaterial
            color={COR.violeta}
            wireframe
            transparent
            opacity={0.5}
            toneMapped={false}
          />
        </mesh>
      </group>

      <Brilho cor={COR.ciano} tamanho={22} opacidade={0.4} />
      <Brilho cor={COR.violeta} tamanho={42} opacidade={0.12} />

      {/* casca neural */}
      <group ref={casca}>
        <instancedMesh ref={nos} args={[geoEsferaFina(), null, totalNos]}>
          <meshBasicMaterial color={COR.cianoClaro} toneMapped={false} />
        </instancedMesh>
        <lineSegments geometry={ligacoes}>
          <lineBasicMaterial
            color={COR.azul}
            transparent
            opacity={0.22}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      </group>

      {afluentes.map((pts, i) => (
        <Fluxo
          key={i}
          pontos={pts}
          cor={i % 3 === 0 ? COR.violeta : COR.ciano}
          espessura={0.05}
          velocidade={-(0.45 + i * 0.05)}
          opacidade={0.75}
          segmentos={rico ? 72 : 32}
          parado={parado}
        />
      ))}

      <Anel raio={12.4} espessura={0.03} cor={COR.ciano} opacidade={0.4} rotation={[1.4, 0.3, 0]} />
      <Anel raio={15.2} espessura={0.022} cor={COR.violeta} opacidade={0.26} rotation={[0.6, 1.1, 0.5]} />

      <Enxame quantidade={rico ? 460 : 200} parado={parado} longe={longe} />

      <Grade position={[0, -13, 0]} tamanho={44} divisoes={18} cor={COR.ciano} opacidade={0.14} />
    </group>
  );
}

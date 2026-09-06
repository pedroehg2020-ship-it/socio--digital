/**
 * Regiões do dinheiro: Financeiro e Agenda.
 *
 *   Financeiro → dois anéis, entrada e saída, ligados por fluxos que correm
 *                em sentidos opostos; entre eles, colunas de saldo projetado.
 *   Agenda     → uma fileira de marcos semanais que se afasta em perspectiva,
 *                com os três vencimentos da semana acesos e os vencidos em
 *                âmbar, cortada por uma linha de tempo em movimento.
 *
 * Nenhuma moeda, nenhuma cédula, nenhum cofre: o dinheiro aqui é volume e
 * direção, que é como ele aparece de fato em um sistema.
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
  geoCubo,
  useLonge,
} from "@/components/landing/mundo/comuns";
import { REGIOES } from "@/components/landing/mundo/rota";

function ruido(i, s = 1) {
  const v = Math.sin(i * 73.3 + s * 19.7) * 43758.5453;
  return v - Math.floor(v);
}

/* ====================================================== FINANCEIRO ==== */

/** Colunas de saldo projetado entre os dois anéis. */
function Saldo({ quantidade = 22, parado, longe }) {
  const malha = useRef();
  const topo = useRef();

  const base = useMemo(
    () =>
      Array.from({ length: quantidade }, (_, i) => ({
        x: (i - (quantidade - 1) / 2) * 0.62,
        altura: 1.2 + Math.sin(i * 0.42) * 1.6 + ruido(i, 4) * 1.5,
        fase: ruido(i, 8) * Math.PI * 2,
      })),
    [quantidade]
  );

  const m = useMemo(() => new THREE.Matrix4(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Vector3(), []);

  const escrever = (t) => {
    base.forEach((b, i) => {
      const h = Math.max(0.3, b.altura * (1 + Math.sin(t * 0.8 + b.fase) * 0.14));
      v.set(b.x, h / 2 - 3.2, 0);
      e.set(0.34, h, 0.34);
      m.compose(v, q, e);
      malha.current.setMatrixAt(i, m);

      v.set(b.x, h - 3.2, 0);
      e.set(0.4, 0.06, 0.4);
      m.compose(v, q, e);
      topo.current.setMatrixAt(i, m);
    });
    malha.current.instanceMatrix.needsUpdate = true;
    topo.current.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => escrever(0), [base]);
  useFrame((state) => {
    if (parado || longe.current) return;
    escrever(state.clock.elapsedTime);
  });

  return (
    <>
      <instancedMesh ref={malha} args={[geoCubo(), null, quantidade]}>
        <meshStandardMaterial color={COR.marinhoClaro} roughness={0.22} metalness={0.86} />
      </instancedMesh>
      <instancedMesh ref={topo} args={[geoCubo(), null, quantidade]}>
        <meshBasicMaterial color={COR.cianoClaro} toneMapped={false} />
      </instancedMesh>
    </>
  );
}

export function Financeiro({ parado = false, qualidade = "alta" }) {
  const { pos } = REGIOES.financeiro;
  const longe = useLonge(pos, 150);
  const rico = qualidade === "alta";

  const entrada = useRef();
  const saida = useRef();

  useFrame((_, delta) => {
    if (parado || longe.current) return;
    const d = Math.min(delta, 0.05);
    if (entrada.current) entrada.current.rotation.z += d * 0.22;
    if (saida.current) saida.current.rotation.z -= d * 0.17;
  });

  // fluxos cruzando de um anel ao outro, em sentidos opostos
  const paraDentro = useMemo(
    () =>
      [0, 1, 2].map((i) => [
        [-8.4, -1.4 + i * 1.3, 0],
        [-3.6, 1.2 + i * 0.6, 1.6 - i],
        [1.2, -0.4 + i * 0.9, -1.2 + i],
        [8.4, 0.9 + i * 0.7, 0],
      ]),
    []
  );

  return (
    <group position={pos}>
      {/* anel de entrada — a receber */}
      <group ref={entrada} position={[-8.4, 0.4, 0]}>
        <Anel raio={3.5} espessura={0.09} cor={COR.positivo} opacidade={0.9} />
        <Anel raio={2.6} espessura={0.04} cor={COR.cianoClaro} opacidade={0.5} />
        <Brilho cor={COR.positivo} tamanho={9} opacidade={0.3} />
      </group>

      {/* anel de saída — a pagar */}
      <group ref={saida} position={[8.4, 0.9, 0]}>
        <Anel raio={3.1} espessura={0.08} cor={COR.azul} opacidade={0.85} />
        <Anel raio={2.2} espessura={0.035} cor={COR.azulClaro} opacidade={0.45} />
        <Brilho cor={COR.azul} tamanho={8} opacidade={0.3} />
      </group>

      {paraDentro.map((pts, i) => (
        <Fluxo
          key={`d-${i}`}
          pontos={pts}
          cor={COR.ciano}
          espessura={0.05}
          velocidade={-(0.4 + i * 0.1)}
          segmentos={rico ? 64 : 28}
          parado={parado}
        />
      ))}
      {paraDentro.map((pts, i) => (
        <Fluxo
          key={`v-${i}`}
          pontos={pts.map((p) => [p[0], p[1] - 2.6, p[2] * -1])}
          cor={COR.azul}
          espessura={0.038}
          opacidade={0.55}
          velocidade={0.34 + i * 0.08}
          segmentos={rico ? 56 : 24}
          parado={parado}
        />
      ))}

      <Saldo quantidade={rico ? 24 : 14} parado={parado} longe={longe} />

      <Grade position={[0, -3.4, 0]} tamanho={24} divisoes={12} cor={COR.azul} opacidade={0.2} />

      <Painel
        position={[0.5, 5.4, -2.4]}
        rotation={[0, 0.12, 0]}
        largura={6}
        altura={3.4}
        tipo={0}
        cor={COR.ciano}
      />
    </group>
  );
}

/* =========================================================== AGENDA === */

export function Agenda({ parado = false, qualidade = "alta" }) {
  const { pos } = REGIOES.agenda;
  const longe = useLonge(pos, 150);
  const rico = qualidade === "alta";
  const total = rico ? 18 : 11;

  const hastes = useRef();
  const marcas = useRef();

  const dados = useMemo(
    () =>
      Array.from({ length: total }, (_, i) => {
        const r = ruido(i, 3);
        return {
          z: (i - (total - 1) / 2) * 1.9,
          altura: 1.4 + r * 5.2,
          semana: i > total - 6 && i <= total - 2, // vence nesta semana
          vencido: r > 0.9,
        };
      }),
    [total]
  );

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const v = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const e = new THREE.Vector3();
    const cor = new THREE.Color();

    dados.forEach((d, i) => {
      v.set(0, d.altura / 2 - 3, d.z);
      e.set(0.22, d.altura, 0.22);
      m.compose(v, q, e);
      hastes.current.setMatrixAt(i, m);

      v.set(0, d.altura - 3, d.z);
      e.set(1.5, 0.09, 0.5);
      m.compose(v, q, e);
      marcas.current.setMatrixAt(i, m);
      cor.set(d.vencido ? COR.ambar : d.semana ? COR.cianoClaro : COR.concretoClaro);
      marcas.current.setColorAt(i, cor);
    });
    hastes.current.instanceMatrix.needsUpdate = true;
    marcas.current.instanceMatrix.needsUpdate = true;
    if (marcas.current.instanceColor) marcas.current.instanceColor.needsUpdate = true;
  }, [dados]);

  const grupo = useRef();
  useFrame((state) => {
    if (parado || longe.current || !grupo.current) return;
    grupo.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.28;
  });

  const linha = useMemo(
    () => [
      [-2.2, 1.4, -(total / 2) * 1.9 - 3],
      [0.4, 2.6, 0],
      [-1.4, 1.2, (total / 2) * 1.9 + 3],
    ],
    [total]
  );

  return (
    <group position={pos} rotation={[0, 0.5, 0]}>
      <group ref={grupo}>
        <instancedMesh ref={hastes} args={[geoCubo(), null, total]}>
          <meshStandardMaterial color={COR.marinhoClaro} roughness={0.28} metalness={0.8} />
        </instancedMesh>
        <instancedMesh ref={marcas} args={[geoCubo(), null, total]}>
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      </group>

      <Fluxo
        pontos={linha}
        cor={COR.ciano}
        espessura={0.06}
        velocidade={0.6}
        segmentos={rico ? 64 : 28}
        parado={parado}
      />

      <Grade position={[0, -3.1, 0]} tamanho={30} divisoes={15} cor={COR.azul} opacidade={0.16} />
      <Brilho position={[0, 1, 0]} cor={COR.ciano} tamanho={16} opacidade={0.16} />

      <Painel
        position={[5.4, 3.2, 2]}
        rotation={[0, -0.75, 0]}
        largura={4.2}
        altura={2.6}
        tipo={2}
        cor={COR.ambar}
      />
    </group>
  );
}

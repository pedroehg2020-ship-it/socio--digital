/**
 * Regiões da operação: Vendas, Estoque e Clientes.
 *
 * Cada uma traduz o módulo em estrutura, não em ícone:
 *
 *   Vendas   → um relevo de colunas que cresce, atravessado por uma curva de
 *              pedidos em movimento;
 *   Estoque  → uma estante tridimensional de células, com as posições abaixo
 *              do mínimo acesas em âmbar;
 *   Clientes → uma constelação de nós ligados, com a carteira ativa brilhando
 *              mais que a inativa.
 *
 * As três compartilham material, brilho e grade com o resto do mundo, então
 * pertencem visivelmente ao mesmo ambiente.
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
  geoEsferaFina,
  useLonge,
} from "@/components/landing/mundo/comuns";
import { REGIOES } from "@/components/landing/mundo/rota";

function ruido(i, s = 1) {
  const v = Math.sin(i * 91.7 + s * 47.3) * 43758.5453;
  return v - Math.floor(v);
}

/* ========================================================= VENDAS ===== */

function Relevo({ colunas = 16, linhas = 8, parado, longe }) {
  const malha = useRef();
  const topos = useRef();
  const total = colunas * linhas;

  const base = useMemo(() => {
    const lista = [];
    for (let c = 0; c < colunas; c += 1) {
      for (let l = 0; l < linhas; l += 1) {
        const i = c * linhas + l;
        lista.push({
          x: (c - (colunas - 1) / 2) * 1.15,
          z: (l - (linhas - 1) / 2) * 1.15,
          // a tendência sobe da esquerda para a direita: é uma curva de
          // crescimento, não um ruído qualquer
          altura: 0.7 + (c / colunas) * 6.2 + ruido(i, 3) * 2.4,
          fase: ruido(i, 9) * Math.PI * 2,
        });
      }
    }
    return lista;
  }, [colunas, linhas]);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Vector3(), []);

  const escrever = (t) => {
    base.forEach((b, i) => {
      const h = b.altura * (1 + Math.sin(t * 0.7 + b.fase) * 0.09);
      v.set(b.x, h / 2 - 4, b.z);
      e.set(0.72, h, 0.72);
      m.compose(v, q, e);
      malha.current.setMatrixAt(i, m);

      v.set(b.x, h - 4, b.z);
      e.set(0.78, 0.09, 0.78);
      m.compose(v, q, e);
      topos.current.setMatrixAt(i, m);
    });
    malha.current.instanceMatrix.needsUpdate = true;
    topos.current.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => escrever(0), [base]);
  useFrame((state) => {
    if (parado || longe.current) return;
    escrever(state.clock.elapsedTime);
  });

  return (
    <>
      <instancedMesh ref={malha} args={[geoCubo(), null, total]}>
        <meshStandardMaterial
          color={COR.marinhoClaro}
          roughness={0.2}
          metalness={0.85}
          envMapIntensity={1.1}
        />
      </instancedMesh>
      <instancedMesh ref={topos} args={[geoCubo(), null, total]}>
        <meshBasicMaterial color={COR.ciano} toneMapped={false} />
      </instancedMesh>
    </>
  );
}

export function Vendas({ parado = false, qualidade = "alta" }) {
  const { pos } = REGIOES.vendas;
  const longe = useLonge(pos, 150);
  const rico = qualidade === "alta";

  const curva = useMemo(
    () => [
      [-9.5, -2.6, 3],
      [-4.5, 0.4, 0.5],
      [0, 2.2, -1],
      [5, 4.4, -0.5],
      [9.8, 6.6, 2],
    ],
    []
  );

  return (
    <group position={pos}>
      <Relevo
        colunas={rico ? 16 : 11}
        linhas={rico ? 8 : 5}
        parado={parado}
        longe={longe}
      />

      {/* curva de pedidos correndo por cima do relevo */}
      <Fluxo
        pontos={curva}
        cor={COR.positivo}
        espessura={0.09}
        velocidade={0.55}
        segmentos={rico ? 72 : 32}
        parado={parado}
      />
      <Fluxo
        pontos={curva.map((p) => [p[0], p[1] + 1.5, p[2] + 2.4])}
        cor={COR.ciano}
        espessura={0.05}
        velocidade={0.4}
        opacidade={0.6}
        segmentos={rico ? 64 : 28}
        parado={parado}
      />

      <Grade position={[0, -4.1, 0]} tamanho={26} divisoes={13} cor={COR.azul} opacidade={0.22} />

      <Painel
        position={[7.4, 4.2, 5.4]}
        rotation={[0, -0.62, 0]}
        largura={5}
        altura={3}
        tipo={1}
        cor={COR.positivo}
      />

      <Brilho position={[8, 6.4, 1]} cor={COR.positivo} tamanho={13} opacidade={0.24} />
      <Brilho position={[-6, -1, 0]} cor={COR.azul} tamanho={16} opacidade={0.16} />
    </group>
  );
}

/* ======================================================== ESTOQUE ===== */

export function Estoque({ parado = false, qualidade = "alta" }) {
  const { pos } = REGIOES.estoque;
  const longe = useLonge(pos, 150);
  const rico = qualidade === "alta";

  const cols = rico ? 10 : 7;
  const rows = rico ? 6 : 4;
  const deep = rico ? 3 : 2;

  const celulas = useMemo(() => {
    const lista = [];
    for (let x = 0; x < cols; x += 1) {
      for (let y = 0; y < rows; y += 1) {
        for (let z = 0; z < deep; z += 1) {
          const i = (x * rows + y) * deep + z;
          const r = ruido(i, 5);
          lista.push({
            pos: [
              (x - (cols - 1) / 2) * 1.7,
              (y - (rows - 1) / 2) * 1.5,
              (z - (deep - 1) / 2) * 1.9,
            ],
            // ~12% das posições estão abaixo do ponto mínimo
            baixo: r > 0.88,
            vazio: r < 0.12,
            fase: r * Math.PI * 2,
          });
        }
      }
    }
    return lista;
  }, [cols, rows, deep]);

  const cheias = useMemo(() => celulas.filter((c) => !c.vazio && !c.baixo), [celulas]);
  const alertas = useMemo(() => celulas.filter((c) => c.baixo), [celulas]);

  const malha = useRef();
  const luz = useRef();
  const alerta = useRef();

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const v = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const e = new THREE.Vector3();

    celulas.forEach((c, i) => {
      v.set(c.pos[0], c.pos[1], c.pos[2]);
      e.set(1.45, 1.25, 1.6);
      m.compose(v, q, e);
      malha.current.setMatrixAt(i, m);
    });
    malha.current.instanceMatrix.needsUpdate = true;

    cheias.forEach((c, i) => {
      v.set(c.pos[0], c.pos[1] - 0.6, c.pos[2]);
      e.set(1.2, 0.07, 1.35);
      m.compose(v, q, e);
      luz.current.setMatrixAt(i, m);
    });
    luz.current.instanceMatrix.needsUpdate = true;

    alertas.forEach((c, i) => {
      v.set(c.pos[0], c.pos[1] - 0.6, c.pos[2]);
      e.set(1.2, 0.07, 1.35);
      m.compose(v, q, e);
      alerta.current.setMatrixAt(i, m);
    });
    alerta.current.instanceMatrix.needsUpdate = true;
  }, [celulas, cheias, alertas]);

  // as posições em alerta pulsam; o resto da estante fica parado de propósito
  const matAlerta = useRef();
  useFrame((state) => {
    if (parado || longe.current || !matAlerta.current) return;
    matAlerta.current.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 2.4) * 0.4;
  });

  return (
    <group position={pos}>
      <group rotation={[0, 0.34, 0]}>
        <instancedMesh ref={malha} args={[geoCubo(), null, celulas.length]}>
          <meshStandardMaterial
            color={COR.marinho}
            roughness={0.32}
            metalness={0.8}
            envMapIntensity={0.9}
            transparent
            opacity={0.9}
          />
        </instancedMesh>

        <instancedMesh ref={luz} args={[geoCubo(), null, Math.max(1, cheias.length)]}>
          <meshBasicMaterial color={COR.ciano} transparent opacity={0.85} toneMapped={false} />
        </instancedMesh>

        <instancedMesh ref={alerta} args={[geoCubo(), null, Math.max(1, alertas.length)]}>
          <meshBasicMaterial ref={matAlerta} color={COR.ambar} transparent opacity={0.9} toneMapped={false} />
        </instancedMesh>
      </group>

      <Grade position={[0, -5.6, 0]} tamanho={24} divisoes={12} cor={COR.ciano} opacidade={0.18} />

      <Painel
        position={[-7.8, 3.4, 4.2]}
        rotation={[0, 0.7, 0]}
        largura={4.6}
        altura={2.8}
        tipo={2}
        cor={COR.ambar}
      />

      <Brilho position={[0, 0, 3]} cor={COR.azul} tamanho={20} opacidade={0.14} />
    </group>
  );
}

/* ======================================================= CLIENTES ===== */

export function Clientes({ parado = false, qualidade = "alta" }) {
  const { pos } = REGIOES.clientes;
  const longe = useLonge(pos, 150);
  const rico = qualidade === "alta";
  const total = rico ? 78 : 40;

  const grupo = useRef();
  const nos = useRef();
  const matNos = useRef();

  /** Distribuição em espiral de Fibonacci: cobertura uniforme da esfera. */
  const pontos = useMemo(() => {
    const lista = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < total; i += 1) {
      const y = 1 - (i / (total - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = phi * i;
      const raio = 7.6 + ruido(i, 2) * 1.4;
      lista.push({
        p: [Math.cos(th) * r * raio, y * raio * 0.82, Math.sin(th) * r * raio],
        ativo: ruido(i, 6) > 0.34,
        tam: 0.16 + ruido(i, 8) * 0.2,
      });
    }
    return lista;
  }, [total]);

  /** Ligações entre vizinhos próximos — a carteira como rede, não como lista. */
  const ligacoes = useMemo(() => {
    const seg = [];
    const limite = rico ? 4.6 : 4.0;
    for (let i = 0; i < pontos.length; i += 1) {
      for (let j = i + 1; j < pontos.length; j += 1) {
        const a = pontos[i].p;
        const b = pontos[j].p;
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
    const cor = new THREE.Color();
    pontos.forEach((n, i) => {
      v.set(n.p[0], n.p[1], n.p[2]);
      e.setScalar(n.tam * (n.ativo ? 1.35 : 0.85));
      m.compose(v, q, e);
      nos.current.setMatrixAt(i, m);
      cor.set(n.ativo ? COR.cianoClaro : COR.concretoClaro);
      nos.current.setColorAt(i, cor);
    });
    nos.current.instanceMatrix.needsUpdate = true;
    if (nos.current.instanceColor) nos.current.instanceColor.needsUpdate = true;
  }, [pontos]);

  useFrame((_, delta) => {
    if (parado || longe.current || !grupo.current) return;
    const d = Math.min(delta, 0.05);
    grupo.current.rotation.y += d * 0.075;
    grupo.current.rotation.x = Math.sin(grupo.current.rotation.y * 0.5) * 0.08;
  });

  return (
    <group position={pos}>
      <group ref={grupo}>
        <instancedMesh ref={nos} args={[geoEsferaFina(), null, total]}>
          <meshBasicMaterial ref={matNos} toneMapped={false} />
        </instancedMesh>

        <lineSegments geometry={ligacoes}>
          <lineBasicMaterial
            color={COR.azul}
            transparent
            opacity={0.28}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      </group>

      <Anel raio={9.6} espessura={0.03} cor={COR.ciano} opacidade={0.4} rotation={[1.5, 0, 0]} />
      <Brilho cor={COR.azul} tamanho={22} opacidade={0.15} />
      <Painel
        position={[6.6, -5.4, 5]}
        rotation={[0, -0.5, 0]}
        largura={4.4}
        altura={2.7}
        tipo={2}
        cor={COR.ciano}
      />
    </group>
  );
}

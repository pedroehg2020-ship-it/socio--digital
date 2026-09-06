/**
 * Regiões de leitura: Console e Documentos.
 *
 *   Console    → uma parede curva de painéis em duas fileiras, com um painel
 *                central maior. É a região visitada duas vezes: uma na seção
 *                de relatórios e outra, mais de perto, na do painel geral.
 *   Documentos → uma pilha em espiral de placas finas e acesas, como um
 *                arquivo que se organiza sozinho.
 *
 * O console existe em duas instâncias no mundo, em posições diferentes. Não
 * é repetição preguiçosa: é o mesmo tipo de estrutura aparecendo em dois
 * pontos do ambiente, o que reforça que o lugar é um só.
 */

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COR } from "@/components/landing/mundo/paleta";
import {
  Anel,
  Brilho,
  Grade,
  Painel,
  geoCubo,
  useLonge,
} from "@/components/landing/mundo/comuns";
import { REGIOES } from "@/components/landing/mundo/rota";

function ruido(i, s = 1) {
  const v = Math.sin(i * 53.9 + s * 71.1) * 43758.5453;
  return v - Math.floor(v);
}

/* ========================================================== CONSOLE === */

export function Console({ chave = "console", giro = 0, parado = false, qualidade = "alta" }) {
  const { pos } = REGIOES[chave];
  const longe = useLonge(pos, 150);
  const rico = qualidade === "alta";

  const grupo = useRef();

  const painéis = useMemo(() => {
    const lista = [];
    const raio = 10.5;
    const abertura = Math.PI * 0.78;
    const porFileira = rico ? 6 : 4;

    [0, 1].forEach((fileira) => {
      for (let i = 0; i < porFileira; i += 1) {
        const f = porFileira === 1 ? 0.5 : i / (porFileira - 1);
        const a = -abertura / 2 + f * abertura;
        lista.push({
          pos: [Math.sin(a) * raio, fileira === 0 ? -1.9 : 2.4, Math.cos(a) * raio * -1],
          giro: [fileira === 0 ? 0.12 : -0.1, a, 0],
          tipo: (i + fileira) % 3,
          largura: 4.1,
          altura: 2.5,
          cor: (i + fileira) % 4 === 0 ? COR.verde : COR.ciano,
        });
      }
    });
    return lista;
  }, [rico]);

  useFrame((state) => {
    if (parado || longe.current || !grupo.current) return;
    grupo.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.16) * 0.06;
  });

  return (
    <group position={pos} rotation={[0, giro, 0]}>
      <group ref={grupo}>
        {painéis.map((p, i) => (
          <Painel
            key={i}
            position={p.pos}
            rotation={p.giro}
            largura={p.largura}
            altura={p.altura}
            tipo={p.tipo}
            cor={p.cor}
            opacidade={0.9}
          />
        ))}

        {/* painel central, maior: é o "painel geral" da seção */}
        <Painel
          position={[0, 0.4, -6.2]}
          largura={7.6}
          altura={4.4}
          tipo={0}
          cor={COR.cianoClaro}
        />
      </group>

      <Anel raio={11.4} espessura={0.03} cor={COR.ciano} opacidade={0.35} rotation={[1.5708, 0, 0]} position={[0, -5.4, -3]} />
      <Grade position={[0, -5.6, -3]} tamanho={30} divisoes={15} cor={COR.azul} opacidade={0.18} />
      <Brilho position={[0, 0.4, -6.6]} cor={COR.ciano} tamanho={20} opacidade={0.2} />
    </group>
  );
}

/* ======================================================= DOCUMENTOS === */

export function Documentos({ parado = false, qualidade = "alta" }) {
  const { pos } = REGIOES.documentos;
  const longe = useLonge(pos, 150);
  const rico = qualidade === "alta";
  const total = rico ? 22 : 13;

  const placas = useRef();
  const bordas = useRef();
  const grupo = useRef();

  const dados = useMemo(
    () =>
      Array.from({ length: total }, (_, i) => ({
        y: (i - (total - 1) / 2) * 0.46,
        giro: i * 0.19,
        escala: 2.4 + ruido(i, 2) * 1.3,
        emitida: ruido(i, 6) > 0.62,
      })),
    [total]
  );

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const v = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3();
    const cor = new THREE.Color();

    dados.forEach((d, i) => {
      e.set(0, d.giro, 0);
      q.setFromEuler(e);
      v.set(0, d.y, 0);

      s.set(d.escala, 0.055, d.escala * 0.7);
      m.compose(v, q, s);
      placas.current.setMatrixAt(i, m);

      s.set(d.escala * 1.03, 0.012, d.escala * 0.72);
      m.compose(v, q, s);
      bordas.current.setMatrixAt(i, m);
      cor.set(d.emitida ? COR.ciano : COR.aco);
      bordas.current.setColorAt(i, cor);
    });
    placas.current.instanceMatrix.needsUpdate = true;
    bordas.current.instanceMatrix.needsUpdate = true;
    if (bordas.current.instanceColor) bordas.current.instanceColor.needsUpdate = true;
  }, [dados]);

  useFrame((_, delta) => {
    if (parado || longe.current || !grupo.current) return;
    grupo.current.rotation.y += Math.min(delta, 0.05) * 0.1;
  });

  return (
    <group position={pos}>
      <group ref={grupo}>
        <instancedMesh ref={placas} args={[geoCubo(), null, total]}>
          <meshStandardMaterial
            color={COR.casco2}
            roughness={0.18}
            metalness={0.88}
            envMapIntensity={1.2}
          />
        </instancedMesh>
        <instancedMesh ref={bordas} args={[geoCubo(), null, total]}>
          <meshBasicMaterial transparent opacity={0.7} toneMapped={false} />
        </instancedMesh>
      </group>

      <Brilho cor={COR.ciano} tamanho={14} opacidade={0.2} />
      <Anel raio={4.6} espessura={0.025} cor={COR.ciano} opacidade={0.4} rotation={[1.5708, 0, 0]} position={[0, -5.6, 0]} />
    </group>
  );
}

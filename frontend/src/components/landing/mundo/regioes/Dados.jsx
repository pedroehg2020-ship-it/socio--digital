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
import { REGIOES } from "@/components/landing/mundo/rota";
import {
  Painel,
  useConcreto,
  useLonge,
  useMetal,
  usePedra,
  useVidro,
} from "@/components/landing/mundo/comuns";

function ruido(i, s = 1) {
  const v = Math.sin(i * 53.9 + s * 71.1) * 43758.5453;
  return v - Math.floor(v);
}

/* ========================================================== CONSOLE === */

export function Console({ chave = "console", giro = 0, parado = false, qualidade = "alta" }) {
  const { pos } = REGIOES[chave];
  const longe = useLonge(pos, 150);
  const rico = qualidade === "alta";
  const base = usePedra(COR.pedra);

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
          cor: (i + fileira) % 4 === 0 ? COR.positivo : COR.ciano,
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

      {/* Base em pedra no lugar da grade em neon e do halo que existiam aqui.
          Aquele halo tinha 20 unidades e ficava logo atrás da parede de
          painéis: era literalmente uma fonte de luz atrás da área de leitura. */}
      <mesh material={base} position={[0, -6.2, -3]}>
        <boxGeometry args={[26, 1.4, 14]} />
      </mesh>
      <mesh material={base} position={[0, -8.6, -3]}>
        <boxGeometry args={[20, 3.6, 9]} />
      </mesh>
    </group>
  );
}

/* ======================================================= DOCUMENTOS === */

/**
 * DOCUMENTOS — arquivo de vidro.
 *
 * A versão anterior era uma pilha em espiral de placas girando, que lia como
 * folhas de papel gigantes flutuando. Aqui os documentos viram ARQUITETURA:
 * uma estante de lâminas de vidro em pé, alinhadas numa malha regular, com
 * poucas puxadas para fora — as que estão em uso. Parado, ordenado, sólido.
 * A leitura é de acervo organizado, que é o que o módulo faz.
 */
export function Documentos({ parado = false, qualidade = "alta" }) {
  const { pos } = REGIOES.documentos;
  const longe = useLonge(pos, 150);
  const rico = qualidade === "alta";

  const colunas = rico ? 9 : 6;
  const linhas = rico ? 4 : 3;
  const total = colunas * linhas;

  const laminas = useRef();
  const estrutura = useMetal(COR.metalEscuro, 0.34);
  const pedra = usePedra(COR.pedra);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COR.vidroClaro,
        transparent: true,
        opacity: 0.44,
        roughness: 0.08,
        metalness: 0.45,
        envMapIntensity: 1.4,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  const dados = useMemo(() => {
    const lista = [];
    for (let c = 0; c < colunas; c += 1) {
      for (let l = 0; l < linhas; l += 1) {
        const i = c * linhas + l;
        const fora = ruido(i, 4) > 0.86; // lâmina "em uso", puxada para fora
        lista.push({
          x: (c - (colunas - 1) / 2) * 1.55,
          y: (l - (linhas - 1) / 2) * 2.5,
          z: fora ? 0.9 : 0,
          fase: ruido(i, 8) * Math.PI * 2,
          fora,
        });
      }
    }
    return lista;
  }, [colunas, linhas]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3();
    dados.forEach((d, i) => {
      v.set(d.x, d.y, d.z);
      s.set(1.24, 2.1, 0.09);
      m.compose(v, q, s);
      laminas.current.setMatrixAt(i, m);
    });
    laminas.current.instanceMatrix.needsUpdate = true;
  }, [dados]);

  const t = useRef(0);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (parado || longe.current || !laminas.current) return;
    t.current += Math.min(delta, 0.05);
    /* Só as lâminas em uso deslizam, e devagar. O acervo em si não se mexe. */
    dados.forEach((d, i) => {
      if (!d.fora) return;
      v.set(d.x, d.y, 0.55 + Math.sin(t.current * 0.5 + d.fase) * 0.45);
      s.set(1.24, 2.1, 0.09);
      m.compose(v, q, s);
      laminas.current.setMatrixAt(i, m);
    });
    laminas.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={pos}>
      {/* montantes verticais da estante */}
      {Array.from({ length: colunas + 1 }, (_, i) => (
        <mesh
          key={i}
          material={estrutura}
          position={[(i - colunas / 2) * 1.55, 0, 0]}
        >
          <boxGeometry args={[0.1, linhas * 2.5 + 0.6, 0.5]} />
        </mesh>
      ))}
      {/* prateleiras */}
      {Array.from({ length: linhas + 1 }, (_, i) => (
        <mesh
          key={i}
          material={estrutura}
          position={[0, (i - linhas / 2) * 2.5, 0]}
        >
          <boxGeometry args={[colunas * 1.55 + 0.4, 0.09, 0.5]} />
        </mesh>
      ))}

      <instancedMesh ref={laminas} args={[null, null, total]} material={material} frustumCulled>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      {/* base em pedra: a estante está apoiada, não flutuando */}
      <mesh material={pedra} position={[0, -(linhas * 2.5) / 2 - 0.9, 0]}>
        <boxGeometry args={[colunas * 1.55 + 1.6, 1.2, 2.2]} />
      </mesh>
    </group>
  );
}

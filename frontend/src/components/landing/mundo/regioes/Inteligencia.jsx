/**
 * INTELIGÊNCIA — o quarto e último termo da narrativa.
 *
 * As duas peças aqui foram refeitas do zero, porque as anteriores eram
 * exatamente o que o projeto não quer ser:
 *
 *  · O RADAR era um disco com um setor de varredura girando e sinais que
 *    acendiam quando o feixe passava. É a interface de um videogame. No lugar
 *    entra o que a função de fato é num sistema de gestão: uma MESA DE
 *    MONITORAMENTO. Uma superfície horizontal de vidro sobre a qual paira uma
 *    matriz de indicadores, e onde poucas posições — as que exigem atenção —
 *    se levantam acima do plano. A leitura é "algo está sendo observado e
 *    algumas coisas pedem decisão", não "sonar".
 *
 *  · O NÚCLEO DE IA era uma casca neural de 96 nós com um enxame de 460
 *    partículas. Cérebro e esfera de neon, os dois vetos explícitos. No lugar
 *    entra uma CONVERGÊNCIA: as seis áreas da empresa chegam como feixes
 *    ordenados de lâminas de vidro, giram em torno de um eixo comum e se
 *    consolidam num volume central único e sólido. O que se lê é integração
 *    de dados — matéria vindo de vários lugares e virando uma coisa só.
 *
 * Nenhuma das duas usa cor fora da paleta arquitetônica, e o emissivo se
 * limita ao que seria de fato uma tela.
 */

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COR } from "@/components/landing/mundo/paleta";
import { REGIOES } from "@/components/landing/mundo/rota";
import {
  Anel,
  Painel,
  useConcreto,
  useEmissivo,
  useLonge,
  useMetal,
  usePedra,
  useVidro,
} from "@/components/landing/mundo/comuns";

function ruido(i, s = 1) {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/* ------------------------------------------------- mesa de monitoramento */

/**
 * Matriz de indicadores sobre uma mesa de vidro. A esmagadora maioria das
 * posições fica rente ao plano, em cinza; umas poucas se elevam e ganham
 * âmbar. É essa proporção — quase tudo quieto, pouca coisa pedindo atenção —
 * que faz a peça significar "monitoramento" em vez de "efeito".
 */
function Matriz({ colunas = 18, linhas = 12, parado, longe }) {
  const malha = useRef();
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COR.concretoClaro,
        roughness: 0.42,
        metalness: 0.5,
        envMapIntensity: 1.1,
      }),
    []
  );

  const celulas = useMemo(() => {
    const lista = [];
    for (let c = 0; c < colunas; c += 1) {
      for (let l = 0; l < linhas; l += 1) {
        const i = c * linhas + l;
        const alerta = ruido(i, 5) > 0.9;
        lista.push({
          x: (c - (colunas - 1) / 2) * 0.92,
          z: (l - (linhas - 1) / 2) * 0.92,
          alerta,
          base: alerta ? 1.1 + ruido(i, 9) * 2.4 : 0.06 + ruido(i, 7) * 0.16,
          fase: ruido(i, 13) * Math.PI * 2,
        });
      }
    }
    return lista;
  }, [colunas, linhas]);

  const cor = useMemo(() => new THREE.Color(), []);
  const corCalma = useMemo(() => new THREE.Color(COR.concretoClaro), []);
  const corAlerta = useMemo(() => new THREE.Color(COR.ambar), []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    celulas.forEach((c, i) => {
      p.set(c.x, c.base / 2, c.z);
      s.set(0.62, c.base, 0.62);
      m.compose(p, q, s);
      malha.current.setMatrixAt(i, m);
      malha.current.setColorAt(i, c.alerta ? corAlerta : corCalma);
    });
    malha.current.instanceMatrix.needsUpdate = true;
    if (malha.current.instanceColor) malha.current.instanceColor.needsUpdate = true;
  }, [celulas, corAlerta, corCalma]);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (parado || longe.current || !malha.current) return;
    t.current += Math.min(delta, 0.05);
    /* Só as posições em alerta respiram. O resto fica absolutamente parado —
       movimento generalizado é o que faz uma cena parecer inquieta. */
    celulas.forEach((c, i) => {
      if (!c.alerta) return;
      const h = c.base * (1 + Math.sin(t.current * 1.3 + c.fase) * 0.14);
      p.set(c.x, h / 2, c.z);
      s.set(0.62, h, 0.62);
      m.compose(p, q, s);
      malha.current.setMatrixAt(i, m);
    });
    malha.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={malha}
      args={[null, null, celulas.length]}
      material={material}
      frustumCulled
    >
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

export function Radar({ parado = false, qualidade = "alta" }) {
  const pos = REGIOES.radar.pos;
  const longe = useLonge(pos);
  const rico = qualidade === "alta";

  const tampo = useVidro(COR.vidroClaro, 0.3);
  const moldura = useMetal(COR.metalEscuro, 0.3);
  const pedra = usePedra(COR.pedra);

  return (
    <group position={pos}>
      {/* base pesada: a peça precisa estar apoiada em algo, não flutuando */}
      <mesh material={pedra} position={[0, -4.4, 0]}>
        <boxGeometry args={[13, 1.4, 10]} />
      </mesh>
      <mesh material={moldura} position={[0, -2.4, 0]}>
        <boxGeometry args={[2.4, 3.2, 2.4]} />
      </mesh>

      {/* mesa de vidro e sua moldura */}
      <mesh material={tampo} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[17.4, 11.6]} />
      </mesh>
      <mesh material={moldura} position={[0, -0.16, 0]}>
        <boxGeometry args={[17.8, 0.24, 12]} />
      </mesh>

      <group position={[0, 0.05, 0]}>
        <Matriz colunas={rico ? 18 : 12} linhas={rico ? 12 : 8} parado={parado} longe={longe} />
      </group>

      {/* dois painéis de leitura na cabeceira, como numa sala de controle */}
      {rico ? (
        <>
          <Painel position={[-5.2, 4.4, -5.6]} rotation={[0, 0.24, 0]} largura={6} altura={3.6} tipo={0} />
          <Painel position={[1.8, 4.4, -5.9]} rotation={[0, -0.1, 0]} largura={6} altura={3.6} tipo={2} />
        </>
      ) : null}
    </group>
  );
}

/* --------------------------------------------------- núcleo de integração */

/**
 * Um afluente: o feixe de lâminas de vidro que traz uma área da empresa até o
 * centro. As lâminas ficam mais próximas e menores conforme se aproximam do
 * núcleo — a informação chega dispersa e sai consolidada, e a geometria diz
 * isso sozinha.
 */
function Afluente({ angulo, lâminas = 9, parado, longe }) {
  const malha = useRef();
  const grupo = useRef();

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COR.azulClaro,
        transparent: true,
        opacity: 0.5,
        roughness: 0.1,
        metalness: 0.4,
        envMapIntensity: 1.4,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  const dados = useMemo(() => {
    const lista = [];
    for (let i = 0; i < lâminas; i += 1) {
      const f = i / (lâminas - 1); // 0 = longe, 1 = junto ao núcleo
      lista.push({
        raio: 21 - f * 14,
        largura: 5.4 - f * 3.6,
        altura: 3.4 - f * 2.2,
        y: (1 - f) * (ruido(i, 3) - 0.5) * 5,
      });
    }
    return lista;
  }, [lâminas]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    dados.forEach((d, i) => {
      e.set(0, angulo, 0);
      q.setFromEuler(e);
      p.set(Math.cos(angulo) * d.raio, d.y, Math.sin(angulo) * d.raio);
      s.set(d.largura, d.altura, 0.1);
      m.compose(p, q, s);
      malha.current.setMatrixAt(i, m);
    });
    malha.current.instanceMatrix.needsUpdate = true;
  }, [dados, angulo]);

  useFrame((_, delta) => {
    if (parado || longe.current || !grupo.current) return;
    grupo.current.rotation.y += Math.min(delta, 0.05) * 0.045;
  });

  return (
    <group ref={grupo}>
      <instancedMesh ref={malha} args={[null, null, dados.length]} material={material} frustumCulled>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
}

export function IA({ parado = false, qualidade = "alta" }) {
  const pos = REGIOES.ia.pos;
  const longe = useLonge(pos, 320);
  const rico = qualidade === "alta";
  const medio = qualidade !== "baixa";

  const metal = useMetal(COR.metal, 0.22);
  const concreto = useConcreto(COR.concretoClaro, { roughness: 0.6, metalness: 0.2 });
  const vidro = useVidro(COR.vidroClaro, 0.4);
  /* O único emissivo da peça, e em intensidade de tela, não de lâmpada. */
  const nucleo = useEmissivo(COR.cianoClaro, 0.55);

  const eixo = useRef();
  useFrame((_, delta) => {
    if (parado || longe.current || !eixo.current) return;
    eixo.current.rotation.y -= Math.min(delta, 0.05) * 0.03;
  });

  /* Seis afluentes: as seis áreas que a página apresentou até aqui. */
  const angulos = useMemo(
    () => Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2),
    []
  );

  return (
    <group position={pos}>
      {/* volume central consolidado: sólido, facetado, nada de esfera lisa */}
      <group ref={eixo}>
        <mesh material={metal}>
          <octahedronGeometry args={[5.2, 1]} />
        </mesh>
        <mesh material={nucleo} scale={0.78}>
          <octahedronGeometry args={[5.2, 1]} />
        </mesh>
        <mesh material={vidro} scale={1.42}>
          <octahedronGeometry args={[5.2, 0]} />
        </mesh>
      </group>

      {/* pedestal: ancora a peça no terreno em vez de deixá-la flutuando */}
      <mesh material={concreto} position={[0, -13, 0]}>
        <cylinderGeometry args={[7.4, 9.6, 3.2, 6]} />
      </mesh>
      <mesh material={metal} position={[0, -8.4, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 6.2, 8]} />
      </mesh>

      {angulos.map((a, i) =>
        i < (rico ? 6 : medio ? 4 : 3) ? (
          <Afluente key={a} angulo={a} lâminas={rico ? 9 : 6} parado={parado} longe={longe} />
        ) : null
      )}

      {/* dois anéis finos marcam a escala do conjunto sem virar neon */}
      {medio ? (
        <>
          <Anel raio={24} espessura={0.05} cor={COR.azul} opacidade={0.3} rotation={[Math.PI / 2, 0, 0]} />
          <Anel raio={13} espessura={0.04} cor={COR.ciano} opacidade={0.26} rotation={[Math.PI / 2, 0, 0]} />
        </>
      ) : null}
    </group>
  );
}

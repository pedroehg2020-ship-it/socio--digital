/**
 * ESCRITÓRIO — o começo físico da narrativa.
 *
 * A página abre dentro de uma sala executiva de último andar, ao fim da
 * tarde, com a cidade atrás do vidro. Não é cenário decorativo: é o primeiro
 * termo da transformação que a rolagem inteira encena —
 *
 *     espaço físico → empresa → dados → inteligência
 *
 * O que costura essas quatro etapas é um MÓDULO, declarado aqui e reusado nas
 * outras regiões em escalas crescentes. O ritmo dos caixilhos desta janela é
 * o mesmo ritmo da fachada do edifício, que é o mesmo ritmo das grades de
 * dados lá adiante. Quando a câmera se afasta no final e o usuário reconhece
 * a mesma malha em três tamanhos, a mensagem "é tudo a mesma empresa" já foi
 * dada visualmente, antes de qualquer texto dizê-la. Por isso `MODULO` é
 * exportado: quem mexer nele mexe na cena inteira, e é para ser assim.
 *
 * Custo: a sala é feita de caixas e planos, com os caixilhos e as ripas de
 * madeira instanciados. São poucas chamadas de desenho, e nenhuma sombra
 * projetada — o volume vem do contraste entre a luz da janela e o interior.
 */

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COR } from "@/components/landing/mundo/paleta";
import { REGIOES } from "@/components/landing/mundo/rota";
import {
  texturaPainel,
  useConcreto,
  useMadeira,
  useMetal,
  usePedra,
  useVidro,
} from "@/components/landing/mundo/comuns";

/**
 * A malha que atravessa a página inteira: largura de um vão e proporção
 * altura/largura. O escritório usa 1×, o edifício ~6×, as grades de dados
 * ~2×. Ver o cabeçalho.
 */
export const MODULO = { vao: 3.2, proporcao: 1.9 };

/* Dimensões da sala. A janela fica em -Z, que é a direção da cidade e o
   sentido em que a câmera viaja ao longo de toda a página. */
const SALA = {
  x: 17,   // meia-largura
  z0: -15, // parede de vidro
  z1: 21,  // fundo da sala
  piso: -6,
  teto: 7.4,
};

/* --------------------------------------------------------------- piso */

function Piso() {
  const pedra = usePedra(COR.pedraClara);
  const tapete = useConcreto(COR.grafite, { roughness: 0.95 });

  return (
    <group>
      <mesh
        material={pedra}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, SALA.piso, (SALA.z0 + SALA.z1) / 2]}
      >
        <planeGeometry args={[SALA.x * 2, SALA.z1 - SALA.z0]} />
      </mesh>

      {/* tapete sob a área de trabalho: quebra a pedra e ancora os móveis */}
      <mesh material={tapete} rotation={[-Math.PI / 2, 0, 0]} position={[3.5, SALA.piso + 0.02, 6]}>
        <planeGeometry args={[19, 15]} />
      </mesh>
    </group>
  );
}

/* --------------------------------------------------------------- teto */

/**
 * Teto com sancas de luz. As fitas são o único emissivo da sala, e em
 * intensidade baixa: elas dão a leitura de "iluminação arquitetônica" sem
 * virar fonte de brilho atrás do texto.
 */
function Teto() {
  const laje = useConcreto(COR.concretoClaro, { roughness: 0.92, side: THREE.DoubleSide });
  const fita = useMemo(
    () =>
      new THREE.MeshBasicMaterial({ color: COR.luzDia, transparent: true, opacity: 0.75 }),
    []
  );

  const sancas = useMemo(() => {
    const lista = [];
    for (let i = 0; i < 4; i += 1) lista.push(SALA.z0 + 5 + i * 8.4);
    return lista;
  }, []);

  return (
    <group>
      <mesh
        material={laje}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, SALA.teto, (SALA.z0 + SALA.z1) / 2]}
      >
        <planeGeometry args={[SALA.x * 2, SALA.z1 - SALA.z0]} />
      </mesh>

      {sancas.map((z, i) => (
        <mesh key={i} material={fita} position={[0, SALA.teto - 0.16, z]}>
          <boxGeometry args={[SALA.x * 1.7, 0.09, 0.34]} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------- paredes/madeira */

/** Painel de nogueira em ripas verticais — a parede de fundo e a lateral. */
function Madeira() {
  const madeira = useMadeira(COR.nogueira);
  const clara = useMadeira(COR.nogueiraClara);
  const ripas = useRef();

  const dados = useMemo(() => {
    const lista = [];
    // parede do fundo
    for (let i = 0; i < 26; i += 1) {
      lista.push({ x: -SALA.x + 0.7 + i * 1.32, z: SALA.z1 - 0.2, giro: 0, alt: 11 });
    }
    // lateral esquerda, que fecha o enquadramento do hero
    for (let i = 0; i < 22; i += 1) {
      lista.push({ x: -SALA.x + 0.25, z: SALA.z1 - 1.6 - i * 1.5, giro: Math.PI / 2, alt: 11 });
    }
    return lista;
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    dados.forEach((d, i) => {
      e.set(0, d.giro, 0);
      q.setFromEuler(e);
      p.set(d.x, SALA.piso + d.alt / 2, d.z);
      // pequena variação de profundidade: é o que faz a ripa ler como ripa
      s.set(1.18, d.alt, 0.16 + (i % 3) * 0.07);
      m.compose(p, q, s);
      ripas.current.setMatrixAt(i, m);
    });
    ripas.current.instanceMatrix.needsUpdate = true;
  }, [dados]);

  return (
    <group>
      {/* massa da parede atrás das ripas */}
      <mesh material={clara} position={[0, SALA.piso + 5.5, SALA.z1 + 0.1]}>
        <boxGeometry args={[SALA.x * 2, 11, 0.5]} />
      </mesh>
      <mesh material={clara} position={[-SALA.x - 0.1, SALA.piso + 5.5, (SALA.z0 + SALA.z1) / 2]}>
        <boxGeometry args={[0.5, 11, SALA.z1 - SALA.z0]} />
      </mesh>

      <instancedMesh ref={ripas} args={[null, null, dados.length]} material={madeira} frustumCulled>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
}

/* ------------------------------------------------------------- janela */

/**
 * Parede de vidro do chão ao teto. Os caixilhos usam `MODULO.vao`, a mesma
 * medida que reaparece na fachada do edifício mais adiante.
 */
function Janela() {
  const vidro = useVidro(COR.vidroClaro, 0.14);
  const caixilho = useMetal(COR.metalEscuro, 0.3);
  const montantes = useRef();

  const dados = useMemo(() => {
    const lista = [];
    const n = Math.round((SALA.x * 2) / MODULO.vao);
    // montantes verticais
    for (let i = 0; i <= n; i += 1) {
      lista.push({
        pos: [-SALA.x + i * MODULO.vao, SALA.piso + 6.7, SALA.z0],
        esc: [0.16, 13.4, 0.3],
      });
    }
    // travessas horizontais: piso, meio e teto
    [0.15, 6.7, 13.25].forEach((h) => {
      lista.push({ pos: [0, SALA.piso + h, SALA.z0], esc: [SALA.x * 2, 0.16, 0.3] });
    });
    return lista;
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    dados.forEach((d, i) => {
      p.set(...d.pos);
      s.set(...d.esc);
      m.compose(p, q, s);
      montantes.current.setMatrixAt(i, m);
    });
    montantes.current.instanceMatrix.needsUpdate = true;
  }, [dados]);

  return (
    <group>
      <mesh material={vidro} position={[0, SALA.piso + 6.7, SALA.z0]}>
        <planeGeometry args={[SALA.x * 2, 13.4]} />
      </mesh>
      <instancedMesh
        ref={montantes}
        args={[null, null, dados.length]}
        material={caixilho}
        frustumCulled
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
}

/* -------------------------------------------------------------- móveis */

/** Tela de trabalho: é aqui que os dados aparecem pela primeira vez, pequenos. */
function Monitor({ position, giro = 0, tipo = 0 }) {
  const corpo = useMetal(COR.metalEscuro, 0.44);
  const tela = useMemo(() => {
    const t = texturaPainel(tipo);
    return new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
  }, [tipo]);

  return (
    <group position={position} rotation={[0, giro, 0]}>
      <mesh material={corpo} position={[0, -0.72, 0]}>
        <boxGeometry args={[0.9, 0.08, 0.55]} />
      </mesh>
      <mesh material={corpo} position={[0, -0.4, 0]}>
        <boxGeometry args={[0.12, 0.66, 0.12]} />
      </mesh>
      <mesh material={corpo}>
        <boxGeometry args={[3.3, 1.9, 0.09]} />
      </mesh>
      <mesh material={tela} position={[0, 0, 0.05]}>
        <planeGeometry args={[3.1, 1.72]} />
      </mesh>
    </group>
  );
}

/** Mesa executiva: tampo de nogueira sobre estrutura de metal. */
function Mesa({ position = [0, 0, 0], giro = 0 }) {
  const madeira = useMadeira(COR.nogueiraClara);
  const metal = useMetal(COR.metalEscuro, 0.34);

  return (
    <group position={position} rotation={[0, giro, 0]}>
      <mesh material={madeira} position={[0, 0, 0]}>
        <boxGeometry args={[8.4, 0.22, 3.4]} />
      </mesh>
      {/* saia frontal, que dá peso à peça vista de longe */}
      <mesh material={madeira} position={[0, -0.55, -1.5]}>
        <boxGeometry args={[8.0, 0.9, 0.16]} />
      </mesh>
      {[-3.7, 3.7].map((x) => (
        <mesh key={x} material={metal} position={[x, -1.05, 0]}>
          <boxGeometry args={[0.16, 2.0, 3.0]} />
        </mesh>
      ))}
    </group>
  );
}

/** Poltrona/cadeira estilizada — volume, não detalhe. */
function Cadeira({ position, giro = 0 }) {
  const estofado = useConcreto(COR.grafite, { roughness: 0.78 });
  const metal = useMetal(COR.metalEscuro, 0.4);
  return (
    <group position={position} rotation={[0, giro, 0]}>
      <mesh material={estofado} position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 0.24, 1.4]} />
      </mesh>
      <mesh material={estofado} position={[0, 0.78, -0.62]}>
        <boxGeometry args={[1.42, 1.5, 0.2]} />
      </mesh>
      <mesh material={metal} position={[0, -0.62, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 1.0, 8]} />
      </mesh>
      <mesh material={metal} position={[0, -1.16, 0]}>
        <cylinderGeometry args={[0.62, 0.68, 0.09, 12]} />
      </mesh>
    </group>
  );
}

/**
 * Pilar de pedra junto à janela, no lado esquerdo da sala.
 *
 * Ele existe por razão de composição, não de decoração. A parede de vidro
 * inteira é a superfície mais clara da cena, e no hero a coluna de texto fica
 * à esquerda: sem nada ali, o título cairia sobre céu aberto e perderia
 * contraste. O pilar bloqueia justamente esse trecho de janela e devolve uma
 * área calma e escura atrás das letras — que é como o problema se resolve em
 * arquitetura, e não empilhando uma camada preta sobre a cena.
 */
function Pilar() {
  const pedra = usePedra(COR.pedra);
  const madeira = useMadeira(COR.nogueira);
  return (
    <group position={[-11.2, 0, SALA.z0 + 1.4]}>
      <mesh material={pedra} position={[0, SALA.piso + 6.7, 0]}>
        <boxGeometry args={[4.2, 13.4, 2.6]} />
      </mesh>
      {/* faixa de madeira no encontro com o piso, para não virar bloco cego */}
      <mesh material={madeira} position={[0, SALA.piso + 1.1, 1.45]}>
        <boxGeometry args={[4.4, 2.2, 0.4]} />
      </mesh>
    </group>
  );
}

/** Aparador de pedra encostado na madeira: a terceira textura da sala. */
function Aparador() {
  const pedra = usePedra(COR.pedra);
  const madeira = useMadeira(COR.nogueira);
  return (
    <group position={[-9.5, SALA.piso + 1.1, SALA.z1 - 2.2]}>
      <mesh material={madeira}>
        <boxGeometry args={[9, 2.0, 1.5]} />
      </mesh>
      <mesh material={pedra} position={[0, 1.06, 0]}>
        <boxGeometry args={[9.3, 0.14, 1.7]} />
      </mesh>
    </group>
  );
}

/** Mesa de reunião ao fundo — sugere a operação da empresa, sem detalhar. */
function Reuniao() {
  const pedra = usePedra(COR.pedraClara);
  const metal = useMetal(COR.metalEscuro, 0.36);
  const cadeiras = useMemo(
    () =>
      [-1, 1].flatMap((s) =>
        [-2.4, 0, 2.4].map((z) => ({ x: s * 3.4, z, giro: s > 0 ? -Math.PI / 2 : Math.PI / 2 }))
      ),
    []
  );

  return (
    <group position={[-8.5, 0, SALA.z0 + 8]}>
      <mesh material={pedra} position={[0, SALA.piso + 2.4, 0]}>
        <boxGeometry args={[4.6, 0.2, 8.2]} />
      </mesh>
      <mesh material={metal} position={[0, SALA.piso + 1.2, 0]}>
        <boxGeometry args={[1.2, 2.3, 6.0]} />
      </mesh>
      {cadeiras.map((c, i) => (
        <Cadeira key={i} position={[c.x, SALA.piso + 1.4, c.z]} giro={c.giro} />
      ))}
    </group>
  );
}

/* ----------------------------------------------------------- exportado */

export default function Escritorio({ qualidade = "alta" }) {
  const pos = REGIOES.escritorio.pos;
  const rico = qualidade === "alta";

  return (
    <group position={pos}>
      <Piso />
      <Teto />
      <Madeira />
      <Janela />

      <Mesa position={[4.5, SALA.piso + 2.6, 6]} giro={-0.1} />
      <Monitor position={[3.4, SALA.piso + 4.2, 5.4]} giro={-0.1} tipo={0} />
      {rico ? <Monitor position={[6.9, SALA.piso + 4.2, 5.9]} giro={-0.62} tipo={2} /> : null}
      <Cadeira position={[4.2, SALA.piso + 1.4, 9.2]} giro={Math.PI} />

      <Pilar />
      <Aparador />
      {rico ? <Reuniao /> : null}
    </group>
  );
}

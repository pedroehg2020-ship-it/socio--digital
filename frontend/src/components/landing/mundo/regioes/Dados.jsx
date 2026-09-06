/**
 * DADOS — quadros 3, 5, 6 e 7.
 *
 * Um único tipo de objeto atravessa os quatro quadros: a LÂMINA DE VIDRO com
 * um traço de dado gravado. O que muda é onde ela está e como está arranjada:
 *
 *   Q3  gravadas na própria janela do escritório, alinhadas ao caixilho;
 *   Q5  aplicadas às fachadas das torres, como sobreposição técnica;
 *   Q6  soltas no ar, em profundidades diferentes — é o quadro do desfoque;
 *   Q7  todas alinhadas num único painel curvo.
 *
 * Não há um "objeto de convergência" separado. A convergência é geométrica: as
 * mesmas lâminas do Q6 têm uma posição de origem e uma posição no painel, e a
 * rolagem interpola entre as duas. Por isso o espectador reconhece que aquelas
 * eram as mesmas informações — porque literalmente são.
 */

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { COR } from "@/components/landing/mundo/paleta";
import { plano, planoCurvo } from "@/components/landing/mundo/forma";
import { texturaDado, texturaFachada } from "@/components/landing/mundo/dados";
import { useAluminio, useVidroJanela } from "@/components/landing/mundo/materiais";
import { SALA, MODULO } from "@/components/landing/mundo/regioes/Escritorio";
import { PAINEL } from "@/components/landing/mundo/rota";

function ruido(i, s = 1) {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/** Material de uma lâmina: a textura do dado sobre vidro quase transparente. */
function useLamina(tipo, semente, opacidade = 0.95) {
  return useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      map: texturaDado(tipo, semente),
      transparent: true,
      opacity: opacidade,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    return m;
  }, [tipo, semente, opacidade]);
}

/* ------------------------------------------------ Q3 · gravados na janela */

/**
 * Os primeiros dados da página. Ficam RENTE ao vidro do escritório e
 * alinhados ao vão do caixilho — a impressão é de serigrafia sobre a
 * superfície, como o skyline gravado no vidro das referências.
 */
export function DadosNaJanela() {
  const a = useLamina(0, 3, 0.9);
  const b = useLamina(3, 11, 0.86);
  const c = useLamina(2, 5, 0.82);
  const geo = useMemo(() => plano(MODULO * 1.85, MODULO * 1.16), []);
  const z = SALA.vidroZ + 0.14;

  return (
    <group>
      <mesh geometry={geo} material={a} position={[-MODULO * 1.05, 3.2, z]} />
      <mesh geometry={geo} material={b} position={[MODULO * 1.45, 0.6, z]} />
      <mesh geometry={geo} material={c} position={[-MODULO * 2.45, -1.4, z]} />
    </group>
  );
}

/* --------------------------------------------- Q5 · camadas nas fachadas */

/**
 * Sobreposição técnica aplicada a algumas torres. São planos rentes à face,
 * com a mesma inclinação do prédio: a fachada continua sendo fachada, e o
 * dado é uma camada sobre ela.
 */
export function DadosNaCidade({ qualidade = "alta" }) {
  const rico = qualidade === "alta";
  const geo = useMemo(() => plano(24, 24), []);

  const material = useMemo(
    () =>
      [1, 2, 3, 4].map(
        (s) =>
          new THREE.MeshBasicMaterial({
            map: texturaFachada(s),
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
      ),
    []
  );

  /* Posições escolhidas à mão para caírem em torres da faixa próxima e do
     lado certo do corredor em cada quadro. */
  const placas = useMemo(
    () => [
      { p: [-56, 6, -140], g: 0.22, m: 0 },
      { p: [58, 14, -190], g: -0.3, m: 1 },
      { p: [-60, 2, -238], g: 0.18, m: 2 },
      { p: [62, 18, -286], g: -0.24, m: 3 },
    ],
    []
  );

  return (
    <group>
      {placas.slice(0, rico ? 4 : 2).map((x, i) => (
        <mesh
          key={i}
          geometry={geo}
          material={material[x.m]}
          position={x.p}
          rotation={[0, x.g, 0]}
        />
      ))}
    </group>
  );
}

/* ------------------------------- Q6 e Q7 · dispersão e painel único */

/**
 * As lâminas que se dispersam no Q6 e se alinham no Q7.
 *
 * Cada lâmina guarda DOIS destinos e uma matriz é interpolada entre eles a
 * cada quadro, em função do progresso da rolagem. `disperso` é uma posição
 * ampla e desalinhada; `alinhado` é a grade do painel curvo. Não há objeto
 * novo entrando em cena em nenhum momento — é o mesmo conjunto se organizando.
 */
export function PainelInteligente({ qualidade = "alta", parado = false }) {
  const { camera } = useThree();
  const rico = qualidade === "alta";
  const quantidade = rico ? 12 : 7;

  const geo = useMemo(() => plano(8.4, 5.2), []);
  const perfil = useAluminio(COR.caixilho, 0.3);
  const vidroFundo = useVidroJanela(COR.vidro, 0.07);
  const geoCurvo = useMemo(() => planoCurvo(PAINEL.largura, PAINEL.altura, 0.1, 28), []);

  const refs = useRef([]);

  const laminas = useMemo(() => {
    const lista = [];
    const colunas = rico ? 4 : 3;
    for (let i = 0; i < quantidade; i += 1) {
      const c = i % colunas;
      const l = Math.floor(i / colunas);
      const linhas = Math.ceil(quantidade / colunas);

      /* alinhado: grade sobre a superfície curva do painel */
      const ax = (c - (colunas - 1) / 2) * 8.9;
      const ay = ((linhas - 1) / 2 - l) * 5.6;
      const az = -((ax / (PAINEL.largura / 2)) ** 2) * PAINEL.largura * 0.05; // acompanha a curvatura

      /* disperso: mesma família de posições, aberta e desalinhada */
      const dx = ax * (2.5 + ruido(i, 3) * 1.6);
      const dy = ay * 2.1 + (ruido(i, 5) - 0.5) * 22;
      const dz = az + 40 + ruido(i, 7) * 150;

      lista.push({
        tipo: i % 4,
        semente: i * 13 + 1,
        alinhado: [ax, ay, az],
        disperso: [dx, dy, dz],
        giroDisperso: (ruido(i, 11) - 0.5) * 0.9,
      });
    }
    return lista;
  }, [quantidade, rico]);

  const materiais = laminas.map((l) => texturaDado(l.tipo, l.semente));
  const mats = useMemo(
    () =>
      materiais.map(
        (map) =>
          new THREE.MeshBasicMaterial({
            map,
            transparent: true,
            opacity: 0.94,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [laminas]
  );

  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    /**
     * `convergencia` vai de 0 a 1 conforme a rolagem passa pelo trecho do
     * painel. `camera.userData.progresso` é publicado pelo Cinema.
     */
    const u = camera.userData.progresso ?? 0;
    const bruto = THREE.MathUtils.clamp((u - 0.5) / 0.22, 0, 1);
    const f = bruto * bruto * (3 - 2 * bruto); // suaviza as pontas

    laminas.forEach((l, i) => {
      const o = refs.current[i];
      if (!o) return;
      v.set(
        l.disperso[0] + (l.alinhado[0] - l.disperso[0]) * f,
        l.disperso[1] + (l.alinhado[1] - l.disperso[1]) * f,
        l.disperso[2] + (l.alinhado[2] - l.disperso[2]) * f
      );
      o.position.copy(v);
      o.rotation.y = l.giroDisperso * (1 - f);
      o.rotation.z = l.giroDisperso * 0.3 * (1 - f);
      /* as lâminas ainda dispersas ficam mais tênues; ao alinhar, firmam */
      o.material.opacity = 0.5 + 0.44 * f;
    });
  });

  return (
    <group position={PAINEL.pos}>
      {/* a lâmina de vidro que recebe tudo — só aparece quando o painel forma */}
      <mesh geometry={geoCurvo} material={vidroFundo} />
      {/* moldura mínima: dois filetes horizontais, nada mais */}
      <mesh material={perfil} position={[0, PAINEL.altura / 2 + 0.4, -1.1]}>
        <boxGeometry args={[PAINEL.largura, 0.09, 0.22]} />
      </mesh>
      <mesh material={perfil} position={[0, -PAINEL.altura / 2 - 0.4, -1.1]}>
        <boxGeometry args={[PAINEL.largura, 0.09, 0.22]} />
      </mesh>

      {laminas.map((l, i) => (
        <mesh
          key={i}
          ref={(o) => (refs.current[i] = o)}
          geometry={geo}
          material={mats[i]}
        />
      ))}
    </group>
  );
}

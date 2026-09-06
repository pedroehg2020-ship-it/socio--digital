/**
 * ESCRITÓRIO — quadro 1 e 2 do storyboard.
 *
 * A versão anterior tentou representar uma sala executiva com dezenas de
 * primitivas: mesa com quatro pés, cadeiras com cilindros, aparador, mesa de
 * reunião, ripas de madeira. Cada peça isolada era defensável; o conjunto lia
 * como PS2, porque o realismo de um interior não vem da CONTAGEM de móveis —
 * vem de proporção, material e luz. Aqui o inventário foi cortado ao osso:
 *
 *      laje + parede + piso  ·  parede de vidro  ·  mesa  ·  poltrona
 *
 * Nada mais. O que sustenta a cena é o pé-direito duplo, o piso polido que
 * devolve reflexo, o caixilho preto fino em ritmo regular e a luz baixa da
 * manhã atravessando esse ritmo. Toda peça de mobiliário usa a caixa de
 * arestas macias: é o filete de luz na aresta que faz o objeto parecer
 * fabricado em vez de modelado.
 *
 * MÓDULO é exportado porque o mesmo vão de caixilho reaparece nas torres. É a
 * costura visual entre a sala e a cidade — o espectador reconhece o ritmo
 * antes de saber por quê.
 */

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COR } from "@/components/landing/mundo/paleta";
import { caixaMacia } from "@/components/landing/mundo/forma";
import {
  useAluminio,
  useConcreto,
  useMadeira,
  useMarmore,
  useVidroJanela,
} from "@/components/landing/mundo/materiais";

/** Vão do caixilho. Reusado pelas fachadas da cidade. */
export const MODULO = 3.1;

/* Pé-direito duplo, como nas referências. A sala é larga e rasa: a câmera
   atravessa a profundidade dela em poucos segundos de rolagem. */
const SALA = {
  meiaLargura: 13,
  vidroZ: -13,
  fundoZ: 20,
  piso: -5.5,
  teto: 10.5,
};

/* ------------------------------------------------------------ envoltório */

function Envoltorio() {
  const marmore = useMarmore();
  const concreto = useConcreto(COR.concretoClaro);
  const madeira = useMadeira();

  const profundidade = SALA.fundoZ - SALA.vidroZ;
  const centroZ = (SALA.vidroZ + SALA.fundoZ) / 2;

  return (
    <group>
      {/* piso em mármore polido: o reflexo dele é metade da elegância da cena */}
      <mesh material={marmore} rotation={[-Math.PI / 2, 0, 0]} position={[0, SALA.piso, centroZ]}>
        <planeGeometry args={[SALA.meiaLargura * 2, profundidade]} />
      </mesh>

      {/* laje superior, recuada da janela — cria a sombra do teto sobre o vidro */}
      <mesh material={concreto} rotation={[Math.PI / 2, 0, 0]} position={[0, SALA.teto, centroZ + 2]}>
        <planeGeometry args={[SALA.meiaLargura * 2, profundidade - 4]} />
      </mesh>

      {/* parede de nogueira ao fundo e à esquerda: é a zona calma do hero,
          e é atrás dela que o texto do primeiro quadro é lido */}
      <mesh material={madeira} position={[0, SALA.piso + 9, SALA.fundoZ]}>
        <boxGeometry args={[SALA.meiaLargura * 2, 18, 0.6]} />
      </mesh>
      <mesh material={madeira} position={[-SALA.meiaLargura, SALA.piso + 9, centroZ]}>
        <boxGeometry args={[0.6, 18, profundidade]} />
      </mesh>

      {/* parede direita em concreto claro, para não espelhar a esquerda */}
      <mesh material={concreto} position={[SALA.meiaLargura, SALA.piso + 9, centroZ]}>
        <boxGeometry args={[0.6, 18, profundidade]} />
      </mesh>

      {/**
       * JAMBAS E VERGA — o que faz a travessia acontecer.
       *
       * Antes a parede de vidro era um plano solto, sem nada em volta: a
       * câmera cruzava o vidro e continuava vendo montante preto por dezenas
       * de unidades, porque não havia nada dizendo onde o interior termina.
       * Estes três volumes fecham a abertura, e por serem opacos e curtos
       * saem de quadro em poucos metros depois da passagem. É a partir daqui
       * que o quadro 4 é de fato exterior.
       */}
      <mesh material={concreto} position={[-SALA.meiaLargura - 1.4, SALA.piso + 9, SALA.vidroZ - 1]}>
        <boxGeometry args={[3.4, 18, 3]} />
      </mesh>
      <mesh material={concreto} position={[SALA.meiaLargura + 1.4, SALA.piso + 9, SALA.vidroZ - 1]}>
        <boxGeometry args={[3.4, 18, 3]} />
      </mesh>
      <mesh material={concreto} position={[0, SALA.teto + 1.5, SALA.vidroZ - 1]}>
        <boxGeometry args={[SALA.meiaLargura * 2 + 6, 3, 3]} />
      </mesh>
      {/* peitoril: fecha embaixo e ancora o vidro no piso */}
      <mesh material={marmore} position={[0, SALA.piso + 0.35, SALA.vidroZ - 0.6]}>
        <boxGeometry args={[SALA.meiaLargura * 2, 0.7, 1.8]} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- janela */

/**
 * Parede de vidro do piso à laje. Os montantes são instanciados e finos —
 * o perfil preto de 8 cm das referências, não uma grade grossa.
 */
function Janela() {
  const vidro = useVidroJanela();
  const perfil = useAluminio(COR.caixilho, 0.34);
  const montantes = useRef();

  const altura = SALA.teto - SALA.piso;
  const dados = useMemo(() => {
    const lista = [];
    const n = Math.round((SALA.meiaLargura * 2) / MODULO);
    for (let i = 0; i <= n; i += 1) {
      lista.push({
        p: [-SALA.meiaLargura + i * ((SALA.meiaLargura * 2) / n), SALA.piso + altura / 2, SALA.vidroZ],
        e: [0.09, altura, 0.26],
      });
    }
    /* Só duas travessas: piso e uma linha alta. Mais do que isso vira grade. */
    [0.06, altura * 0.72].forEach((h) =>
      lista.push({ p: [0, SALA.piso + h, SALA.vidroZ], e: [SALA.meiaLargura * 2, 0.09, 0.26] })
    );
    return lista;
  }, [altura]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    dados.forEach((d, i) => {
      p.set(...d.p);
      s.set(...d.e);
      m.compose(p, q, s);
      montantes.current.setMatrixAt(i, m);
    });
    montantes.current.instanceMatrix.needsUpdate = true;
  }, [dados]);

  return (
    <group>
      <mesh material={vidro} position={[0, SALA.piso + altura / 2, SALA.vidroZ]}>
        <planeGeometry args={[SALA.meiaLargura * 2, altura]} />
      </mesh>
      <instancedMesh ref={montantes} args={[null, null, dados.length]} material={perfil} frustumCulled>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
}

/* -------------------------------------------------------------- mobília */

/**
 * Mesa: um tampo fino de mármore sobre um volume de nogueira RECUADO. O recuo
 * é o truque — de longe o tampo parece flutuar, e o objeto ganha a leveza de
 * mobiliário de autor em vez do peso de uma caixa sobre quatro pernas.
 */
function Mesa({ position = [0, 0, 0], giro = 0 }) {
  const marmore = useMarmore(COR.marmore, 0.16);
  const madeira = useMadeira(COR.nogueira);

  const tampo = useMemo(() => caixaMacia(6.4, 0.11, 2.5, 0.05, 3), []);
  const base = useMemo(() => caixaMacia(3.6, 1.4, 1.5, 0.06, 3), []);

  return (
    <group position={position} rotation={[0, giro, 0]}>
      <mesh geometry={tampo} material={marmore} />
      <mesh geometry={base} material={madeira} position={[0, -0.76, 0]} />
    </group>
  );
}

/* ------------------------------------------------------------ exportado */

export default function Escritorio() {
  return (
    <group>
      <Envoltorio />
      <Janela />

      {/**
       * Uma peça só. A poltrona foi eliminada: em volume simples ela lia como
       * um bloco azul sem acabamento, e pela regra da direção de arte —
       * "se não puder parecer premium, simplifique ou elimine" — sai. Sobra a
       * mesa, em contraluz contra a janela, que é silhueta e não objeto.
       * À esquerda não há nada: aquele terço é a zona de leitura do hero.
       */}
      <Mesa position={[5.6, SALA.piso + 2.35, 0.5]} giro={-0.3} />
    </group>
  );
}

export { SALA };

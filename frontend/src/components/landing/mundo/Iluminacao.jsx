/**
 * Iluminação — nove da manhã, do começo ao fim.
 *
 * A página não escurece em nenhum momento. O que muda ao longo da rolagem é
 * sutil: a luz sai de um interior com contraste (sol baixo entrando de lado)
 * para um exterior mais difuso e aberto, e volta a ganhar direção na visão
 * final. Nenhum estágio desce abaixo do ponto em que a cena continua clara.
 *
 * Duas regras de composição embutidas aqui:
 *
 *  · A CHAVE FICA DO LADO DO ASSUNTO. O lado é publicado pelo Cinema e é
 *    sempre o oposto ao da coluna de texto. Do lado do texto sobra o
 *    preenchimento difuso, que não produz mancha nem estouro.
 *
 *  · SEM BRANCO PURO. A chave nunca passa de intensidade 2,6 e a exposição
 *    fica em torno de 1,05. Céu claro com resto de cor lê como fotografia;
 *    céu em 100% lê como falha de exposição.
 */

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { COR } from "@/components/landing/mundo/paleta";

/** `u` é o progresso normalizado da rota (0 a 1). */
const CLIMAS = [
  { u: 0.0, ambiente: 0.34, hemisferio: 0.52, chave: 2.9, quente: 1.0 },  // interior, sol de lado
  { u: 0.2, ambiente: 0.38, hemisferio: 0.58, chave: 2.7, quente: 0.82 },  // atravessando o vidro
  { u: 0.45, ambiente: 0.42, hemisferio: 0.64, chave: 2.5, quente: 0.6 }, // cidade, luz difusa
  { u: 0.75, ambiente: 0.4, hemisferio: 0.6, chave: 2.6, quente: 0.55 },  // painel
  { u: 1.0, ambiente: 0.38, hemisferio: 0.58, chave: 2.8, quente: 0.72 },  // visão ampla
];

function climaEm(u) {
  let i = 0;
  while (i < CLIMAS.length - 2 && u > CLIMAS[i + 1].u) i += 1;
  const a = CLIMAS[i];
  const b = CLIMAS[i + 1];
  const f = THREE.MathUtils.clamp((u - a.u) / Math.max(1e-4, b.u - a.u), 0, 1);
  const s = f * f * (3 - 2 * f);
  return {
    ambiente: a.ambiente + (b.ambiente - a.ambiente) * s,
    hemisferio: a.hemisferio + (b.hemisferio - a.hemisferio) * s,
    chave: a.chave + (b.chave - a.chave) * s,
    quente: a.quente + (b.quente - a.quente) * s,
  };
}

export default function Iluminacao() {
  const grupo = useRef();
  const chave = useRef();
  const ambiente = useRef();
  const hemisferio = useRef();
  const preenche = useRef();
  const { camera } = useThree();

  const corQuente = useMemo(() => new THREE.Color(COR.sol), []);
  const corFria = useMemo(() => new THREE.Color(COR.ceuMeio), []);
  const corChave = useMemo(() => new THREE.Color(), []);
  const ladoSuave = useRef(1);

  useFrame((_, delta) => {
    const g = grupo.current;
    if (!g) return;
    const d = Math.min(delta, 0.05);

    // o rig acompanha a câmera com atraso; nunca gruda nela
    g.position.x += (camera.position.x - g.position.x) * Math.min(1, d * 1.3);
    g.position.z += (camera.position.z - g.position.z) * Math.min(1, d * 1.3);

    const c = climaEm(camera.userData.progresso ?? 0);
    if (ambiente.current) ambiente.current.intensity = c.ambiente;
    if (hemisferio.current) hemisferio.current.intensity = c.hemisferio;

    const alvo = camera.userData.lado ?? 1;
    // travessia lenta: lê como o sol mudando de ângulo, não como interruptor
    ladoSuave.current += (alvo - ladoSuave.current) * Math.min(1, d * 0.8);

    if (chave.current) {
      chave.current.intensity = c.chave;
      chave.current.position.set(26 * ladoSuave.current, 20, 22);
      corChave.copy(corFria).lerp(corQuente, c.quente);
      chave.current.color.copy(corChave);
    }
    if (preenche.current) {
      preenche.current.intensity = c.chave * 0.26;
      preenche.current.position.set(-20 * ladoSuave.current, 12, -26);
    }
  });

  return (
    <group ref={grupo}>
      {/* piso de luz alto: é ele que garante que nada fique fechado */}
      <ambientLight ref={ambiente} intensity={0.36} color={COR.ceuBaixo} />
      <hemisphereLight ref={hemisferio} args={[COR.ceuMeio, COR.concretoSombra, 0.55]} />

      {/* sol de manhã, baixo e do lado do assunto */}
      <directionalLight ref={chave} position={[26, 20, 22]} intensity={2.6} color={COR.sol} />

      {/* rebote frio do céu, atrás: recorta a silhueta sem estourar */}
      <directionalLight ref={preenche} position={[-20, 12, -26]} intensity={0.7} color={COR.ceuAlto} />
    </group>
  );
}

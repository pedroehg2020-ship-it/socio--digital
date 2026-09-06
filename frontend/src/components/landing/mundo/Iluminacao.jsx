/**
 * Iluminação do mundo.
 *
 * A cena inteira roda com um rig só, o que mantém a coerência entre as
 * regiões: o mesmo contraluz que recorta o núcleo no hero recorta o radar
 * lá no fundo. As luzes acompanham a câmera na horizontal, então nenhuma
 * região chega "apagada" — mas a direção continua fixa, para que as áreas
 * escuras permaneçam escuras e o volume não se achate.
 *
 * Não há sombra projetada. Em um ambiente sem chão contínuo ela custaria
 * caro e apareceria pouco; o volume aqui vem de contraluz e emissão.
 */

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { COR } from "@/components/landing/mundo/paleta";

export default function Iluminacao({ rico = true }) {
  const grupo = useRef();
  const { camera } = useThree();

  // O rig segue a câmera de longe, com atraso — nunca gruda nela.
  useFrame((_, delta) => {
    const g = grupo.current;
    if (!g) return;
    const d = Math.min(delta, 0.05);
    g.position.x += (camera.position.x - g.position.x) * Math.min(1, d * 1.4);
    g.position.z += (camera.position.z - g.position.z) * Math.min(1, d * 1.4);
  });

  return (
    <group ref={grupo}>
      {/* preenchimento mínimo: define o quanto o escuro fica legível */}
      <ambientLight intensity={0.28} color="#5f7ec0" />
      <hemisphereLight args={["#4d7fd6", "#02060f", 0.5]} />

      {/* luz-chave fria, alta e à frente */}
      <directionalLight position={[16, 22, 14]} intensity={1.5} color="#cfe8ff" />

      {/* contraluz ciano — é ela que desenha a silhueta dos objetos */}
      <directionalLight position={[-18, 6, -26]} intensity={2.2} color={COR.ciano} />

      {rico ? (
        <>
          {/* apoio azul baixo, para o volume não morrer na base */}
          <pointLight position={[0, -14, -20]} intensity={90} distance={90} color={COR.azul} />
          {/* acento violeta, único ponto quente da paleta */}
          <pointLight position={[22, 12, -40]} intensity={70} distance={80} color={COR.violeta} />
        </>
      ) : null}
    </group>
  );
}

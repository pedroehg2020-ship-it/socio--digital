/**
 * Mundo — um objeto só.
 *
 * A página inteira é o campo de partículas mais a câmera. Não há iluminação
 * porque não há nada para iluminar: o campo emite a própria luz, como uma
 * longa exposição. Isso elimina de uma vez o problema que derrubou as versões
 * anteriores — geometria modelada que, sem equipe de arte, sempre lia como
 * jogo antigo.
 */

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Camera, Exposicao, Pos } from "@/components/landing/mundo/Cinema";
import Campo from "@/components/landing/mundo/Campo";
import { NEVOA } from "@/components/landing/mundo/paleta";

function Fundo() {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color(NEVOA.fundo);
    return () => {
      scene.background = null;
    };
  }, [scene]);
  return null;
}

export default function Mundo({ qualidade = "alta", parado = false, largura = 1440 }) {
  const rico = qualidade === "alta";
  const medio = qualidade !== "baixa";

  return (
    <>
      <Fundo />
      <Camera semMovimento={parado} largura={largura} />

      {/* A densidade é o que decide a qualidade da imagem: menos partículas
          não fica "mais simples", fica ralo. Por isso o corte é agressivo
          apenas no nível mais baixo. */}
      <Campo quantidade={rico ? 260000 : medio ? 120000 : 40000} parado={parado} />

      {/* Aqui o bloom volta a ter função real: é ele que transforma pontos
          isolados em corrente luminosa contínua. */}
      {medio ? <Pos intensidade={rico ? 1.5 : 1.1} limiar={0.02} escala={rico ? 1 : 0.7} /> : <Exposicao />}
    </>
  );
}

/**
 * Mundo — a montagem da tomada única.
 *
 * Cinco tipos de objeto, e nada além disso:
 *   1. arquitetura de interior   2. vidro e caixilho   3. mesa e poltrona
 *   4. lâminas de dado em vidro  5. volumes de fachada
 *
 * Nada entra ou sai de cena: tudo existe o tempo inteiro, e o que muda é o
 * ponto de vista. É por isso que a visão final do quadro 8 funciona — o
 * escritório e o painel estão lá porque sempre estiveram.
 */

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Camera, Exposicao, Pos } from "@/components/landing/mundo/Cinema";
import Iluminacao from "@/components/landing/mundo/Iluminacao";
import { NEVOA } from "@/components/landing/mundo/paleta";
import Escritorio from "@/components/landing/mundo/regioes/Escritorio";
import Cidade from "@/components/landing/mundo/regioes/Cidade";
import {
  DadosNaCidade,
  DadosNaJanela,
  PainelInteligente,
} from "@/components/landing/mundo/regioes/Dados";

/**
 * Céu e mapa de ambiente.
 *
 * Todo material da cena resolve o brilho por reflexo, então este canvas é o
 * que decide se a imagem lê como renderização arquitetônica ou como desenho
 * colorido. É um céu de manhã: claro em cima, mais claro no horizonte, com um
 * sol baixo de um lado só — o que dá direção ao realce no vidro e no metal.
 */
function Ambiente() {
  const { scene, gl } = useThree();

  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const g = c.getContext("2d");

    const ceu = g.createLinearGradient(0, 0, 0, 512);
    ceu.addColorStop(0, "#7fa4cd");
    ceu.addColorStop(0.36, "#a8c3de");
    ceu.addColorStop(0.49, "#dde6ee");
    ceu.addColorStop(0.52, "#9ba3ac");
    ceu.addColorStop(1, "#5c646c");
    g.fillStyle = ceu;
    g.fillRect(0, 0, 1024, 512);

    const sol = g.createRadialGradient(268, 196, 0, 268, 196, 220);
    sol.addColorStop(0, "rgba(255,244,226,0.92)");
    sol.addColorStop(0.4, "rgba(255,238,214,0.3)");
    sol.addColorStop(1, "rgba(255,238,214,0)");
    g.fillStyle = sol;
    g.fillRect(0, 0, 1024, 512);

    const bruta = new THREE.CanvasTexture(c);
    bruta.mapping = THREE.EquirectangularReflectionMapping;
    bruta.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const alvo = pmrem.fromEquirectangular(bruta);
    scene.environment = alvo.texture;
    scene.background = new THREE.Color(NEVOA.manha);

    bruta.dispose();
    pmrem.dispose();
    return () => {
      scene.environment = null;
      scene.background = null;
      alvo.dispose();
    };
  }, [scene, gl]);

  return null;
}

export default function Mundo({ qualidade = "alta", parado = false, largura = 1440 }) {
  const rico = qualidade === "alta";
  const medio = qualidade !== "baixa";

  return (
    <>
      <Ambiente />
      <Camera semMovimento={parado} largura={largura} />
      <Iluminacao />

      <Escritorio />
      <Cidade quantidade={rico ? 96 : medio ? 60 : 34} qualidade={qualidade} />

      <DadosNaJanela />
      <DadosNaCidade qualidade={qualidade} />
      <PainelInteligente qualidade={qualidade} parado={parado} />

      {/* Bloom quase imperceptível: só encosta no céu e no realce do vidro.
          Ver a nota em Cinema.Pos sobre por que ele é tão contido aqui. */}
      {medio ? <Pos intensidade={0.12} escala={rico ? 1 : 0.7} desfoque={rico} /> : <Exposicao />}
    </>
  );
}

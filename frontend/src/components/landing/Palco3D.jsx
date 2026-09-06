/**
 * Palco3D — o contêiner do mundo.
 *
 * Responsabilidades desta camada: abrir o único contexto WebGL da página,
 * classificar o aparelho, parar de gastar quadro quando a aba sai de foco e
 * garantir que nada aqui capture clique.
 *
 * Ponto crítico do layout: o canvas fica em `z-index: 0`, atrás de todo o
 * conteúdo, e com `pointer-events: none`. É a garantia estrutural — não
 * cosmética — de que nenhuma figura pode cobrir texto nem roubar o clique de
 * um botão. A composição entre HTML e WebGL é feita pelo enquadramento da
 * câmera, não por objetos passando por cima das palavras.
 */

import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import Mundo from "@/components/landing/mundo/Mundo";
import { NEVOA } from "@/components/landing/mundo/paleta";
import { movimentoReduzido, nivelQualidade } from "@/components/landing/mundo/aparelho";

export default function Palco3D() {
  const parado = useMemo(() => movimentoReduzido(), []);
  const [qualidade, setQualidade] = useState(() => nivelQualidade());
  const [largura, setLargura] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth
  );
  const [ativo, setAtivo] = useState(true);

  // Girar o celular ou arrastar a janela para outro monitor reavalia a cena.
  useEffect(() => {
    let t;
    const aoRedimensionar = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        setQualidade(nivelQualidade());
        setLargura(window.innerWidth);
      }, 200);
    };
    window.addEventListener("resize", aoRedimensionar);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", aoRedimensionar);
    };
  }, []);

  // Aba em segundo plano não consome quadro nenhum.
  useEffect(() => {
    const aoTrocar = () => setAtivo(!document.hidden);
    document.addEventListener("visibilitychange", aoTrocar);
    return () => document.removeEventListener("visibilitychange", aoTrocar);
  }, []);

  const dprMax = qualidade === "alta" ? 1.75 : qualidade === "media" ? 1.35 : 1;

  return (
    <div className="lp-palco" aria-hidden="true">
      <Canvas
        dpr={[1, dprMax]}
        frameloop={ativo ? "always" : "never"}
        camera={{ position: [-3.5, 1.2, 15], fov: 38, near: 0.5, far: 3000 }}
        gl={{
          antialias: qualidade === "alta",
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(NEVOA), 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <Mundo qualidade={qualidade} parado={parado} largura={largura} />
      </Canvas>
    </div>
  );
}

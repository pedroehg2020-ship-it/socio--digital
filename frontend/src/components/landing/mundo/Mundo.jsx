/**
 * Mundo — a montagem do ambiente inteiro.
 *
 * Existe uma única cena, uma única câmera e um único percurso. As regiões não
 * entram e saem: elas ficam onde estão, e o que muda é o ponto de vista. Essa
 * é a diferença de fundo em relação à versão anterior, onde cada seção
 * montava e desmontava uma composição no mesmo lugar da tela.
 */

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Camera, Exposicao, Pos } from "@/components/landing/mundo/Cinema";
import Iluminacao from "@/components/landing/mundo/Iluminacao";
import Estrutura from "@/components/landing/mundo/Estrutura";
import Nucleo from "@/components/landing/mundo/regioes/Nucleo";
import { Clientes, Estoque, Vendas } from "@/components/landing/mundo/regioes/Operacao";
import { Agenda, Financeiro } from "@/components/landing/mundo/regioes/Financas";
import { Console, Documentos } from "@/components/landing/mundo/regioes/Dados";
import { IA, Radar } from "@/components/landing/mundo/regioes/Inteligencia";

/**
 * Mapa de ambiente desenhado em canvas e passado pelo PMREM.
 *
 * É o que dá reflexo de verdade ao metal e ao vidro das estruturas — sem ele
 * as superfícies escuras ficam chapadas, e é justamente o reflexo que produz
 * a leitura de "renderizado" em vez de "geometria colorida". Custa um canvas
 * de 1024×512 uma vez na vida da página.
 */
function Ambiente() {
  const { scene, gl } = useThree();

  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const g = c.getContext("2d");

    const base = g.createLinearGradient(0, 0, 0, 512);
    base.addColorStop(0, "#123157");
    base.addColorStop(0.4, "#0a1734");
    base.addColorStop(0.66, "#04091c");
    base.addColorStop(1, "#01030c");
    g.fillStyle = base;
    g.fillRect(0, 0, 1024, 512);

    const mancha = (x, y, r, rgb, alfa) => {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(${rgb},${alfa})`);
      rg.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = rg;
      g.fillRect(0, 0, 1024, 512);
    };

    mancha(250, 190, 300, "34,211,238", 0.7); // ciano
    mancha(740, 210, 320, "59,130,246", 0.55); // azul
    mancha(520, 60, 380, "200,228,255", 0.5); // janela alta
    mancha(940, 320, 200, "139,92,246", 0.28); // acento violeta

    // faixa de luz superior: vira o realce alongado nas superfícies polidas
    const faixa = g.createLinearGradient(0, 70, 0, 140);
    faixa.addColorStop(0, "rgba(255,255,255,0)");
    faixa.addColorStop(0.5, "rgba(255,255,255,0.45)");
    faixa.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = faixa;
    g.fillRect(0, 70, 1024, 70);

    const bruta = new THREE.CanvasTexture(c);
    bruta.mapping = THREE.EquirectangularReflectionMapping;
    bruta.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const alvo = pmrem.fromEquirectangular(bruta);
    scene.environment = alvo.texture;

    bruta.dispose();
    pmrem.dispose();

    return () => {
      scene.environment = null;
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
      <Iluminacao rico={medio} />

      <Estrutura qualidade={qualidade} parado={parado} />

      <Nucleo parado={parado} qualidade={qualidade} />
      <Financeiro parado={parado} qualidade={qualidade} />
      <Vendas parado={parado} qualidade={qualidade} />
      <Clientes parado={parado} qualidade={qualidade} />
      <Estoque parado={parado} qualidade={qualidade} />
      <Console chave="console" parado={parado} qualidade={qualidade} />
      <Agenda parado={parado} qualidade={qualidade} />
      <Radar parado={parado} qualidade={qualidade} />
      <Documentos parado={parado} qualidade={qualidade} />
      {/* na via de volta a câmera chega pelo lado oposto: o console gira 180° */}
      <Console chave="painel" giro={Math.PI} parado={parado} qualidade={qualidade} />
      <IA parado={parado} qualidade={qualidade} />

      {/* O bloom é o acabamento, não a estrutura: onde ele não cabe, os
          brilhos aditivos das regiões sustentam a leitura sozinhos. */}
      {medio ? <Pos intensidade={rico ? 0.66 : 0.5} escala={rico ? 1 : 0.72} /> : <Exposicao />}
    </>
  );
}

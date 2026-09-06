/**
 * Mundo — a montagem do sítio inteiro.
 *
 * Existe uma única cena, uma única câmera e um único percurso. As regiões não
 * entram e saem: elas ficam onde estão, e o que muda é o ponto de vista. É
 * essa continuidade que permite a leitura final — quando a câmera sobe no
 * último marco, escritório, edifício e estruturas de dados aparecem juntos
 * porque sempre estiveram juntos.
 */

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Camera, Exposicao, Pos } from "@/components/landing/mundo/Cinema";
import Iluminacao from "@/components/landing/mundo/Iluminacao";
import Estrutura from "@/components/landing/mundo/Estrutura";
import { NEVOA } from "@/components/landing/mundo/paleta";
import Escritorio from "@/components/landing/mundo/regioes/Escritorio";
import Edificio from "@/components/landing/mundo/regioes/Edificio";
import { Clientes, Estoque, Vendas } from "@/components/landing/mundo/regioes/Operacao";
import { Agenda, Financeiro } from "@/components/landing/mundo/regioes/Financas";
import { Console, Documentos } from "@/components/landing/mundo/regioes/Dados";
import { IA, Radar } from "@/components/landing/mundo/regioes/Inteligencia";

/**
 * Céu e mapa de ambiente.
 *
 * A versão anterior desenhava manchas de ciano, azul e violeta num canvas e
 * usava aquilo como ambiente — era a origem do reflexo neon em todo material
 * metálico da cena. Agora o mapa é o que de fato existe do lado de fora da
 * janela: um degradê de céu de fim de tarde, com o horizonte claro, a luz do
 * sol num ponto só e o terreno escuro embaixo.
 *
 * Isso importa mais do que parece. Como todos os materiais resolvem o brilho
 * por reflexo, é este canvas que decide se a cena lê como "renderização
 * arquitetônica" ou como "videogame". Custa um canvas de 1024×512 uma vez na
 * vida da página.
 */
function Ambiente() {
  const { scene, gl } = useThree();

  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const g = c.getContext("2d");

    // metade de cima: céu. metade de baixo: terra.
    const ceu = g.createLinearGradient(0, 0, 0, 512);
    ceu.addColorStop(0, "#2f5286");
    ceu.addColorStop(0.34, "#6f92bd");
    ceu.addColorStop(0.49, "#cddaea");
    ceu.addColorStop(0.51, "#5d6a7c");
    ceu.addColorStop(1, "#1b2436");
    g.fillStyle = ceu;
    g.fillRect(0, 0, 1024, 512);

    // sol baixo: a única fonte quente, e a origem do realce nos metais
    const sol = g.createRadialGradient(300, 214, 0, 300, 214, 190);
    sol.addColorStop(0, "rgba(255,238,208,0.95)");
    sol.addColorStop(0.35, "rgba(255,226,186,0.34)");
    sol.addColorStop(1, "rgba(255,226,186,0)");
    g.fillStyle = sol;
    g.fillRect(0, 0, 1024, 512);

    // banda fria oposta: dá direção ao reflexo em vez de deixá-lo chapado
    const frio = g.createRadialGradient(800, 180, 0, 800, 180, 260);
    frio.addColorStop(0, "rgba(190,214,242,0.4)");
    frio.addColorStop(1, "rgba(190,214,242,0)");
    g.fillStyle = frio;
    g.fillRect(0, 0, 1024, 512);

    const bruta = new THREE.CanvasTexture(c);
    bruta.mapping = THREE.EquirectangularReflectionMapping;
    bruta.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const alvo = pmrem.fromEquirectangular(bruta);
    scene.environment = alvo.texture;

    /* O fundo é uma cor só, que o Cinema interpola junto com a névoa. Sem
       isso o horizonte fica preto e a cidade parece recortada no vazio. */
    scene.background = new THREE.Color(NEVOA.dia);

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
      <Iluminacao rico={medio} />

      {/* o sítio: cidade, terreno e atmosfera */}
      <Estrutura qualidade={qualidade} parado={parado} />

      {/* 1. espaço físico */}
      <Escritorio qualidade={qualidade} />
      {/* 2. a empresa */}
      <Edificio qualidade={qualidade} />

      {/* 3. os dados */}
      <Financeiro parado={parado} qualidade={qualidade} />
      <Vendas parado={parado} qualidade={qualidade} />
      <Clientes parado={parado} qualidade={qualidade} />
      <Estoque parado={parado} qualidade={qualidade} />
      <Console chave="console" parado={parado} qualidade={qualidade} />
      <Agenda parado={parado} qualidade={qualidade} />
      <Radar parado={parado} qualidade={qualidade} />
      <Documentos parado={parado} qualidade={qualidade} />
      <Console chave="painel" giro={Math.PI} parado={parado} qualidade={qualidade} />

      {/* 4. a inteligência, para onde tudo converge */}
      <IA parado={parado} qualidade={qualidade} />

      {/* O bloom é acabamento, não estrutura. Ver a nota em Cinema.Pos. */}
      {medio ? <Pos intensidade={rico ? 0.18 : 0.14} escala={rico ? 1 : 0.72} /> : <Exposicao />}
    </>
  );
}

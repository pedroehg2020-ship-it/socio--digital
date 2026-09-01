/**
 * Palco3D — o único contexto WebGL da página.
 *
 * Continua havendo um só <Canvas>, fixo e do tamanho da janela. O que mudou em
 * relação à versão anterior:
 *
 *  - além de posicionar a cena no retângulo reservado pela seção, o
 *    controlador calcula o **progresso de rolagem** daquela seção e o entrega
 *    às cenas por `ref`. Nenhum estado de React muda por quadro;
 *  - a troca de cena não é mais só um fade: a cena que sai recua e encolhe, a
 *    que entra vem da frente — leitura de corte de câmera, não de crossfade;
 *  - o mouse entra como `ref` e é consumido com força diferente por plano de
 *    profundidade, o que produz paralaxe real entre frente, meio e fundo;
 *  - sombras projetadas, mapa de ambiente para reflexo e tone mapping
 *    cinematográfico, todos condicionados ao nível de qualidade do aparelho.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import COMPOSICOES from "@/components/landing/composicoes";
import { Ambiente, Iluminacao, Poeira } from "@/components/landing/ambiente3d";
import {
  movimentoReduzido,
  nivelQualidade,
  slotAtivo,
} from "@/components/landing/palco";

/**
 * Raio de referência com que as cenas são desenhadas. O encaixe no slot usa
 * este número, e o fator de transbordo abaixo deixa a cena vazar para fora da
 * coluna de propósito — é o que tira a página da aparência de "ilustração
 * dentro de uma caixinha".
 */
const RAIO_BASE = 2.75;
const TRANSBORDO = 1.42;

function Controlador({ semMovimento, qualidade }) {
  const { camera, size } = useThree();
  const grupo = useRef();

  const [chaveMontada, setChaveMontada] = useState(null);

  const fade = useRef(0);
  const alvoFade = useRef(0);
  const mouse = useRef({ x: 0, y: 0 });
  const mouseAlvo = useRef({ x: 0, y: 0 });
  const progresso = useRef(0);
  const encaixado = useRef(false);

  useEffect(() => {
    if (semMovimento) return undefined;
    const aoMover = (e) => {
      mouseAlvo.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseAlvo.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    const aoSair = () => {
      mouseAlvo.current.x = 0;
      mouseAlvo.current.y = 0;
    };
    window.addEventListener("pointermove", aoMover, { passive: true });
    window.addEventListener("pointerleave", aoSair);
    return () => {
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("pointerleave", aoSair);
    };
  }, [semMovimento]);

  useFrame((state, delta) => {
    const g = grupo.current;
    if (!g) return;

    const d = Math.min(delta, 0.05);
    const passo = Math.min(1, d * 6.5);

    // suaviza o mouse para o paralaxe não ficar nervoso
    mouse.current.x += (mouseAlvo.current.x - mouse.current.x) * Math.min(1, d * 4);
    mouse.current.y += (mouseAlvo.current.y - mouse.current.y) * Math.min(1, d * 4);

    const alvo = slotAtivo();
    const chaveDesejada = alvo && COMPOSICOES[alvo.chave] ? alvo.chave : null;
    if (alvo) progresso.current = alvo.progresso;

    /* -------------------------------------------------- troca de cena */
    if (chaveDesejada !== chaveMontada) {
      alvoFade.current = 0;
      if (fade.current < 0.05) {
        fade.current = 0;
        encaixado.current = false;
        setChaveMontada(chaveDesejada);
      }
    } else {
      alvoFade.current = chaveDesejada ? 1 : 0;
    }
    fade.current += (alvoFade.current - fade.current) * Math.min(1, d * 5.5);
    const o = THREE.MathUtils.clamp(fade.current, 0, 1);

    /* ------------------------------- encaixe no retângulo da seção */
    if (alvo) {
      const distancia = camera.position.z;
      const alturaVisivel = 2 * Math.tan(((camera.fov * Math.PI) / 180) / 2) * distancia;
      const unidadesPorPixel = alturaVisivel / size.height;

      const centroX = alvo.rect.left + alvo.rect.width / 2;
      const centroY = alvo.rect.top + alvo.rect.height / 2;

      const alvoX = (centroX - size.width / 2) * unidadesPorPixel;
      const alvoY = -(centroY - size.height / 2) * unidadesPorPixel;

      const meiaAltura = (alvo.rect.height * unidadesPorPixel) / 2;
      const meiaLargura = (alvo.rect.width * unidadesPorPixel) / 2;
      const escalaAlvo =
        (Math.min(meiaAltura, meiaLargura) * TRANSBORDO) / RAIO_BASE;

      // a cena entra vindo da frente e recua ao sair: corte de câmera
      const zEntrada = (1 - o) * 3.4;
      const escalaEntrada = escalaAlvo * (0.82 + o * 0.18);

      if (!encaixado.current) {
        g.position.set(alvoX, alvoY, zEntrada);
        g.scale.setScalar(Math.max(0.001, escalaEntrada));
        encaixado.current = true;
      } else {
        g.position.x += (alvoX - g.position.x) * passo;
        g.position.y += (alvoY - g.position.y) * passo;
        g.position.z += (zEntrada - g.position.z) * passo;
        const e = g.scale.x + (escalaEntrada - g.scale.x) * passo;
        g.scale.setScalar(Math.max(0.001, e));
      }
    }

    /* --------------------------------- inclinação geral e opacidade */
    const inclX = semMovimento ? 0 : mouse.current.y * 0.07;
    const inclY = semMovimento ? 0 : mouse.current.x * 0.1;
    g.rotation.x += (inclX - g.rotation.x) * Math.min(1, d * 2.6);
    g.rotation.y += (inclY - g.rotation.y) * Math.min(1, d * 2.6);

    g.visible = o > 0.012;
    if (!g.visible) return;

    g.traverse((filho) => {
      const m = filho.material;
      if (!m) return;
      if (Array.isArray(m)) {
        m.forEach((x) => {
          x.opacity = (x.userData.opacidadeBase ?? x.opacity) * o;
        });
      } else {
        if (m.userData.opacidadeBase === undefined) {
          m.userData.opacidadeBase = m.opacity;
        }
        m.opacity = m.userData.opacidadeBase * o;
      }
    });
  });

  const Cena = chaveMontada ? COMPOSICOES[chaveMontada] : null;

  return (
    <>
      <Ambiente />
      <Iluminacao sombras={qualidade === "alta"} />
      {qualidade !== "baixa" ? (
        <Poeira quantidade={qualidade === "alta" ? 240 : 120} semMovimento={semMovimento} />
      ) : null}

      <group ref={grupo} scale={0.001}>
        {Cena ? (
          <Cena
            key={chaveMontada}
            progresso={progresso}
            mouse={mouse}
            semMovimento={semMovimento}
            qualidade={qualidade}
          />
        ) : null}
      </group>
    </>
  );
}

export default function Palco3D() {
  const semMovimento = useMemo(() => movimentoReduzido(), []);
  const [qualidade, setQualidade] = useState(() => nivelQualidade());
  const [ativo, setAtivo] = useState(true);

  // Reavalia a qualidade quando a janela muda de faixa (girar o celular,
  // arrastar a janela para outro monitor).
  useEffect(() => {
    let t;
    const aoRedimensionar = () => {
      clearTimeout(t);
      t = setTimeout(() => setQualidade(nivelQualidade()), 220);
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

  const dprMax = qualidade === "alta" ? 1.9 : qualidade === "media" ? 1.5 : 1;

  return (
    <div className="lp-palco" aria-hidden="true">
      <Canvas
        dpr={[1, dprMax]}
        frameloop={ativo ? "always" : "never"}
        shadows={qualidade === "alta" ? "soft" : false}
        camera={{ position: [0, 0, 11], fov: 36, near: 0.1, far: 90 }}
        gl={{
          antialias: qualidade !== "baixa",
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          // ACES + espaço sRGB é o que dá a resposta de luz "de render" em vez
          // do contraste plano do padrão do WebGL.
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <Controlador semMovimento={semMovimento} qualidade={qualidade} />
      </Canvas>
    </div>
  );
}

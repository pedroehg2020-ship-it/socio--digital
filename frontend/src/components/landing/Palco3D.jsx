/**
 * Palco3D — o único canvas WebGL da página inicial.
 *
 * Em vez de um <Canvas> por seção (o que criaria uma dezena de contextos
 * WebGL simultâneos e derrubaria a performance), existe um só canvas fixo,
 * do tamanho da janela, com `pointer-events: none`.
 *
 * A cada quadro o controlador:
 *   1. pergunta ao registro qual slot está mais perto do centro da tela;
 *   2. converte o retângulo desse slot (em pixels) para coordenadas de mundo;
 *   3. move e redimensiona a composição para encaixar exatamente ali;
 *   4. faz o fade quando a seção muda, trocando a composição montada.
 *
 * Como o encaixe parte do retângulo real do DOM, o mesmo código serve para
 * desktop (coluna ao lado do texto) e mobile (bloco acima do texto) — não há
 * layout 3D duplicado.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import COMPOSICOES from "@/components/landing/composicoes";
import { PALETA } from "@/components/landing/primitivas3d";
import { movimentoReduzido, slotAtivo } from "@/components/landing/palco";

/** Raio de referência usado ao desenhar as composições. */
const RAIO_BASE = 1.62;

function Controlador({ semMovimento }) {
  const { camera, size } = useThree();
  const grupo = useRef();

  const [chaveMontada, setChaveMontada] = useState(null);
  const fade = useRef(0);
  const alvoFade = useRef(0);
  const ponteiro = useRef({ x: 0, y: 0 });
  const primeiroEncaixe = useRef(false);

  useEffect(() => {
    if (semMovimento) return undefined;
    const aoMover = (e) => {
      ponteiro.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      ponteiro.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", aoMover, { passive: true });
    return () => window.removeEventListener("pointermove", aoMover);
  }, [semMovimento]);

  useFrame((_, delta) => {
    const g = grupo.current;
    if (!g) return;

    const passo = Math.min(1, delta * 7);
    const alvo = slotAtivo();
    const chaveDesejada = alvo && COMPOSICOES[alvo.chave] ? alvo.chave : null;

    /* ------------------------------------------------- troca de composição */
    if (chaveDesejada !== chaveMontada) {
      alvoFade.current = 0;
      if (fade.current < 0.04) {
        fade.current = 0;
        primeiroEncaixe.current = false;
        setChaveMontada(chaveDesejada);
      }
    } else {
      alvoFade.current = chaveDesejada ? 1 : 0;
    }
    fade.current += (alvoFade.current - fade.current) * Math.min(1, delta * 6);

    /* --------------------------------- encaixe no retângulo reservado */
    if (alvo) {
      const distancia = camera.position.z;
      const alturaVisivel =
        2 * Math.tan(((camera.fov * Math.PI) / 180) / 2) * distancia;
      const unidadesPorPixel = alturaVisivel / size.height;

      const centroX = alvo.rect.left + alvo.rect.width / 2;
      const centroY = alvo.rect.top + alvo.rect.height / 2;

      const alvoX = (centroX - size.width / 2) * unidadesPorPixel;
      const alvoY = -(centroY - size.height / 2) * unidadesPorPixel;

      const meiaAlturaMundo = (alvo.rect.height * unidadesPorPixel) / 2;
      const meiaLarguraMundo = (alvo.rect.width * unidadesPorPixel) / 2;
      const alvoEscala =
        (Math.min(meiaAlturaMundo, meiaLarguraMundo) * 0.94) / RAIO_BASE;

      if (!primeiroEncaixe.current) {
        // O primeiro quadro após a troca já nasce no lugar certo: sem isso a
        // composição atravessaria a tela vindo da posição anterior.
        g.position.set(alvoX, alvoY, 0);
        g.scale.setScalar(Math.max(0.001, alvoEscala));
        primeiroEncaixe.current = true;
      } else {
        g.position.x += (alvoX - g.position.x) * passo;
        g.position.y += (alvoY - g.position.y) * passo;
        const e = g.scale.x + (alvoEscala - g.scale.x) * passo;
        g.scale.setScalar(Math.max(0.001, e));
      }
    }

    /* ------------------------------------------------- paralaxe e opacidade */
    const inclinacaoX = semMovimento ? 0 : ponteiro.current.y * 0.09;
    const inclinacaoY = semMovimento ? 0 : ponteiro.current.x * 0.13;
    g.rotation.x += (inclinacaoX - g.rotation.x) * Math.min(1, delta * 3);
    g.rotation.y += (inclinacaoY - g.rotation.y) * Math.min(1, delta * 3);

    const o = Math.max(0, Math.min(1, fade.current));
    g.visible = o > 0.01;
    g.traverse((filho) => {
      if (filho.material) {
        const mats = Array.isArray(filho.material) ? filho.material : [filho.material];
        mats.forEach((m) => {
          m.opacity = o;
        });
      }
    });
  });

  const Composicao = chaveMontada ? COMPOSICOES[chaveMontada] : null;

  return (
    <>
      <ambientLight intensity={0.62} />
      <directionalLight position={[3.5, 5.5, 5]} intensity={1.25} />
      <pointLight position={[-4.5, 1.5, 3]} intensity={26} color={PALETA.marca} distance={16} />
      <pointLight position={[4.5, -1.5, 3]} intensity={24} color={PALETA.apoio} distance={16} />

      <group ref={grupo} scale={0.001}>
        {Composicao ? <Composicao semMovimento={semMovimento} /> : null}
      </group>
    </>
  );
}

export default function Palco3D() {
  const semMovimento = useMemo(() => movimentoReduzido(), []);
  const [frameloop, setFrameloop] = useState("always");

  // Aba em segundo plano não precisa de quadros.
  useEffect(() => {
    const aoTrocar = () => setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", aoTrocar);
    return () => document.removeEventListener("visibilitychange", aoTrocar);
  }, []);

  const dprMaximo =
    typeof window !== "undefined" && window.innerWidth < 780 ? 1.4 : 1.8;

  return (
    <div className="lp-palco" aria-hidden="true">
      <Canvas
        dpr={[1, dprMaximo]}
        frameloop={frameloop}
        camera={{ position: [0, 0, 10], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <Controlador semMovimento={semMovimento} />
      </Canvas>
    </div>
  );
}

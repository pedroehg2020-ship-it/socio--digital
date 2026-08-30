/**
 * Cena 3D da página inicial — React Three Fiber.
 *
 * Ambiente de gestão empresarial: um painel de dashboard flutuando em
 * perspectiva, cercado por elementos financeiros (moedas, cartões, notas
 * fiscais, caixas de estoque) e um piso em grade.
 *
 * A cena reage a duas entradas:
 *   - progresso da rolagem (0 → 1), que gira a câmera, aproxima o painel e
 *     faz as barras do gráfico crescerem;
 *   - posição do mouse, que aplica um leve paralaxe.
 *
 * Tudo é desenhado com geometrias primitivas e texturas geradas em canvas —
 * não há download de modelos, HDRs ou fontes externas.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/* ------------------------------------------------------------- utilidades */

const PALETA = {
  midnight: "#0a1128",
  painel: "#111c3d",
  emerald: "#10b981",
  emeraldEscuro: "#059669",
  blue: "#3b82f6",
  blueEscuro: "#1d4ed8",
  violet: "#a855f7",
  amber: "#f59e0b",
  rose: "#f43f5e",
  cyan: "#06b6d4",
  claro: "#dbe6fb",
};

const lerp = (a, b, t) => a + (b - a) * t;

/** Textura de texto gerada em canvas (evita carregar fontes externas). */
function useTextoTextura(texto, cor = "#0a1128", fundo = "#ffffff") {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = fundo;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = cor;
    ctx.font = "bold 118px Outfit, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, 128, 136);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }, [texto, cor, fundo]);
}

/** Geometria de retângulo com cantos arredondados (usada nos painéis). */
function useFormaArredondada(largura, altura, raio = 0.12, profundidade = 0.06) {
  return useMemo(() => {
    const forma = new THREE.Shape();
    const l = largura / 2;
    const a = altura / 2;
    forma.moveTo(-l + raio, -a);
    forma.lineTo(l - raio, -a);
    forma.quadraticCurveTo(l, -a, l, -a + raio);
    forma.lineTo(l, a - raio);
    forma.quadraticCurveTo(l, a, l - raio, a);
    forma.lineTo(-l + raio, a);
    forma.quadraticCurveTo(-l, a, -l, a - raio);
    forma.lineTo(-l, -a + raio);
    forma.quadraticCurveTo(-l, -a, -l + raio, -a);
    const geo = new THREE.ExtrudeGeometry(forma, {
      depth: profundidade,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 2,
      curveSegments: 8,
    });
    geo.center();
    return geo;
  }, [largura, altura, raio, profundidade]);
}

/* ------------------------------------------------------------ componentes */

/** Cartão retangular genérico (KPI, cartão de crédito, nota fiscal). */
function Cartao({ largura, altura, cor, opacidade = 1, emissiva, ...props }) {
  const geo = useFormaArredondada(largura, altura, Math.min(0.1, altura / 3), 0.04);
  return (
    <mesh geometry={geo} {...props}>
      <meshStandardMaterial
        color={cor}
        roughness={0.42}
        metalness={0.18}
        transparent={opacidade < 1}
        opacity={opacidade}
        emissive={emissiva || "#000000"}
        emissiveIntensity={emissiva ? 0.45 : 0}
      />
    </mesh>
  );
}

/** Barra do gráfico: cresce conforme o progresso da rolagem. */
function Barra({ x, alturaFinal, cor, atraso, progresso }) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const p = THREE.MathUtils.clamp((progresso.current - atraso) * 3.2, 0, 1);
    const suave = p * p * (3 - 2 * p); // smoothstep
    const pulso = 1 + Math.sin(state.clock.elapsedTime * 1.6 + x * 2) * 0.03;
    const h = Math.max(0.02, alturaFinal * suave * pulso);
    ref.current.scale.y = h;
    ref.current.position.y = h / 2 - 0.86;
  });

  return (
    <mesh ref={ref} position={[x, -0.86, 0.07]}>
      <boxGeometry args={[0.17, 1, 0.11]} />
      <meshStandardMaterial color={cor} roughness={0.3} metalness={0.28} emissive={cor} emissiveIntensity={0.28} />
    </mesh>
  );
}

/** Linha de tendência desenhada sobre o painel. */
function LinhaTendencia({ progresso }) {
  const ref = useRef();

  const curva = useMemo(() => {
    const pontos = [
      [-1.55, -0.32], [-1.05, -0.05], [-0.55, -0.2], [-0.05, 0.24],
      [0.45, 0.12], [0.95, 0.46], [1.45, 0.66],
    ].map(([x, y]) => new THREE.Vector3(x, y, 0.2));
    return new THREE.CatmullRomCurve3(pontos);
  }, []);

  const geo = useMemo(() => new THREE.TubeGeometry(curva, 90, 0.022, 8, false), [curva]);

  useFrame(() => {
    if (!ref.current) return;
    const p = THREE.MathUtils.clamp((progresso.current - 0.02) * 2.4, 0, 1);
    ref.current.geometry.setDrawRange(0, Math.floor(geo.index.count * p));
  });

  return (
    <mesh ref={ref} geometry={geo}>
      <meshStandardMaterial color={PALETA.emerald} emissive={PALETA.emerald} emissiveIntensity={0.9} roughness={0.25} />
    </mesh>
  );
}

/** O painel de dashboard flutuando em perspectiva. */
function PainelDashboard({ progresso }) {
  const grupo = useRef();
  const fundo = useFormaArredondada(4.3, 2.6, 0.16, 0.09);

  useFrame((state, delta) => {
    if (!grupo.current) return;
    const t = state.clock.elapsedTime;
    const p = progresso.current;
    // Sobe e endireita conforme a página rola.
    grupo.current.rotation.x = lerp(grupo.current.rotation.x, -0.34 + p * 0.3, delta * 2.2);
    grupo.current.rotation.y = lerp(grupo.current.rotation.y, 0.42 - p * 0.5, delta * 2.2);
    grupo.current.position.y = lerp(grupo.current.position.y, 0.12 + Math.sin(t * 0.7) * 0.07 + p * 0.3, delta * 2.4);
  });

  const kpis = [
    { x: -1.5, cor: PALETA.emerald },
    { x: -0.5, cor: PALETA.blue },
    { x: 0.5, cor: PALETA.violet },
    { x: 1.5, cor: PALETA.amber },
  ];

  const barras = [
    { x: -1.5, h: 0.62, cor: PALETA.emerald, atraso: 0.0 },
    { x: -1.15, h: 0.86, cor: PALETA.emerald, atraso: 0.04 },
    { x: -0.8, h: 0.52, cor: PALETA.blue, atraso: 0.08 },
    { x: -0.45, h: 1.02, cor: PALETA.blue, atraso: 0.12 },
    { x: -0.1, h: 0.74, cor: PALETA.violet, atraso: 0.16 },
    { x: 0.25, h: 1.18, cor: PALETA.violet, atraso: 0.2 },
    { x: 0.6, h: 0.9, cor: PALETA.amber, atraso: 0.24 },
    { x: 0.95, h: 1.34, cor: PALETA.cyan, atraso: 0.28 },
  ];

  return (
    <group ref={grupo} position={[0.35, 0.12, 0]}>
      {/* corpo do painel */}
      <mesh geometry={fundo}>
        <meshStandardMaterial color={PALETA.painel} roughness={0.55} metalness={0.35} />
      </mesh>

      {/* moldura luminosa */}
      <mesh geometry={fundo} scale={[1.012, 1.02, 0.6]} position={[0, 0, -0.03]}>
        <meshBasicMaterial color={PALETA.blueEscuro} transparent opacity={0.35} />
      </mesh>

      {/* faixa de KPIs no topo */}
      {kpis.map((k) => (
        <group key={k.x} position={[k.x, 0.94, 0.07]}>
          <Cartao largura={0.86} altura={0.42} cor={k.cor} emissiva={k.cor} />
        </group>
      ))}

      {/* área do gráfico */}
      <mesh position={[0, -0.24, 0.05]}>
        <planeGeometry args={[3.9, 1.5]} />
        <meshStandardMaterial color="#0c1733" roughness={0.8} />
      </mesh>

      {barras.map((b) => (
        <Barra key={b.x} x={b.x} alturaFinal={b.h} cor={b.cor} atraso={b.atraso} progresso={progresso} />
      ))}

      <group position={[0, -0.1, 0]}>
        <LinhaTendencia progresso={progresso} />
      </group>
    </group>
  );
}

/**
 * Elemento que flutua livremente ao redor do painel: cada um recebe uma
 * órbita e uma velocidade próprias.
 */
function Flutuante({ children, posicao, amplitude = 0.22, velocidade = 0.6, giro = 0.25, fase = 0 }) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * velocidade + fase;
    ref.current.position.x = posicao[0] + Math.sin(t * 0.8) * amplitude * 0.5;
    ref.current.position.y = posicao[1] + Math.sin(t) * amplitude;
    ref.current.position.z = posicao[2] + Math.cos(t * 0.7) * amplitude * 0.4;
    ref.current.rotation.y = Math.sin(t * 0.5) * giro;
    ref.current.rotation.z = Math.cos(t * 0.4) * giro * 0.5;
  });

  return <group ref={ref}>{children}</group>;
}

/** Moeda com símbolo (R$, %, etc.). */
function Moeda({ simbolo, cor, tamanho = 0.3 }) {
  const textura = useTextoTextura(simbolo, "#0a1128", "#f4f8ff");
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[tamanho, tamanho, tamanho * 0.16, 40]} />
        <meshStandardMaterial color={cor} roughness={0.28} metalness={0.65} />
      </mesh>
      <mesh position={[0, tamanho * 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[tamanho * 0.78, 40]} />
        <meshStandardMaterial map={textura} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Nota fiscal: folha branca com linhas de texto simuladas. */
function NotaFiscal() {
  const geo = useFormaArredondada(0.62, 0.84, 0.04, 0.02);
  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#f6f9ff" roughness={0.65} />
      </mesh>
      {[0.26, 0.15, 0.04, -0.07, -0.18].map((y, i) => (
        <mesh key={y} position={[i % 2 ? -0.04 : 0, y, 0.022]}>
          <planeGeometry args={[i % 2 ? 0.34 : 0.42, 0.032]} />
          <meshBasicMaterial color={i === 0 ? PALETA.blueEscuro : "#c3cfe4"} />
        </mesh>
      ))}
      <mesh position={[0.15, -0.3, 0.022]}>
        <planeGeometry args={[0.24, 0.09]} />
        <meshBasicMaterial color={PALETA.emerald} />
      </mesh>
    </group>
  );
}

/** Caixa de estoque. */
function CaixaEstoque({ cor = "#c98b4b" }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.52, 0.42, 0.42]} />
        <meshStandardMaterial color={cor} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.212, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.52, 0.1]} />
        <meshBasicMaterial color="#a86f39" />
      </mesh>
    </group>
  );
}

/** Cartão de crédito / meio de pagamento. */
function CartaoPagamento() {
  const geo = useFormaArredondada(0.88, 0.55, 0.07, 0.03);
  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial color={PALETA.blueEscuro} roughness={0.3} metalness={0.55} />
      </mesh>
      <mesh position={[-0.26, 0.06, 0.021]}>
        <planeGeometry args={[0.16, 0.12]} />
        <meshStandardMaterial color={PALETA.amber} metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0.02, -0.16, 0.021]}>
        <planeGeometry args={[0.56, 0.05]} />
        <meshBasicMaterial color="#7ea6ee" />
      </mesh>
    </group>
  );
}

/** Piso em grade com esmaecimento na distância. */
function Grade() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms: { uCor: { value: new THREE.Color(PALETA.blue) } },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform vec3 uCor;
          void main() {
            vec2 g = abs(fract(vUv * 26.0 - 0.5) - 0.5) / fwidth(vUv * 26.0);
            float linha = 1.0 - min(min(g.x, g.y), 1.0);
            float dist = distance(vUv, vec2(0.5));
            float fade = smoothstep(0.5, 0.06, dist);
            gl_FragColor = vec4(uCor, linha * fade * 0.42);
          }
        `,
      }),
    []
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, -1]} material={material}>
      <planeGeometry args={[26, 26]} />
    </mesh>
  );
}

/** Partículas de fundo. */
function Particulas({ quantidade = 130 }) {
  const ref = useRef();

  const geometria = useMemo(() => {
    const pos = new Float32Array(quantidade * 3);
    for (let i = 0; i < quantidade; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [quantidade]);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={ref} geometry={geometria}>
      <pointsMaterial size={0.045} color={PALETA.claro} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

/** Câmera com paralaxe de mouse e deslocamento por rolagem. */
function Camera({ progresso, mouse }) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const p = progresso.current;
    const alvoX = mouse.current.x * 0.9;
    const alvoY = 0.25 + mouse.current.y * 0.55 - p * 1.1;
    const alvoZ = 9.4 - p * 1.6;
    camera.position.x = lerp(camera.position.x, alvoX, delta * 2.4);
    camera.position.y = lerp(camera.position.y, alvoY, delta * 2.4);
    camera.position.z = lerp(camera.position.z, alvoZ, delta * 2.4);
    camera.lookAt(0, -p * 0.5, 0);
  });

  return null;
}

/* ----------------------------------------------------------------- cena */

function Cena({ progresso, mouse }) {
  return (
    <>
      <Camera progresso={progresso} mouse={mouse} />

      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.15} />
      <pointLight position={[-5, 1.5, 3]} intensity={38} color={PALETA.emerald} distance={16} />
      <pointLight position={[5.5, -1, 2]} intensity={34} color={PALETA.blue} distance={16} />
      <pointLight position={[0, 3.5, -3]} intensity={20} color={PALETA.violet} distance={14} />

      <Grade />
      <Particulas />

      <PainelDashboard progresso={progresso} />

      <Flutuante posicao={[-3.35, 0.95, 1.1]} velocidade={0.52} amplitude={0.28}>
        <Moeda simbolo="R$" cor={PALETA.emerald} tamanho={0.34} />
      </Flutuante>
      <Flutuante posicao={[-2.75, -1.25, 1.6]} velocidade={0.68} amplitude={0.22} fase={1.8}>
        <Moeda simbolo="%" cor={PALETA.amber} tamanho={0.24} />
      </Flutuante>
      <Flutuante posicao={[3.5, 1.35, 0.6]} velocidade={0.46} amplitude={0.26} fase={0.9}>
        <NotaFiscal />
      </Flutuante>
      <Flutuante posicao={[3.15, -1.15, 1.5]} velocidade={0.6} amplitude={0.24} fase={2.4}>
        <CartaoPagamento />
      </Flutuante>
      <Flutuante posicao={[-3.75, -0.35, -0.8]} velocidade={0.4} amplitude={0.2} fase={3.1}>
        <CaixaEstoque />
      </Flutuante>
      <Flutuante posicao={[2.4, 1.95, -1.4]} velocidade={0.55} amplitude={0.3} fase={1.2}>
        <Moeda simbolo="$" cor={PALETA.cyan} tamanho={0.2} />
      </Flutuante>
      <Flutuante posicao={[-1.9, 2.05, -1.1]} velocidade={0.5} amplitude={0.24} fase={4.2}>
        <Cartao largura={0.7} altura={0.34} cor={PALETA.violet} emissiva={PALETA.violet} />
      </Flutuante>
      <Flutuante posicao={[4.05, -0.1, -1.8]} velocidade={0.44} amplitude={0.26} fase={5.1}>
        <CaixaEstoque cor="#b3793f" />
      </Flutuante>
    </>
  );
}

/* -------------------------------------------------------------- wrapper */

/** Detecta suporte a WebGL para permitir um fallback silencioso. */
function temWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

/**
 * Canvas fixo ao fundo da página. O progresso da rolagem é lido por
 * referência (não por estado) para não re-renderizar o React a cada pixel.
 */
export default function Scene3D({ alvoRolagem }) {
  const progresso = useRef(0);
  const mouse = useRef({ x: 0, y: 0 });
  const [ativo, setAtivo] = useState(false);
  // Enquanto a cena está fora da tela não há motivo para desenhar quadros.
  const [naTela, setNaTela] = useState(true);

  useEffect(() => {
    const semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setAtivo(temWebGL() && !semAnimacao);
  }, []);

  useEffect(() => {
    if (!ativo) return undefined;

    const aoRolar = () => {
      const alturaHero = alvoRolagem?.current?.offsetHeight || window.innerHeight;
      progresso.current = Math.min(1, Math.max(0, window.scrollY / (alturaHero * 0.9)));
      setNaTela(window.scrollY < alturaHero + window.innerHeight * 0.3);
    };
    const aoMover = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };

    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("pointermove", aoMover, { passive: true });
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("pointermove", aoMover);
    };
  }, [ativo, alvoRolagem]);

  if (!ativo) return <div className="cena3d-fallback" aria-hidden="true" />;

  return (
    <div className="cena3d" aria-hidden="true">
      <Canvas
        dpr={[1, typeof window !== "undefined" && window.innerWidth < 780 ? 1.4 : 1.8]}
        frameloop={naTela ? "always" : "demand"}
        camera={{ position: [0, 0.25, 9.4], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <Cena progresso={progresso} mouse={mouse} />
      </Canvas>
    </div>
  );
}

/**
 * Ambiente da cena: o que dá acabamento "renderizado" em vez de "geometria
 * colorida".
 *
 *  - mapa de ambiente gerado por PMREM a partir de um canvas equirretangular,
 *    o que produz reflexo real em metal e vidro sem baixar nenhum HDR;
 *  - rig de três luzes (chave quente da marca, preenchimento de apoio e
 *    contraluz) mais sombra projetada só no plano de contato;
 *  - poeira volumétrica em três profundidades, que é o que cria o paralaxe
 *    quando a câmera se mexe.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export const PALETA = {
  marca: "#10b981",
  marcaForte: "#059669",
  marcaClara: "#34d399",
  apoio: "#3b82f6",
  apoioForte: "#2563eb",
  apoioClaro: "#60a5fa",
  tinta: "#070e22",
  tinta2: "#0d1733",
  tinta3: "#16224a",
  aco: "#8fa2c6",
  neutro: "#dbe4f5",
  neutroClaro: "#f4f7fd",
};

/* ------------------------------------------------------ mapa de ambiente */

/**
 * Céu equirretangular desenhado em canvas: faixa escura embaixo, brilho verde
 * de um lado, azul do outro e uma "janela" clara no alto. É esse desenho que
 * aparece refletido nas superfícies metálicas e de vidro.
 */
function criarTexturaAmbiente() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d");

  const base = g.createLinearGradient(0, 0, 0, 512);
  base.addColorStop(0, "#1a2a56");
  base.addColorStop(0.42, "#0d1733");
  base.addColorStop(0.62, "#070e22");
  base.addColorStop(1, "#03060f");
  g.fillStyle = base;
  g.fillRect(0, 0, 1024, 512);

  const brilho = (x, y, r, cor, alfa) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, cor.replace("ALFA", alfa));
    rg.addColorStop(1, cor.replace("ALFA", "0"));
    g.fillStyle = rg;
    g.fillRect(0, 0, 1024, 512);
  };

  brilho(250, 170, 300, "rgba(16,185,129,ALFA)", "0.7");
  brilho(760, 210, 320, "rgba(59,130,246,ALFA)", "0.6");
  brilho(512, 40, 420, "rgba(226,238,255,ALFA)", "0.55");
  brilho(940, 120, 180, "rgba(255,255,255,ALFA)", "0.5");

  // faixa de luz superior — vira o realce alongado nos objetos polidos
  const faixa = g.createLinearGradient(0, 60, 0, 130);
  faixa.addColorStop(0, "rgba(255,255,255,0)");
  faixa.addColorStop(0.5, "rgba(255,255,255,.5)");
  faixa.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = faixa;
  g.fillRect(0, 60, 1024, 70);

  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Instala o env map na cena uma única vez. */
export function Ambiente() {
  const { scene, gl } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const bruta = criarTexturaAmbiente();
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

/* ---------------------------------------------------------------- luzes */

export function Iluminacao({ sombras = true }) {
  const chave = useRef();

  return (
    <>
      <ambientLight intensity={0.42} />
      <hemisphereLight args={["#7f9fd8", "#050a18", 0.5]} />

      {/* luz-chave, cor da marca, é quem projeta a sombra */}
      <directionalLight
        ref={chave}
        position={[5.5, 7.5, 6]}
        intensity={2.1}
        color="#dff7ec"
        castShadow={sombras}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0006}
        shadow-normalBias={0.028}
        shadow-camera-near={1}
        shadow-camera-far={34}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />

      {/* preenchimento frio pelo lado oposto */}
      <directionalLight position={[-6, 2.5, 4]} intensity={0.85} color="#8fbaff" />

      {/* contraluz que recorta a silhueta contra o fundo */}
      <directionalLight position={[-2, -3, -7]} intensity={1.15} color="#34d399" />

      <pointLight position={[-4.2, 1.4, 3.4]} intensity={22} color={PALETA.marca} distance={17} decay={2} />
      <pointLight position={[4.6, -1.6, 3.2]} intensity={20} color={PALETA.apoio} distance={17} decay={2} />
    </>
  );
}

/* -------------------------------------------------- sombra de contato */

function texturaBorrao() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, "rgba(0,0,0,.62)");
  rg.addColorStop(0.45, "rgba(0,0,0,.3)");
  rg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/**
 * Mancha escura sob a cena. Barata e sempre correta — ancora os objetos no
 * espaço mesmo onde o shadow map não alcança.
 */
export function SombraContato({ escala = 5.4, y = -2.2, opacidade = 0.85, ...props }) {
  const mapa = useMemo(texturaBorrao, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} {...props}>
      <planeGeometry args={[escala, escala * 0.62]} />
      <meshBasicMaterial
        map={mapa}
        transparent
        opacity={opacidade}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------- reflexo */

/**
 * Piso escuro e polido. Não é um espelho de verdade (custaria um segundo
 * render), mas com o env map e rugosidade baixa ele devolve o brilho das luzes
 * e dá a leitura de superfície reflexiva.
 */
export function PisoPolido({ y = -2.25, tamanho = 26 }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, -2]} receiveShadow>
      <planeGeometry args={[tamanho, tamanho]} />
      <meshStandardMaterial
        color="#050a1a"
        roughness={0.16}
        metalness={0.86}
        envMapIntensity={1.5}
        transparent
        opacity={1}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------ partículas */

function texturaPonto() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, "rgba(255,255,255,1)");
  rg.addColorStop(0.35, "rgba(210,235,255,.55)");
  rg.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/**
 * Três camadas de poeira luminosa em profundidades diferentes. A camada da
 * frente é maior e reage mais ao mouse — é ela que produz a sensação de
 * partículas passando entre o visitante e a cena.
 */
export function Poeira({ quantidade = 220, semMovimento = false }) {
  const mapa = useMemo(texturaPonto, []);
  const grupos = useRef([]);

  const camadas = useMemo(() => {
    const fazer = (n, espalhaZ, tam, cor, semente) => {
      const pos = new Float32Array(n * 3);
      let s = semente;
      const rnd = () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
      };
      for (let i = 0; i < n; i += 1) {
        pos[i * 3] = (rnd() - 0.5) * 22;
        pos[i * 3 + 1] = (rnd() - 0.5) * 13;
        pos[i * 3 + 2] = (rnd() - 0.5) * espalhaZ;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      return { geo, tam, cor };
    };
    const base = Math.max(40, Math.round(quantidade / 3));
    return [
      fazer(base, 8, 0.05, "#5f7db8", 12345),
      fazer(Math.round(base * 0.7), 5, 0.085, PALETA.apoioClaro, 987654),
      fazer(Math.round(base * 0.45), 3, 0.14, PALETA.marcaClara, 24680),
    ];
  }, [quantidade]);

  useFrame((state) => {
    if (semMovimento) return;
    const t = state.clock.elapsedTime;
    grupos.current.forEach((g, i) => {
      if (!g) return;
      const v = 0.02 + i * 0.035;
      g.position.y = Math.sin(t * v * 3 + i) * (0.16 + i * 0.14);
      g.rotation.z = Math.sin(t * 0.05 + i) * 0.06;
    });
  });

  return (
    <>
      {camadas.map((c, i) => (
        <points
          key={i}
          ref={(el) => {
            grupos.current[i] = el;
          }}
          geometry={c.geo}
          position={[0, 0, i === 2 ? 3.2 : -1.5 - i * 2]}
        >
          <pointsMaterial
            map={mapa}
            size={c.tam}
            color={c.cor}
            transparent
            opacity={0.62 - i * 0.08}
            depthWrite={false}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
          />
        </points>
      ))}
    </>
  );
}

/* -------------------------------------------------------------- atmosfera */

/**
 * Névoa luminosa aditiva atrás da cena. Sem ela o fundo fica plano; com ela a
 * cena parece estar dentro de um volume iluminado.
 */
export function Halo({ cor = PALETA.marca, raio = 4.2, opacidade = 0.3, ...props }) {
  const mapa = useMemo(texturaPonto, []);
  return (
    <mesh {...props}>
      <planeGeometry args={[raio * 2, raio * 2]} />
      <meshBasicMaterial
        map={mapa}
        color={cor}
        transparent
        opacity={opacidade}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

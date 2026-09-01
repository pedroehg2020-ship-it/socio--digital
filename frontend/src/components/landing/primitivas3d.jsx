/**
 * Primitivas 3D da página inicial.
 *
 * Diferenças em relação à versão anterior, que era um conjunto de ícones
 * tridimensionais:
 *
 *  - materiais separados por família (vidro, metal polido, plástico técnico,
 *    emissivo) em vez de um `meshStandardMaterial` genérico para tudo;
 *  - `Tela`, que monta um monitor completo — moldura, bisel, brilho de vidro e
 *    a textura da tela real do ERP — e é o objeto em torno do qual as cenas
 *    são construídas;
 *  - `Camada`, que posiciona um grupo em primeiro, segundo ou terceiro plano e
 *    reage ao scroll e ao mouse com intensidade diferente por profundidade. É
 *    daqui que sai o paralaxe.
 *
 * Continua valendo: nada é baixado, tudo é geometria primitiva e textura de
 * canvas.
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETA } from "@/components/landing/ambiente3d";
import { texturaTela } from "@/components/landing/telas";

export { PALETA };
export const lerp = (a, b, t) => a + (b - a) * t;

/* ------------------------------------------------------------- materiais */

/** Vidro fosco: usa clearcoat e o env map em vez de refração (que custaria caro). */
export function Vidro({ cor = "#bcd6ff", opacidade = 0.24, aspereza = 0.06, intensidade = 2.2 }) {
  return (
    <meshPhysicalMaterial
      color={cor}
      transparent
      opacity={opacidade}
      roughness={aspereza}
      metalness={0}
      clearcoat={1}
      clearcoatRoughness={0.05}
      envMapIntensity={intensidade}
      side={THREE.DoubleSide}
      depthWrite={false}
    />
  );
}

/** Metal escovado / polido. O brilho vem quase todo do mapa de ambiente. */
export function Metal({ cor = PALETA.aco, aspereza = 0.22, intensidade = 1.8 }) {
  return (
    <meshStandardMaterial
      color={cor}
      roughness={aspereza}
      metalness={1}
      envMapIntensity={intensidade}
      transparent
      opacity={1}
    />
  );
}

/** Plástico técnico dos corpos e molduras. */
export function Corpo({ cor = PALETA.tinta3, aspereza = 0.44, metal = 0.35, intensidade = 1.1 }) {
  return (
    <meshStandardMaterial
      color={cor}
      roughness={aspereza}
      metalness={metal}
      envMapIntensity={intensidade}
      transparent
      opacity={1}
    />
  );
}

/** Superfície que emite luz própria — barras de gráfico, filetes, anéis. */
export function Neon({ cor = PALETA.marca, forca = 1.3, aspereza = 0.25 }) {
  return (
    <meshStandardMaterial
      color={cor}
      emissive={cor}
      emissiveIntensity={forca}
      roughness={aspereza}
      metalness={0.3}
      envMapIntensity={1.4}
      transparent
      opacity={1}
    />
  );
}

/* ------------------------------------------------------------ geometrias */

/** Retângulo extrudado com cantos arredondados. */
export function useFormaArredondada(largura, altura, raio = 0.12, profundidade = 0.06) {
  return useMemo(() => {
    const forma = new THREE.Shape();
    const l = largura / 2;
    const a = altura / 2;
    const r = Math.min(raio, l * 0.9, a * 0.9);
    forma.moveTo(-l + r, -a);
    forma.lineTo(l - r, -a);
    forma.quadraticCurveTo(l, -a, l, -a + r);
    forma.lineTo(l, a - r);
    forma.quadraticCurveTo(l, a, l - r, a);
    forma.lineTo(-l + r, a);
    forma.quadraticCurveTo(-l, a, -l, a - r);
    forma.lineTo(-l, -a + r);
    forma.quadraticCurveTo(-l, -a, -l + r, -a);
    const geo = new THREE.ExtrudeGeometry(forma, {
      depth: profundidade,
      bevelEnabled: true,
      bevelSize: 0.014,
      bevelThickness: 0.014,
      bevelSegments: 3,
      curveSegments: 10,
    });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, [largura, altura, raio, profundidade]);
}

export function useTexturaTexto(txt, cor = "#06301f", fundo = "#ffffff") {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = fundo;
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = cor;
    g.font = "bold 116px Outfit, system-ui, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(txt, 128, 136);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }, [txt, cor, fundo]);
}

/* --------------------------------------------------------------- camadas */

/**
 * Posiciona um grupo em um dos três planos de profundidade e o anima.
 *
 * `plano`  1 = primeiro plano (perto do visitante, movimento amplo)
 *          2 = plano médio (onde ficam as telas)
 *          3 = fundo (movimento discreto)
 *
 * `progresso` é a rolagem dentro da seção (0 → 1). Camadas da frente
 * atravessam mais espaço que as de trás: é a definição de paralaxe.
 */
export function Camada({
  children,
  plano = 2,
  base = [0, 0, 0],
  deriva = [0, 0, 0],
  flutua = 0,
  velocidade = 0.5,
  fase = 0,
  giro = 0,
  progresso,
  mouse,
  semMovimento = false,
  ...props
}) {
  const ref = useRef();
  const forcaMouse = plano === 1 ? 0.5 : plano === 2 ? 0.22 : 0.09;

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    const p = progresso ? progresso.current : 0;
    const t = state.clock.elapsedTime;
    const suave = Math.min(1, delta * 4);

    const mx = mouse && !semMovimento ? mouse.current.x : 0;
    const my = mouse && !semMovimento ? mouse.current.y : 0;

    const alvoX = base[0] + deriva[0] * p + mx * forcaMouse;
    const alvoY =
      base[1] +
      deriva[1] * p +
      my * forcaMouse * 0.6 +
      (semMovimento ? 0 : Math.sin(t * velocidade + fase) * flutua);
    const alvoZ = base[2] + deriva[2] * p;

    g.position.x += (alvoX - g.position.x) * suave;
    g.position.y += (alvoY - g.position.y) * suave;
    g.position.z += (alvoZ - g.position.z) * suave;

    if (giro && !semMovimento) {
      g.rotation.y = Math.sin(t * velocidade * 0.7 + fase) * giro + mx * forcaMouse * 0.24;
      g.rotation.x = my * forcaMouse * -0.16;
    }
  });

  return (
    <group ref={ref} position={base} {...props}>
      {children}
    </group>
  );
}

/* ----------------------------------------------------------------- tela */

/**
 * Monitor completo: moldura metálica, bisel, painel com a interface real do
 * ERP e uma lâmina de vidro por cima que capta o reflexo do ambiente.
 *
 * É o objeto central de quase toda cena — os demais elementos orbitam,
 * passam na frente e emergem dele.
 */
export function Tela({
  nome = "painel",
  largura = 4.4,
  brilho = 0.62,
  moldura = true,
  ...props
}) {
  const altura = largura / 1.6;
  const mapa = useMemo(() => texturaTela(nome), [nome]);
  const geoMoldura = useFormaArredondada(largura + 0.2, altura + 0.2, 0.14, 0.12);

  return (
    <group {...props}>
      {moldura ? (
        <mesh geometry={geoMoldura} position={[0, 0, -0.05]} castShadow receiveShadow>
          <Metal cor="#33415f" aspereza={0.3} intensidade={1.7} />
        </mesh>
      ) : null}

      {/* painel emissivo com a interface */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[largura, altura]} />
        <meshStandardMaterial
          map={mapa}
          emissiveMap={mapa}
          emissive="#ffffff"
          emissiveIntensity={brilho}
          roughness={0.34}
          metalness={0.04}
          transparent
          opacity={1}
        />
      </mesh>

      {/* lâmina de vidro sobre a tela */}
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[largura, altura]} />
        <Vidro opacidade={0.1} aspereza={0.03} intensidade={2.6} />
      </mesh>

      {/* filete luminoso na base, cor da marca */}
      <mesh position={[0, -altura / 2 - 0.05, 0.02]}>
        <boxGeometry args={[largura * 0.55, 0.022, 0.02]} />
        <Neon cor={PALETA.marcaClara} forca={2.2} />
      </mesh>
    </group>
  );
}

/** Painel de vidro solto — usado como card flutuante na frente das telas. */
export function PainelVidro({
  largura = 1.5,
  altura = 0.9,
  cor = "#bcd6ff",
  opacidade = 0.22,
  borda = PALETA.marcaClara,
  ...props
}) {
  const geo = useFormaArredondada(largura, altura, 0.1, 0.03);
  const geoBorda = useFormaArredondada(largura + 0.012, altura + 0.012, 0.104, 0.008);
  return (
    <group {...props}>
      <mesh geometry={geoBorda} position={[0, 0, -0.006]}>
        <Neon cor={borda} forca={0.85} aspereza={0.4} />
      </mesh>
      <mesh geometry={geo} castShadow>
        <Vidro cor={cor} opacidade={opacidade} intensidade={2.4} />
      </mesh>
    </group>
  );
}

/** Placa sólida com filete colorido — cartão de KPI dentro da cena. */
export function Placa({
  largura = 1.2,
  altura = 0.56,
  cor = PALETA.tinta3,
  filete = PALETA.marcaClara,
  ...props
}) {
  const geo = useFormaArredondada(largura, altura, 0.09, 0.06);
  return (
    <group {...props}>
      <mesh geometry={geo} castShadow receiveShadow>
        <Corpo cor={cor} aspereza={0.4} metal={0.42} intensidade={1.5} />
      </mesh>
      <mesh position={[-largura / 2 + 0.05, 0, 0.04]}>
        <boxGeometry args={[0.035, altura * 0.62, 0.012]} />
        <Neon cor={filete} forca={1.9} />
      </mesh>
      <mesh position={[0.05, -altura * 0.16, 0.04]}>
        <boxGeometry args={[largura * 0.5, 0.028, 0.008]} />
        <Neon cor={filete} forca={0.5} aspereza={0.5} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------- gráficos */

/**
 * Gráfico de barras volumétrico que cresce conforme a rolagem da seção.
 * As barras têm topo emissivo e projetam sombra: lidas como objeto físico,
 * não como decalque.
 */
export function GraficoBarras({
  valores = [0.4, 0.62, 0.5, 0.82, 0.7, 1],
  largura = 2.6,
  altura = 1.5,
  espessura = 0.16,
  progresso,
  semMovimento = false,
  ...props
}) {
  const refs = useRef([]);
  const passo = largura / valores.length;

  useFrame((state) => {
    const p = progresso ? THREE.MathUtils.clamp(progresso.current * 1.5, 0, 1) : 1;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const atraso = i * 0.07;
      const t = THREE.MathUtils.clamp((p - atraso) * 2.4, 0, 1);
      const suave = t * t * (3 - 2 * t);
      const pulso = semMovimento
        ? 1
        : 1 + Math.sin(state.clock.elapsedTime * 1.4 + i * 0.8) * 0.03;
      const h = Math.max(0.004, valores[i] * altura * suave * pulso);
      m.scale.y = h;
      m.position.y = h / 2;
    });
  });

  return (
    <group {...props}>
      {valores.map((v, i) => (
        <group key={i} position={[(i - (valores.length - 1) / 2) * passo, 0, 0]}>
          <mesh
            ref={(el) => {
              refs.current[i] = el;
            }}
            castShadow
            scale-y={0.004}
          >
            <boxGeometry args={[espessura, 1, espessura]} />
            <Neon
              cor={i >= valores.length - 2 ? PALETA.marcaClara : PALETA.apoio}
              forca={i >= valores.length - 2 ? 1.5 : 0.85}
            />
          </mesh>
          {/* base metálica */}
          <mesh position={[0, -0.012, 0]}>
            <boxGeometry args={[espessura * 1.5, 0.024, espessura * 1.5]} />
            <Metal cor="#3d4d70" aspereza={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Curva de linha construída com TubeGeometry, que se desenha conforme a
 * rolagem. Sai da tela e continua no espaço — um dos momentos em que a
 * informação "escapa" da interface.
 */
export function CurvaLinha({
  pontos,
  raio = 0.035,
  cor = PALETA.marcaClara,
  progresso,
  ...props
}) {
  const geo = useMemo(() => {
    const curva = new THREE.CatmullRomCurve3(
      pontos.map((p) => new THREE.Vector3(...p))
    );
    return new THREE.TubeGeometry(curva, 90, raio, 10, false);
  }, [pontos, raio]);

  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    const p = progresso ? THREE.MathUtils.clamp(progresso.current * 1.8, 0, 1) : 1;
    const total = geo.index ? geo.index.count : geo.attributes.position.count;
    geo.setDrawRange(0, Math.max(6, Math.floor(total * p)));
  });

  return (
    <mesh ref={ref} geometry={geo} castShadow {...props}>
      <Neon cor={cor} forca={2} aspereza={0.2} />
    </mesh>
  );
}

/** Anel orbital — dá escala e movimento contínuo em torno das telas. */
export function Anel({ raio = 2.4, espessura = 0.02, cor = PALETA.apoio, ...props }) {
  return (
    <mesh {...props}>
      <torusGeometry args={[raio, espessura, 10, 96]} />
      <Neon cor={cor} forca={1.1} aspereza={0.3} />
    </mesh>
  );
}

/* --------------------------------------------------------------- objetos */

export function Moeda({ simbolo = "R$", cor = PALETA.marca, tamanho = 0.34, ...props }) {
  const textura = useTexturaTexto(simbolo);
  return (
    <group {...props}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[tamanho, tamanho, tamanho * 0.19, 40]} />
        <meshStandardMaterial
          color={cor}
          roughness={0.16}
          metalness={0.95}
          envMapIntensity={2.4}
          emissive={cor}
          emissiveIntensity={0.18}
          transparent
          opacity={1}
        />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, 0, s * tamanho * 0.1]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
          <circleGeometry args={[tamanho * 0.74, 32]} />
          <meshStandardMaterial map={textura} transparent opacity={1} roughness={0.4} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export function Caixa({ tamanho = 0.6, cor = "#c98a4b", ...props }) {
  return (
    <group {...props}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[tamanho, tamanho * 0.8, tamanho * 0.84]} />
        <meshStandardMaterial color={cor} roughness={0.78} metalness={0.06} envMapIntensity={0.9} transparent opacity={1} />
      </mesh>
      <mesh position={[0, tamanho * 0.405, 0]} castShadow>
        <boxGeometry args={[tamanho * 1.03, 0.05 * tamanho, tamanho * 0.87]} />
        <meshStandardMaterial color="#a86f38" roughness={0.76} metalness={0.06} transparent opacity={1} />
      </mesh>
      <mesh position={[0, tamanho * 0.02, tamanho * 0.43]}>
        <boxGeometry args={[tamanho * 0.13, tamanho * 0.8, tamanho * 0.014]} />
        <Neon cor={PALETA.marcaClara} forca={0.7} aspereza={0.5} />
      </mesh>
    </group>
  );
}

export function No({ raio = 0.17, cor = PALETA.apoio, ...props }) {
  return (
    <mesh castShadow {...props}>
      <icosahedronGeometry args={[raio, 2]} />
      <Neon cor={cor} forca={1.2} aspereza={0.22} />
    </mesh>
  );
}

export function Conexao({ de, para, espessura = 0.016, cor = PALETA.apoio }) {
  const dados = useMemo(() => {
    const a = new THREE.Vector3(...de);
    const b = new THREE.Vector3(...para);
    const dir = new THREE.Vector3().subVectors(b, a);
    return {
      posicao: new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize()
      ),
      comprimento: dir.length(),
    };
  }, [de, para]);

  return (
    <mesh position={dados.posicao} quaternion={dados.quaternion}>
      <cylinderGeometry args={[espessura, espessura, dados.comprimento, 8]} />
      <Neon cor={cor} forca={1.6} aspereza={0.35} />
    </mesh>
  );
}

export function Engrenagem({ raio = 0.5, dentes = 12, cor = PALETA.aco, ...props }) {
  const posicoes = useMemo(
    () =>
      Array.from({ length: dentes }, (_, i) => {
        const a = (i / dentes) * Math.PI * 2;
        return { a, x: Math.cos(a) * raio, y: Math.sin(a) * raio };
      }),
    [dentes, raio]
  );

  return (
    <group {...props}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <torusGeometry args={[raio * 0.74, raio * 0.24, 14, 36]} />
        <Metal cor={cor} aspereza={0.24} intensidade={2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[raio * 0.26, raio * 0.26, raio * 0.3, 22]} />
        <Neon cor={PALETA.marca} forca={0.8} />
      </mesh>
      {posicoes.map(({ a, x, y }, i) => (
        <mesh key={i} position={[x, y, 0]} rotation={[0, 0, a]} castShadow>
          <boxGeometry args={[raio * 0.3, raio * 0.19, raio * 0.28]} />
          <Metal cor={cor} aspereza={0.26} intensidade={1.9} />
        </mesh>
      ))}
    </group>
  );
}

export function Escudo({ tamanho = 1.6, cor = PALETA.marca, ...props }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    const l = tamanho * 0.5;
    const a = tamanho * 0.62;
    s.moveTo(0, a);
    s.quadraticCurveTo(l, a * 0.82, l, a * 0.34);
    s.quadraticCurveTo(l, -a * 0.42, 0, -a);
    s.quadraticCurveTo(-l, -a * 0.42, -l, a * 0.34);
    s.quadraticCurveTo(-l, a * 0.82, 0, a);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: tamanho * 0.14,
      bevelEnabled: true,
      bevelSize: 0.03,
      bevelThickness: 0.03,
      bevelSegments: 3,
      curveSegments: 18,
    });
    g.center();
    g.computeVertexNormals();
    return g;
  }, [tamanho]);

  return (
    <group {...props}>
      <mesh geometry={geo} castShadow receiveShadow>
        <Vidro cor={cor} opacidade={0.34} aspereza={0.05} intensidade={2.6} />
      </mesh>
      <mesh geometry={geo} scale={0.92} position={[0, 0, -0.02]}>
        <Neon cor={cor} forca={0.55} aspereza={0.4} />
      </mesh>
    </group>
  );
}

export function Cadeado({ tamanho = 0.42, ...props }) {
  return (
    <group {...props}>
      <mesh castShadow>
        <boxGeometry args={[tamanho, tamanho * 0.78, tamanho * 0.44]} />
        <Metal cor="#c8d6ee" aspereza={0.18} intensidade={2.3} />
      </mesh>
      <mesh position={[0, tamanho * 0.56, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[tamanho * 0.3, tamanho * 0.085, 12, 26, Math.PI]} />
        <Metal cor="#c8d6ee" aspereza={0.16} intensidade={2.4} />
      </mesh>
      <mesh position={[0, 0, tamanho * 0.23]}>
        <circleGeometry args={[tamanho * 0.13, 20]} />
        <Neon cor={PALETA.marcaClara} forca={2.4} />
      </mesh>
    </group>
  );
}

export function Relogio({ raio = 0.46, ...props }) {
  return (
    <group {...props}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[raio, raio, raio * 0.2, 40]} />
        <Metal cor="#cbd7ec" aspereza={0.2} intensidade={2.2} />
      </mesh>
      <mesh position={[0, 0, raio * 0.11]}>
        <circleGeometry args={[raio * 0.85, 34]} />
        <Corpo cor="#0c1734" aspereza={0.4} metal={0.2} />
      </mesh>
      <mesh position={[0, raio * 0.23, raio * 0.14]}>
        <boxGeometry args={[raio * 0.06, raio * 0.5, raio * 0.03]} />
        <Neon cor={PALETA.apoioClaro} forca={2.4} />
      </mesh>
      <mesh position={[raio * 0.17, 0, raio * 0.14]} rotation={[0, 0, -Math.PI / 2]}>
        <boxGeometry args={[raio * 0.055, raio * 0.38, raio * 0.03]} />
        <Neon cor={PALETA.marcaClara} forca={2.4} />
      </mesh>
    </group>
  );
}

export function Pasta({ largura = 1.1, cor = PALETA.marcaForte, ...props }) {
  const altura = largura * 0.72;
  const geoAba = useFormaArredondada(largura * 0.42, altura * 0.2, 0.05, 0.05);
  const geoCorpo = useFormaArredondada(largura, altura, 0.09, 0.08);
  const geoPapel = useFormaArredondada(largura * 0.86, altura * 0.82, 0.05, 0.02);
  return (
    <group {...props}>
      <mesh geometry={geoAba} position={[-largura * 0.28, altura * 0.53, -0.03]} castShadow>
        <Corpo cor={cor} aspereza={0.42} metal={0.3} />
      </mesh>
      <mesh geometry={geoCorpo} castShadow receiveShadow>
        <Corpo cor={cor} aspereza={0.42} metal={0.3} />
      </mesh>
      <mesh geometry={geoPapel} position={[0, altura * 0.07, 0.06]}>
        <Corpo cor="#e8eefb" aspereza={0.62} metal={0.02} />
      </mesh>
    </group>
  );
}

export function Carrinho({ tamanho = 0.7, cor = PALETA.marca, ...props }) {
  return (
    <group {...props}>
      <mesh rotation={[0, 0, -0.12]} castShadow>
        <boxGeometry args={[tamanho, tamanho * 0.6, tamanho * 0.52]} />
        <Metal cor={cor} aspereza={0.28} intensidade={1.9} />
      </mesh>
      <mesh position={[0, tamanho * 0.13, 0]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[tamanho * 0.88, tamanho * 0.42, tamanho * 0.44]} />
        <Corpo cor={PALETA.tinta2} aspereza={0.5} metal={0.3} />
      </mesh>
      <mesh position={[-tamanho * 0.62, tamanho * 0.46, 0]} rotation={[0, 0, 0.55]} castShadow>
        <cylinderGeometry args={[tamanho * 0.035, tamanho * 0.035, tamanho * 0.64, 12]} />
        <Metal cor="#cbd7ec" aspereza={0.2} />
      </mesh>
      {[-0.28, 0.28].map((x) => (
        <mesh key={x} position={[tamanho * x, -tamanho * 0.45, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[tamanho * 0.11, tamanho * 0.11, tamanho * 0.09, 20]} />
          <Metal cor="#41527a" aspereza={0.34} />
        </mesh>
      ))}
    </group>
  );
}

export function Funil({ tamanho = 1.1, ...props }) {
  const niveis = [
    { r: tamanho * 0.52, y: tamanho * 0.32, cor: PALETA.apoio },
    { r: tamanho * 0.37, y: 0, cor: PALETA.apoioClaro },
    { r: tamanho * 0.22, y: -tamanho * 0.3, cor: PALETA.marcaClara },
  ];
  return (
    <group {...props}>
      {niveis.map((n, i) => (
        <mesh key={i} position={[0, n.y, 0]} castShadow>
          <cylinderGeometry args={[n.r, n.r * 0.76, tamanho * 0.2, 36, 1, true]} />
          <meshPhysicalMaterial
            color={n.cor}
            emissive={n.cor}
            emissiveIntensity={0.6}
            transparent
            opacity={0.5}
            roughness={0.12}
            metalness={0.2}
            clearcoat={1}
            envMapIntensity={2.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Prisma de vidro girando — objeto de primeiro plano puramente escultural. */
export function Cristal({ raio = 0.42, cor = "#a8ccff", ...props }) {
  return (
    <mesh castShadow {...props}>
      <octahedronGeometry args={[raio, 0]} />
      <Vidro cor={cor} opacidade={0.4} aspereza={0.02} intensidade={3} />
    </mesh>
  );
}

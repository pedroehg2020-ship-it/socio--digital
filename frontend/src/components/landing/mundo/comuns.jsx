/**
 * Vocabulário visual comum a todas as regiões.
 *
 * Tudo que aparece no mundo é montado a partir daqui, e é isso que faz as
 * nove regiões parecerem o mesmo lugar em vez de nove ilustrações diferentes:
 * mesmo vidro, mesma emissão, mesmo tipo de brilho, mesma grade.
 *
 * Regra de desempenho seguida em todo o arquivo: geometria e textura são
 * criadas uma única vez em cache de módulo e compartilhadas por todas as
 * instâncias. Nenhum componente aloca buffer por quadro.
 */

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { COR } from "@/components/landing/mundo/paleta";

/**
 * Diz se a região está longe demais para valer animação.
 *
 * A geometria continua na cena — o descarte por frustum do three já resolve
 * o custo de desenho, e a revelação final precisa de todas as regiões
 * visíveis ao mesmo tempo. O que este gancho evita é o custo de CPU: nenhuma
 * matriz de instância é recalculada para algo que está a 150 unidades.
 */
export function useLonge(pos, limite = 150) {
  const { camera } = useThree();
  const alvo = useMemo(() => new THREE.Vector3(pos[0], pos[1], pos[2]), [pos]);
  const longe = useRef(false);
  useFrame(() => {
    longe.current = camera.position.distanceToSquared(alvo) > limite * limite;
  });
  return longe;
}

/* ------------------------------------------------------------- texturas */

const cache = new Map();
function memo(chave, fabrica) {
  if (!cache.has(chave)) cache.set(chave, fabrica());
  return cache.get(chave);
}

/** Disco de luz com queda suave — a base de todo brilho aditivo da cena. */
export function texturaBrilho() {
  return memo("brilho", () => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d");
    const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, "rgba(255,255,255,1)");
    rg.addColorStop(0.22, "rgba(255,255,255,0.62)");
    rg.addColorStop(0.55, "rgba(255,255,255,0.14)");
    rg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = rg;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}

/**
 * Conteúdo dos painéis de dados. Não é interface de verdade nem tenta ser:
 * é a leitura de "tela de sistema" à distância — grade, série temporal,
 * barras e linhas de registro.
 */
export function texturaPainel(tipo = 0) {
  return memo(`painel-${tipo}`, () => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 320;
    const g = c.getContext("2d");

    /* Fundo de vidro claro, não de tela preta. É a diferença entre ler como
       "software corporativo" e ler como "console de nave". */
    const base = g.createLinearGradient(0, 0, 0, 320);
    base.addColorStop(0, "#f2f5f9");
    base.addColorStop(1, "#dde4ee");
    g.fillStyle = base;
    g.fillRect(0, 0, 512, 320);

    // grade discreta, quase imperceptível a distância
    g.strokeStyle = "rgba(80,110,150,0.09)";
    g.lineWidth = 1;
    for (let y = 76; y <= 288; y += 42) {
      g.beginPath();
      g.moveTo(28, y);
      g.lineTo(484, y);
      g.stroke();
    }

    // cabeçalho: um rótulo e um valor, como qualquer relatório
    g.fillStyle = "rgba(30,48,78,0.85)";
    g.fillRect(28, 26, 96, 9);
    g.fillStyle = "rgba(30,48,78,0.30)";
    g.fillRect(28, 45, 58, 7);
    g.fillStyle = "rgba(30,48,78,0.16)";
    g.fillRect(408, 26, 76, 26);

    const semente = (tipo * 977 + 13) % 1000;
    const aleatorio = (i) => {
      const v = Math.sin(semente + i * 12.9898) * 43758.5453;
      return v - Math.floor(v);
    };

    if (tipo % 3 === 0) {
      // série temporal — área suave, uma linha só, sem brilho
      g.beginPath();
      g.moveTo(28, 288);
      for (let i = 0; i <= 22; i += 1) {
        const x = 28 + (i / 22) * 456;
        const y = 266 - aleatorio(i) * 96 - i * 3.2;
        g.lineTo(x, y);
      }
      g.lineTo(484, 288);
      g.closePath();
      const area = g.createLinearGradient(0, 120, 0, 288);
      area.addColorStop(0, "rgba(74,127,181,0.34)");
      area.addColorStop(1, "rgba(74,127,181,0.02)");
      g.fillStyle = area;
      g.fill();
      g.strokeStyle = "rgba(38,86,140,0.95)";
      g.lineWidth = 2.5;
      g.stroke();
    } else if (tipo % 3 === 1) {
      // colunas — uma única cor, com o último período destacado
      for (let i = 0; i < 14; i += 1) {
        const h = 30 + aleatorio(i) * 140 + i * 3;
        const x = 32 + i * 32;
        g.fillStyle = i === 13 ? "rgba(38,86,140,0.92)" : "rgba(109,145,187,0.55)";
        g.fillRect(x, 288 - h, 18, h);
      }
      g.strokeStyle = "rgba(30,48,78,0.22)";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(28, 288.5);
      g.lineTo(484, 288.5);
      g.stroke();
    } else {
      // tabela — linhas de registro com um indicador sóbrio à direita
      for (let i = 0; i < 6; i += 1) {
        const y = 84 + i * 34;
        g.fillStyle = "rgba(30,48,78,0.42)";
        g.fillRect(28, y, 120 + aleatorio(i) * 150, 8);
        g.fillStyle = "rgba(30,48,78,0.14)";
        g.fillRect(300, y, 90, 8);
        g.fillStyle =
          aleatorio(i + 40) > 0.35 ? "rgba(95,158,127,0.85)" : "rgba(181,112,95,0.8)";
        g.fillRect(438, y - 2, 46, 12);
      }
    }

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  });
}

/* ----------------------------------------------------------- geometrias */

export const geoPlano = () => memo("geo-plano", () => new THREE.PlaneGeometry(1, 1));
export const geoCubo = () => memo("geo-cubo", () => new THREE.BoxGeometry(1, 1, 1));
export const geoEsfera = () =>
  memo("geo-esfera", () => new THREE.SphereGeometry(1, 16, 12));
export const geoEsferaFina = () =>
  memo("geo-esfera-fina", () => new THREE.SphereGeometry(1, 10, 8));

/* ----------------------------------------------------------- materiais */

/**
 * Vocabulário de superfícies. Todas resolvem o brilho por reflexo do mapa de
 * ambiente e pela iluminação — nenhuma emite luz própria. Trocar um material
 * daqui muda o acabamento da cena inteira de uma vez, que é exatamente o que
 * se quer quando a direção de arte muda.
 */

/** Concreto e reboco arquitetônico: fosco, sem reflexo especular marcado. */
export function useConcreto(cor = COR.concreto, extras = {}) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: cor,
        roughness: 0.86,
        metalness: 0.02,
        envMapIntensity: 0.55,
        ...extras,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cor]
  );
}

/** Pedra polida de piso e bancada: reflexo largo e suave. */
export function usePedra(cor = COR.pedra) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: cor,
        roughness: 0.34,
        metalness: 0.05,
        envMapIntensity: 0.9,
      }),
    [cor]
  );
}

/** Nogueira: quente, fosca, com um leve brilho de verniz. */
export function useMadeira(cor = COR.nogueira) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: cor,
        roughness: 0.52,
        metalness: 0.0,
        envMapIntensity: 0.55,
      }),
    [cor]
  );
}

/** Metal escovado de caixilhos, pés de mesa e perfis. */
export function useMetal(cor = COR.metalEscuro, aspereza = 0.38) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: cor,
        roughness: aspereza,
        metalness: 0.92,
        envMapIntensity: 1.15,
      }),
    [cor, aspereza]
  );
}

/**
 * Vidro arquitetônico. Sem `transmission` de propósito: refração custa caro e
 * a leitura que interessa aqui — superfície que reflete o céu e deixa
 * entrever o que há atrás — se obtém com transparência e reflexo.
 */
export function useVidro(cor = COR.vidro, opacidade = 0.34) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: cor,
        transparent: true,
        opacity: opacidade,
        roughness: 0.08,
        metalness: 0.55,
        envMapIntensity: 1.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [cor, opacidade]
  );
}

/**
 * Superfície que realmente emite luz: telas, luminárias, traços de interface.
 * A força padrão caiu de 2.1 para 0.9 — com bloom reduzido, valores altos
 * viram borrão branco e comem o contraste do texto.
 */
export function useEmissivo(cor = COR.ciano, forca = 0.9) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: cor,
        emissive: new THREE.Color(cor),
        emissiveIntensity: forca,
        roughness: 0.4,
        metalness: 0.05,
      }),
    [cor, forca]
  );
}

/**
 * Linha de interface. Deixou de ser aditiva: mistura aditiva sobre um fundo
 * claro estoura para branco e é a principal causa de texto ilegível. Agora é
 * transparência normal, que se comporta igual no claro e no escuro.
 */
export function useLinha(cor = COR.azul, opacidade = 0.5) {
  return useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: cor,
        transparent: true,
        opacity: opacidade,
        depthWrite: false,
      }),
    [cor, opacidade]
  );
}

/* ------------------------------------------------------------- brilhos */

/**
 * Mancha de luz sempre voltada para a câmera. É o que garante a leitura de
 * "glow" mesmo nos aparelhos onde o pós-processamento fica desligado.
 */
/**
 * Halo suave em volta de uma fonte de luz. Continua aditivo — é a natureza do
 * efeito — mas a opacidade padrão caiu de 0.5 para 0.18 e o `toneMapped` foi
 * religado. Com o ambiente claro, halo aditivo sem tone mapping satura para
 * branco puro e é a causa mais comum de texto ilegível por cima.
 */
export function Brilho({ cor = COR.ciano, tamanho = 4, opacidade = 0.18, ...props }) {
  const material = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: texturaBrilho(),
        color: new THREE.Color(cor),
        transparent: true,
        opacity: opacidade,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [cor, opacidade]
  );
  return <sprite scale={[tamanho, tamanho, 1]} material={material} {...props} />;
}

/** Anel fino e luminoso. Aparece em quase toda região como marca de escala. */
export function Anel({
  raio = 4,
  espessura = 0.045,
  cor = COR.azul,
  opacidade = 0.4,
  segmentos = 72,
  ...props
}) {
  const geo = useMemo(
    () => new THREE.TorusGeometry(raio, espessura, 6, segmentos),
    [raio, espessura, segmentos]
  );
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: cor,
        transparent: true,
        opacity: opacidade,
        toneMapped: false,
      }),
    [cor, opacidade]
  );
  return <mesh geometry={geo} material={mat} {...props} />;
}

/** Painel de dados: vidro com moldura acesa e a tela como textura emissiva. */
export function Painel({
  largura = 4,
  altura = 2.5,
  tipo = 0,
  cor = COR.ciano,
  opacidade = 0.9,
  ...props
}) {
  const matTela = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texturaPainel(tipo),
        transparent: true,
        opacity: opacidade,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [tipo, opacidade]
  );
  const matMoldura = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: cor,
        transparent: true,
        opacity: 0.5,
        toneMapped: false,
      }),
    [cor]
  );
  const moldura = useMemo(() => {
    const g = new THREE.EdgesGeometry(new THREE.PlaneGeometry(largura, altura));
    return g;
  }, [largura, altura]);

  return (
    <group {...props}>
      <mesh material={matTela}>
        <planeGeometry args={[largura, altura]} />
      </mesh>
      <lineSegments geometry={moldura}>
        <primitive object={matMoldura} attach="material" />
      </lineSegments>
    </group>
  );
}

/**
 * Fluxo de energia ao longo de uma curva.
 *
 * O tubo em si é estático; o que se move é o deslocamento da textura de
 * traço. Sai muito mais barato do que regenerar geometria por quadro e dá o
 * mesmo efeito de "dado correndo pelo cabo".
 */
export function Fluxo({
  pontos,
  cor = COR.ciano,
  espessura = 0.055,
  velocidade = 0.35,
  opacidade = 0.85,
  segmentos = 64,
  parado = false,
}) {
  const ref = useRef();

  const { geo, mat } = useMemo(() => {
    const curva = new THREE.CatmullRomCurve3(
      pontos.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
    );
    const g = new THREE.TubeGeometry(curva, segmentos, espessura, 6, false);

    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 4;
    const ctx = c.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 64, 0);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.15)");
    grad.addColorStop(0.62, "rgba(255,255,255,1)");
    grad.addColorStop(0.78, "rgba(255,255,255,0.15)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 4);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(3, 1);

    const m = new THREE.MeshBasicMaterial({
      color: cor,
      map: tex,
      transparent: true,
      opacity: opacidade,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    return { geo: g, mat: m };
  }, [pontos, cor, espessura, opacidade, segmentos]);

  useFrame((_, delta) => {
    if (parado || !ref.current) return;
    const t = ref.current.material.map;
    if (t) t.offset.x -= Math.min(delta, 0.05) * velocidade;
  });

  return <mesh ref={ref} geometry={geo} material={mat} />;
}

/** Grade luminosa em um plano — usada como "chão" de várias regiões. */
export function Grade({
  tamanho = 40,
  divisoes = 20,
  cor = COR.azul,
  opacidade = 0.2,
  ...props
}) {
  const geo = useMemo(() => {
    const pts = [];
    const meio = tamanho / 2;
    const passo = tamanho / divisoes;
    for (let i = 0; i <= divisoes; i += 1) {
      const p = -meio + i * passo;
      pts.push(-meio, 0, p, meio, 0, p);
      pts.push(p, 0, -meio, p, 0, meio);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [tamanho, divisoes]);

  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: cor,
        transparent: true,
        opacity: opacidade,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [cor, opacidade]
  );

  return <lineSegments geometry={geo} material={mat} {...props} />;
}

/** Giro lento e constante. A cena precisa viver mesmo com a página parada. */
export function Gira({ children, velocidade = 0.12, eixo = "y", parado = false, ...props }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (parado || !ref.current) return;
    ref.current.rotation[eixo] += Math.min(delta, 0.05) * velocidade;
  });
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
}

/** Flutuação suave em torno da posição de origem. */
export function Flutua({ children, amplitude = 0.5, velocidade = 0.6, fase = 0, parado = false, ...props }) {
  const ref = useRef();
  const t = useRef(fase);
  useFrame((_, delta) => {
    if (parado || !ref.current) return;
    t.current += Math.min(delta, 0.05) * velocidade;
    ref.current.position.y = Math.sin(t.current) * amplitude;
  });
  return (
    <group {...props}>
      <group ref={ref}>{children}</group>
    </group>
  );
}

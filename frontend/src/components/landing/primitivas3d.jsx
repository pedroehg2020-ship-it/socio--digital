/**
 * Primitivas 3D reutilizáveis da página inicial.
 *
 * Regras que valem para todo o arquivo:
 *  - nada é baixado (sem modelos .glb, sem HDR, sem fontes externas): tudo é
 *    geometria primitiva e textura gerada em <canvas>;
 *  - todo material nasce com `transparent`, porque a troca de composição entre
 *    seções é feita por opacidade;
 *  - a paleta tem só duas cores de marca (verde principal, azul de apoio) mais
 *    neutros — é a mesma restrição aplicada ao CSS.
 */

import { useMemo } from "react";
import * as THREE from "three";

export const PALETA = {
  marca: "#10b981",
  marcaForte: "#059669",
  marcaClara: "#34d399",
  apoio: "#3b82f6",
  apoioForte: "#2563eb",
  tinta: "#0a1128",
  tinta2: "#16224a",
  tinta3: "#22326b",
  neutro: "#dbe4f5",
  neutroClaro: "#f4f7fd",
};

export const lerp = (a, b, t) => a + (b - a) * t;

/* --------------------------------------------------------------- material */

/**
 * Material padrão. `transparent` fica sempre ligado para permitir o
 * fade entre composições; `depthWrite` continua ligado para os objetos não
 * se atravessarem visualmente enquanto estão opacos.
 */
export function Mat({ cor, emissiva, brilho = 0, aspereza = 0.42, metal = 0.16 }) {
  return (
    <meshStandardMaterial
      color={cor}
      roughness={aspereza}
      metalness={metal}
      transparent
      opacity={1}
      emissive={emissiva || "#000000"}
      emissiveIntensity={emissiva ? brilho || 0.4 : 0}
    />
  );
}

/* -------------------------------------------------------------- geometrias */

/** Retângulo extrudado com cantos arredondados — base de painéis e cartões. */
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
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 2,
      curveSegments: 8,
    });
    geo.center();
    return geo;
  }, [largura, altura, raio, profundidade]);
}

/** Textura de texto curto desenhada em canvas (usada nas moedas). */
export function useTexturaTexto(texto, cor = PALETA.tinta, fundo = "#ffffff") {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = fundo;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = cor;
    ctx.font = "bold 116px Outfit, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, 128, 136);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }, [texto, cor, fundo]);
}

/* ------------------------------------------------------------- componentes */

/** Painel/cartão retangular arredondado. */
export function Painel({
  largura = 1,
  altura = 0.6,
  cor = PALETA.tinta2,
  emissiva,
  brilho,
  raio,
  profundidade = 0.05,
  ...props
}) {
  const geo = useFormaArredondada(
    largura,
    altura,
    raio ?? Math.min(0.1, altura / 3),
    profundidade
  );
  return (
    <mesh geometry={geo} castShadow={false} {...props}>
      <Mat cor={cor} emissiva={emissiva} brilho={brilho} />
    </mesh>
  );
}

/** Moeda: cilindro chato com um símbolo impresso nas faces. */
export function Moeda({ simbolo = "R$", cor = PALETA.marca, tamanho = 0.3, ...props }) {
  const textura = useTexturaTexto(simbolo, "#06301f", "#ffffff");
  return (
    <group {...props}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[tamanho, tamanho, tamanho * 0.17, 34]} />
        <Mat cor={cor} emissiva={cor} brilho={0.22} aspereza={0.3} metal={0.55} />
      </mesh>
      <mesh position={[0, 0, tamanho * 0.093]}>
        <circleGeometry args={[tamanho * 0.74, 30]} />
        <meshStandardMaterial map={textura} transparent opacity={1} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, -tamanho * 0.093]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[tamanho * 0.74, 30]} />
        <meshStandardMaterial map={textura} transparent opacity={1} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Caixa de estoque com tampa e fita. */
export function Caixa({ tamanho = 0.5, cor = "#c98a4b", ...props }) {
  return (
    <group {...props}>
      <mesh>
        <boxGeometry args={[tamanho, tamanho * 0.78, tamanho * 0.82]} />
        <Mat cor={cor} aspereza={0.72} metal={0.04} />
      </mesh>
      <mesh position={[0, tamanho * 0.395, 0]}>
        <boxGeometry args={[tamanho * 1.02, tamanho * 0.05, tamanho * 0.84]} />
        <Mat cor="#a86f38" aspereza={0.7} metal={0.04} />
      </mesh>
      <mesh position={[0, tamanho * 0.02, tamanho * 0.42]}>
        <boxGeometry args={[tamanho * 0.12, tamanho * 0.8, tamanho * 0.02]} />
        <Mat cor={PALETA.neutroClaro} aspereza={0.6} metal={0.02} />
      </mesh>
    </group>
  );
}

/** Barra vertical de gráfico, ancorada pela base. */
export function Barra({ altura = 0.6, largura = 0.17, cor = PALETA.marca, ...props }) {
  return (
    <mesh position-y={altura / 2} {...props}>
      <boxGeometry args={[largura, altura, largura]} />
      <Mat cor={cor} emissiva={cor} brilho={0.2} aspereza={0.35} metal={0.25} />
    </mesh>
  );
}

/** Esfera usada como "nó" nas composições de rede/clientes. */
export function No({ raio = 0.16, cor = PALETA.apoio, ...props }) {
  return (
    <mesh {...props}>
      <sphereGeometry args={[raio, 24, 18]} />
      <Mat cor={cor} emissiva={cor} brilho={0.32} aspereza={0.3} metal={0.3} />
    </mesh>
  );
}

/** Segmento fino ligando dois pontos — as "conexões" do CRM e do fluxo. */
export function Conexao({ de, para, espessura = 0.018, cor = PALETA.apoio }) {
  const { posicao, quaternion, comprimento } = useMemo(() => {
    const a = new THREE.Vector3(...de);
    const b = new THREE.Vector3(...para);
    const dir = new THREE.Vector3().subVectors(b, a);
    const comp = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    return {
      posicao: new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5),
      quaternion: q,
      comprimento: comp,
    };
  }, [de, para]);

  return (
    <mesh position={posicao} quaternion={quaternion}>
      <cylinderGeometry args={[espessura, espessura, comprimento, 8]} />
      <Mat cor={cor} emissiva={cor} brilho={0.5} aspereza={0.4} metal={0.1} />
    </mesh>
  );
}

/** Engrenagem: anel central + dentes distribuídos. */
export function Engrenagem({ raio = 0.4, dentes = 10, cor = PALETA.apoio, ...props }) {
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
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[raio * 0.74, raio * 0.24, 12, 30]} />
        <Mat cor={cor} emissiva={cor} brilho={0.22} aspereza={0.35} metal={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[raio * 0.24, raio * 0.24, raio * 0.28, 18]} />
        <Mat cor={PALETA.tinta3} aspereza={0.4} metal={0.35} />
      </mesh>
      {posicoes.map(({ a, x, y }, i) => (
        <mesh key={i} position={[x, y, 0]} rotation={[0, 0, a]}>
          <boxGeometry args={[raio * 0.3, raio * 0.19, raio * 0.26]} />
          <Mat cor={cor} emissiva={cor} brilho={0.18} aspereza={0.35} metal={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/** Escudo extrudado — usado na seção de segurança. */
export function Escudo({ tamanho = 0.9, cor = PALETA.marca, ...props }) {
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
      depth: tamanho * 0.15,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      bevelSegments: 2,
      curveSegments: 14,
    });
    g.center();
    return g;
  }, [tamanho]);

  return (
    <mesh geometry={geo} {...props}>
      <Mat cor={cor} emissiva={cor} brilho={0.24} aspereza={0.32} metal={0.35} />
    </mesh>
  );
}

/** Cadeado simples: corpo + arco. */
export function Cadeado({ tamanho = 0.34, cor = PALETA.neutroClaro, ...props }) {
  return (
    <group {...props}>
      <mesh>
        <boxGeometry args={[tamanho, tamanho * 0.78, tamanho * 0.42]} />
        <Mat cor={cor} aspereza={0.34} metal={0.45} />
      </mesh>
      <mesh position={[0, tamanho * 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[tamanho * 0.3, tamanho * 0.08, 10, 22, Math.PI]} />
        <Mat cor={cor} aspereza={0.34} metal={0.5} />
      </mesh>
    </group>
  );
}

/** Folha de calendário: cabeçalho colorido + grade de dias. */
export function Calendario({ largura = 1.1, cor = PALETA.marca, ...props }) {
  const altura = largura * 0.92;
  const dias = useMemo(() => {
    const linhas = 4;
    const colunas = 5;
    const out = [];
    for (let l = 0; l < linhas; l += 1) {
      for (let c = 0; c < colunas; c += 1) {
        out.push({
          x: (c - (colunas - 1) / 2) * (largura * 0.155),
          y: altura * 0.16 - l * (altura * 0.155),
          destaque: l === 2 && c === 3,
        });
      }
    }
    return out;
  }, [largura, altura]);

  return (
    <group {...props}>
      <Painel largura={largura} altura={altura} cor={PALETA.neutroClaro} raio={0.09} />
      <group position={[0, 0, 0.045]}>
        <Painel
          largura={largura * 0.98}
          altura={altura * 0.2}
          cor={cor}
          emissiva={cor}
          brilho={0.2}
          raio={0.05}
          profundidade={0.02}
          position={[0, altura * 0.37, 0]}
        />
        {dias.map((d, i) => (
          <mesh key={i} position={[d.x, d.y, 0.01]}>
            <circleGeometry args={[largura * 0.045, 14]} />
            <meshStandardMaterial
              color={d.destaque ? cor : "#c3cee4"}
              emissive={d.destaque ? cor : "#000000"}
              emissiveIntensity={d.destaque ? 0.55 : 0}
              transparent
              opacity={1}
              roughness={0.5}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Relógio analógico estilizado. */
export function Relogio({ raio = 0.4, cor = PALETA.apoio, ...props }) {
  return (
    <group {...props}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[raio, raio, raio * 0.22, 34]} />
        <Mat cor={PALETA.neutroClaro} aspereza={0.34} metal={0.3} />
      </mesh>
      <mesh position={[0, 0, raio * 0.12]}>
        <circleGeometry args={[raio * 0.84, 30]} />
        <meshStandardMaterial color={PALETA.tinta2} transparent opacity={1} roughness={0.5} />
      </mesh>
      <mesh position={[0, raio * 0.22, raio * 0.14]}>
        <boxGeometry args={[raio * 0.07, raio * 0.5, raio * 0.03]} />
        <Mat cor={cor} emissiva={cor} brilho={0.6} />
      </mesh>
      <mesh position={[raio * 0.16, 0, raio * 0.14]} rotation={[0, 0, -Math.PI / 2]}>
        <boxGeometry args={[raio * 0.06, raio * 0.36, raio * 0.03]} />
        <Mat cor={PALETA.marcaClara} emissiva={PALETA.marcaClara} brilho={0.6} />
      </mesh>
    </group>
  );
}

/** Documento com "linhas de texto" e um selo colorido. */
export function Documento({ largura = 0.78, cor = PALETA.apoio, linhas = 4, ...props }) {
  const altura = largura * 1.32;
  return (
    <group {...props}>
      <Painel largura={largura} altura={altura} cor={PALETA.neutroClaro} raio={0.05} />
      <group position={[0, 0, 0.04]}>
        {Array.from({ length: linhas }).map((_, i) => (
          <mesh
            key={i}
            position={[
              -largura * 0.06 * (i % 2),
              altura * 0.24 - i * (altura * 0.13),
              0,
            ]}
          >
            <planeGeometry args={[largura * (i % 2 ? 0.5 : 0.66), altura * 0.045]} />
            <meshStandardMaterial color="#c3cee4" transparent opacity={1} roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[largura * 0.24, -altura * 0.34, 0]}>
          <circleGeometry args={[largura * 0.14, 22]} />
          <meshStandardMaterial
            color={cor}
            emissive={cor}
            emissiveIntensity={0.4}
            transparent
            opacity={1}
            roughness={0.4}
          />
        </mesh>
      </group>
    </group>
  );
}

/** Pasta de arquivos (aba + corpo). */
export function Pasta({ largura = 0.95, cor = PALETA.marcaForte, ...props }) {
  const altura = largura * 0.72;
  return (
    <group {...props}>
      <Painel
        largura={largura * 0.42}
        altura={altura * 0.2}
        cor={cor}
        raio={0.04}
        profundidade={0.04}
        position={[-largura * 0.28, altura * 0.52, -0.02]}
      />
      <Painel largura={largura} altura={altura} cor={cor} raio={0.07} profundidade={0.06} />
      <Painel
        largura={largura * 0.86}
        altura={altura * 0.8}
        cor={PALETA.neutroClaro}
        raio={0.04}
        profundidade={0.02}
        position={[0, altura * 0.06, 0.05]}
      />
    </group>
  );
}

/** Carrinho de compras estilizado (cesto + duas rodas). */
export function Carrinho({ tamanho = 0.62, cor = PALETA.marca, ...props }) {
  return (
    <group {...props}>
      <mesh rotation={[0, 0, -0.12]}>
        <boxGeometry args={[tamanho, tamanho * 0.6, tamanho * 0.52]} />
        <Mat cor={cor} emissiva={cor} brilho={0.18} aspereza={0.36} metal={0.3} />
      </mesh>
      <mesh position={[0, tamanho * 0.12, 0]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[tamanho * 0.88, tamanho * 0.42, tamanho * 0.44]} />
        <Mat cor={PALETA.tinta2} aspereza={0.5} metal={0.2} />
      </mesh>
      <mesh position={[-tamanho * 0.62, tamanho * 0.44, 0]} rotation={[0, 0, 0.55]}>
        <cylinderGeometry args={[tamanho * 0.035, tamanho * 0.035, tamanho * 0.62, 10]} />
        <Mat cor={PALETA.neutro} aspereza={0.4} metal={0.4} />
      </mesh>
      {[-0.28, 0.28].map((x) => (
        <mesh
          key={x}
          position={[tamanho * x, -tamanho * 0.44, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[tamanho * 0.11, tamanho * 0.11, tamanho * 0.09, 18]} />
          <Mat cor={PALETA.tinta3} aspereza={0.45} metal={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/** Funil de vendas: três anéis decrescentes. */
export function Funil({ tamanho = 0.9, ...props }) {
  const niveis = [
    { r: tamanho * 0.5, y: tamanho * 0.3, cor: PALETA.apoio },
    { r: tamanho * 0.36, y: 0, cor: PALETA.marcaClara },
    { r: tamanho * 0.22, y: -tamanho * 0.28, cor: PALETA.marca },
  ];
  return (
    <group {...props}>
      {niveis.map((n, i) => (
        <mesh key={i} position={[0, n.y, 0]}>
          <cylinderGeometry args={[n.r, n.r * 0.78, tamanho * 0.2, 30, 1, true]} />
          <meshStandardMaterial
            color={n.cor}
            emissive={n.cor}
            emissiveIntensity={0.3}
            transparent
            opacity={1}
            roughness={0.32}
            metalness={0.28}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Desenho dos dados — a referência é Bloomberg / Apple / Figma.
 *
 * Todo painel é uma textura de canvas com FUNDO TRANSPARENTE. Isso é o ponto
 * central: o painel não é um cartaz opaco colado na cena, é um traço gravado
 * numa lâmina de vidro, e o que estiver atrás continua sendo visto. É assim
 * que o dado "surge do próprio vidro" em vez de flutuar sobre ele.
 *
 * Regras de desenho, todas deliberadas:
 *   · linha de 1,5 px — fina, nunca barra grossa;
 *   · duas cores no máximo, ambas o azul-marinho da marca em opacidades
 *     diferentes; verde e vermelho só como um ponto de 6 px em indicador;
 *   · área sob a curva com opacidade baixíssima, só para dar corpo;
 *   · tipografia real, em tamanho pequeno, com espaçamento largo — é ela que
 *     dá a leitura de "software", e é o que faltava na versão anterior.
 */

import * as THREE from "three";

const cache = new Map();
function memo(chave, fabrica) {
  if (!cache.has(chave)) cache.set(chave, fabrica());
  return cache.get(chave);
}

const TINTA = "47, 92, 149";   // azul-marinho da marca
const CLARO = "143, 176, 214";

function aleatorio(semente) {
  let s = semente;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

/** Cabeçalho comum: rótulo pequeno em caixa alta e um valor grande. */
function cabecalho(g, w, rotulo, valor, variacao) {
  g.font = "500 15px 'IBM Plex Sans', system-ui, sans-serif";
  g.fillStyle = `rgba(${TINTA},0.62)`;
  g.letterSpacing = "2.4px";
  g.fillText(rotulo.toUpperCase(), 30, 40);

  g.letterSpacing = "0px";
  g.font = "600 42px 'Outfit', system-ui, sans-serif";
  g.fillStyle = `rgba(${TINTA},0.95)`;
  g.fillText(valor, 28, 88);

  if (variacao) {
    const positiva = !variacao.startsWith("-");
    g.font = "500 16px 'IBM Plex Mono', monospace";
    g.fillStyle = positiva ? "rgba(79,143,114,0.95)" : "rgba(169,104,92,0.95)";
    g.fillText(variacao, 30 + g.measureText(valor).width * 0.1 + 150, 86);
  }
}

/**
 * `tipo` escolhe o desenho. São quatro, e nenhum inventa um objeto novo:
 * série temporal, colunas finas, tabela e anel de proporção.
 */
export function texturaDado(tipo = 0, semente = 1) {
  return memo(`dado-${tipo}-${semente}`, () => {
    const L = 640;
    const A = 400;
    const c = document.createElement("canvas");
    c.width = L;
    c.height = A;
    const g = c.getContext("2d");
    const r = aleatorio(semente * 7919 + 13);

    g.clearRect(0, 0, L, A); // FUNDO TRANSPARENTE

    /* filete superior: a única "moldura", e ela é meia linha */
    g.strokeStyle = `rgba(${TINTA},0.22)`;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(28, 108);
    g.lineTo(L - 28, 108);
    g.stroke();

    if (tipo === 0) {
      cabecalho(g, L, "Receita acumulada", "R$ 1,84M", "+6,2%");
      const pontos = [];
      for (let i = 0; i <= 40; i += 1) {
        const x = 30 + (i / 40) * (L - 60);
        const y = 330 - (i / 40) * 130 - r() * 46;
        pontos.push([x, y]);
      }
      g.beginPath();
      g.moveTo(pontos[0][0], A - 40);
      pontos.forEach((p) => g.lineTo(p[0], p[1]));
      g.lineTo(pontos[pontos.length - 1][0], A - 40);
      g.closePath();
      const area = g.createLinearGradient(0, 140, 0, A - 40);
      area.addColorStop(0, `rgba(${TINTA},0.16)`);
      area.addColorStop(1, `rgba(${TINTA},0)`);
      g.fillStyle = area;
      g.fill();

      g.beginPath();
      pontos.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.strokeStyle = `rgba(${TINTA},0.9)`;
      g.lineWidth = 1.6;
      g.stroke();
    } else if (tipo === 1) {
      cabecalho(g, L, "Vendas por período", "2.417", "+3,8%");
      const n = 26;
      for (let i = 0; i < n; i += 1) {
        const h = 40 + r() * 150 + i * 2.2;
        const x = 32 + i * ((L - 64) / n);
        g.fillStyle = i === n - 1 ? `rgba(${TINTA},0.9)` : `rgba(${CLARO},0.72)`;
        g.fillRect(x, A - 44 - h, 6, h); // coluna FINA
      }
      g.strokeStyle = `rgba(${TINTA},0.2)`;
      g.beginPath();
      g.moveTo(28, A - 43.5);
      g.lineTo(L - 28, A - 43.5);
      g.stroke();
    } else if (tipo === 2) {
      cabecalho(g, L, "Contas a receber", "R$ 312,4k", null);
      g.font = "400 17px 'IBM Plex Mono', monospace";
      for (let i = 0; i < 6; i += 1) {
        const y = 152 + i * 40;
        g.fillStyle = `rgba(${TINTA},0.72)`;
        g.fillText(["NF 4.812", "NF 4.813", "NF 4.815", "NF 4.818", "NF 4.821", "NF 4.824"][i], 30, y);
        g.fillStyle = `rgba(${TINTA},0.5)`;
        const v = (r() * 40 + 4).toFixed(1).replace(".", ",");
        g.fillText(`R$ ${v}k`, 300, y);
        g.fillStyle = r() > 0.3 ? "rgba(79,143,114,0.9)" : "rgba(169,104,92,0.9)";
        g.beginPath();
        g.arc(L - 44, y - 6, 3.6, 0, Math.PI * 2);
        g.fill();
      }
    } else {
      cabecalho(g, L, "Margem operacional", "24,6%", "+1,1 p.p.");
      const cx = L / 2;
      const cy = 268;
      const raio = 84;
      g.lineWidth = 8;
      g.strokeStyle = `rgba(${CLARO},0.4)`;
      g.beginPath();
      g.arc(cx, cy, raio, 0, Math.PI * 2);
      g.stroke();
      g.strokeStyle = `rgba(${TINTA},0.92)`;
      g.lineCap = "round";
      g.beginPath();
      g.arc(cx, cy, raio, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.55);
      g.stroke();
    }

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  });
}

/**
 * Camada de dado para aplicar SOBRE uma fachada — quadro 5. Só linhas e
 * marcações finas, sem cabeçalho: ela precisa ler como sobreposição técnica,
 * não como cartaz pendurado no prédio.
 */
export function texturaFachada(semente = 1) {
  return memo(`fachada-${semente}`, () => {
    const L = 512;
    const A = 512;
    const c = document.createElement("canvas");
    c.width = L;
    c.height = A;
    const g = c.getContext("2d");
    const r = aleatorio(semente * 104729 + 7);
    g.clearRect(0, 0, L, A);

    /* série vertical correndo pelos andares */
    g.strokeStyle = `rgba(${TINTA},0.55)`;
    g.lineWidth = 1.5;
    g.beginPath();
    for (let i = 0; i <= 34; i += 1) {
      const y = 20 + (i / 34) * (A - 40);
      const x = 120 + Math.sin(i * 0.5) * 40 + r() * 70;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();

    /* marcações horizontais alinhadas às lajes */
    g.strokeStyle = `rgba(${TINTA},0.2)`;
    g.lineWidth = 1;
    for (let i = 0; i < 12; i += 1) {
      const y = 30 + i * 40;
      g.beginPath();
      g.moveTo(300, y);
      g.lineTo(300 + 60 + r() * 130, y);
      g.stroke();
    }

    g.font = "500 20px 'IBM Plex Mono', monospace";
    g.fillStyle = `rgba(${TINTA},0.7)`;
    g.fillText("+4,8%", 300, 470);

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  });
}

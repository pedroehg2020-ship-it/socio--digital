/**
 * Telas do ERP desenhadas em <canvas> para virarem textura 3D.
 *
 * É isto que tira a página do território "ícone 3D flutuando": os painéis da
 * cena não são placeholders, são desenhos das telas reais do sistema —
 * dashboard, contas a receber, PDV, estoque, agenda, radar — renderizados em
 * alta resolução e aplicados como mapa em planos com perspectiva.
 *
 * Nada aqui é baixado. Tudo é Canvas2D, gerado uma vez e cacheado.
 */

import * as THREE from "three";

const L = 1280;
const A = 800;

const COR = {
  fundo: "#0b1430",
  fundo2: "#111e40",
  cartao: "#16244d",
  cartao2: "#1b2c5c",
  linha: "#25376b",
  texto: "#eaf1ff",
  texto2: "#9fb2d8",
  texto3: "#6b7fa8",
  marca: "#10b981",
  marcaClara: "#34d399",
  apoio: "#3b82f6",
  apoioClaro: "#60a5fa",
};

/* ------------------------------------------------------------ utilidades */

function ctx2d() {
  const c = document.createElement("canvas");
  c.width = L;
  c.height = A;
  return [c, c.getContext("2d")];
}

function retanguloRedondo(g, x, y, l, a, r) {
  const raio = Math.min(r, l / 2, a / 2);
  g.beginPath();
  g.moveTo(x + raio, y);
  g.lineTo(x + l - raio, y);
  g.quadraticCurveTo(x + l, y, x + l, y + raio);
  g.lineTo(x + l, y + a - raio);
  g.quadraticCurveTo(x + l, y + a, x + l - raio, y + a);
  g.lineTo(x + raio, y + a);
  g.quadraticCurveTo(x, y + a, x, y + a - raio);
  g.lineTo(x, y + raio);
  g.quadraticCurveTo(x, y, x + raio, y);
  g.closePath();
}

function texto(g, t, x, y, { tam = 22, cor = COR.texto, peso = 500, fonte = "Outfit" } = {}) {
  g.fillStyle = cor;
  g.font = `${peso} ${tam}px ${fonte}, system-ui, sans-serif`;
  g.textBaseline = "middle";
  g.fillText(t, x, y);
}

/** Moldura comum: fundo, barra de título e trilho lateral de navegação. */
function moldura(g, titulo) {
  const grad = g.createLinearGradient(0, 0, L, A);
  grad.addColorStop(0, COR.fundo);
  grad.addColorStop(1, COR.fundo2);
  g.fillStyle = grad;
  g.fillRect(0, 0, L, A);

  // trilho lateral
  g.fillStyle = "#0a1230";
  g.fillRect(0, 0, 96, A);
  const itens = 7;
  for (let i = 0; i < itens; i += 1) {
    const y = 118 + i * 62;
    g.fillStyle = i === 1 ? "rgba(16,185,129,.22)" : "rgba(255,255,255,.05)";
    retanguloRedondo(g, 22, y, 52, 44, 12);
    g.fill();
    g.fillStyle = i === 1 ? COR.marcaClara : COR.texto3;
    retanguloRedondo(g, 38, y + 16, 20, 12, 3);
    g.fill();
  }
  // selo da marca
  const sg = g.createLinearGradient(22, 34, 74, 82);
  sg.addColorStop(0, COR.marca);
  sg.addColorStop(1, COR.apoio);
  g.fillStyle = sg;
  retanguloRedondo(g, 22, 34, 52, 48, 14);
  g.fill();

  // barra de título
  g.fillStyle = "rgba(255,255,255,.03)";
  g.fillRect(96, 0, L - 96, 78);
  g.fillStyle = COR.linha;
  g.fillRect(96, 78, L - 96, 1);
  texto(g, titulo, 132, 40, { tam: 27, peso: 600 });

  // avatar
  g.fillStyle = "rgba(255,255,255,.08)";
  g.beginPath();
  g.arc(L - 58, 39, 21, 0, Math.PI * 2);
  g.fill();
}

function cartaoKpi(g, x, y, l, a, rotulo, valor, delta, cor) {
  g.fillStyle = COR.cartao;
  retanguloRedondo(g, x, y, l, a, 18);
  g.fill();
  g.strokeStyle = COR.linha;
  g.lineWidth = 1.4;
  g.stroke();

  g.fillStyle = cor;
  retanguloRedondo(g, x, y, 5, a, 3);
  g.fill();

  texto(g, rotulo, x + 26, y + 34, { tam: 17, cor: COR.texto2, peso: 500 });
  texto(g, valor, x + 26, y + 76, { tam: 34, peso: 700 });
  if (delta) texto(g, delta, x + 26, y + 116, { tam: 16, cor, peso: 600 });
}

/* ------------------------------------------------------------- as telas */

/** Painel geral: KPIs, curva de receita e barras por dia. */
function desenharPainel(g) {
  moldura(g, "Painel geral");

  const kpis = [
    ["Receita 30 dias", "R$ 128.400", "+18,2%", COR.marcaClara],
    ["Lucro líquido", "R$ 41.960", "+9,4%", COR.marcaClara],
    ["A receber", "R$ 32.180", "12 títulos", COR.apoioClaro],
    ["A pagar", "R$ 19.740", "7 títulos", COR.apoioClaro],
  ];
  kpis.forEach((k, i) => cartaoKpi(g, 132 + i * 268, 112, 244, 148, ...k));

  // gráfico de área
  const gx = 132;
  const gy = 300;
  const gl = 700;
  const ga = 300;
  g.fillStyle = COR.cartao;
  retanguloRedondo(g, gx, gy, gl, ga, 20);
  g.fill();
  g.strokeStyle = COR.linha;
  g.lineWidth = 1.4;
  g.stroke();
  texto(g, "Receita por dia", gx + 28, gy + 36, { tam: 19, peso: 600 });

  const pts = [];
  const n = 26;
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const v =
      0.34 +
      t * 0.44 +
      Math.sin(i * 0.85) * 0.09 +
      Math.sin(i * 0.31) * 0.06;
    pts.push([gx + 34 + t * (gl - 74), gy + ga - 40 - v * (ga - 110)]);
  }
  // grade
  g.strokeStyle = "rgba(255,255,255,.05)";
  g.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const y = gy + 78 + i * 48;
    g.beginPath();
    g.moveTo(gx + 30, y);
    g.lineTo(gx + gl - 30, y);
    g.stroke();
  }
  // área preenchida
  const ag = g.createLinearGradient(0, gy + 60, 0, gy + ga);
  ag.addColorStop(0, "rgba(16,185,129,.42)");
  ag.addColorStop(1, "rgba(16,185,129,0)");
  g.beginPath();
  g.moveTo(pts[0][0], gy + ga - 34);
  pts.forEach((p) => g.lineTo(p[0], p[1]));
  g.lineTo(pts[pts.length - 1][0], gy + ga - 34);
  g.closePath();
  g.fillStyle = ag;
  g.fill();
  // linha
  g.beginPath();
  pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
  g.strokeStyle = COR.marcaClara;
  g.lineWidth = 3.4;
  g.lineJoin = "round";
  g.stroke();
  // ponto final destacado
  const ult = pts[pts.length - 1];
  g.fillStyle = COR.marcaClara;
  g.beginPath();
  g.arc(ult[0], ult[1], 7, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(52,211,153,.3)";
  g.lineWidth = 10;
  g.stroke();

  // coluna lateral: barras
  const bx = 866;
  g.fillStyle = COR.cartao;
  retanguloRedondo(g, bx, gy, 282, ga, 20);
  g.fill();
  g.strokeStyle = COR.linha;
  g.lineWidth = 1.4;
  g.stroke();
  texto(g, "Pedidos por dia", bx + 26, gy + 36, { tam: 19, peso: 600 });
  const barras = [0.38, 0.62, 0.45, 0.8, 0.55, 0.94, 0.7];
  barras.forEach((v, i) => {
    const alt = v * 176;
    const x = bx + 30 + i * 34;
    g.fillStyle = i === 5 ? COR.marcaClara : "rgba(59,130,246,.65)";
    retanguloRedondo(g, x, gy + ga - 40 - alt, 22, alt, 7);
    g.fill();
  });

  // rodapé com alertas
  g.fillStyle = "rgba(16,185,129,.1)";
  retanguloRedondo(g, 132, 634, 1016, 118, 18);
  g.fill();
  g.strokeStyle = "rgba(16,185,129,.32)";
  g.lineWidth = 1.4;
  g.stroke();
  texto(g, "Radar", 164, 672, { tam: 16, cor: COR.marcaClara, peso: 700 });
  texto(g, "3 produtos abaixo do estoque mínimo · 2 títulos vencem em 48h", 164, 710, {
    tam: 20,
    cor: COR.texto,
  });
}

/** Lista de títulos com vencimento e situação. */
function desenharFinanceiro(g) {
  moldura(g, "Contas a receber");

  const abas = ["Todos", "Em aberto", "Vencidos", "Baixados"];
  abas.forEach((t, i) => {
    const x = 132 + i * 148;
    g.fillStyle = i === 1 ? "rgba(16,185,129,.18)" : "rgba(255,255,255,.04)";
    retanguloRedondo(g, x, 110, 132, 46, 12);
    g.fill();
    texto(g, t, x + 24, 133, {
      tam: 17,
      cor: i === 1 ? COR.marcaClara : COR.texto2,
      peso: 600,
    });
  });

  const cab = ["Cliente", "Vencimento", "Valor", "Situação"];
  const cols = [156, 560, 800, 1010];
  g.fillStyle = "rgba(255,255,255,.04)";
  retanguloRedondo(g, 132, 184, 1016, 56, 14);
  g.fill();
  cab.forEach((t, i) =>
    texto(g, t, cols[i], 212, { tam: 16, cor: COR.texto3, peso: 600 })
  );

  const linhas = [
    ["Padaria Bom Dia", "12/09/2026", "R$ 2.480,00", "Em aberto", COR.apoioClaro],
    ["Mercado Vila Nova", "14/09/2026", "R$ 5.910,00", "Em aberto", COR.apoioClaro],
    ["Restaurante Sabor", "02/09/2026", "R$ 1.230,00", "Vencido", "#f97362"],
    ["Distribuidora Sul", "20/09/2026", "R$ 8.740,00", "Em aberto", COR.apoioClaro],
    ["Café Central", "28/08/2026", "R$ 960,00", "Baixado", COR.marcaClara],
    ["Loja Aurora", "24/09/2026", "R$ 3.375,00", "Em aberto", COR.apoioClaro],
    ["Empório Norte", "30/09/2026", "R$ 6.120,00", "Em aberto", COR.apoioClaro],
  ];
  linhas.forEach((l, i) => {
    const y = 258 + i * 64;
    if (i % 2 === 0) {
      g.fillStyle = "rgba(255,255,255,.022)";
      retanguloRedondo(g, 132, y, 1016, 56, 12);
      g.fill();
    }
    texto(g, l[0], cols[0], y + 28, { tam: 19 });
    texto(g, l[1], cols[1], y + 28, { tam: 18, cor: COR.texto2 });
    texto(g, l[2], cols[2], y + 28, { tam: 19, peso: 600 });
    g.fillStyle = `${l[4]}22`;
    retanguloRedondo(g, cols[3] - 12, y + 12, 132, 32, 10);
    g.fill();
    texto(g, l[3], cols[3], y + 28, { tam: 15, cor: l[4], peso: 600 });
  });

  g.fillStyle = COR.cartao2;
  retanguloRedondo(g, 132, 716, 1016, 56, 14);
  g.fill();
  texto(g, "Total em aberto", 156, 744, { tam: 18, cor: COR.texto2 });
  texto(g, "R$ 32.180,00", 1010, 744, { tam: 21, peso: 700, cor: COR.marcaClara });
}

/** Frente de vendas com carrinho e resumo. */
function desenharPdv(g) {
  moldura(g, "Frente de vendas");

  // catálogo
  const prods = [
    ["Café torrado 500g", "R$ 32,90"],
    ["Farinha tipo 1", "R$ 18,40"],
    ["Azeite extra virgem", "R$ 46,00"],
    ["Leite integral 1L", "R$ 6,80"],
    ["Açúcar cristal 5kg", "R$ 24,50"],
    ["Chocolate 70% 100g", "R$ 14,90"],
  ];
  prods.forEach((p, i) => {
    const x = 132 + (i % 3) * 232;
    const y = 118 + Math.floor(i / 3) * 172;
    g.fillStyle = COR.cartao;
    retanguloRedondo(g, x, y, 210, 148, 18);
    g.fill();
    g.strokeStyle = COR.linha;
    g.lineWidth = 1.4;
    g.stroke();
    const pg = g.createLinearGradient(x, y, x + 210, y + 90);
    pg.addColorStop(0, "rgba(59,130,246,.3)");
    pg.addColorStop(1, "rgba(16,185,129,.24)");
    g.fillStyle = pg;
    retanguloRedondo(g, x + 18, y + 18, 68, 62, 14);
    g.fill();
    texto(g, p[0], x + 18, y + 106, { tam: 16, cor: COR.texto2 });
    texto(g, p[1], x + 18, y + 132, { tam: 20, peso: 700 });
  });

  // carrinho
  const cx = 838;
  g.fillStyle = COR.cartao;
  retanguloRedondo(g, cx, 112, 310, 574, 20);
  g.fill();
  g.strokeStyle = COR.linha;
  g.lineWidth = 1.4;
  g.stroke();
  texto(g, "Venda em andamento", cx + 26, 146, { tam: 19, peso: 600 });

  const itens = [
    ["2× Café torrado", "R$ 65,80"],
    ["1× Azeite", "R$ 46,00"],
    ["3× Leite integral", "R$ 20,40"],
    ["1× Chocolate 70%", "R$ 14,90"],
  ];
  itens.forEach((it, i) => {
    const y = 190 + i * 58;
    g.fillStyle = "rgba(255,255,255,.03)";
    retanguloRedondo(g, cx + 20, y, 270, 46, 12);
    g.fill();
    texto(g, it[0], cx + 36, y + 24, { tam: 17, cor: COR.texto2 });
    texto(g, it[1], cx + 208, y + 24, { tam: 17, peso: 600 });
  });

  g.strokeStyle = COR.linha;
  g.beginPath();
  g.moveTo(cx + 20, 448);
  g.lineTo(cx + 290, 448);
  g.stroke();
  texto(g, "Subtotal", cx + 30, 480, { tam: 17, cor: COR.texto2 });
  texto(g, "R$ 147,10", cx + 202, 480, { tam: 17 });
  texto(g, "Total", cx + 30, 524, { tam: 21, peso: 700 });
  texto(g, "R$ 147,10", cx + 186, 524, { tam: 25, peso: 700, cor: COR.marcaClara });

  const bg = g.createLinearGradient(cx + 20, 562, cx + 290, 620);
  bg.addColorStop(0, "#059669");
  bg.addColorStop(1, COR.marca);
  g.fillStyle = bg;
  retanguloRedondo(g, cx + 20, 562, 270, 58, 14);
  g.fill();
  texto(g, "Finalizar venda", cx + 74, 592, { tam: 20, peso: 700, cor: "#04231a" });

  g.fillStyle = "rgba(16,185,129,.1)";
  retanguloRedondo(g, 132, 640, 674, 112, 18);
  g.fill();
  texto(g, "Ao finalizar", 160, 676, { tam: 15, cor: COR.marcaClara, peso: 700 });
  texto(g, "Estoque baixado · título gerado · cliente atualizado", 160, 712, {
    tam: 19,
    cor: COR.texto,
  });
}

/** Estoque com saldo e ponto mínimo. */
function desenharEstoque(g) {
  moldura(g, "Estoque");

  const linhas = [
    ["Café torrado 500g", 128, 40, 0.86],
    ["Farinha tipo 1", 18, 30, 0.2],
    ["Azeite extra virgem", 64, 20, 0.72],
    ["Leite integral 1L", 240, 80, 0.92],
    ["Açúcar cristal 5kg", 12, 25, 0.14],
    ["Chocolate 70%", 96, 30, 0.68],
  ];
  linhas.forEach((l, i) => {
    const y = 126 + i * 98;
    g.fillStyle = COR.cartao;
    retanguloRedondo(g, 132, y, 1016, 80, 18);
    g.fill();
    g.strokeStyle = COR.linha;
    g.lineWidth = 1.4;
    g.stroke();

    const baixo = l[3] < 0.3;
    const cg = g.createLinearGradient(160, y + 18, 220, y + 62);
    cg.addColorStop(0, baixo ? "rgba(249,115,98,.4)" : "rgba(16,185,129,.34)");
    cg.addColorStop(1, "rgba(59,130,246,.24)");
    g.fillStyle = cg;
    retanguloRedondo(g, 158, y + 18, 56, 44, 12);
    g.fill();

    texto(g, l[0], 240, y + 32, { tam: 20, peso: 600 });
    texto(g, `mínimo ${l[2]} un.`, 240, y + 60, { tam: 15, cor: COR.texto3 });

    // barra de saldo
    g.fillStyle = "rgba(255,255,255,.06)";
    retanguloRedondo(g, 620, y + 34, 320, 14, 7);
    g.fill();
    g.fillStyle = baixo ? "#f97362" : COR.marcaClara;
    retanguloRedondo(g, 620, y + 34, Math.max(18, 320 * l[3]), 14, 7);
    g.fill();

    texto(g, `${l[1]} un.`, 976, y + 42, { tam: 21, peso: 700 });
    if (baixo) {
      g.fillStyle = "rgba(249,115,98,.16)";
      retanguloRedondo(g, 1058, y + 26, 74, 30, 9);
      g.fill();
      texto(g, "repor", 1074, y + 42, { tam: 14, cor: "#f97362", peso: 700 });
    }
  });
}

/** Agenda de vencimentos em calendário. */
function desenharAgenda(g) {
  moldura(g, "Agenda de vencimentos");

  const dias = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
  dias.forEach((d, i) =>
    texto(g, d, 168 + i * 142, 132, { tam: 16, cor: COR.texto3, peso: 600 })
  );

  const marcas = {
    3: [COR.marcaClara],
    8: [COR.apoioClaro, COR.marcaClara],
    10: ["#f97362"],
    15: [COR.marcaClara],
    17: [COR.apoioClaro],
    22: [COR.marcaClara, "#f97362", COR.apoioClaro],
    26: [COR.apoioClaro],
  };

  for (let i = 0; i < 28; i += 1) {
    const x = 138 + (i % 7) * 142;
    const y = 160 + Math.floor(i / 7) * 130;
    const hoje = i === 15;
    g.fillStyle = hoje ? "rgba(16,185,129,.16)" : COR.cartao;
    retanguloRedondo(g, x, y, 128, 114, 16);
    g.fill();
    g.strokeStyle = hoje ? "rgba(16,185,129,.5)" : COR.linha;
    g.lineWidth = hoje ? 2 : 1.2;
    g.stroke();
    texto(g, String(i + 1), x + 18, y + 26, {
      tam: 17,
      cor: hoje ? COR.marcaClara : COR.texto2,
      peso: 600,
    });
    (marcas[i] || []).forEach((c, k) => {
      g.fillStyle = c;
      retanguloRedondo(g, x + 16, y + 50 + k * 20, 96 - k * 22, 12, 6);
      g.fill();
    });
  }

  g.fillStyle = COR.cartao2;
  retanguloRedondo(g, 132, 690, 1016, 74, 16);
  g.fill();
  texto(g, "Esta semana", 164, 727, { tam: 17, cor: COR.texto2 });
  texto(g, "A receber R$ 9.320", 420, 727, { tam: 19, peso: 600, cor: COR.marcaClara });
  texto(g, "A pagar R$ 4.180", 720, 727, { tam: 19, peso: 600, cor: COR.apoioClaro });
  texto(g, "2 vencidos", 990, 727, { tam: 19, peso: 600, cor: "#f97362" });
}

/** Conversa com o assistente de IA. */
function desenharAssistente(g) {
  moldura(g, "Assistente");

  const balao = (t, linhas2, y, minha) => {
    const l = minha ? 620 : 760;
    const x = minha ? 1148 - l - 20 : 132;
    const a = 60 + linhas2.length * 36;
    g.fillStyle = minha ? "rgba(59,130,246,.2)" : COR.cartao;
    retanguloRedondo(g, x, y, l, a, 18);
    g.fill();
    g.strokeStyle = minha ? "rgba(59,130,246,.4)" : COR.linha;
    g.lineWidth = 1.4;
    g.stroke();
    if (t) texto(g, t, x + 26, y + 30, { tam: 15, cor: COR.marcaClara, peso: 700 });
    linhas2.forEach((ln, i) =>
      texto(g, ln, x + 26, y + (t ? 68 : 38) + i * 34, { tam: 19, cor: COR.texto })
    );
    return a;
  };

  let y = 118;
  y += balao(null, ["Como foi a semana?"], y, true) + 22;
  y +=
    balao(
      "SÓCIO DIGITAL",
      [
        "Receita de R$ 31.480 nos últimos 7 dias, 14% acima",
        "da semana anterior. Lucro líquido de R$ 9.860.",
        "Dois pontos merecem atenção:",
      ],
      y,
      false
    ) + 18;
  y +=
    balao(
      null,
      [
        "· Açúcar cristal e farinha abaixo do mínimo",
        "· R$ 1.230 vencidos com Restaurante Sabor",
      ],
      y,
      false
    ) + 22;
  balao(null, ["Posso pagar o fornecedor hoje?"], y, true);

  // campo de entrada
  g.fillStyle = COR.cartao;
  retanguloRedondo(g, 132, 700, 1016, 64, 16);
  g.fill();
  g.strokeStyle = COR.linha;
  g.lineWidth = 1.4;
  g.stroke();
  texto(g, "Pergunte sobre os seus números…", 164, 733, { tam: 18, cor: COR.texto3 });
  const eg = g.createLinearGradient(1040, 712, 1132, 754);
  eg.addColorStop(0, "#059669");
  eg.addColorStop(1, COR.marca);
  g.fillStyle = eg;
  retanguloRedondo(g, 1044, 712, 88, 42, 12);
  g.fill();
}

/** Radar de alertas por severidade. */
function desenharRadar(g) {
  moldura(g, "Radar");

  const alertas = [
    ["crítico", "#f97362", "Título vencido", "Restaurante Sabor · R$ 1.230 há 3 dias"],
    ["atenção", "#f5b544", "Estoque no limite", "Açúcar cristal · 12 un. (mínimo 25)"],
    ["atenção", "#f5b544", "Cliente inativo", "Mercado Vila Nova · 68 dias sem comprar"],
    ["informação", COR.apoioClaro, "Meta do mês", "76% atingido faltando 9 dias"],
    ["positivo", COR.marcaClara, "Tendência de vendas", "+18,2% contra a semana anterior"],
  ];
  alertas.forEach((a, i) => {
    const y = 122 + i * 118;
    g.fillStyle = COR.cartao;
    retanguloRedondo(g, 132, y, 1016, 100, 18);
    g.fill();
    g.strokeStyle = COR.linha;
    g.lineWidth = 1.4;
    g.stroke();
    g.fillStyle = a[1];
    retanguloRedondo(g, 132, y, 6, 100, 3);
    g.fill();

    g.fillStyle = `${a[1]}22`;
    retanguloRedondo(g, 166, y + 32, 44, 40, 12);
    g.fill();
    g.fillStyle = a[1];
    g.beginPath();
    g.arc(188, y + 52, 8, 0, Math.PI * 2);
    g.fill();

    texto(g, a[2], 240, y + 42, { tam: 21, peso: 600 });
    texto(g, a[3], 240, y + 74, { tam: 17, cor: COR.texto2 });

    g.fillStyle = `${a[1]}1c`;
    retanguloRedondo(g, 1000, y + 34, 132, 34, 10);
    g.fill();
    texto(g, a[0], 1020, y + 51, { tam: 15, cor: a[1], peso: 700 });
  });
}

/* --------------------------------------------------------------- cache */

const DESENHOS = {
  painel: desenharPainel,
  financeiro: desenharFinanceiro,
  pdv: desenharPdv,
  estoque: desenharEstoque,
  agenda: desenharAgenda,
  assistente: desenharAssistente,
  radar: desenharRadar,
};

const cache = new Map();

/**
 * Devolve a textura da tela pedida, gerando-a na primeira chamada.
 * Cada tela é desenhada uma única vez por sessão, mesmo aparecendo em
 * várias cenas.
 */
export function texturaTela(nome) {
  if (cache.has(nome)) return cache.get(nome);
  const desenhar = DESENHOS[nome] || DESENHOS.painel;
  const [canvas, g] = ctx2d();
  desenhar(g);
  const t = new THREE.CanvasTexture(canvas);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  cache.set(nome, t);
  return t;
}

export const TELAS = Object.keys(DESENHOS);
export const PROPORCAO_TELA = L / A;

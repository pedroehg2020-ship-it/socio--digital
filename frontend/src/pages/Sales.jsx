import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import api, {
  apiError, formatBRL, formatBRLShort, formatDate, formatDayShort, todayISO,
} from "@/lib/api";
import Icon from "@/components/Icons";
import {
  Badge, Card, CardHead, Empty, Field, Kpi, Loading, Modal, Segmented,
  StatusBadge, Table, useToast,
} from "@/components/ui";

const PAGAMENTOS = [
  { value: "pix", label: "Pix", tone: "emerald", avista: true },
  { value: "dinheiro", label: "Dinheiro", tone: "emerald", avista: true },
  { value: "debito", label: "Débito", tone: "blue", avista: true },
  { value: "credito", label: "Crédito", tone: "violet", avista: false },
  { value: "boleto", label: "Boleto", tone: "amber", avista: false },
  { value: "prazo", label: "A prazo", tone: "rose", avista: false },
];

const CORES_PIZZA = ["#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#f43f5e", "#06b6d4"];

const rotuloPagamento = (v) =>
  PAGAMENTOS.find((p) => p.value === v)?.label || (v ? v : "Não informado");

/* ------------------------------------------------------------- nova venda */

function NovaVenda({ aberto, onClose, produtos, clientes, aoConcluir }) {
  const { push } = useToast();
  const [itens, setItens] = useState([{ product_id: "", quantity: 1, unit_price: "" }]);
  const [clienteId, setClienteId] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [pagamento, setPagamento] = useState("pix");
  const [parcelas, setParcelas] = useState(1);
  const [desconto, setDesconto] = useState("");
  const [emitirNota, setEmitirNota] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setItens([{ product_id: "", quantity: 1, unit_price: "" }]);
      setClienteId(""); setClienteNome(""); setPagamento("pix");
      setParcelas(1); setDesconto(""); setEmitirNota(false);
      setObservacao(""); setErro("");
    }
  }, [aberto]);

  const avista = PAGAMENTOS.find((p) => p.value === pagamento)?.avista;

  const precoDe = (id) => {
    const p = produtos.find((x) => x.id === id);
    return p ? Number(p.price || 0) : 0;
  };
  const estoqueDe = (id) => {
    const p = produtos.find((x) => x.id === id);
    return p ? Number(p.stock || 0) : null;
  };

  const total = useMemo(() => {
    const bruto = itens.reduce((acc, i) => {
      const preco = i.unit_price === "" ? precoDe(i.product_id) : Number(i.unit_price || 0);
      return acc + preco * Number(i.quantity || 0);
    }, 0);
    return Math.max(0, bruto - Number(desconto || 0));
  }, [itens, desconto, produtos]);

  const alterarItem = (idx, campo, valor) => {
    setItens((prev) => prev.map((i, n) => (n === idx ? { ...i, [campo]: valor } : i)));
  };

  const salvar = async () => {
    setErro("");
    const validos = itens.filter((i) => i.product_id && Number(i.quantity) > 0);
    if (!validos.length) {
      setErro("Escolha ao menos um produto e a quantidade.");
      return;
    }
    for (const i of validos) {
      const disp = estoqueDe(i.product_id);
      if (disp !== null && Number(i.quantity) > disp) {
        setErro(`Estoque insuficiente: há ${disp} unidade(s) disponível(is).`);
        return;
      }
    }
    setSalvando(true);
    try {
      const { data } = await api.post("/sales", {
        customer_id: clienteId || null,
        customer_name: clienteId
          ? clientes.find((c) => c.id === clienteId)?.name
          : clienteNome || "Consumidor final",
        items: validos.map((i) => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          unit_price: i.unit_price === "" ? undefined : Number(i.unit_price),
        })),
        payment_method: pagamento,
        installments: avista ? 1 : Number(parcelas || 1),
        discount: Number(desconto || 0),
        note: observacao || null,
        issue_invoice: emitirNota,
      });
      push(
        `Venda de ${formatBRL(data.total)} registrada${data.invoice ? ` — NF-e nº ${data.invoice.number} emitida` : ""}.`
      );
      onClose();
      aoConcluir();
    } catch (e) {
      setErro(apiError(e));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      open={aberto}
      title="Nova venda"
      icon="cart"
      onClose={onClose}
      width={700}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={salvando}>
            {salvando ? "Registrando…" : `Registrar ${formatBRL(total)}`}
          </button>
        </>
      }
    >
      {erro && <div className="form-error">{erro}</div>}

      <div className="grid g2" style={{ gap: 12 }}>
        <Field label="Cliente">
          <select className="select" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Consumidor final</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        {!clienteId && (
          <Field label="Nome no comprovante" hint="Opcional">
            <input
              className="input"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Consumidor final"
            />
          </Field>
        )}
      </div>

      <div className="mt8 mb12">
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>
          Itens
        </div>
        {itens.map((item, idx) => {
          const disp = estoqueDe(item.product_id);
          return (
            <div key={idx} className="row" style={{ gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <select
                className="select"
                style={{ flex: 2 }}
                value={item.product_id}
                onChange={(e) => alterarItem(idx, "product_id", e.target.value)}
              >
                <option value="">Selecione o produto…</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatBRL(p.price)} ({p.stock} un.)
                  </option>
                ))}
              </select>
              <input
                className="input"
                style={{ width: 76 }}
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => alterarItem(idx, "quantity", e.target.value)}
              />
              <input
                className="input"
                style={{ width: 118 }}
                type="number"
                step="0.01"
                placeholder={item.product_id ? String(precoDe(item.product_id)) : "Preço"}
                value={item.unit_price}
                onChange={(e) => alterarItem(idx, "unit_price", e.target.value)}
              />
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setItens((p) => p.filter((_, n) => n !== idx))}
                disabled={itens.length === 1}
                title="Remover item"
              >
                <Icon name="x" size={14} />
              </button>
              {disp !== null && Number(item.quantity) > disp && (
                <span className="badge badge-alert">só {disp}</span>
              )}
            </div>
          );
        })}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setItens((p) => [...p, { product_id: "", quantity: 1, unit_price: "" }])}
        >
          <Icon name="plus" size={14} /> Adicionar item
        </button>
      </div>

      <Field label="Forma de pagamento">
        <div className="row row-wrap" style={{ gap: 7 }}>
          {PAGAMENTOS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`btn btn-sm ${pagamento === p.value ? "btn-dark" : "btn-ghost"}`}
              onClick={() => setPagamento(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid g3" style={{ gap: 12 }}>
        {!avista && (
          <Field label="Parcelas">
            <select className="select" value={parcelas} onChange={(e) => setParcelas(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 10, 12].map((n) => (
                <option key={n} value={n}>{n}x</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Desconto (R$)">
          <input
            className="input"
            type="number"
            step="0.01"
            value={desconto}
            onChange={(e) => setDesconto(e.target.value)}
            placeholder="0,00"
          />
        </Field>
        <Field label="Observação">
          <input className="input" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </Field>
      </div>

      <label className="row" style={{ gap: 8, cursor: "pointer", marginTop: 4 }}>
        <input type="checkbox" checked={emitirNota} onChange={(e) => setEmitirNota(e.target.checked)} />
        <span className="small">Emitir nota fiscal (NF-e) junto com a venda</span>
      </label>

      <div className="tile tile-emerald mt16">
        <div className="t-label">Total da venda</div>
        <div className="t-value num">{formatBRL(total)}</div>
        <div className="t-foot">
          {avista
            ? "Entra no caixa hoje e baixa o estoque automaticamente."
            : `Gera ${parcelas} título(s) em contas a receber, com vencimento a cada 30 dias.`}
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ página */

export default function Sales() {
  const { push } = useToast();
  const [vendas, setVendas] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState("30");

  const carregar = () => {
    setCarregando(true);
    Promise.all([
      api.get("/sales"),
      api.get("/sales/summary"),
      api.get("/products"),
      api.get("/customers"),
    ])
      .then(([v, r, p, c]) => {
        setVendas(v.data);
        setResumo(r.data);
        setProdutos(p.data);
        setClientes(c.data);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  };

  useEffect(carregar, []);

  const filtradas = useMemo(() => {
    const dias = Number(periodo);
    const corte = new Date();
    corte.setDate(corte.getDate() - dias);
    const termo = busca.trim().toLowerCase();
    return vendas
      .filter((v) => new Date(v.sold_at) >= corte)
      .filter(
        (v) =>
          !termo ||
          String(v.product_name || "").toLowerCase().includes(termo) ||
          String(v.customer_name || "").toLowerCase().includes(termo)
      )
      .sort((a, b) => new Date(b.sold_at) - new Date(a.sold_at));
  }, [vendas, busca, periodo]);

  const serieDiaria = useMemo(() => {
    const mapa = {};
    filtradas.forEach((v) => {
      const dia = String(v.sold_at).slice(0, 10);
      const item = mapa[dia] || { dia, receita: 0, lucro: 0, pedidos: 0 };
      item.receita += Number(v.revenue || 0);
      item.lucro += Number(v.profit || 0);
      item.pedidos += 1;
      mapa[dia] = item;
    });
    return Object.keys(mapa)
      .sort()
      .map((k) => ({ ...mapa[k], receita: Math.round(mapa[k].receita * 100) / 100 }));
  }, [filtradas]);

  const cancelar = async (id) => {
    if (!window.confirm("Cancelar esta venda? O estoque volta e o título é estornado.")) return;
    try {
      await api.delete(`/sales/${id}`);
      push("Venda cancelada e estoque devolvido.");
      carregar();
    } catch (e) {
      push(apiError(e), "alert");
    }
  };

  if (carregando && !resumo) return <Loading />;

  return (
    <>
      <div className="page-head row row-wrap">
        <div>
          <h2>Vendas</h2>
          <p>Tudo começa aqui: registre o pedido e o resto do sistema se atualiza sozinho.</p>
        </div>
        <div className="spacer" />
        <button className="btn btn-primary btn-lg" onClick={() => setModal(true)}>
          <Icon name="plus" size={17} /> Nova venda
        </button>
      </div>

      {/* KPIs */}
      <div className="grid g5 mb16">
        <Kpi
          tone="emerald"
          icon="cart"
          label="Vendido hoje"
          value={formatBRLShort(resumo?.hoje)}
          foot={`${resumo?.pedidos_hoje || 0} pedido(s)`}
        />
        <Kpi
          tone="blue"
          icon="calendar"
          label="Faturamento do mês"
          value={formatBRLShort(resumo?.mes)}
          foot={`${resumo?.pedidos_mes || 0} pedidos no mês`}
        />
        <Kpi
          tone="violet"
          icon="trendUp"
          label="Lucro do mês"
          value={formatBRLShort(resumo?.lucro_mes)}
          foot={
            resumo?.mes
              ? `Margem de ${((resumo.lucro_mes / resumo.mes) * 100).toFixed(1)}%`
              : "—"
          }
        />
        <Kpi
          tone="amber"
          icon="target"
          label="Ticket médio"
          value={formatBRLShort(resumo?.ticket_medio)}
          foot="Por pedido no mês"
        />
        <Kpi
          tone="cyan"
          icon="box"
          label="Produtos ativos"
          value={produtos.length}
          foot={`${produtos.filter((p) => (p.stock || 0) <= (p.min_stock || 0)).length} no limite de estoque`}
        />
      </div>

      {/* gráficos */}
      <div className="grid g-2-1 mb16">
        <Card>
          <CardHead
            title="Receita e lucro por dia"
            subtitle={`Últimos ${periodo} dias`}
            icon="trendUp"
            iconClass="kpi-emerald"
            right={
              <Segmented
                value={periodo}
                onChange={setPeriodo}
                options={[
                  { value: "7", label: "7 dias" },
                  { value: "30", label: "30 dias" },
                  { value: "90", label: "90 dias" },
                ]}
              />
            }
          />
          <div className="card-pad" style={{ height: 288 }}>
            {serieDiaria.length === 0 ? (
              <Empty text="Sem vendas no período selecionado." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serieDiaria} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="gLucro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.42} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eaf0f8" vertical={false} />
                  <XAxis dataKey="dia" tickFormatter={formatDayShort} tick={{ fontSize: 11, fill: "#7b8798" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: "#7b8798" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v, n) => [formatBRL(v), n === "receita" ? "Receita" : "Lucro"]}
                    labelFormatter={(l) => formatDate(l)}
                    contentStyle={{ borderRadius: 10, border: "1px solid #dfe6f2", fontSize: 12.5 }}
                  />
                  <Area type="monotone" dataKey="receita" stroke="#059669" strokeWidth={2.2} fill="url(#gReceita)" />
                  <Area type="monotone" dataKey="lucro" stroke="#2563eb" strokeWidth={2} fill="url(#gLucro)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHead title="Formas de pagamento" subtitle="Últimos 30 dias" icon="wallet" iconClass="kpi-violet" />
          <div className="card-pad" style={{ height: 288 }}>
            {!resumo?.por_pagamento?.length ? (
              <Empty text="Sem dados de pagamento." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resumo.por_pagamento.map((p) => ({ ...p, nome: rotuloPagamento(p.metodo) }))}
                    dataKey="valor"
                    nameKey="nome"
                    innerRadius={54}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {resumo.por_pagamento.map((_, i) => (
                      <Cell key={i} fill={CORES_PIZZA[i % CORES_PIZZA.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatBRL(v)} contentStyle={{ borderRadius: 10, fontSize: 12.5 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* ranking */}
      <Card className="mb16">
        <CardHead title="Produtos mais vendidos" subtitle="Receita nos últimos 30 dias" icon="trendUp" iconClass="kpi-amber" />
        <div className="card-pad" style={{ height: 230 }}>
          {!resumo?.top_produtos?.length ? (
            <Empty text="Ainda não há ranking para o período." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resumo.top_produtos} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eaf0f8" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: "#7b8798" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="produto" width={168} tick={{ fontSize: 11.5, fill: "#4b5563" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatBRL(v)} contentStyle={{ borderRadius: 10, fontSize: 12.5 }} />
                <Bar dataKey="receita" radius={[0, 7, 7, 0]} barSize={19}>
                  {resumo.top_produtos.map((_, i) => (
                    <Cell key={i} fill={CORES_PIZZA[i % CORES_PIZZA.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* lista */}
      <Card>
        <CardHead
          title="Pedidos"
          subtitle={`${filtradas.length} venda(s) no período`}
          icon="doc"
          iconClass="kpi-blue"
          right={
            <div className="row" style={{ gap: 8 }}>
              <input
                className="input input-inline"
                placeholder="Buscar produto ou cliente…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <button className="btn btn-ghost btn-sm" onClick={carregar} title="Atualizar">
                <Icon name="refresh" size={15} />
              </button>
            </div>
          }
        />
        <Table
          columns={[
            { label: "Data" },
            { label: "Cliente" },
            { label: "Produto" },
            { label: "Qtd", align: "right" },
            { label: "Total", align: "right" },
            { label: "Lucro", align: "right" },
            { label: "Pagamento" },
            { label: "" },
          ]}
          rows={filtradas.slice(0, 60)}
          empty="Nenhuma venda no período. Clique em “Nova venda” para registrar a primeira."
          renderRow={(v) => (
            <tr key={v.id}>
              <td className="num">{formatDate(v.sold_at)}</td>
              <td>{v.customer_name || "Consumidor final"}</td>
              <td>{v.product_name}</td>
              <td className="right num">{v.quantity}</td>
              <td className="right num" style={{ fontWeight: 600 }}>{formatBRL(v.revenue)}</td>
              <td className="right num pos">{formatBRL(v.profit)}</td>
              <td><Badge tone="neutral">{rotuloPagamento(v.payment_method)}</Badge></td>
              <td className="right">
                <button className="btn btn-danger btn-sm" onClick={() => cancelar(v.id)}>
                  Cancelar
                </button>
              </td>
            </tr>
          )}
        />
      </Card>

      <NovaVenda
        aberto={modal}
        onClose={() => setModal(false)}
        produtos={produtos}
        clientes={clientes}
        aoConcluir={carregar}
      />
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import api, {
  apiError, daysUntil, formatBRL, formatBRLShort, formatDate, formatDayShort,
  monthLabel, todayISO,
} from "@/lib/api";
import Icon from "@/components/Icons";
import {
  Badge, Card, CardHead, Empty, Field, Kpi, Loading, Modal, Segmented,
  StatusBadge, Table, Tile, useToast,
} from "@/components/ui";

const ABAS = [
  { value: "receber", label: "Contas a receber" },
  { value: "pagar", label: "Contas a pagar" },
  { value: "caixa", label: "Fluxo de caixa" },
  { value: "dre", label: "DRE" },
];

const CATEGORIAS = [
  "aluguel", "folha", "fornecedores", "impostos", "utilidades",
  "servicos", "marketing", "manutencao", "outros",
];

const vencimentoBadge = (linha) => {
  if (linha.status === "pago") return <StatusBadge status="pago" />;
  const dias = daysUntil(linha.due_date);
  if (dias < 0) return <Badge tone="alert">Vencido há {Math.abs(dias)}d</Badge>;
  if (dias === 0) return <Badge tone="warn">Vence hoje</Badge>;
  if (dias <= 7) return <Badge tone="warn">Em {dias}d</Badge>;
  return <Badge tone="info">Em {dias}d</Badge>;
};

/* ------------------------------------------------------------------ modais */

function ModalRecebivel({ aberto, onClose, clientes, aoConcluir }) {
  const { push } = useToast();
  const [form, setForm] = useState({ description: "", amount: "", due_date: todayISO(), customer_id: "", method: "boleto" });
  const [erro, setErro] = useState("");

  const salvar = async () => {
    setErro("");
    if (!form.description || !form.amount) {
      setErro("Descrição e valor são obrigatórios.");
      return;
    }
    try {
      await api.post("/receivables", {
        description: form.description,
        amount: Number(form.amount),
        due_date: form.due_date,
        method: form.method,
        customer_id: form.customer_id || null,
        customer_name: clientes.find((c) => c.id === form.customer_id)?.name || null,
      });
      push("Título lançado em contas a receber.");
      onClose();
      aoConcluir();
    } catch (e) {
      setErro(apiError(e));
    }
  };

  return (
    <Modal
      open={aberto}
      title="Novo título a receber"
      icon="arrowDownLeft"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar}>Lançar título</button>
        </>
      }
    >
      {erro && <div className="form-error">{erro}</div>}
      <Field label="Descrição">
        <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
      <div className="grid g2" style={{ gap: 12 }}>
        <Field label="Valor (R$)">
          <input className="input" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </Field>
        <Field label="Vencimento">
          <input className="input" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        </Field>
      </div>
      <div className="grid g2" style={{ gap: 12 }}>
        <Field label="Cliente">
          <select className="select" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
            <option value="">Sem cliente vinculado</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Meio de cobrança">
          <select className="select" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            <option value="boleto">Boleto</option>
            <option value="pix">Pix</option>
            <option value="credito">Cartão de crédito</option>
            <option value="prazo">Acordo a prazo</option>
          </select>
        </Field>
      </div>
    </Modal>
  );
}

function ModalPagavel({ aberto, onClose, aoConcluir }) {
  const { push } = useToast();
  const [form, setForm] = useState({ supplier: "", category: "fornecedores", amount: "", due_date: todayISO(), recurring: false });
  const [erro, setErro] = useState("");

  const salvar = async () => {
    setErro("");
    if (!form.supplier || !form.amount) {
      setErro("Fornecedor e valor são obrigatórios.");
      return;
    }
    try {
      await api.post("/payables", {
        supplier: form.supplier,
        category: form.category,
        description: form.supplier,
        amount: Number(form.amount),
        due_date: form.due_date,
        recurring: form.recurring,
      });
      push("Conta lançada em contas a pagar.");
      onClose();
      aoConcluir();
    } catch (e) {
      setErro(apiError(e));
    }
  };

  return (
    <Modal
      open={aberto}
      title="Nova conta a pagar"
      icon="arrowUpRight"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar}>Lançar conta</button>
        </>
      }
    >
      {erro && <div className="form-error">{erro}</div>}
      <Field label="Fornecedor / descrição">
        <input className="input" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
      </Field>
      <div className="grid g3" style={{ gap: 12 }}>
        <Field label="Categoria">
          <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Valor (R$)">
          <input className="input" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </Field>
        <Field label="Vencimento">
          <input className="input" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        </Field>
      </div>
      <label className="row" style={{ gap: 8, cursor: "pointer" }}>
        <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} />
        <span className="small">Despesa fixa (se repete todo mês)</span>
      </label>
    </Modal>
  );
}

/* ------------------------------------------------------------------ página */

export default function Finance() {
  const { push } = useToast();
  const [aba, setAba] = useState("receber");
  const [receber, setReceber] = useState([]);
  const [pagar, setPagar] = useState([]);
  const [caixa, setCaixa] = useState(null);
  const [dre, setDre] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalR, setModalR] = useState(false);
  const [modalP, setModalP] = useState(false);
  const [filtro, setFiltro] = useState("todos");

  const carregar = () => {
    setCarregando(true);
    Promise.all([
      api.get("/receivables"),
      api.get("/payables"),
      api.get("/cashflow", { params: { days: 90 } }),
      api.get("/reports/dre", { params: { months: 6 } }),
      api.get("/customers"),
    ])
      .then(([r, p, c, d, cl]) => {
        setReceber(r.data);
        setPagar(p.data);
        setCaixa(c.data);
        setDre(d.data.linhas || []);
        setClientes(cl.data);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  };

  useEffect(carregar, []);

  const baixar = async (tipo, id) => {
    try {
      await api.post(`/${tipo}/${id}/settle`, {});
      push(tipo === "receivables" ? "Recebimento registrado no caixa." : "Pagamento registrado no caixa.");
      carregar();
    } catch (e) {
      push(apiError(e), "alert");
    }
  };

  const aplicarFiltro = (linhas) =>
    filtro === "todos" ? linhas : linhas.filter((l) => l.status === filtro);

  const totaisDre = useMemo(() => {
    const ultimo = dre[dre.length - 1];
    return ultimo || null;
  }, [dre]);

  if (carregando && !caixa) return <Loading />;

  return (
    <>
      <div className="page-head row row-wrap">
        <div>
          <h2>Financeiro</h2>
          <p>Quem te deve, o que você deve e como o caixa fica nos próximos 90 dias.</p>
        </div>
        <div className="spacer" />
        <button className="btn btn-ghost" onClick={() => setModalR(true)}>
          <Icon name="arrowDownLeft" size={16} /> A receber
        </button>
        <button className="btn btn-blue" onClick={() => setModalP(true)}>
          <Icon name="arrowUpRight" size={16} /> A pagar
        </button>
      </div>

      <div className="grid g4 mb16">
        <Kpi
          tone="emerald"
          icon="bank"
          label="Saldo em caixa"
          value={formatBRLShort(caixa?.saldo_atual)}
          foot="Movimentações já realizadas"
        />
        <Kpi
          tone="blue"
          icon="arrowDownLeft"
          label="A receber"
          value={formatBRLShort(caixa?.a_receber)}
          foot={
            caixa?.vencidos_receber
              ? `${formatBRLShort(caixa.vencidos_receber)} em atraso`
              : "Nenhum título vencido"
          }
        />
        <Kpi
          tone="rose"
          icon="arrowUpRight"
          label="A pagar"
          value={formatBRLShort(caixa?.a_pagar)}
          foot={
            caixa?.vencidos_pagar
              ? `${formatBRLShort(caixa.vencidos_pagar)} em atraso`
              : "Nenhuma conta vencida"
          }
        />
        <Kpi
          tone={caixa && caixa.saldo_projetado < 0 ? "amber" : "violet"}
          icon="trendUp"
          label="Saldo projetado (90d)"
          value={formatBRLShort(caixa?.saldo_projetado)}
          foot={
            caixa?.primeiro_dia_negativo
              ? `Fica negativo em ${formatDate(caixa.primeiro_dia_negativo)}`
              : "Não fica negativo no período"
          }
        />
      </div>

      <div className="mb16">
        <Segmented value={aba} onChange={setAba} options={ABAS} />
      </div>

      {/* -------------------------------------------------------- receber */}
      {aba === "receber" && (
        <Card>
          <CardHead
            title="Contas a receber"
            subtitle={`${aplicarFiltro(receber).length} título(s)`}
            icon="arrowDownLeft"
            iconClass="kpi-emerald"
            right={
              <Segmented
                value={filtro}
                onChange={setFiltro}
                options={[
                  { value: "todos", label: "Todos" },
                  { value: "aberto", label: "Em aberto" },
                  { value: "vencido", label: "Vencidos" },
                  { value: "pago", label: "Pagos" },
                ]}
              />
            }
          />
          <Table
            columns={[
              { label: "Vencimento" },
              { label: "Cliente" },
              { label: "Descrição" },
              { label: "Meio" },
              { label: "Valor", align: "right" },
              { label: "Situação" },
              { label: "" },
            ]}
            rows={aplicarFiltro(receber)}
            empty="Nenhum título a receber."
            renderRow={(r) => (
              <tr key={r.id}>
                <td className="num">{formatDate(r.due_date)}</td>
                <td>{r.customer_name || "—"}</td>
                <td>{r.description}</td>
                <td><Badge tone="neutral">{r.method || "—"}</Badge></td>
                <td className="right num" style={{ fontWeight: 600 }}>{formatBRL(r.amount)}</td>
                <td>{vencimentoBadge(r)}</td>
                <td className="right">
                  {r.status !== "pago" && r.status !== "cancelado" && (
                    <button className="btn btn-primary btn-sm" onClick={() => baixar("receivables", r.id)}>
                      <Icon name="check" size={14} /> Recebi
                    </button>
                  )}
                </td>
              </tr>
            )}
          />
        </Card>
      )}

      {/* ---------------------------------------------------------- pagar */}
      {aba === "pagar" && (
        <Card>
          <CardHead
            title="Contas a pagar"
            subtitle={`${aplicarFiltro(pagar).length} conta(s)`}
            icon="arrowUpRight"
            iconClass="kpi-rose"
            right={
              <Segmented
                value={filtro}
                onChange={setFiltro}
                options={[
                  { value: "todos", label: "Todas" },
                  { value: "aberto", label: "Em aberto" },
                  { value: "vencido", label: "Vencidas" },
                  { value: "pago", label: "Pagas" },
                ]}
              />
            }
          />
          <Table
            columns={[
              { label: "Vencimento" },
              { label: "Fornecedor" },
              { label: "Categoria" },
              { label: "Tipo" },
              { label: "Valor", align: "right" },
              { label: "Situação" },
              { label: "" },
            ]}
            rows={aplicarFiltro(pagar)}
            empty="Nenhuma conta a pagar."
            renderRow={(p) => (
              <tr key={p.id}>
                <td className="num">{formatDate(p.due_date)}</td>
                <td>{p.supplier}</td>
                <td><Badge tone="neutral">{p.category}</Badge></td>
                <td>{p.recurring ? <Badge tone="violet">Fixa</Badge> : <Badge tone="info">Variável</Badge>}</td>
                <td className="right num" style={{ fontWeight: 600 }}>{formatBRL(p.amount)}</td>
                <td>{vencimentoBadge(p)}</td>
                <td className="right">
                  {p.status !== "pago" && (
                    <button className="btn btn-blue btn-sm" onClick={() => baixar("payables", p.id)}>
                      <Icon name="check" size={14} /> Paguei
                    </button>
                  )}
                </td>
              </tr>
            )}
          />
        </Card>
      )}

      {/* ---------------------------------------------------------- caixa */}
      {aba === "caixa" && (
        <>
          <Card className="mb16">
            <CardHead
              title="Saldo projetado"
              subtitle="Considera títulos em aberto e contas a vencer nos próximos 90 dias"
              icon="bank"
              iconClass="kpi-violet"
            />
            <div className="card-pad" style={{ height: 300 }}>
              {!caixa?.serie?.length ? (
                <Empty text="Sem movimentações futuras lançadas." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={caixa.serie} margin={{ top: 6, right: 10, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gSaldo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eaf0f8" vertical={false} />
                    <XAxis dataKey="dia" tickFormatter={formatDayShort} tick={{ fontSize: 11, fill: "#7b8798" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: "#7b8798" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v, n) => [formatBRL(v), n === "saldo" ? "Saldo" : n === "entradas" ? "Entradas" : "Saídas"]}
                      labelFormatter={(l) => formatDate(l)}
                      contentStyle={{ borderRadius: 10, fontSize: 12.5 }}
                    />
                    <Area type="monotone" dataKey="saldo" stroke="#7c3aed" strokeWidth={2.4} fill="url(#gSaldo)" />
                    <Line type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={1.6} dot={false} />
                    <Line type="monotone" dataKey="saidas" stroke="#f43f5e" strokeWidth={1.6} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <div className="grid g3 mb16">
            <Tile tone="emerald" label="Entradas previstas" value={formatBRL(caixa?.a_receber)} foot="Títulos em aberto e vencidos" />
            <Tile tone="rose" label="Saídas previstas" value={formatBRL(caixa?.a_pagar)} foot="Contas a vencer no período" />
            <Tile
              tone={caixa && caixa.saldo_projetado < 0 ? "amber" : "blue"}
              label="Resultado do período"
              value={formatBRL((caixa?.a_receber || 0) - (caixa?.a_pagar || 0))}
              foot={caixa?.primeiro_dia_negativo ? `Atenção: caixa negativo em ${formatDate(caixa.primeiro_dia_negativo)}` : "Caixa segue positivo"}
            />
          </div>

          <Card>
            <CardHead title="Agenda dos próximos vencimentos" icon="calendar" iconClass="kpi-blue" />
            <Table
              columns={[
                { label: "Dia" },
                { label: "Entradas", align: "right" },
                { label: "Saídas", align: "right" },
                { label: "Líquido", align: "right" },
                { label: "Saldo acumulado", align: "right" },
              ]}
              rows={(caixa?.serie || []).slice(0, 20)}
              empty="Sem vencimentos futuros."
              renderRow={(s) => (
                <tr key={s.dia}>
                  <td className="num">{formatDate(s.dia)}</td>
                  <td className="right num pos">{s.entradas ? formatBRL(s.entradas) : "—"}</td>
                  <td className="right num neg">{s.saidas ? formatBRL(s.saidas) : "—"}</td>
                  <td className={`right num ${s.liquido >= 0 ? "pos" : "neg"}`}>{formatBRL(s.liquido)}</td>
                  <td className={`right num ${s.saldo >= 0 ? "" : "neg"}`} style={{ fontWeight: 600 }}>{formatBRL(s.saldo)}</td>
                </tr>
              )}
            />
          </Card>
        </>
      )}

      {/* ------------------------------------------------------------ DRE */}
      {aba === "dre" && (
        <>
          {totaisDre && (
            <div className="grid g4 mb16">
              <Tile tone="blue" label="Receita bruta (mês atual)" value={formatBRL(totaisDre.receita_bruta)} />
              <Tile tone="amber" label="Custo da mercadoria" value={formatBRL(totaisDre.custo_mercadoria)} foot={`Margem bruta de ${totaisDre.margem_bruta}%`} />
              <Tile tone="rose" label="Despesas" value={formatBRL(totaisDre.despesas_fixas + totaisDre.despesas_variaveis)} foot="Fixas + variáveis" />
              <Tile
                tone={totaisDre.lucro_liquido >= 0 ? "emerald" : "rose"}
                label="Lucro líquido"
                value={formatBRL(totaisDre.lucro_liquido)}
                foot={`Margem líquida de ${totaisDre.margem_liquida}%`}
              />
            </div>
          )}

          <Card className="mb16">
            <CardHead title="Resultado mês a mês" subtitle="Últimos 6 meses" icon="doc" iconClass="kpi-midnight" />
            <div className="card-pad" style={{ height: 292 }}>
              {!dre.length ? (
                <Empty text="Sem dados suficientes para o DRE." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dre} margin={{ top: 6, right: 10, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eaf0f8" vertical={false} />
                    <XAxis dataKey="mes" tickFormatter={monthLabel} tick={{ fontSize: 11, fill: "#7b8798" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: "#7b8798" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => formatBRL(v)} labelFormatter={monthLabel} contentStyle={{ borderRadius: 10, fontSize: 12.5 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar name="Receita" dataKey="receita_bruta" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar name="Custo" dataKey="custo_mercadoria" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar name="Lucro líquido" dataKey="lucro_liquido" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card>
            <CardHead title="Demonstrativo de resultado" icon="doc" iconClass="kpi-blue" />
            <Table
              columns={[
                { label: "Mês" },
                { label: "Receita bruta", align: "right" },
                { label: "Custo mercadoria", align: "right" },
                { label: "Lucro bruto", align: "right" },
                { label: "Desp. fixas", align: "right" },
                { label: "Desp. variáveis", align: "right" },
                { label: "Lucro líquido", align: "right" },
                { label: "Margem", align: "right" },
              ]}
              rows={[...dre].reverse()}
              empty="Sem dados."
              renderRow={(l) => (
                <tr key={l.mes}>
                  <td style={{ fontWeight: 600 }}>{monthLabel(l.mes)}</td>
                  <td className="right num">{formatBRL(l.receita_bruta)}</td>
                  <td className="right num">{formatBRL(l.custo_mercadoria)}</td>
                  <td className="right num">{formatBRL(l.lucro_bruto)}</td>
                  <td className="right num">{formatBRL(l.despesas_fixas)}</td>
                  <td className="right num">{formatBRL(l.despesas_variaveis)}</td>
                  <td className={`right num ${l.lucro_liquido >= 0 ? "pos" : "neg"}`}>{formatBRL(l.lucro_liquido)}</td>
                  <td className="right num">{l.margem_liquida}%</td>
                </tr>
              )}
            />
          </Card>
        </>
      )}

      <ModalRecebivel aberto={modalR} onClose={() => setModalR(false)} clientes={clientes} aoConcluir={carregar} />
      <ModalPagavel aberto={modalP} onClose={() => setModalP(false)} aoConcluir={carregar} />
    </>
  );
}

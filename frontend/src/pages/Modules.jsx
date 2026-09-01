import { useEffect, useMemo, useState } from "react";
import api, {
  apiError, formatBRL, formatBRLShort, formatDate, lista, todayISO,
} from "@/lib/api";
import Icon from "@/components/Icons";
import {
  Badge, Card, CardHead, Empty, Field, Kpi, Loading, Modal, Segmented,
  StatusBadge, Table, Tile, useToast,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

/* ========================================================== ESTOQUE ====== */

export function Inventory() {
  const { push } = useToast();
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [form, setForm] = useState({ name: "", price: "", cost: "", stock: "", min_stock: "" });

  const carregar = () => {
    setCarregando(true);
    api.get("/products")
      .then((r) => setProdutos(lista(r)))
      .catch(() => {})
      .finally(() => setCarregando(false));
  };

  useEffect(carregar, []);

  const abrirNovo = () => {
    setEditando(null);
    setForm({ name: "", price: "", cost: "", stock: "", min_stock: "" });
    setModal(true);
  };

  const abrirEdicao = (p) => {
    setEditando(p);
    setForm({
      name: p.name || "", price: p.price ?? "", cost: p.cost ?? "",
      stock: p.stock ?? "", min_stock: p.min_stock ?? "",
    });
    setModal(true);
  };

  const salvar = async () => {
    const payload = {
      name: form.name,
      price: Number(form.price || 0),
      cost: Number(form.cost || 0),
      stock: Number(form.stock || 0),
      min_stock: Number(form.min_stock || 0),
    };
    try {
      if (editando) await api.patch(`/products/${editando.id}`, payload);
      else await api.post("/products", payload);
      push(editando ? "Produto atualizado." : "Produto cadastrado.");
      setModal(false);
      carregar();
    } catch (e) {
      push(apiError(e), "alert");
    }
  };

  const excluir = async (p) => {
    if (!window.confirm(`Excluir "${p.name}" do catálogo?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      push("Produto excluído.");
      carregar();
    } catch (e) {
      push(apiError(e), "alert");
    }
  };

  const listados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos
      .filter((p) => !termo || String(p.name).toLowerCase().includes(termo))
      .filter((p) => {
        if (filtro === "baixo") return (p.stock || 0) <= (p.min_stock || 0);
        if (filtro === "parado") return String(p.status) === "excesso";
        return true;
      });
  }, [produtos, busca, filtro]);

  const valorEstoque = produtos.reduce(
    (a, p) => a + Number(p.cost || 0) * Number(p.stock || 0), 0
  );
  const baixos = produtos.filter((p) => (p.stock || 0) <= (p.min_stock || 0)).length;
  const margemMedia = produtos.length
    ? produtos.reduce((a, p) => {
        const preco = Number(p.price || 0);
        return a + (preco ? ((preco - Number(p.cost || 0)) / preco) * 100 : 0);
      }, 0) / produtos.length
    : 0;

  if (carregando) return <Loading />;

  return (
    <>
      <div className="page-head row row-wrap">
        <div>
          <h2>Estoque</h2>
          <p>Saldo, custo e ponto de reposição de cada produto.</p>
        </div>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={abrirNovo}>
          <Icon name="plus" size={16} /> Novo produto
        </button>
      </div>

      <div className="grid g4 mb16">
        <Kpi tone="cyan" icon="box" label="Produtos no catálogo" value={produtos.length} foot="Itens cadastrados" />
        <Kpi tone="emerald" icon="bank" label="Valor em estoque" value={formatBRLShort(valorEstoque)} foot="Avaliado pelo custo" />
        <Kpi tone="amber" icon="alert" label="No ponto de reposição" value={baixos} foot="Precisam de compra" />
        <Kpi tone="violet" icon="trendUp" label="Margem média" value={`${margemMedia.toFixed(1)}%`} foot="Preço x custo" />
      </div>

      <Card>
        <CardHead
          title="Catálogo"
          subtitle={`${listados.length} produto(s)`}
          icon="box"
          iconClass="kpi-cyan"
          right={
            <div className="row" style={{ gap: 8 }}>
              <input className="input input-inline" placeholder="Buscar produto…" value={busca} onChange={(e) => setBusca(e.target.value)} />
              <Segmented
                value={filtro}
                onChange={setFiltro}
                options={[
                  { value: "todos", label: "Todos" },
                  { value: "baixo", label: "Repor" },
                  { value: "parado", label: "Parados" },
                ]}
              />
            </div>
          }
        />
        <Table
          columns={[
            { label: "Produto" },
            { label: "Preço", align: "right" },
            { label: "Custo", align: "right" },
            { label: "Margem", align: "right" },
            { label: "Estoque", align: "right" },
            { label: "Situação" },
            { label: "Sugestão da IA" },
            { label: "" },
          ]}
          rows={listados}
          empty="Nenhum produto encontrado."
          renderRow={(p) => {
            const preco = Number(p.price || 0);
            const margem = preco ? ((preco - Number(p.cost || 0)) / preco) * 100 : 0;
            const baixo = (p.stock || 0) <= (p.min_stock || 0);
            return (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.name}</td>
                <td className="right num">{formatBRL(p.price)}</td>
                <td className="right num muted">{formatBRL(p.cost)}</td>
                <td className="right num">{margem.toFixed(1)}%</td>
                <td className="right num">
                  <span className={baixo ? "neg" : ""}>{p.stock}</span>
                  <span className="muted small"> / {p.min_stock}</span>
                </td>
                <td>{baixo ? <Badge tone="alert">Repor</Badge> : <StatusBadge status={p.status || "ativo"} />}</td>
                <td className="small muted" style={{ maxWidth: 240 }}>{p.ai_suggestion || "—"}</td>
                <td className="right">
                  <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => abrirEdicao(p)}>Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => excluir(p)}>
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          }}
        />
      </Card>

      <Modal
        open={modal}
        title={editando ? "Editar produto" : "Novo produto"}
        icon="box"
        onClose={() => setModal(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={salvar}>Salvar</button>
          </>
        }
      >
        <Field label="Nome do produto">
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid g2" style={{ gap: 12 }}>
          <Field label="Preço de venda (R$)">
            <input className="input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </Field>
          <Field label="Custo (R$)">
            <input className="input" type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </Field>
        </div>
        <div className="grid g2" style={{ gap: 12 }}>
          <Field label="Estoque atual">
            <input className="input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </Field>
          <Field label="Estoque mínimo" hint="Abaixo disso o radar avisa.">
            <input className="input" type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </>
  );
}

/* ========================================================= CLIENTES ====== */

export function Customers() {
  const { push } = useToast();
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState({ name: "", email: "", city: "", document: "", phone: "" });

  const carregar = () => {
    setCarregando(true);
    api.get("/customers")
      .then((r) => setClientes(lista(r)))
      .catch(() => {})
      .finally(() => setCarregando(false));
  };

  useEffect(carregar, []);

  const salvar = async () => {
    if (!form.name) {
      push("Informe o nome do cliente.", "alert");
      return;
    }
    try {
      await api.post("/customers", form);
      push("Cliente cadastrado.");
      setModal(false);
      setForm({ name: "", email: "", city: "", document: "", phone: "" });
      carregar();
    } catch (e) {
      push(apiError(e), "alert");
    }
  };

  const listados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return clientes.filter(
      (c) => !termo || String(c.name).toLowerCase().includes(termo) || String(c.city || "").toLowerCase().includes(termo)
    );
  }, [clientes, busca]);

  const inativos = clientes.filter((c) => (c.days_since_purchase || 0) > 60);
  const ltv = clientes.reduce((a, c) => a + Number(c.lifetime_value || 0), 0);

  if (carregando) return <Loading />;

  return (
    <>
      <div className="page-head row row-wrap">
        <div>
          <h2>Clientes</h2>
          <p>Quem compra, quanto já comprou e quem parou de aparecer.</p>
        </div>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Icon name="plus" size={16} /> Novo cliente
        </button>
      </div>

      <div className="grid g4 mb16">
        <Kpi tone="blue" icon="users" label="Clientes na carteira" value={clientes.length} foot="Cadastros ativos" />
        <Kpi tone="emerald" icon="bank" label="Valor acumulado" value={formatBRLShort(ltv)} foot="Soma do histórico de compras" />
        <Kpi tone="amber" icon="clock" label="Inativos há 60+ dias" value={inativos.length} foot="Merecem contato" />
        <Kpi
          tone="violet"
          icon="target"
          label="Valor médio por cliente"
          value={formatBRLShort(clientes.length ? ltv / clientes.length : 0)}
          foot="Média da carteira"
        />
      </div>

      {inativos.length > 0 && (
        <Card className="mb16">
          <CardHead title="Radar de clientes" subtitle="Bons clientes que sumiram" icon="radar" iconClass="kpi-amber" />
          <div className="card-pad grid g3" style={{ gap: 10 }}>
            {inativos.slice(0, 6).map((c) => (
              <div key={c.id} className="tile tile-amber">
                <div className="t-label">{c.name}</div>
                <div className="t-value num">{formatBRL(c.lifetime_value)}</div>
                <div className="t-foot">Sem comprar há {c.days_since_purchase} dias</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHead
          title="Carteira"
          subtitle={`${listados.length} cliente(s)`}
          icon="users"
          iconClass="kpi-blue"
          right={
            <input className="input input-inline" placeholder="Buscar cliente ou cidade…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          }
        />
        <Table
          columns={[
            { label: "Cliente" },
            { label: "Cidade" },
            { label: "Contato" },
            { label: "Última compra" },
            { label: "Valor acumulado", align: "right" },
            { label: "Situação" },
            { label: "Sugestão da IA" },
          ]}
          rows={listados}
          empty="Nenhum cliente encontrado."
          renderRow={(c) => (
            <tr key={c.id}>
              <td style={{ fontWeight: 500 }}>{c.name}</td>
              <td>{c.city || "—"}</td>
              <td className="small muted">{c.email || c.phone || "—"}</td>
              <td className="num">{c.last_purchase ? formatDate(c.last_purchase) : "—"}</td>
              <td className="right num" style={{ fontWeight: 600 }}>{formatBRL(c.lifetime_value)}</td>
              <td>
                {(c.days_since_purchase || 0) > 60
                  ? <Badge tone="warn">Inativo {c.days_since_purchase}d</Badge>
                  : <StatusBadge status={c.status || "ativo"} />}
              </td>
              <td className="small muted" style={{ maxWidth: 230 }}>{c.ai_suggestion || "—"}</td>
            </tr>
          )}
        />
      </Card>

      <Modal
        open={modal}
        title="Novo cliente"
        icon="users"
        onClose={() => setModal(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={salvar}>Cadastrar</button>
          </>
        }
      >
        <Field label="Nome">
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid g2" style={{ gap: 12 }}>
          <Field label="CPF / CNPJ">
            <input className="input" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
          </Field>
          <Field label="Telefone">
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
        </div>
        <div className="grid g2" style={{ gap: 12 }}>
          <Field label="E-mail">
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Cidade">
            <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </>
  );
}

/* ==================================================== NOTAS FISCAIS ====== */

export function Invoices() {
  const { push } = useToast();
  const [notas, setNotas] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ sale_id: "", customer_name: "", amount: "", kind: "NFe" });

  const carregar = () => {
    setCarregando(true);
    Promise.all([api.get("/invoices"), api.get("/sales")])
      .then(([n, v]) => {
        setNotas(lista(n));
        setVendas(v.data.slice(0, 40));
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  };

  useEffect(carregar, []);

  const emitir = async () => {
    try {
      await api.post("/invoices", {
        sale_id: form.sale_id || null,
        customer_name: form.customer_name || null,
        amount: form.amount === "" ? null : Number(form.amount),
        kind: form.kind,
      });
      push("Nota emitida com sucesso.");
      setModal(false);
      setForm({ sale_id: "", customer_name: "", amount: "", kind: "NFe" });
      carregar();
    } catch (e) {
      push(apiError(e), "alert");
    }
  };

  const cancelar = async (n) => {
    if (!window.confirm(`Cancelar a nota nº ${n.number}?`)) return;
    try {
      await api.post(`/invoices/${n.id}/cancel`);
      push("Nota cancelada.");
      carregar();
    } catch (e) {
      push(apiError(e), "alert");
    }
  };

  const autorizadas = notas.filter((n) => n.status === "autorizada");
  const total = autorizadas.reduce((a, n) => a + Number(n.amount || 0), 0);

  if (carregando) return <Loading />;

  return (
    <>
      <div className="page-head row row-wrap">
        <div>
          <h2>Notas fiscais</h2>
          <p>Emissão e histórico de NF-e e NFS-e, prontos para o contador.</p>
        </div>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Icon name="plus" size={16} /> Emitir nota
        </button>
      </div>

      <div className="grid g4 mb16">
        <Kpi tone="amber" icon="invoice" label="Notas autorizadas" value={autorizadas.length} foot="No histórico" />
        <Kpi tone="emerald" icon="bank" label="Valor total emitido" value={formatBRLShort(total)} foot="Somente autorizadas" />
        <Kpi tone="rose" icon="x" label="Canceladas" value={notas.filter((n) => n.status === "cancelada").length} foot="Fora do faturamento" />
        <Kpi
          tone="blue"
          icon="doc"
          label="Próximo número"
          value={(notas.reduce((m, n) => Math.max(m, n.number || 0), 0) + 1)}
          foot="Série 1"
        />
      </div>

      <div className="alert-item alert-info mb16">
        <span className="ai-icon"><Icon name="shield" size={15} /></span>
        <div>
          <b>Emissão em modo simulado</b>
          <p>
            A numeração, a chave de acesso e o histórico já funcionam. Para transmitir à SEFAZ
            basta plugar um emissor (certificado A1 e credenciais) — o restante do fluxo permanece igual.
          </p>
        </div>
      </div>

      <Card>
        <CardHead title="Histórico de notas" subtitle={`${notas.length} documento(s)`} icon="invoice" iconClass="kpi-amber" />
        <Table
          columns={[
            { label: "Número" },
            { label: "Tipo" },
            { label: "Emissão" },
            { label: "Destinatário" },
            { label: "Chave de acesso" },
            { label: "Valor", align: "right" },
            { label: "Situação" },
            { label: "" },
          ]}
          rows={notas}
          empty="Nenhuma nota emitida ainda."
          renderRow={(n) => (
            <tr key={n.id}>
              <td className="num" style={{ fontWeight: 600 }}>{n.number}</td>
              <td><Badge tone="info">{n.kind}</Badge></td>
              <td className="num">{formatDate(n.issued_at)}</td>
              <td>{n.customer_name || "—"}</td>
              <td className="num small muted" style={{ maxWidth: 190, overflow: "hidden", textOverflow: "ellipsis" }}>
                {n.access_key}
              </td>
              <td className="right num" style={{ fontWeight: 600 }}>{formatBRL(n.amount)}</td>
              <td><StatusBadge status={n.status} /></td>
              <td className="right">
                {n.status === "autorizada" && (
                  <button className="btn btn-danger btn-sm" onClick={() => cancelar(n)}>Cancelar</button>
                )}
              </td>
            </tr>
          )}
        />
      </Card>

      <Modal
        open={modal}
        title="Emitir nota fiscal"
        icon="invoice"
        onClose={() => setModal(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={emitir}>Emitir</button>
          </>
        }
      >
        <Field label="Tipo de documento">
          <select className="select" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="NFe">NF-e — venda de mercadoria</option>
            <option value="NFSe">NFS-e — prestação de serviço</option>
          </select>
        </Field>
        <Field label="Vincular a uma venda" hint="Opcional — preenche destinatário e valor.">
          <select
            className="select"
            value={form.sale_id}
            onChange={(e) => {
              const v = vendas.find((s) => s.id === e.target.value);
              setForm({
                ...form,
                sale_id: e.target.value,
                customer_name: v ? v.customer_name : form.customer_name,
                amount: v ? v.revenue : form.amount,
              });
            }}
          >
            <option value="">Nota avulsa</option>
            {vendas.map((v) => (
              <option key={v.id} value={v.id}>
                {formatDate(v.sold_at)} — {v.product_name} — {formatBRL(v.revenue)}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid g2" style={{ gap: 12 }}>
          <Field label="Destinatário">
            <input className="input" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Consumidor final" />
          </Field>
          <Field label="Valor (R$)">
            <input className="input" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </>
  );
}

/* =================================================== CONFIGURAÇÕES ====== */

export function Settings() {
  const { user, setUser } = useAuth();
  const { push } = useToast();
  const [form, setForm] = useState({ name: "", company_name: "", segment: "", whatsapp: "" });
  const [prefs, setPrefs] = useState({ enabled: true, immediate: true, daily_summary: true, categories: [] });
  const [integracoes, setIntegracoes] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "", company_name: user.company_name || "",
        segment: user.segment || "", whatsapp: user.whatsapp || "",
      });
      if (user.whatsapp_prefs) setPrefs(user.whatsapp_prefs);
    }
  }, [user]);

  useEffect(() => {
    api.get("/integrations/status").then((r) => setIntegracoes(r.data)).catch(() => {});
  }, []);

  const salvar = async () => {
    setSalvando(true);
    try {
      const { data } = await api.patch("/profile", { ...form, whatsapp_prefs: prefs });
      setUser(data);
      push("Configurações salvas.");
    } catch (e) {
      push(apiError(e), "alert");
    } finally {
      setSalvando(false);
    }
  };

  const testarWhatsapp = async () => {
    try {
      await api.post("/whatsapp/test");
      push("Mensagem de teste enviada (ou registrada no log em modo simulado).");
    } catch (e) {
      push(apiError(e), "alert");
    }
  };

  const alternarCategoria = (cat) => {
    setPrefs((p) => ({
      ...p,
      categories: p.categories?.includes(cat)
        ? p.categories.filter((c) => c !== cat)
        : [...(p.categories || []), cat],
    }));
  };

  return (
    <>
      <div className="page-head">
        <h2>Configurações</h2>
        <p>Dados da empresa, avisos automáticos e integrações.</p>
      </div>

      <div className="grid g2">
        <Card>
          <CardHead title="Empresa" subtitle="Aparece nos documentos e nas respostas da IA" icon="bank" iconClass="kpi-blue" />
          <div className="card-pad">
            <Field label="Seu nome">
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Nome da empresa">
              <input className="input" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            </Field>
            <div className="grid g2" style={{ gap: 12 }}>
              <Field label="Segmento">
                <select className="select" value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })}>
                  <option>Comércio</option>
                  <option>Serviços</option>
                  <option>Indústria</option>
                  <option>Alimentação</option>
                  <option>Outro</option>
                </select>
              </Field>
              <Field label="WhatsApp">
                <input className="input" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(51) 90000-0000" />
              </Field>
            </div>
            <button className="btn btn-primary" onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>
        </Card>

        <div className="grid" style={{ gap: 15, alignContent: "start" }}>
          <Card>
            <CardHead title="Avisos automáticos" subtitle="O que o radar manda no seu WhatsApp" icon="whatsapp" iconClass="kpi-emerald" />
            <div className="card-pad">
              <label className="row mb12" style={{ gap: 9, cursor: "pointer" }}>
                <input type="checkbox" checked={!!prefs.enabled} onChange={(e) => setPrefs({ ...prefs, enabled: e.target.checked })} />
                <span className="small">Receber avisos no WhatsApp</span>
              </label>
              <label className="row mb12" style={{ gap: 9, cursor: "pointer" }}>
                <input type="checkbox" checked={!!prefs.immediate} onChange={(e) => setPrefs({ ...prefs, immediate: e.target.checked })} />
                <span className="small">Alertas imediatos (problema detectado)</span>
              </label>
              <label className="row mb12" style={{ gap: 9, cursor: "pointer" }}>
                <input type="checkbox" checked={!!prefs.daily_summary} onChange={(e) => setPrefs({ ...prefs, daily_summary: e.target.checked })} />
                <span className="small">Resumo diário do dia anterior</span>
              </label>

              <div className="small muted mb12">Categorias monitoradas</div>
              <div className="row row-wrap" style={{ gap: 7 }}>
                {["vendas", "estoque", "clientes", "financeiro"].map((c) => (
                  <button
                    key={c}
                    className={`btn btn-sm ${prefs.categories?.includes(c) ? "btn-dark" : "btn-ghost"}`}
                    onClick={() => alternarCategoria(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <button className="btn btn-ghost btn-block mt16" onClick={testarWhatsapp}>
                <Icon name="send" size={15} /> Enviar mensagem de teste
              </button>
            </div>
          </Card>

          <Card>
            <CardHead title="Integrações" subtitle="Sistemas conectados" icon="link" iconClass="kpi-violet" />
            <div className="card-pad grid" style={{ gap: 10 }}>
              {!integracoes ? (
                <Empty text="Carregando integrações…" />
              ) : (
                Object.entries(integracoes).map(([nome, info]) => {
                  const ativo = info === true || info?.configured || info?.status === "connected";
                  return (
                    <div key={nome} className="row" style={{ padding: "11px 13px", border: "1px solid var(--border)", borderRadius: 11 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 500, textTransform: "capitalize" }}>{nome}</span>
                      <span className="spacer">
                        {ativo ? <Badge tone="ok">Configurado</Badge> : <Badge tone="neutral">Não configurado</Badge>}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <ContaAzulCard />
        </div>
      </div>
    </>
  );
}

/** Painel da integração Conta Azul (OAuth2 + sincronização do financeiro). */
function ContaAzulCard() {
  const { push } = useToast();
  const [status, setStatus] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = () =>
    api.get("/integrations/contaazul/status").then((r) => setStatus(r.data)).catch(() => {});

  useEffect(() => {
    carregar();
    const params = new URLSearchParams(window.location.search);
    if (params.get("contaazul") === "connected") push("Conta Azul conectada.");
    if (params.get("contaazul") === "error") push("Não foi possível conectar à Conta Azul.", "alert");
  }, []);

  const conectar = async () => {
    setOcupado(true);
    try {
      const { data } = await api.get("/integrations/contaazul/connect");
      window.location.href = data.authorize_url;
    } catch (e) {
      push(apiError(e, "Conta Azul ainda não está configurada no servidor."), "alert");
      setOcupado(false);
    }
  };

  const desconectar = async () => {
    setOcupado(true);
    try {
      await api.post("/integrations/contaazul/disconnect");
      push("Conta Azul desconectada.");
      carregar();
    } catch (e) {
      push(apiError(e), "alert");
    } finally {
      setOcupado(false);
    }
  };

  const sincronizar = async () => {
    setOcupado(true);
    try {
      const ate = new Date();
      const de = new Date();
      de.setDate(de.getDate() - 90);
      await api.post("/integrations/contaazul/sync", null, {
        params: { date_from: de.toISOString().slice(0, 10), date_to: ate.toISOString().slice(0, 10) },
      });
      push("Financeiro sincronizado com a Conta Azul.");
      carregar();
    } catch (e) {
      push(apiError(e), "alert");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Card>
      <CardHead title="Conta Azul" subtitle="Importa o financeiro para o fluxo de caixa" icon="link" iconClass="kpi-blue" />
      <div className="card-pad">
        {!status ? (
          <Empty text="Verificando conexão…" />
        ) : !status.configured ? (
          <div className="alert-item alert-info">
            <span className="ai-icon"><Icon name="shield" size={15} /></span>
            <div>
              <b>Credenciais não configuradas</b>
              <p>
                Defina CONTAAZUL_CLIENT_ID, CONTAAZUL_CLIENT_SECRET e CONTAAZUL_REDIRECT_URI nas
                variáveis de ambiente da hospedagem para liberar a conexão.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="row mb12">
              <span className="small muted">Situação</span>
              <span className="spacer">
                {status.connected ? <Badge tone="ok">Conectada</Badge> : <Badge tone="neutral">Desconectada</Badge>}
              </span>
            </div>
            {status.last_sync_at && (
              <div className="small muted mb12">
                Última sincronização: <b className="num">{formatDate(status.last_sync_at)}</b>
              </div>
            )}
            {status.connected ? (
              <div className="row" style={{ gap: 8 }}>
                <button className="btn btn-blue" onClick={sincronizar} disabled={ocupado}>
                  <Icon name="refresh" size={15} /> Sincronizar 90 dias
                </button>
                <button className="btn btn-ghost" onClick={desconectar} disabled={ocupado}>
                  Desconectar
                </button>
              </div>
            ) : (
              <button className="btn btn-blue btn-block" onClick={conectar} disabled={ocupado}>
                <Icon name="link" size={15} /> Conectar Conta Azul
              </button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

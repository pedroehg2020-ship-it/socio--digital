import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";
import Icon from "@/components/Icons";
import { Card, Field } from "@/components/ui";

const Beneficios = ({ itens }) => (
  <ul>
    {itens.map((t) => (
      <li key={t}>
        <span className="ck"><Icon name="check" size={16} /></span>
        {t}
      </li>
    ))}
  </ul>
);

const Marca = () => (
  <div className="row" style={{ gap: 10, marginBottom: 26 }}>
    <span
      style={{
        width: 36, height: 36, borderRadius: 10,
        background: "linear-gradient(135deg,#10b981,#3b82f6)",
        display: "grid", placeItems: "center", color: "#04122a",
        fontWeight: 700, fontFamily: "Outfit, sans-serif",
      }}
    >
      SD
    </span>
    <b style={{ fontFamily: "Outfit, sans-serif", fontSize: 17 }}>Sócio Digital</b>
  </div>
);

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await login(email, senha);
      nav("/app/vendas", { replace: true });
    } catch (ex) {
      setErro(apiError(ex, "E-mail ou senha inválidos."));
    } finally {
      setCarregando(false);
    }
  };

  const usarDemo = () => {
    setEmail("demo@sociodigital.local");
    setSenha("demo1234");
  };

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <Marca />
        <h2>O seu sócio já olhou os números de hoje.</h2>
        <p>
          Entre e veja a operação inteira: vendas do dia, títulos a vencer, caixa projetado e o
          que o radar encontrou desde ontem.
        </p>
        <Beneficios
          itens={[
            "Frente de vendas com baixa automática de estoque",
            "Contas a receber e a pagar em uma agenda só",
            "Fluxo de caixa projetado para 90 dias",
            "Notas fiscais emitidas a partir da venda",
          ]}
        />
      </aside>

      <div className="auth-form-wrap">
        <div className="auth-card">
          <h2 style={{ fontSize: 24, marginBottom: 6 }}>Entrar</h2>
          <p className="muted small mb16">Acesse o painel da sua empresa.</p>

          <Card className="card-pad">
            {erro && <div className="form-error">{erro}</div>}
            <form onSubmit={entrar}>
              <Field label="E-mail">
                <input
                  className="input"
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field label="Senha">
                <input
                  className="input"
                  type="password"
                  value={senha}
                  autoComplete="current-password"
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </Field>
              <button className="btn btn-primary btn-block" disabled={carregando}>
                {carregando ? "Entrando…" : "Entrar"}
              </button>
            </form>

            <button className="btn btn-ghost btn-block mt12" type="button" onClick={usarDemo}>
              <Icon name="sparkles" size={15} /> Preencher conta de demonstração
            </button>
          </Card>

          <p className="small muted mt16 center">
            Não tem conta? <Link to="/cadastro" style={{ color: "var(--blue)", fontWeight: 600 }}>Criar agora</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", company_name: "", segment: "Comércio", whatsapp: "",
  });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await register(form);
      nav("/app/vendas", { replace: true });
    } catch (ex) {
      setErro(apiError(ex, "Não foi possível criar a conta."));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <Marca />
        <h2>Sua empresa com um sócio que não dorme.</h2>
        <p>
          Em poucos minutos você tem vendas, financeiro, estoque e notas rodando — e um
          assistente acompanhando tudo em segundo plano.
        </p>
        <Beneficios
          itens={[
            "Cadastro em menos de dois minutos",
            "Sem cartão de crédito para começar",
            "Radar avisa por WhatsApp quando algo muda",
            "Integração com a Conta Azul disponível",
          ]}
        />
      </aside>

      <div className="auth-form-wrap">
        <div className="auth-card">
          <h2 style={{ fontSize: 24, marginBottom: 6 }}>Criar conta</h2>
          <p className="muted small mb16">Comece pelo essencial. O resto ajusta depois.</p>

          <Card className="card-pad">
            {erro && <div className="form-error">{erro}</div>}
            <form onSubmit={enviar}>
              <Field label="Seu nome">
                <input className="input" value={form.name} onChange={set("name")} required />
              </Field>
              <Field label="E-mail">
                <input className="input" type="email" value={form.email} onChange={set("email")} required />
              </Field>
              <Field label="Senha" hint="Mínimo de 8 caracteres.">
                <input className="input" type="password" minLength={8} value={form.password} onChange={set("password")} required />
              </Field>
              <Field label="Empresa">
                <input className="input" value={form.company_name} onChange={set("company_name")} required />
              </Field>
              <Field label="Segmento">
                <select className="select" value={form.segment} onChange={set("segment")}>
                  <option>Comércio</option>
                  <option>Serviços</option>
                  <option>Indústria</option>
                  <option>Alimentação</option>
                  <option>Outro</option>
                </select>
              </Field>
              <Field label="WhatsApp" hint="Opcional — usado para os avisos do radar.">
                <input className="input" value={form.whatsapp} onChange={set("whatsapp")} placeholder="(51) 90000-0000" />
              </Field>
              <button className="btn btn-primary btn-block" disabled={carregando}>
                {carregando ? "Criando…" : "Criar conta"}
              </button>
            </form>
          </Card>

          <p className="small muted mt16 center">
            Já tem conta? <Link to="/login" style={{ color: "var(--blue)", fontWeight: 600 }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

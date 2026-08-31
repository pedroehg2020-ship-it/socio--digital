import { Link } from "react-router-dom";

const COLUNAS = [
  {
    titulo: "Produto",
    itens: [
      { texto: "Vendas e PDV", href: "#vendas" },
      { texto: "Financeiro", href: "#financeiro" },
      { texto: "Clientes", href: "#clientes" },
      { texto: "Estoque", href: "#estoque" },
      { texto: "Relatórios", href: "#relatorios" },
    ],
  },
  {
    titulo: "Recursos",
    itens: [
      { texto: "Agenda de vencimentos", href: "#agenda" },
      { texto: "Rotinas automáticas", href: "#automacao" },
      { texto: "Notas fiscais", href: "#documentos" },
      { texto: "Painel geral", href: "#painel" },
    ],
  },
  {
    titulo: "Saber mais",
    itens: [
      { texto: "Como funciona", href: "#como-funciona" },
      { texto: "Para quem é", href: "#para-quem" },
      { texto: "Segurança", href: "#seguranca" },
      { texto: "Perguntas frequentes", href: "#faq" },
    ],
  },
];

export default function Rodape() {
  const ano = new Date().getFullYear();

  return (
    <footer className="lp-rodape">
      <div className="lp-wrap">
        <div className="lp-rodape-grade">
          <div className="lp-rodape-marca">
            <span className="lp-marca-selo">SD</span>
            <b>Sócio Digital</b>
            <p>
              Gestão e assistente executivo de IA em um sistema só, pensado para quem
              toca a empresa e a operação ao mesmo tempo.
            </p>
          </div>

          {COLUNAS.map((c) => (
            <nav key={c.titulo} aria-label={c.titulo}>
              <h3>{c.titulo}</h3>
              <ul>
                {c.itens.map((i) => (
                  <li key={i.texto}>
                    <a href={i.href}>{i.texto}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav aria-label="Conta">
            <h3>Conta</h3>
            <ul>
              <li>
                <Link to="/login">Entrar</Link>
              </li>
              <li>
                <Link to="/cadastro">Criar conta grátis</Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="lp-rodape-base">
          <span>© {ano} Sócio Digital. Todos os direitos reservados.</span>
          <span>Versão 5.0</span>
        </div>
      </div>
    </footer>
  );
}

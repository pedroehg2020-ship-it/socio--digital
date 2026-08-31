import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/Icons";

const LINKS = [
  { href: "#funcionalidades", texto: "Funcionalidades" },
  { href: "#beneficios", texto: "Benefícios" },
  { href: "#como-funciona", texto: "Como funciona" },
  { href: "#seguranca", texto: "Segurança" },
  { href: "#faq", texto: "FAQ" },
];

/** Barra fixa do topo. Ganha fundo sólido depois que a página rola. */
export default function Cabecalho() {
  const [rolado, setRolado] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolado(window.scrollY > 24);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  // Trava a rolagem do fundo enquanto o menu mobile está aberto.
  useEffect(() => {
    document.body.style.overflow = menuAberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAberto]);

  return (
    <header className={`lp-topo ${rolado ? "rolado" : ""}`}>
      <div className="lp-topo-inner">
        <Link to="/" className="lp-marca" onClick={() => setMenuAberto(false)}>
          <span className="lp-marca-selo">SD</span>
          <b>Sócio Digital</b>
        </Link>

        <nav className="lp-menu" aria-label="Seções da página">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.texto}
            </a>
          ))}
        </nav>

        <div className="lp-topo-acoes">
          <Link to="/login" className="lp-btn lp-btn-texto">
            Entrar
          </Link>
          <Link to="/cadastro" className="lp-btn lp-btn-principal lp-btn-sm">
            Criar conta grátis
          </Link>
        </div>

        <button
          type="button"
          className="lp-topo-hamburguer"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto((v) => !v)}
        >
          <Icon name={menuAberto ? "x" : "menu"} size={20} />
        </button>
      </div>

      {menuAberto ? (
        <div className="lp-menu-mobile">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenuAberto(false)}>
              {l.texto}
            </a>
          ))}
          <div className="lp-menu-mobile-acoes">
            <Link to="/login" className="lp-btn lp-btn-vidro lp-btn-bloco">
              Entrar
            </Link>
            <Link to="/cadastro" className="lp-btn lp-btn-principal lp-btn-bloco">
              Criar conta grátis
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

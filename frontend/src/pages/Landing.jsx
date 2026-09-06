/**
 * Página pública — etapa 1 da reconstrução.
 *
 * Contém apenas HERO e CASCATA, que são as duas seções em validação. As
 * demais seções da landing antiga foram retiradas de propósito: o objetivo
 * aqui é julgar o acabamento do padrão antes de replicá-lo.
 *
 * Não há mais nada de WebGL nesta página. `three` e `@react-three/fiber`
 * saíram do projeto — verifiquei que nenhuma outra área os usava.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Hero from "@/components/landing/Hero";
import Cascata from "@/components/landing/Cascata";
import "@/styles/landing.css";

function Topo() {
  const [fixo, setFixo] = useState(false);

  useEffect(() => {
    const aoRolar = () => setFixo(window.scrollY > 8);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header className={`lp-topo${fixo ? " lp-topo-fixo" : ""}`}>
      <div className="sd-container lp-topo-interno">
        <Link className="lp-marca" to="/">
          <span className="lp-marca-simbolo" aria-hidden="true" />
          Sócio Digital
        </Link>
        <nav className="lp-topo-acoes">
          <Link className="lp-link" to="/login">
            Entrar
          </Link>
          <Link className="sd-btn sd-btn-principal" to="/cadastro">
            Começar agora
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Rodape() {
  return (
    <footer className="lp-rodape">
      <div className="sd-container lp-rodape-interno">
        <span className="lp-marca">
          <span className="lp-marca-simbolo" aria-hidden="true" />
          Sócio Digital
        </span>
        <p className="sd-nota">
          © {new Date().getFullYear()} Sócio Digital. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="sd">
      <Topo />
      <main>
        <Hero />
        <Cascata />
      </main>
      <Rodape />
    </div>
  );
}

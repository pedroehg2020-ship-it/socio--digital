import { useEffect, useRef, useState } from "react";

/**
 * Revela um elemento quando ele entra na viewport.
 * Retorna a ref para o elemento e um booleano de visibilidade.
 * Respeita `prefers-reduced-motion`: nesse caso já nasce visível.
 */
export function useRevelar({ margem = "0px 0px -12% 0px", umaVez = true } = {}) {
  const ref = useRef(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (semAnimacao || typeof IntersectionObserver === "undefined") {
      setVisivel(true);
      return undefined;
    }
    const el = ref.current;
    if (!el) return undefined;

    const obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            setVisivel(true);
            if (umaVez) obs.unobserve(e.target);
          } else if (!umaVez) {
            setVisivel(false);
          }
        });
      },
      { rootMargin: margem, threshold: 0.12 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [margem, umaVez]);

  return [ref, visivel];
}

/**
 * Conta de 0 até `valor` quando o elemento aparece na tela.
 * Usado nos números do hero, para que surjam junto com a cena 3D.
 */
export function useContador(valor, { duracao = 1400, ativo = true } = {}) {
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    if (!ativo) return undefined;
    const semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (semAnimacao) {
      setAtual(valor);
      return undefined;
    }

    let quadro;
    const inicio = performance.now();
    const passo = (agora) => {
      const t = Math.min(1, (agora - inicio) / duracao);
      const suave = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setAtual(valor * suave);
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor, duracao, ativo]);

  return atual;
}

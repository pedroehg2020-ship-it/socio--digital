import { useEffect, useRef } from "react";
import Icon from "@/components/Icons";
import { registrarSlot } from "@/components/landing/palco";

/**
 * Reserva no layout o espaço onde a cena 3D daquela seção será encaixada.
 *
 * O elemento em si é vazio: quem desenha é o canvas único do `Palco3D`, que lê
 * o retângulo deste div e posiciona a composição exatamente sobre ele. Como o
 * retângulo é definido pelo CSS normal, o comportamento responsivo (coluna ao
 * lado no desktop, bloco acima no mobile) sai de graça.
 *
 * Quando não há WebGL, a página inteira ganha a classe `sem-3d` e o fallback
 * em CSS abaixo aparece no lugar — uma composição em camadas com profundidade,
 * não um espaço em branco.
 */
export default function Slot3D({ chave, icone = "gauge", altura = "media", className = "" }) {
  const ref = useRef(null);

  useEffect(() => registrarSlot(chave, ref.current), [chave]);

  return (
    <div
      ref={ref}
      className={`lp-slot lp-slot-${altura} ${className}`}
      data-slot={chave}
      aria-hidden="true"
    >
      <span className="lp-slot-halo" />
      <span className="lp-slot-css">
        <span className="lp-slot-css-tras" />
        <span className="lp-slot-css-meio" />
        <span className="lp-slot-css-frente">
          <Icon name={icone} size={34} />
        </span>
      </span>
    </div>
  );
}

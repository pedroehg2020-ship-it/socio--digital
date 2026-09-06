/**
 * Iluminação do mundo — rig de fotografia de arquitetura.
 *
 * Duas correções de fundo em relação à versão anterior:
 *
 * 1. A CENA COMEÇA DE DIA. Antes havia um único clima frio e escuro do começo
 *    ao fim. Agora o rig percorre uma tabela de climas ligada à rolagem: o
 *    escritório é luz natural quente de fim de tarde, a cidade é dia aberto,
 *    a região de dados fecha para crepúsculo e a revelação final volta a
 *    abrir. Nenhum clima desce abaixo do ponto em que texto claro sobre a
 *    cena ainda tem contraste.
 *
 * 2. A LUZ NUNCA FICA ATRÁS DO TEXTO. A luz-chave é posicionada do lado em
 *    que o assunto está, que é sempre o lado oposto ao da coluna de texto.
 *    Quando a página inverte o lado, a chave atravessa para o outro lado
 *    junto — devagar, para ler como o sol mudando de ângulo, e não como um
 *    interruptor. Do lado do texto sobra apenas o preenchimento suave, que
 *    não produz manchas nem estouros.
 *
 * Não há sombra projetada: o custo em WebGL não se paga num ambiente deste
 * tamanho, e o volume aqui vem do contraste entre chave e preenchimento.
 */

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { COR } from "@/components/landing/mundo/paleta";

/**
 * Climas ao longo da rolagem. `u` é a posição normalizada na rota (0 a 1).
 *
 * `ambiente` e `hemisferio` são o piso de luz — o que garante que nada fique
 * ilegível. `chave` é o sol. `quente` mistura a cor da chave entre a luz do
 * dia e o azul do fim de tarde.
 */
const CLIMAS = [
  { u: 0.0, ambiente: 0.62, hemisferio: 0.85, chave: 2.5, quente: 1.0 },   // escritório
  { u: 0.12, ambiente: 0.6, hemisferio: 0.9, chave: 2.7, quente: 0.9 },    // janela / cidade
  { u: 0.3, ambiente: 0.52, hemisferio: 0.78, chave: 2.3, quente: 0.65 },  // dados
  { u: 0.58, ambiente: 0.45, hemisferio: 0.66, chave: 2.0, quente: 0.42 }, // operação
  { u: 0.8, ambiente: 0.42, hemisferio: 0.6, chave: 1.8, quente: 0.3 },    // núcleo
  { u: 1.0, ambiente: 0.55, hemisferio: 0.8, chave: 2.4, quente: 0.6 },    // revelação
];

/** Interpola a tabela de climas em `u`. */
function climaEm(u) {
  let i = 0;
  while (i < CLIMAS.length - 2 && u > CLIMAS[i + 1].u) i += 1;
  const a = CLIMAS[i];
  const b = CLIMAS[i + 1];
  const f = THREE.MathUtils.clamp((u - a.u) / Math.max(1e-4, b.u - a.u), 0, 1);
  const s = f * f * (3 - 2 * f); // suaviza as bordas entre climas
  return {
    ambiente: a.ambiente + (b.ambiente - a.ambiente) * s,
    hemisferio: a.hemisferio + (b.hemisferio - a.hemisferio) * s,
    chave: a.chave + (b.chave - a.chave) * s,
    quente: a.quente + (b.quente - a.quente) * s,
  };
}

export default function Iluminacao({ rico = true }) {
  const grupo = useRef();
  const chave = useRef();
  const ambiente = useRef();
  const hemisferio = useRef();
  const apoio = useRef();
  const { camera } = useThree();

  const corQuente = useMemo(() => new THREE.Color(COR.luzDia), []);
  const corFria = useMemo(() => new THREE.Color(COR.azulClaro), []);
  const corChave = useMemo(() => new THREE.Color(), []);

  /** Lado da chave, amortecido: o sol gira, não pisca. */
  const ladoSuave = useRef(1);

  useFrame((_, delta) => {
    const g = grupo.current;
    if (!g) return;
    const d = Math.min(delta, 0.05);

    // O rig acompanha a câmera na horizontal, com atraso — nunca gruda nela.
    g.position.x += (camera.position.x - g.position.x) * Math.min(1, d * 1.4);
    g.position.z += (camera.position.z - g.position.z) * Math.min(1, d * 1.4);

    const clima = climaEm(camera.userData.progresso ?? 0);

    if (ambiente.current) ambiente.current.intensity = clima.ambiente;
    if (hemisferio.current) hemisferio.current.intensity = clima.hemisferio;

    /**
     * O lado do assunto vem do Cinema. Em telas estreitas ele é 0, e aí a
     * chave descansa numa posição neutra à frente.
     */
    const ladoAlvo = camera.userData.lado ?? 1;
    ladoSuave.current += (ladoAlvo - ladoSuave.current) * Math.min(1, d * 0.9);

    if (chave.current) {
      chave.current.intensity = clima.chave;
      // Azimute da chave: acompanha o assunto, mantendo a coluna de texto
      // apenas com preenchimento.
      chave.current.position.set(20 * ladoSuave.current, 26, 16);
      corChave.copy(corFria).lerp(corQuente, clima.quente);
      chave.current.color.copy(corChave);
    }

    if (apoio.current) {
      apoio.current.intensity = clima.chave * 0.3;
      apoio.current.position.set(-16 * ladoSuave.current, 8, -18);
    }
  });

  return (
    <group ref={grupo}>
      {/* piso de luz — define o quanto a sombra continua legível */}
      <ambientLight ref={ambiente} intensity={0.6} color={COR.ceuBaixo} />
      <hemisphereLight
        ref={hemisferio}
        args={[COR.ceuMeio, COR.grafite, 0.85]}
      />

      {/* sol: alto, do lado do assunto */}
      <directionalLight ref={chave} position={[20, 26, 16]} intensity={2.5} color={COR.luzDia} />

      {/* rebote frio vindo do fundo, o que recorta a silhueta sem estourar */}
      <directionalLight ref={apoio} position={[-16, 8, -18]} intensity={0.7} color={COR.azulClaro} />

      {rico ? (
        /* Um único ponto de apoio baixo, para o volume não morrer na base.
           O ponto violeta da versão anterior saiu: era o elemento que mais
           puxava a cena para "neon". */
        <pointLight position={[0, -10, -18]} intensity={45} distance={80} color={COR.azul} />
      ) : null}
    </group>
  );
}

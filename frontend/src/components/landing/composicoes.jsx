/**
 * As cenas 3D da página inicial — uma por seção.
 *
 * Cada cena é montada em três planos:
 *
 *   fundo   → halos, anéis orbitais, telas secundárias em perspectiva forte
 *   médio   → a tela principal do ERP, que é o objeto âncora
 *   frente  → objetos que cruzam entre a tela e o visitante (moedas, cristais,
 *             placas de vidro, caixas), com movimento amplo e reação forte ao
 *             mouse
 *
 * As três recebem o mesmo `progresso` (0 → 1, a rolagem dentro da seção) mas
 * o consomem com amplitudes diferentes. É isso que produz o paralaxe e a
 * sensação de que a informação sai da tela em vez de estar colada nela.
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { Halo, PALETA, SombraContato } from "@/components/landing/ambiente3d";
import {
  Anel,
  Cadeado,
  Caixa,
  Camada,
  Carrinho,
  Conexao,
  Cristal,
  CurvaLinha,
  Engrenagem,
  Escudo,
  Funil,
  GraficoBarras,
  Metal,
  Moeda,
  Neon,
  No,
  PainelVidro,
  Pasta,
  Placa,
  Relogio,
  Tela,
} from "@/components/landing/primitivas3d";

/* ---------------------------------------------------------------- apoios */

/** Rotação contínua em um eixo. */
function Gira({ children, velocidade = 0.3, eixo = "y", semMovimento, ...props }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current && !semMovimento) ref.current.rotation[eixo] += delta * velocidade;
  });
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
}

/** Anéis concêntricos inclinados — moldura orbital do fundo das cenas. */
function Orbitas({ semMovimento, cor = PALETA.apoio, escala = 1 }) {
  const ref = useRef();
  useFrame((state, delta) => {
    if (!ref.current || semMovimento) return;
    ref.current.rotation.z += delta * 0.05;
    ref.current.rotation.x = -0.42 + Math.sin(state.clock.elapsedTime * 0.18) * 0.07;
  });
  return (
    <group ref={ref} rotation={[-0.42, 0.3, 0]} scale={escala} position={[0, 0, -2.4]}>
      <Anel raio={3.2} espessura={0.012} cor={cor} />
      <Anel raio={4.1} espessura={0.008} cor={PALETA.marca} />
      <Anel raio={2.5} espessura={0.016} cor={cor} rotation={[0.5, 0.2, 0]} />
    </group>
  );
}

/**
 * Base comum de toda cena: halos de atmosfera atrás e sombra de contato
 * embaixo. Sem isso os objetos parecem recortados sobre o fundo.
 */
function Palco({ children, halo = PALETA.marca, halo2 = PALETA.apoio, sombra = true }) {
  return (
    <group>
      <Halo cor={halo} raio={4.6} opacidade={0.26} position={[-1.4, 0.4, -4]} />
      <Halo cor={halo2} raio={4} opacidade={0.22} position={[1.8, -0.6, -4.3]} />
      {sombra ? <SombraContato escala={7} y={-2.35} opacidade={0.7} /> : null}
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ hero */

/**
 * Primeiro momento "WOW": a tela do painel inclinada em perspectiva, com o
 * gráfico de barras saindo do plano dela, uma curva de receita que escapa pela
 * direita e moedas cruzando na frente.
 */
function Hero({ progresso, mouse, semMovimento, qualidade }) {
  return (
    <Palco>
      <Orbitas semMovimento={semMovimento} />

      {/* fundo: telas satélites em perspectiva forte */}
      <Camada plano={3} base={[-3.4, 1.15, -3.2]} deriva={[0.5, -0.4, 0]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.1, 0.62, -0.05]}>
          <Tela nome="radar" largura={2.5} brilho={0.44} />
        </group>
      </Camada>
      <Camada plano={3} base={[3.5, -1.1, -3]} deriva={[-0.5, 0.5, 0]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[-0.08, -0.6, 0.05]}>
          <Tela nome="financeiro" largura={2.4} brilho={0.44} />
        </group>
      </Camada>

      {/* médio: a tela principal */}
      <Camada plano={2} base={[0, 0.12, 0]} deriva={[0, 0.18, 0.5]} flutua={0.06} velocidade={0.4} giro={0.03} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.05, -0.2, 0]}>
          <Tela nome="painel" largura={5} brilho={0.72} />

          {/* o gráfico emerge da superfície da tela */}
          <group position={[-0.6, -0.86, 0.5]} rotation={[0, 0.18, 0]}>
            <GraficoBarras
              valores={[0.34, 0.52, 0.42, 0.74, 0.6, 0.95, 0.8]}
              largura={2.4}
              altura={1.25}
              espessura={0.15}
              progresso={progresso}
              semMovimento={semMovimento}
            />
          </group>

          {/* a curva de receita atravessa a moldura e continua no espaço */}
          <CurvaLinha
            progresso={progresso}
            pontos={[
              [-2.2, -0.5, 0.35],
              [-1.2, 0.1, 0.7],
              [-0.2, -0.2, 1],
              [0.9, 0.55, 1.35],
              [2.1, 0.35, 1.7],
              [3.2, 1.2, 2.1],
            ]}
            raio={0.04}
          />
        </group>
      </Camada>

      {/* frente: objetos cruzando entre a tela e o visitante */}
      <Camada plano={1} base={[-3.1, -1.35, 2.6]} deriva={[1.1, 0.9, 0.4]} flutua={0.18} velocidade={0.6} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <Gira velocidade={0.6} semMovimento={semMovimento}>
          <Moeda simbolo="R$" tamanho={0.44} />
        </Gira>
      </Camada>
      <Camada plano={1} base={[3.2, 1.5, 2.3]} deriva={[-0.9, -1, 0.5]} flutua={0.16} velocidade={0.5} fase={2} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <Gira velocidade={-0.4} eixo="x" semMovimento={semMovimento}>
          <Cristal raio={0.5} />
        </Gira>
      </Camada>
      <Camada plano={1} base={[2.4, -1.8, 3]} deriva={[-1.4, 0.7, 0]} flutua={0.14} velocidade={0.66} fase={4} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.16, -0.34, 0.06]}>
          <PainelVidro largura={1.7} altura={0.92} />
        </group>
      </Camada>
      {qualidade !== "baixa" ? (
        <Camada plano={1} base={[-2.6, 1.7, 2.9]} deriva={[0.8, -0.8, 0]} flutua={0.2} velocidade={0.44} fase={1.2} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
          <Gira velocidade={0.5} semMovimento={semMovimento}>
            <Moeda simbolo="%" cor={PALETA.apoio} tamanho={0.28} />
          </Gira>
        </Camada>
      ) : null}
    </Palco>
  );
}

/* ------------------------------------------------------------ financeiro */

function Financeiro({ progresso, mouse, semMovimento, qualidade }) {
  return (
    <Palco halo={PALETA.marca} halo2={PALETA.marcaForte}>
      <Orbitas semMovimento={semMovimento} cor={PALETA.marca} escala={0.9} />

      <Camada plano={3} base={[2.9, 1.3, -3]} deriva={[-0.5, -0.5, 0]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.06, -0.58, 0]}>
          <Tela nome="agenda" largura={2.3} brilho={0.42} />
        </group>
      </Camada>

      <Camada plano={2} base={[-0.2, 0.1, 0]} deriva={[0.2, 0.14, 0.5]} flutua={0.05} velocidade={0.38} giro={0.03} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.06, -0.26, 0]}>
          <Tela nome="financeiro" largura={4.7} brilho={0.7} />
        </group>
      </Camada>

      {/* pilha de cartões de saldo saindo da tela em escada */}
      {[
        { y: 1.05, cor: PALETA.marcaClara, z: 1.1, x: 2.1 },
        { y: 0.35, cor: PALETA.apoioClaro, z: 1.4, x: 2.4 },
        { y: -0.35, cor: PALETA.marca, z: 1.7, x: 2.7 },
      ].map((c, i) => (
        <Camada
          key={i}
          plano={1}
          base={[c.x, c.y, c.z]}
          deriva={[-0.5 - i * 0.2, 0.15, 0.3]}
          flutua={0.09}
          velocidade={0.45 + i * 0.08}
          fase={i * 1.6}
          progresso={progresso}
          mouse={mouse}
          semMovimento={semMovimento}
        >
          <group rotation={[0.08, -0.42, 0.03]}>
            <Placa largura={1.6} altura={0.68} filete={c.cor} />
          </group>
        </Camada>
      ))}

      <Camada plano={1} base={[-2.9, -1.5, 2.6]} deriva={[1, 1.1, 0.5]} flutua={0.2} velocidade={0.6} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <Gira velocidade={0.7} semMovimento={semMovimento}>
          <Moeda simbolo="R$" tamanho={0.46} />
        </Gira>
      </Camada>
      {qualidade !== "baixa" ? (
        <Camada plano={1} base={[-3.3, 1.4, 2.2]} deriva={[0.9, -1.2, 0]} flutua={0.16} velocidade={0.52} fase={3} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
          <Gira velocidade={0.5} eixo="z" semMovimento={semMovimento}>
            <Moeda simbolo="%" cor={PALETA.apoio} tamanho={0.3} />
          </Gira>
        </Camada>
      ) : null}
    </Palco>
  );
}

/* ---------------------------------------------------------------- vendas */

/**
 * Segundo momento "WOW": o PDV com o gráfico de crescimento gigante em
 * primeiro plano, atravessando a frente da tela da esquerda para a direita.
 */
function Vendas({ progresso, mouse, semMovimento, qualidade }) {
  return (
    <Palco halo={PALETA.apoio} halo2={PALETA.marca}>
      <Orbitas semMovimento={semMovimento} cor={PALETA.apoioClaro} escala={1.05} />

      <Camada plano={3} base={[-3.2, 1.4, -3.1]} deriva={[0.6, -0.4, 0]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.08, 0.6, 0]}>
          <Tela nome="painel" largura={2.4} brilho={0.4} />
        </group>
      </Camada>

      <Camada plano={2} base={[0.35, 0.15, 0]} deriva={[-0.3, 0.16, 0.4]} flutua={0.06} velocidade={0.42} giro={0.035} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.05, 0.24, 0]}>
          <Tela nome="pdv" largura={4.6} brilho={0.7} />
        </group>
      </Camada>

      {/* gráfico volumétrico grande, na frente da tela */}
      <Camada plano={1} base={[-1.7, -1.55, 2.2]} deriva={[0.5, 0.35, 0.5]} flutua={0.07} velocidade={0.36} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.14, 0.3, 0]}>
          <GraficoBarras
            valores={[0.3, 0.46, 0.38, 0.66, 0.55, 0.86, 0.72, 1]}
            largura={3.4}
            altura={1.9}
            espessura={0.2}
            progresso={progresso}
            semMovimento={semMovimento}
          />
          <SombraContato escala={4} y={-0.04} opacidade={0.5} />
        </group>
      </Camada>

      <Camada plano={1} base={[3.1, 1.35, 2.5]} deriva={[-1.1, -0.7, 0.4]} flutua={0.18} velocidade={0.54} fase={1.5} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <Gira velocidade={0.34} semMovimento={semMovimento}>
          <Carrinho tamanho={0.78} />
        </Gira>
      </Camada>
      {qualidade !== "baixa" ? (
        <Camada plano={1} base={[3.3, -1.4, 2.1]} deriva={[-0.9, 0.9, 0]} flutua={0.14} velocidade={0.48} fase={3.4} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
          <Gira velocidade={0.26} semMovimento={semMovimento}>
            <Funil tamanho={1.2} />
          </Gira>
        </Camada>
      ) : null}
    </Palco>
  );
}

/* -------------------------------------------------------------- clientes */

function Clientes({ progresso, mouse, semMovimento }) {
  const nos = [
    { p: [0, 0, 0], r: 0.3, cor: PALETA.marca },
    { p: [-1.5, 0.95, 0.4], r: 0.19, cor: PALETA.apoio },
    { p: [1.55, 0.85, -0.2], r: 0.19, cor: PALETA.apoio },
    { p: [-1.3, -1.05, 0.3], r: 0.17, cor: PALETA.marcaClara },
    { p: [1.4, -1.15, 0.35], r: 0.17, cor: PALETA.apoio },
    { p: [0.1, 1.6, -0.35], r: 0.15, cor: PALETA.marcaClara },
    { p: [-0.15, -1.7, -0.25], r: 0.15, cor: PALETA.apoio },
    { p: [2.5, 0.1, 0.5], r: 0.13, cor: PALETA.marcaClara },
    { p: [-2.55, -0.15, 0.45], r: 0.13, cor: PALETA.apoio },
  ];

  return (
    <Palco halo={PALETA.apoio} halo2={PALETA.marca}>
      <Camada plano={3} base={[0, 0, -2.6]} deriva={[0, 0.3, 0]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.04, 0.1, 0]}>
          <Tela nome="assistente" largura={4.2} brilho={0.5} />
        </group>
      </Camada>

      {/* a rede de clientes gira na frente da tela */}
      <Camada plano={2} base={[0, 0.1, 1.4]} deriva={[0, 0.1, 0.6]} flutua={0.08} velocidade={0.34} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <Gira velocidade={0.14} semMovimento={semMovimento}>
          {nos.slice(1).map((n, i) => (
            <Conexao
              key={i}
              de={nos[0].p}
              para={n.p}
              cor={i % 2 ? PALETA.marcaClara : PALETA.apoio}
              espessura={0.013}
            />
          ))}
          {nos.map((n, i) => (
            <No key={i} position={n.p} raio={n.r} cor={n.cor} />
          ))}
        </Gira>
      </Camada>

      <Camada plano={1} base={[-3, 1.45, 2.5]} deriva={[1.1, -0.8, 0.4]} flutua={0.17} velocidade={0.5} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.1, 0.4, -0.05]}>
          <PainelVidro largura={1.6} altura={0.85} borda={PALETA.apoioClaro} />
        </group>
      </Camada>
      <Camada plano={1} base={[3.1, -1.5, 2.4]} deriva={[-1, 0.9, 0.3]} flutua={0.15} velocidade={0.58} fase={2.6} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.1, -0.44, 0.05]}>
          <Placa largura={1.5} altura={0.64} filete={PALETA.marcaClara} />
        </group>
      </Camada>
    </Palco>
  );
}

/* --------------------------------------------------------------- estoque */

function Estoque({ progresso, mouse, semMovimento, qualidade }) {
  const pilha = [
    [-0.75, -1.5, 0.2],
    [0.05, -1.5, 0],
    [0.85, -1.5, 0.25],
    [-0.35, -0.72, 0.15],
    [0.45, -0.72, 0.1],
    [0.05, 0.05, 0.2],
  ];

  return (
    <Palco halo={PALETA.marcaForte} halo2={PALETA.apoio}>
      <Camada plano={3} base={[0.4, 0.5, -2.8]} deriva={[-0.3, 0.3, 0]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.05, -0.16, 0]}>
          <Tela nome="estoque" largura={4.6} brilho={0.62} />
        </group>
      </Camada>

      {/* pilha física de caixas, com sombra própria, na frente da tela */}
      <Camada plano={2} base={[-1.5, 0.05, 1.5]} deriva={[0.4, 0.2, 0.5]} flutua={0.05} velocidade={0.32} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.1, 0.44, 0]}>
          {pilha.map((p, i) => (
            <Caixa key={i} position={p} tamanho={0.78} cor={i % 3 === 1 ? "#b3793f" : "#c98a4b"} />
          ))}
          <SombraContato escala={3.6} y={-1.95} opacidade={0.6} />
        </group>
      </Camada>

      <Camada plano={1} base={[2.9, 1.4, 2.4]} deriva={[-0.9, -0.9, 0.4]} flutua={0.16} velocidade={0.5} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.1, -0.4, 0.05]}>
          <Placa largura={1.7} altura={0.7} filete="#f97362" />
        </group>
      </Camada>
      {qualidade !== "baixa" ? (
        <Camada plano={1} base={[2.6, -1.6, 2.7]} deriva={[-0.7, 0.8, 0]} flutua={0.2} velocidade={0.62} fase={2.2} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
          <Gira velocidade={-0.4} eixo="x" semMovimento={semMovimento}>
            <Cristal raio={0.42} cor={PALETA.marcaClara} />
          </Gira>
        </Camada>
      ) : null}
    </Palco>
  );
}

/* ------------------------------------------------------------ relatórios */

/**
 * Terceiro momento "WOW": três telas em leque, com a curva de resultado
 * costurando as três e saindo pela frente.
 */
function Relatorios({ progresso, mouse, semMovimento, qualidade }) {
  return (
    <Palco halo={PALETA.apoio} halo2={PALETA.marca}>
      <Orbitas semMovimento={semMovimento} cor={PALETA.apoio} escala={1.1} />

      <Camada plano={3} base={[-3, 0.75, -2.4]} deriva={[0.4, -0.3, 0]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.06, 0.66, -0.04]}>
          <Tela nome="financeiro" largura={2.8} brilho={0.46} />
        </group>
      </Camada>
      <Camada plano={3} base={[3.05, -0.7, -2.4]} deriva={[-0.4, 0.35, 0]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[-0.06, -0.66, 0.04]}>
          <Tela nome="radar" largura={2.8} brilho={0.46} />
        </group>
      </Camada>

      <Camada plano={2} base={[0, 0.15, 0.3]} deriva={[0, 0.15, 0.6]} flutua={0.06} velocidade={0.4} giro={0.03} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.04, -0.1, 0]}>
          <Tela nome="painel" largura={4.4} brilho={0.74} />
        </group>
      </Camada>

      <Camada plano={1} base={[0, -0.4, 2]} deriva={[0, 0.3, 0.6]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <CurvaLinha
          progresso={progresso}
          raio={0.05}
          cor={PALETA.marcaClara}
          pontos={[
            [-3.6, -0.9, -0.6],
            [-2.2, -0.1, 0.2],
            [-0.9, -0.6, 0.8],
            [0.4, 0.4, 1.1],
            [1.8, 0.05, 0.7],
            [3.1, 1, 0.1],
            [4, 0.55, -0.5],
          ]}
        />
      </Camada>

      {qualidade !== "baixa" ? (
        <Camada plano={1} base={[-2.9, 1.6, 2.6]} deriva={[1, -0.9, 0.3]} flutua={0.18} velocidade={0.52} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
          <group rotation={[0.1, 0.36, -0.04]}>
            <PainelVidro largura={1.8} altura={0.95} />
          </group>
        </Camada>
      ) : null}
      <Camada plano={1} base={[3, 1.5, 2.3]} deriva={[-1, -0.8, 0]} flutua={0.16} velocidade={0.6} fase={2.8} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <Gira velocidade={0.5} semMovimento={semMovimento}>
          <Cristal raio={0.46} cor={PALETA.apoioClaro} />
        </Gira>
      </Camada>
    </Palco>
  );
}

/* ---------------------------------------------------------------- agenda */

function Agenda({ progresso, mouse, semMovimento, qualidade }) {
  return (
    <Palco halo={PALETA.marca} halo2={PALETA.apoio}>
      <Camada plano={2} base={[0.3, 0.1, 0]} deriva={[-0.25, 0.16, 0.5]} flutua={0.06} velocidade={0.38} giro={0.03} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.05, 0.22, 0]}>
          <Tela nome="agenda" largura={4.7} brilho={0.7} />
        </group>
      </Camada>

      {/* relógio grande atravessando na frente */}
      <Camada plano={1} base={[-2.5, -0.9, 2.4]} deriva={[0.8, 0.7, 0.4]} flutua={0.14} velocidade={0.42} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <Gira velocidade={0.22} semMovimento={semMovimento}>
          <Relogio raio={0.82} />
        </Gira>
      </Camada>

      {/* títulos que vencem, emergindo em escada */}
      {[
        { y: 1.35, x: 2.6, cor: PALETA.marcaClara },
        { y: 0.6, x: 2.9, cor: PALETA.apoioClaro },
        { y: -0.15, x: 3.2, cor: "#f97362" },
      ].map((c, i) => (
        <Camada
          key={i}
          plano={1}
          base={[c.x, c.y, 1.4 + i * 0.3]}
          deriva={[-0.7 - i * 0.25, 0.2, 0.3]}
          flutua={0.1}
          velocidade={0.46 + i * 0.07}
          fase={i * 1.4}
          progresso={progresso}
          mouse={mouse}
          semMovimento={semMovimento}
        >
          <group rotation={[0.08, -0.46, 0.03]}>
            <Placa largura={1.5} altura={0.62} filete={c.cor} />
          </group>
        </Camada>
      ))}

      {qualidade !== "baixa" ? (
        <Camada plano={1} base={[-3, 1.6, 2.2]} deriva={[0.9, -1, 0]} flutua={0.18} velocidade={0.56} fase={3.6} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
          <Gira velocidade={0.4} eixo="z" semMovimento={semMovimento}>
            <Cristal raio={0.36} />
          </Gira>
        </Camada>
      ) : null}
    </Palco>
  );
}

/* -------------------------------------------------------------- automação */

/**
 * Quarto momento "WOW": engrenagens metálicas grandes girando em profundidades
 * diferentes, ligadas por filetes de luz que atravessam a tela do assistente.
 */
function Automacao({ progresso, mouse, semMovimento, qualidade }) {
  return (
    <Palco halo={PALETA.apoio} halo2={PALETA.marcaForte}>
      <Orbitas semMovimento={semMovimento} cor={PALETA.marca} escala={0.95} />

      <Camada plano={3} base={[0.6, 0.4, -2.9]} deriva={[-0.35, 0.25, 0]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.05, -0.2, 0]}>
          <Tela nome="assistente" largura={4.4} brilho={0.56} />
        </group>
      </Camada>

      <Camada plano={2} base={[-1.6, 0.35, 1.1]} deriva={[0.5, 0.15, 0.4]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <Gira velocidade={0.3} eixo="z" semMovimento={semMovimento}>
          <Engrenagem raio={1.15} dentes={14} />
        </Gira>
      </Camada>
      <Camada plano={2} base={[0.5, -1.15, 1.5]} deriva={[0.2, 0.3, 0.4]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <Gira velocidade={-0.44} eixo="z" semMovimento={semMovimento}>
          <Engrenagem raio={0.78} dentes={11} cor="#7d8fb3" />
        </Gira>
      </Camada>

      <Camada plano={1} base={[2.3, 1.15, 2.4]} deriva={[-0.8, -0.6, 0.4]} flutua={0.12} velocidade={0.5} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <Gira velocidade={0.62} eixo="z" semMovimento={semMovimento}>
          <Engrenagem raio={0.5} dentes={9} cor="#a9b8d6" />
        </Gira>
      </Camada>

      {/* filetes de luz ligando as etapas da rotina */}
      <Camada plano={1} base={[0, 0, 2]} deriva={[0, 0.2, 0.4]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <Conexao de={[-2.6, -1.5, -0.4]} para={[-0.4, 0.2, 0.2]} cor={PALETA.marcaClara} espessura={0.018} />
        <Conexao de={[-0.4, 0.2, 0.2]} para={[1.9, -0.7, 0.4]} cor={PALETA.apoioClaro} espessura={0.018} />
        <Conexao de={[1.9, -0.7, 0.4]} para={[3.2, 1.1, 0]} cor={PALETA.marcaClara} espessura={0.018} />
        <No position={[-0.4, 0.2, 0.2]} raio={0.14} cor={PALETA.marcaClara} />
        <No position={[1.9, -0.7, 0.4]} raio={0.14} cor={PALETA.apoioClaro} />
      </Camada>

      {qualidade !== "baixa" ? (
        <Camada plano={1} base={[-3.2, -1.5, 2.6]} deriva={[1, 0.9, 0]} flutua={0.18} velocidade={0.58} fase={2.4} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
          <group rotation={[0.1, 0.4, -0.05]}>
            <PainelVidro largura={1.7} altura={0.9} borda={PALETA.apoioClaro} />
          </group>
        </Camada>
      ) : null}
    </Palco>
  );
}

/* ------------------------------------------------------------- documentos */

function Documentos({ progresso, mouse, semMovimento, qualidade }) {
  return (
    <Palco halo={PALETA.marcaForte} halo2={PALETA.apoio}>
      <Camada plano={3} base={[-0.5, 0.45, -2.8]} deriva={[0.3, 0.25, 0]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.05, 0.24, 0]}>
          <Tela nome="financeiro" largura={4.3} brilho={0.5} />
        </group>
      </Camada>

      {/* leque de notas emergindo, cada uma em profundidade diferente */}
      {[0, 1, 2, 3].map((i) => (
        <Camada
          key={i}
          plano={i < 2 ? 2 : 1}
          base={[1.1 + i * 0.55, 0.9 - i * 0.62, 0.6 + i * 0.65]}
          deriva={[-0.3 - i * 0.18, 0.18, 0.3]}
          flutua={0.1}
          velocidade={0.4 + i * 0.06}
          fase={i * 1.3}
          progresso={progresso}
          mouse={mouse}
          semMovimento={semMovimento}
        >
          <group rotation={[0.1, -0.34 - i * 0.06, 0.05 + i * 0.03]}>
            <PainelVidro
              largura={1.5}
              altura={1.95}
              opacidade={0.26}
              borda={i % 2 ? PALETA.apoioClaro : PALETA.marcaClara}
            />
          </group>
        </Camada>
      ))}

      <Camada plano={1} base={[-2.7, -1.35, 2.4]} deriva={[0.9, 0.8, 0.4]} flutua={0.16} velocidade={0.48} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <Gira velocidade={0.28} semMovimento={semMovimento}>
          <Pasta largura={1.5} />
        </Gira>
      </Camada>
      {qualidade !== "baixa" ? (
        <Camada plano={1} base={[-2.9, 1.5, 2.2]} deriva={[0.8, -0.9, 0]} flutua={0.19} velocidade={0.55} fase={3} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
          <Gira velocidade={0.44} eixo="x" semMovimento={semMovimento}>
            <Cristal raio={0.38} cor={PALETA.marcaClara} />
          </Gira>
        </Camada>
      ) : null}
    </Palco>
  );
}

/* --------------------------------------------------------------- painel */

function Dashboard({ progresso, mouse, semMovimento, qualidade }) {
  return (
    <Palco halo={PALETA.marca} halo2={PALETA.apoio}>
      <Orbitas semMovimento={semMovimento} escala={1.15} />

      <Camada plano={3} base={[-3.3, 0.5, -3]} deriva={[0.5, -0.2, 0]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.06, 0.68, 0]}>
          <Tela nome="estoque" largura={2.6} brilho={0.42} />
        </group>
      </Camada>
      <Camada plano={3} base={[3.35, -0.5, -3]} deriva={[-0.5, 0.25, 0]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[-0.05, -0.68, 0]}>
          <Tela nome="agenda" largura={2.6} brilho={0.42} />
        </group>
      </Camada>

      <Camada plano={2} base={[0, 0.15, 0.4]} deriva={[0, 0.12, 0.6]} flutua={0.05} velocidade={0.36} giro={0.028} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.04, -0.08, 0]}>
          <Tela nome="painel" largura={5.2} brilho={0.78} />
          <group position={[0, -1.35, 0.9]} rotation={[0.24, 0, 0]}>
            <GraficoBarras
              valores={[0.4, 0.58, 0.48, 0.78, 0.66, 0.92, 0.84, 1]}
              largura={3.6}
              altura={0.95}
              espessura={0.16}
              progresso={progresso}
              semMovimento={semMovimento}
            />
          </group>
        </group>
      </Camada>

      {qualidade !== "baixa" ? (
        <>
          <Camada plano={1} base={[-3, 1.7, 2.5]} deriva={[1, -1, 0.4]} flutua={0.16} velocidade={0.5} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
            <Gira velocidade={0.55} semMovimento={semMovimento}>
              <Moeda simbolo="R$" tamanho={0.4} />
            </Gira>
          </Camada>
          <Camada plano={1} base={[3.1, -1.6, 2.6]} deriva={[-1, 0.9, 0]} flutua={0.18} velocidade={0.58} fase={2.6} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
            <Gira velocidade={-0.45} eixo="x" semMovimento={semMovimento}>
              <Cristal raio={0.44} />
            </Gira>
          </Camada>
        </>
      ) : null}
    </Palco>
  );
}

/* ------------------------------------------------------------- segurança */

function Seguranca({ progresso, mouse, semMovimento, qualidade }) {
  return (
    <Palco halo={PALETA.marca} halo2={PALETA.marcaForte}>
      <Orbitas semMovimento={semMovimento} cor={PALETA.marcaClara} escala={0.85} />

      <Camada plano={3} base={[0, 0.2, -2.9]} deriva={[0, 0.2, 0]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.04, 0.06, 0]}>
          <Tela nome="radar" largura={4} brilho={0.44} />
        </group>
      </Camada>

      <Camada plano={2} base={[0, 0.1, 1]} deriva={[0, 0.15, 0.7]} flutua={0.07} velocidade={0.34} giro={0.04} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.04, -0.1, 0]}>
          <Escudo tamanho={3} />
          <Cadeado tamanho={0.62} position={[0, 0.02, 0.42]} />
        </group>
      </Camada>

      <Camada plano={1} base={[-2.9, 1.5, 2.5]} deriva={[0.9, -0.9, 0.4]} flutua={0.16} velocidade={0.5} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.1, 0.4, -0.05]}>
          <PainelVidro largura={1.6} altura={0.82} />
        </group>
      </Camada>
      {qualidade !== "baixa" ? (
        <Camada plano={1} base={[3, -1.5, 2.4]} deriva={[-0.9, 0.9, 0]} flutua={0.18} velocidade={0.56} fase={2.8} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
          <group rotation={[0.1, -0.42, 0.05]}>
            <Placa largura={1.5} altura={0.64} />
          </group>
        </Camada>
      ) : null}
    </Palco>
  );
}

/* ------------------------------------------------------------- CTA final */

/** Encerramento: escudo e telas convergindo, com o gráfico subindo ao centro. */
function Convite({ progresso, mouse, semMovimento, qualidade }) {
  return (
    <Palco halo={PALETA.marca} halo2={PALETA.apoio}>
      <Orbitas semMovimento={semMovimento} escala={1.2} />

      <Camada plano={3} base={[-2.8, 0.9, -2.6]} deriva={[0.6, -0.4, 0]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.06, 0.6, 0]}>
          <Tela nome="pdv" largura={2.6} brilho={0.46} />
        </group>
      </Camada>
      <Camada plano={3} base={[2.85, -0.85, -2.6]} deriva={[-0.6, 0.45, 0]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[-0.05, -0.6, 0]}>
          <Tela nome="agenda" largura={2.6} brilho={0.46} />
        </group>
      </Camada>

      <Camada plano={2} base={[0, 0.1, 0.4]} deriva={[0, 0.2, 0.7]} flutua={0.07} velocidade={0.4} giro={0.035} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.05, -0.12, 0]}>
          <Tela nome="painel" largura={4.6} brilho={0.8} />
        </group>
      </Camada>

      <Camada plano={1} base={[0, -1.7, 2.3]} deriva={[0, 0.5, 0.5]} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
        <group rotation={[0.2, 0, 0]}>
          <GraficoBarras
            valores={[0.3, 0.48, 0.4, 0.7, 0.58, 0.9, 1]}
            largura={3}
            altura={1.5}
            espessura={0.18}
            progresso={progresso}
            semMovimento={semMovimento}
          />
        </group>
      </Camada>

      {qualidade !== "baixa" ? (
        <>
          <Camada plano={1} base={[-3.1, 1.6, 2.6]} deriva={[1, -0.9, 0]} flutua={0.18} velocidade={0.52} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
            <Gira velocidade={0.6} semMovimento={semMovimento}>
              <Moeda simbolo="R$" tamanho={0.44} />
            </Gira>
          </Camada>
          <Camada plano={1} base={[3.2, 1.5, 2.4]} deriva={[-1, -0.8, 0]} flutua={0.16} velocidade={0.6} fase={3} progresso={progresso} mouse={mouse} semMovimento={semMovimento}>
            <Gira velocidade={-0.4} eixo="x" semMovimento={semMovimento}>
              <Cristal raio={0.5} />
            </Gira>
          </Camada>
        </>
      ) : null}
    </Palco>
  );
}

/* ------------------------------------------------------------------ mapa */

export const COMPOSICOES = {
  hero: Hero,
  financeiro: Financeiro,
  vendas: Vendas,
  clientes: Clientes,
  estoque: Estoque,
  relatorios: Relatorios,
  agenda: Agenda,
  automacao: Automacao,
  documentos: Documentos,
  dashboard: Dashboard,
  seguranca: Seguranca,
  convite: Convite,
};

export default COMPOSICOES;

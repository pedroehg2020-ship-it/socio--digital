/**
 * As composições 3D — uma para cada seção da página inicial.
 *
 * Todas são desenhadas dentro de um raio aproximado de 1.6 unidades em torno da
 * origem. O `Palco3D` usa esse raio de referência para encaixar a composição
 * exatamente no retângulo que a seção reservou no layout, seja no desktop
 * (coluna ao lado do texto) ou no mobile (bloco acima do texto).
 *
 * Nenhuma composição depende das outras: trocar uma não afeta o resto.
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  Barra,
  Cadeado,
  Caixa,
  Calendario,
  Carrinho,
  Conexao,
  Documento,
  Engrenagem,
  Escudo,
  Funil,
  Moeda,
  No,
  PALETA,
  Painel,
  Pasta,
  Relogio,
} from "@/components/landing/primitivas3d";

/* --------------------------------------------------------------- wrappers */

/** Flutuação suave e contínua. Com movimento reduzido, fica parado. */
function Flutua({
  children,
  amplitude = 0.12,
  velocidade = 0.6,
  fase = 0,
  giro = 0,
  semMovimento = false,
  ...props
}) {
  const ref = useRef();
  const base = props.position || [0, 0, 0];

  useFrame((state) => {
    if (!ref.current || semMovimento) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = base[1] + Math.sin(t * velocidade + fase) * amplitude;
    if (giro) ref.current.rotation.y = Math.sin(t * velocidade * 0.7 + fase) * giro;
  });

  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
}

/** Giro constante em torno de um eixo (engrenagens, moedas). */
function Gira({ children, velocidade = 0.4, eixo = "y", semMovimento = false, ...props }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (!ref.current || semMovimento) return;
    ref.current.rotation[eixo] += delta * velocidade;
  });
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
}

/** Barra que cresce até a altura final quando a composição entra em cena. */
function BarraAnimada({ alturaFinal, atraso = 0, cor, x, largura = 0.17, semMovimento }) {
  const ref = useRef();
  const nascimento = useRef(null);

  useFrame((state) => {
    if (!ref.current) return;
    if (nascimento.current === null) nascimento.current = state.clock.elapsedTime;
    if (semMovimento) {
      ref.current.scale.y = 1;
      return;
    }
    const t = Math.min(
      1,
      Math.max(0, (state.clock.elapsedTime - nascimento.current - atraso) * 1.9)
    );
    const suave = t * t * (3 - 2 * t);
    const pulso = 1 + Math.sin(state.clock.elapsedTime * 1.3 + x * 3) * 0.025;
    ref.current.scale.y = Math.max(0.001, suave * pulso);
  });

  return (
    <group ref={ref} position={[x, 0, 0]} scale-y={0.001}>
      <Barra altura={alturaFinal} largura={largura} cor={cor} />
    </group>
  );
}

/* ------------------------------------------------------- peças compartilhadas */

/** Painel de dashboard: cabeçalho, gráfico de barras e duas fichas de KPI. */
function PainelDashboard({ semMovimento, compacto = false }) {
  const barras = compacto
    ? [
        { x: -0.3, h: 0.34, cor: PALETA.apoio },
        { x: -0.05, h: 0.56, cor: PALETA.marcaClara },
        { x: 0.2, h: 0.44, cor: PALETA.apoio },
        { x: 0.45, h: 0.72, cor: PALETA.marca },
      ]
    : [
        { x: -0.62, h: 0.3, cor: PALETA.apoio },
        { x: -0.37, h: 0.46, cor: PALETA.apoio },
        { x: -0.12, h: 0.38, cor: PALETA.marcaClara },
        { x: 0.13, h: 0.62, cor: PALETA.marcaClara },
        { x: 0.38, h: 0.52, cor: PALETA.marca },
        { x: 0.63, h: 0.86, cor: PALETA.marca },
      ];

  return (
    <group>
      <Painel largura={2.1} altura={1.42} cor={PALETA.tinta2} raio={0.11} profundidade={0.07} />
      <Painel
        largura={2.02}
        altura={0.18}
        cor={PALETA.tinta3}
        raio={0.05}
        profundidade={0.02}
        position={[0, 0.6, 0.045]}
      />
      <group position={[0, -0.52, 0.06]}>
        {barras.map((b) => (
          <BarraAnimada
            key={b.x}
            x={b.x}
            alturaFinal={b.h}
            cor={b.cor}
            atraso={(b.x + 1) * 0.18}
            semMovimento={semMovimento}
          />
        ))}
      </group>
      <Painel
        largura={0.52}
        altura={0.24}
        cor={PALETA.marca}
        emissiva={PALETA.marca}
        brilho={0.3}
        raio={0.06}
        profundidade={0.02}
        position={[-0.72, 0.32, 0.06]}
      />
      <Painel
        largura={0.52}
        altura={0.24}
        cor={PALETA.apoio}
        emissiva={PALETA.apoio}
        brilho={0.3}
        raio={0.06}
        profundidade={0.02}
        position={[-0.12, 0.32, 0.06]}
      />
    </group>
  );
}

/* ---------------------------------------------------------- composições */

function Hero({ semMovimento }) {
  return (
    <group>
      <Flutua amplitude={0.07} velocidade={0.45} semMovimento={semMovimento}>
        <group rotation={[0.06, -0.22, 0]}>
          <PainelDashboard semMovimento={semMovimento} />
        </group>
      </Flutua>

      <Flutua position={[-1.45, 0.62, 0.7]} velocidade={0.55} amplitude={0.14} semMovimento={semMovimento}>
        <Gira velocidade={0.5} semMovimento={semMovimento}>
          <Moeda simbolo="R$" cor={PALETA.marca} tamanho={0.3} />
        </Gira>
      </Flutua>
      <Flutua position={[1.5, 0.78, 0.5]} velocidade={0.62} amplitude={0.12} fase={1.6} semMovimento={semMovimento}>
        <Painel largura={0.66} altura={0.4} cor={PALETA.apoio} emissiva={PALETA.apoio} brilho={0.25} raio={0.07} />
      </Flutua>
      <Flutua position={[1.42, -0.72, 0.75]} velocidade={0.5} amplitude={0.13} fase={2.6} semMovimento={semMovimento}>
        <Caixa tamanho={0.42} />
      </Flutua>
      <Flutua position={[-1.5, -0.66, 0.4]} velocidade={0.58} amplitude={0.11} fase={3.4} semMovimento={semMovimento}>
        <Documento largura={0.44} cor={PALETA.marcaClara} linhas={3} />
      </Flutua>
    </group>
  );
}

function Financeiro({ semMovimento }) {
  return (
    <group>
      <Flutua amplitude={0.09} velocidade={0.5} semMovimento={semMovimento}>
        <group rotation={[0.1, -0.28, -0.05]}>
          <Painel largura={1.5} altura={0.94} cor={PALETA.tinta2} raio={0.1} profundidade={0.07} />
          <Painel
            largura={1.34}
            altura={0.2}
            cor={PALETA.marca}
            emissiva={PALETA.marca}
            brilho={0.28}
            raio={0.05}
            profundidade={0.02}
            position={[0, 0.26, 0.05]}
          />
          <Painel
            largura={1.34}
            altura={0.14}
            cor={PALETA.tinta3}
            raio={0.04}
            profundidade={0.02}
            position={[0, 0.02, 0.05]}
          />
          <Painel
            largura={0.86}
            altura={0.14}
            cor={PALETA.tinta3}
            raio={0.04}
            profundidade={0.02}
            position={[-0.24, -0.2, 0.05]}
          />
        </group>
      </Flutua>

      <Flutua position={[0.98, 0.72, 0.6]} velocidade={0.6} amplitude={0.13} semMovimento={semMovimento}>
        <Gira velocidade={0.62} semMovimento={semMovimento}>
          <Moeda simbolo="R$" cor={PALETA.marca} tamanho={0.32} />
        </Gira>
      </Flutua>
      <Flutua position={[-1.12, 0.52, 0.55]} velocidade={0.52} amplitude={0.11} fase={2.1} semMovimento={semMovimento}>
        <Gira velocidade={0.44} semMovimento={semMovimento}>
          <Moeda simbolo="%" cor={PALETA.apoio} tamanho={0.22} />
        </Gira>
      </Flutua>
      <Flutua position={[1.02, -0.66, 0.45]} velocidade={0.48} amplitude={0.12} fase={3.2} semMovimento={semMovimento}>
        <group rotation={[0.2, 0.4, 0.1]}>
          <Painel largura={0.78} altura={0.48} cor={PALETA.apoioForte} raio={0.07} />
          <Painel
            largura={0.24}
            altura={0.14}
            cor={PALETA.marcaClara}
            emissiva={PALETA.marcaClara}
            brilho={0.4}
            raio={0.03}
            profundidade={0.02}
            position={[-0.22, 0.06, 0.04]}
          />
        </group>
      </Flutua>
      <Flutua position={[-1.02, -0.6, 0.3]} velocidade={0.56} amplitude={0.1} fase={4.4} semMovimento={semMovimento}>
        <Gira velocidade={0.5} semMovimento={semMovimento}>
          <Moeda simbolo="R$" cor={PALETA.marcaClara} tamanho={0.2} />
        </Gira>
      </Flutua>
    </group>
  );
}

function Vendas({ semMovimento }) {
  const linha = useMemo(
    () => [
      { x: -0.78, h: 0.34 },
      { x: -0.47, h: 0.5 },
      { x: -0.16, h: 0.44 },
      { x: 0.15, h: 0.72 },
      { x: 0.46, h: 0.88 },
      { x: 0.77, h: 1.12 },
    ],
    []
  );

  return (
    <group>
      <group position={[0, -0.5, 0]}>
        {linha.map((b, i) => (
          <BarraAnimada
            key={b.x}
            x={b.x}
            alturaFinal={b.h}
            largura={0.2}
            cor={i > 3 ? PALETA.marca : PALETA.apoio}
            atraso={i * 0.11}
            semMovimento={semMovimento}
          />
        ))}
      </group>

      <Flutua position={[-1.15, 0.72, 0.55]} velocidade={0.55} amplitude={0.12} semMovimento={semMovimento}>
        <Carrinho tamanho={0.56} />
      </Flutua>
      <Flutua position={[1.16, 0.66, 0.4]} velocidade={0.5} amplitude={0.13} fase={2.2} semMovimento={semMovimento}>
        <Funil tamanho={0.7} />
      </Flutua>
      <Flutua position={[0.98, -0.86, 0.6]} velocidade={0.6} amplitude={0.1} fase={3.8} semMovimento={semMovimento}>
        <Gira velocidade={0.5} semMovimento={semMovimento}>
          <Moeda simbolo="R$" cor={PALETA.marca} tamanho={0.2} />
        </Gira>
      </Flutua>
    </group>
  );
}

function Clientes({ semMovimento }) {
  const nos = useMemo(
    () => [
      { p: [0, 0, 0], r: 0.26, cor: PALETA.marca },
      { p: [-1.02, 0.6, 0.2], r: 0.17, cor: PALETA.apoio },
      { p: [1.05, 0.52, -0.1], r: 0.17, cor: PALETA.apoio },
      { p: [-0.86, -0.7, 0.15], r: 0.15, cor: PALETA.marcaClara },
      { p: [0.92, -0.76, 0.2], r: 0.15, cor: PALETA.apoio },
      { p: [0.05, 1.06, -0.2], r: 0.13, cor: PALETA.marcaClara },
      { p: [-0.1, -1.12, -0.15], r: 0.13, cor: PALETA.apoio },
    ],
    []
  );

  return (
    <group>
      <Flutua amplitude={0.06} velocidade={0.4} semMovimento={semMovimento}>
        <Gira velocidade={0.16} semMovimento={semMovimento}>
          {nos.slice(1).map((n, i) => (
            <Conexao
              key={i}
              de={nos[0].p}
              para={n.p}
              cor={i % 2 ? PALETA.marcaClara : PALETA.apoio}
            />
          ))}
          {nos.map((n, i) => (
            <No key={i} position={n.p} raio={n.r} cor={n.cor} />
          ))}
        </Gira>
      </Flutua>

      <Flutua position={[1.28, 0.98, 0.5]} velocidade={0.55} amplitude={0.12} fase={1.4} semMovimento={semMovimento}>
        <Painel largura={0.6} altura={0.36} cor={PALETA.tinta2} raio={0.07} />
      </Flutua>
    </group>
  );
}

function Estoque({ semMovimento }) {
  return (
    <group>
      <Flutua amplitude={0.06} velocidade={0.42} semMovimento={semMovimento}>
        <group rotation={[0.16, -0.5, 0]}>
          <Caixa tamanho={0.72} position={[-0.42, -0.5, 0]} />
          <Caixa tamanho={0.72} position={[0.42, -0.5, -0.05]} cor="#b3793f" />
          <Caixa tamanho={0.72} position={[0, 0.09, 0.05]} />
          <Caixa tamanho={0.56} position={[-0.1, 0.62, 0.12]} cor="#d79c62" />
        </group>
      </Flutua>

      <Flutua position={[1.24, 0.78, 0.55]} velocidade={0.58} amplitude={0.13} fase={2.4} semMovimento={semMovimento}>
        <Painel
          largura={0.62}
          altura={0.34}
          cor={PALETA.marca}
          emissiva={PALETA.marca}
          brilho={0.3}
          raio={0.07}
        />
      </Flutua>
      <Flutua position={[-1.3, 0.52, 0.35]} velocidade={0.5} amplitude={0.11} fase={4} semMovimento={semMovimento}>
        <Painel largura={0.5} altura={0.3} cor={PALETA.apoio} emissiva={PALETA.apoio} brilho={0.28} raio={0.06} />
      </Flutua>
    </group>
  );
}

function Relatorios({ semMovimento }) {
  return (
    <group>
      <Flutua amplitude={0.08} velocidade={0.46} semMovimento={semMovimento}>
        <group rotation={[0.08, -0.24, 0]}>
          <PainelDashboard semMovimento={semMovimento} compacto />
        </group>
      </Flutua>

      <Flutua position={[-1.28, 0.6, 0.6]} velocidade={0.52} amplitude={0.13} fase={1.2} semMovimento={semMovimento}>
        <group rotation={[0.1, 0.42, -0.08]}>
          <Documento largura={0.6} cor={PALETA.marca} />
        </group>
      </Flutua>
      <Flutua position={[1.3, -0.68, 0.45]} velocidade={0.58} amplitude={0.12} fase={3} semMovimento={semMovimento}>
        <group rotation={[0.1, -0.4, 0.08]}>
          <Documento largura={0.52} cor={PALETA.apoio} linhas={3} />
        </group>
      </Flutua>
    </group>
  );
}

function Agenda({ semMovimento }) {
  return (
    <group>
      <Flutua amplitude={0.08} velocidade={0.44} semMovimento={semMovimento}>
        <group rotation={[0.06, -0.26, 0]}>
          <Calendario largura={1.5} />
        </group>
      </Flutua>

      <Flutua position={[1.16, -0.72, 0.6]} velocidade={0.56} amplitude={0.13} fase={2} semMovimento={semMovimento}>
        <Relogio raio={0.42} />
      </Flutua>
      <Flutua position={[-1.24, 0.82, 0.4]} velocidade={0.5} amplitude={0.11} fase={3.6} semMovimento={semMovimento}>
        <Painel
          largura={0.56}
          altura={0.3}
          cor={PALETA.marca}
          emissiva={PALETA.marca}
          brilho={0.32}
          raio={0.06}
        />
      </Flutua>
    </group>
  );
}

function Automacao({ semMovimento }) {
  return (
    <group>
      <Gira velocidade={0.34} eixo="z" semMovimento={semMovimento} position={[-0.36, 0.2, 0]}>
        <Engrenagem raio={0.62} dentes={12} cor={PALETA.marca} />
      </Gira>
      <Gira velocidade={-0.5} eixo="z" semMovimento={semMovimento} position={[0.62, -0.3, -0.1]}>
        <Engrenagem raio={0.42} dentes={9} cor={PALETA.apoio} />
      </Gira>
      <Gira velocidade={0.62} eixo="z" semMovimento={semMovimento} position={[0.52, 0.72, 0.15]}>
        <Engrenagem raio={0.28} dentes={8} cor={PALETA.marcaClara} />
      </Gira>

      <Flutua position={[-1.16, -0.82, 0.5]} velocidade={0.54} amplitude={0.12} fase={2.8} semMovimento={semMovimento}>
        <Painel
          largura={0.68}
          altura={0.34}
          cor={PALETA.tinta2}
          raio={0.07}
        />
      </Flutua>
      <Conexao de={[-1.16, -0.82, 0.3]} para={[0.4, -0.3, 0]} cor={PALETA.marcaClara} espessura={0.014} />
    </group>
  );
}

function Documentos({ semMovimento }) {
  return (
    <group>
      <Flutua amplitude={0.07} velocidade={0.45} semMovimento={semMovimento}>
        <group rotation={[0.1, -0.3, 0]}>
          <Pasta largura={1.36} />
        </group>
      </Flutua>

      <Flutua position={[0.96, 0.82, 0.7]} velocidade={0.56} amplitude={0.13} fase={1.5} semMovimento={semMovimento}>
        <group rotation={[0.1, 0.34, 0.12]}>
          <Documento largura={0.58} cor={PALETA.marca} />
        </group>
      </Flutua>
      <Flutua position={[-1.14, 0.72, 0.4]} velocidade={0.5} amplitude={0.11} fase={3.2} semMovimento={semMovimento}>
        <group rotation={[0.1, -0.3, -0.1]}>
          <Documento largura={0.5} cor={PALETA.apoio} linhas={3} />
        </group>
      </Flutua>
    </group>
  );
}

function Dashboard({ semMovimento }) {
  return (
    <group>
      <Flutua amplitude={0.07} velocidade={0.42} semMovimento={semMovimento}>
        <group rotation={[0.05, -0.16, 0]}>
          <PainelDashboard semMovimento={semMovimento} />
          <Painel
            largura={0.66}
            altura={0.9}
            cor={PALETA.tinta3}
            raio={0.08}
            profundidade={0.04}
            position={[1.42, -0.1, -0.12]}
          />
          <Painel
            largura={0.54}
            altura={0.18}
            cor={PALETA.marca}
            emissiva={PALETA.marca}
            brilho={0.3}
            raio={0.05}
            profundidade={0.02}
            position={[1.42, 0.2, -0.08]}
          />
          <Painel
            largura={0.54}
            altura={0.18}
            cor={PALETA.apoio}
            emissiva={PALETA.apoio}
            brilho={0.3}
            raio={0.05}
            profundidade={0.02}
            position={[1.42, -0.06, -0.08]}
          />
        </group>
      </Flutua>
    </group>
  );
}

function Seguranca({ semMovimento }) {
  return (
    <group>
      <Flutua amplitude={0.08} velocidade={0.44} semMovimento={semMovimento}>
        <group rotation={[0.05, -0.16, 0]}>
          <Escudo tamanho={1.7} />
          <Cadeado tamanho={0.42} position={[0, 0.02, 0.18]} />
        </group>
      </Flutua>

      <Flutua position={[1.24, 0.78, 0.4]} velocidade={0.52} amplitude={0.12} fase={2.2} semMovimento={semMovimento}>
        <Painel largura={0.5} altura={0.3} cor={PALETA.apoio} emissiva={PALETA.apoio} brilho={0.3} raio={0.06} />
      </Flutua>
      <Flutua position={[-1.26, -0.66, 0.35]} velocidade={0.58} amplitude={0.11} fase={4.1} semMovimento={semMovimento}>
        <Painel largura={0.44} altura={0.26} cor={PALETA.marcaClara} emissiva={PALETA.marcaClara} brilho={0.3} raio={0.06} />
      </Flutua>
    </group>
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
};

export default COMPOSICOES;

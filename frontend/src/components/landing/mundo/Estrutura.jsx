/**
 * Estrutura — a arquitetura do ambiente.
 *
 * É a camada que responde pela profundidade real: pilares altos que passam
 * rente à câmera, arcos que cruzam a via, chão em grade lá embaixo e poeira
 * luminosa em três distâncias. Sem ela as regiões seriam objetos soltos no
 * vazio, que é exatamente o problema da versão anterior.
 *
 * Tudo aqui é instanciado — pilares, faixas e arcos saem em quatro chamadas
 * de desenho no total, independentemente da quantidade.
 */

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MARCOS } from "@/components/landing/mundo/rota";
import { COR } from "@/components/landing/mundo/paleta";
import { texturaBrilho, Grade } from "@/components/landing/mundo/comuns";

/** Ruído determinístico: a mesma estrutura em toda visita e em todo aparelho. */
function ruido(i, s = 1) {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/** A via percorrida pela câmera, achatada — serve de eixo para a arquitetura. */
function useVia() {
  return useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        MARCOS.slice(0, MARCOS.length - 1).map(
          (m) => new THREE.Vector3(m.cam[0], 0, m.cam[2])
        ),
        false,
        "catmullrom",
        0.4
      ),
    []
  );
}

/* -------------------------------------------------------------- pilares */

function Pilares({ quantidade = 46 }) {
  const via = useVia();
  const corpo = useRef();
  const faixa = useRef();

  const dados = useMemo(() => {
    const lista = [];
    const p = new THREE.Vector3();
    const tan = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const CIMA = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < quantidade; i += 1) {
      const u = (i + 0.5) / quantidade;
      via.getPoint(u, p);
      via.getTangent(u, tan);
      dir.copy(tan).cross(CIMA).normalize();

      for (let s = -1; s <= 1; s += 2) {
        const afast = 22 + ruido(i, s) * 14;
        const altura = 22 + ruido(i, s + 5) * 30;
        const largura = 1.1 + ruido(i, s + 9) * 1.7;
        const y = -14 + ruido(i, s + 3) * 5;
        lista.push({
          x: p.x + dir.x * afast * s,
          y: y + altura / 2,
          z: p.z + dir.z * afast * s,
          largura,
          altura,
          giro: Math.atan2(dir.x, dir.z),
        });
      }
    }
    return lista;
  }, [via, quantidade]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const esc = new THREE.Vector3();

    dados.forEach((d, i) => {
      e.set(0, d.giro, 0);
      q.setFromEuler(e);

      pos.set(d.x, d.y, d.z);
      esc.set(d.largura, d.altura, d.largura * 0.8);
      m.compose(pos, q, esc);
      corpo.current.setMatrixAt(i, m);

      // faixa acesa correndo pela face interna do pilar
      pos.set(d.x, d.y, d.z);
      esc.set(d.largura * 0.16, d.altura * 0.7, d.largura * 0.9);
      m.compose(pos, q, esc);
      faixa.current.setMatrixAt(i, m);
    });

    corpo.current.instanceMatrix.needsUpdate = true;
    faixa.current.instanceMatrix.needsUpdate = true;
  }, [dados]);

  return (
    <>
      <instancedMesh ref={corpo} args={[null, null, dados.length]} frustumCulled>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={COR.casco}
          roughness={0.55}
          metalness={0.75}
          envMapIntensity={0.6}
        />
      </instancedMesh>

      <instancedMesh ref={faixa} args={[null, null, dados.length]} frustumCulled>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={COR.azul} transparent opacity={0.22} />
      </instancedMesh>
    </>
  );
}

/* ---------------------------------------------------------------- arcos */

/** Arcos que cruzam a via por cima: marcam distância percorrida. */
function Arcos({ quantidade = 16 }) {
  const via = useVia();
  const malha = useRef();

  const dados = useMemo(() => {
    const lista = [];
    const p = new THREE.Vector3();
    const tan = new THREE.Vector3();
    for (let i = 0; i < quantidade; i += 1) {
      const u = (i + 0.5) / quantidade;
      via.getPoint(u, p);
      via.getTangent(u, tan);
      lista.push({
        x: p.x,
        y: -6 + ruido(i, 21) * 3,
        z: p.z,
        // +90° para o arco cruzar a via, e não correr paralelo a ela
        giro: Math.atan2(tan.x, tan.z) + Math.PI / 2,
        escala: 26 + ruido(i, 33) * 9,
      });
    }
    return lista;
  }, [via, quantidade]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const esc = new THREE.Vector3();
    dados.forEach((d, i) => {
      e.set(0, d.giro, 0);
      q.setFromEuler(e);
      pos.set(d.x, d.y, d.z);
      esc.set(d.escala, d.escala, d.escala);
      m.compose(pos, q, esc);
      malha.current.setMatrixAt(i, m);
    });
    malha.current.instanceMatrix.needsUpdate = true;
  }, [dados]);

  return (
    <instancedMesh ref={malha} args={[null, null, dados.length]} frustumCulled>
      <torusGeometry args={[1, 0.012, 4, 40, Math.PI]} />
      <meshBasicMaterial color={COR.ciano} transparent opacity={0.3} toneMapped={false} />
    </instancedMesh>
  );
}

/* ----------------------------------------------------------- chão/grade */

function Chao() {
  const via = useVia();
  const placas = useMemo(() => {
    const lista = [];
    const p = new THREE.Vector3();
    for (let i = 0; i < 9; i += 1) {
      via.getPoint((i + 0.5) / 9, p);
      lista.push([p.x, -15, p.z]);
    }
    return lista;
  }, [via]);

  return (
    <>
      {placas.map((p, i) => (
        <Grade
          key={i}
          position={p}
          tamanho={70}
          divisoes={14}
          cor={i % 3 === 0 ? COR.ciano : COR.azul}
          opacidade={0.13}
        />
      ))}
    </>
  );
}

/* --------------------------------------------------------------- poeira */

/**
 * Partículas em três profundidades ao longo da via. É o elemento mais barato
 * da cena e o que mais contribui para a sensação de espaço ocupado.
 */
function Poeira({ quantidade = 900, parado = false }) {
  const via = useVia();
  const ref = useRef();

  const geo = useMemo(() => {
    const pos = new Float32Array(quantidade * 3);
    const p = new THREE.Vector3();
    for (let i = 0; i < quantidade; i += 1) {
      via.getPoint(ruido(i, 7), p);
      pos[i * 3] = p.x + (ruido(i, 11) - 0.5) * 70;
      pos[i * 3 + 1] = -18 + ruido(i, 13) * 46;
      pos[i * 3 + 2] = p.z + (ruido(i, 17) - 0.5) * 70;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [via, quantidade]);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.5,
        map: texturaBrilho(),
        color: new THREE.Color(COR.cianoClaro),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        fog: true,
      }),
    []
  );

  useFrame((_, delta) => {
    if (parado || !ref.current) return;
    ref.current.rotation.y += Math.min(delta, 0.05) * 0.006;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

/* ------------------------------------------------------------ exportado */

export default function Estrutura({ qualidade = "alta", parado = false }) {
  const rico = qualidade === "alta";
  const medio = qualidade !== "baixa";

  return (
    <group>
      <Pilares quantidade={rico ? 46 : medio ? 32 : 20} />
      {medio ? <Arcos quantidade={rico ? 16 : 10} /> : null}
      <Chao />
      <Poeira quantidade={rico ? 1000 : medio ? 520 : 240} parado={parado} />
    </group>
  );
}

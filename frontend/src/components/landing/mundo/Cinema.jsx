/**
 * Cinema — câmera, atmosfera e pós-processamento.
 *
 * A câmera não "olha para um objeto que se move": ela percorre uma curva
 * Catmull-Rom construída a partir dos marcos da rota, e a rolagem é apenas o
 * cursor sobre essa curva. Como a curva é contínua e o cursor é amortecido,
 * não existe salto possível entre seções — o movimento é sempre uma viagem.
 *
 * Junto com a posição, a rolagem interpola abertura da lente, alcance da
 * névoa e exposição. É isso que faz a página mudar de clima ao descer: o
 * hero é amplo e frio, as regiões do meio são fechadas e contrastadas, e o
 * final abre tudo para revelar o mundo inteiro.
 *
 * O enquadramento lateral é feito mirando fora do eixo, nunca movendo a
 * estrutura. A conta usa a largura real do frustum naquela distância, então
 * a "zona segura" do texto continua livre em qualquer tamanho de janela.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { MARCOS, pontoDeFoco, raioDoFoco } from "@/components/landing/mundo/rota";
import { alvoDaRota, observar } from "@/components/landing/mundo/rolagem";
import { NEVOA } from "@/components/landing/mundo/paleta";

const GRAU = Math.PI / 180;

/** Interpola um campo numérico dos marcos na posição contínua `u`. */
function escalar(valores, t) {
  const i = Math.floor(t);
  const j = Math.min(valores.length - 1, i + 1);
  const f = t - i;
  return valores[i] * (1 - f) + valores[j] * f;
}

export function Camera({ semMovimento, largura }) {
  const { camera, scene, size } = useThree();

  const tSuave = useRef(0);
  const inicializado = useRef(false);
  const giro = useRef(0);
  const mouse = useRef({ x: 0, y: 0 });
  const mouseAlvo = useRef({ x: 0, y: 0 });

  /* --------------------------------------------------------- as curvas */
  const rota = useMemo(() => {
    const pontosCam = MARCOS.map((m) => new THREE.Vector3(...m.cam));
    const pontosFoco = MARCOS.map((m) => new THREE.Vector3(...pontoDeFoco(m)));
    return {
      cam: new THREE.CatmullRomCurve3(pontosCam, false, "catmullrom", 0.4),
      foco: new THREE.CatmullRomCurve3(pontosFoco, false, "catmullrom", 0.4),
      lado: MARCOS.map((m) => m.lado),
      raio: MARCOS.map((m) => raioDoFoco(m)),
      fov: MARCOS.map((m) => m.fov),
      nevoaPerto: MARCOS.map((m) => m.nevoa[0]),
      nevoaLonge: MARCOS.map((m) => m.nevoa[1]),
      /* A névoa deixou de ter cor única: ela viaja do dia ao crepúsculo. */
      nevoaCor: MARCOS.map((m) => new THREE.Color(NEVOA[m.clima] ?? NEVOA.fundo)),
      expo: MARCOS.map((m) => m.expo),
      ultimo: MARCOS.length - 1,
    };
  }, []);

  /* ------------------------------------------------- névoa e ouvintes */
  useEffect(() => {
    const nevoa = new THREE.Fog(new THREE.Color(NEVOA.fundo), 60, 400);
    scene.fog = nevoa;
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useEffect(() => observar(), []);

  useEffect(() => {
    if (semMovimento) return undefined;
    const aoMover = (e) => {
      mouseAlvo.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseAlvo.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    const aoSair = () => {
      mouseAlvo.current.x = 0;
      mouseAlvo.current.y = 0;
    };
    window.addEventListener("pointermove", aoMover, { passive: true });
    window.addEventListener("pointerleave", aoSair);
    return () => {
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("pointerleave", aoSair);
    };
  }, [semMovimento]);

  /* ------------------------------------------------------------ quadro */
  const vPos = useMemo(() => new THREE.Vector3(), []);
  const vFoco = useMemo(() => new THREE.Vector3(), []);
  const vDir = useMemo(() => new THREE.Vector3(), []);
  const vDireita = useMemo(() => new THREE.Vector3(), []);
  const vCima = useMemo(() => new THREE.Vector3(), []);
  const vAlvo = useMemo(() => new THREE.Vector3(), []);
  const corNevoa = useMemo(() => new THREE.Color(), []);
  const CIMA = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);

    /* cursor da rota, amortecido — nada salta de posição */
    const alvo = alvoDaRota();
    if (!inicializado.current) {
      tSuave.current = alvo;
      inicializado.current = true;
    } else {
      tSuave.current += (alvo - tSuave.current) * Math.min(1, d * 3.1);
    }
    const t = THREE.MathUtils.clamp(tSuave.current, 0, rota.ultimo);
    const u = rota.ultimo > 0 ? t / rota.ultimo : 0;

    mouse.current.x += (mouseAlvo.current.x - mouse.current.x) * Math.min(1, d * 2.4);
    mouse.current.y += (mouseAlvo.current.y - mouse.current.y) * Math.min(1, d * 2.4);

    /* lente */
    const fovAlvo = escalar(rota.fov, t);
    if (Math.abs(camera.fov - fovAlvo) > 0.01) {
      camera.fov += (fovAlvo - camera.fov) * Math.min(1, d * 4);
      camera.updateProjectionMatrix();
    }

    /* posição e foco */
    rota.cam.getPoint(u, vPos);
    rota.foco.getPoint(u, vFoco);

    vDir.copy(vFoco).sub(vPos);
    let distancia = Math.max(1, vDir.length());
    vDir.normalize();

    /**
     * TELAS ESTREITAS — a correção que o celular exige.
     *
     * Num retrato de 390 px o frustum é muito mais alto do que largo, então
     * um campo que cabia folgado no desktop passa a transbordar pelos dois
     * lados e a engolir o texto. Não adianta deslocar: não existe "outro
     * lado" para onde empurrar. A solução é AFASTAR a câmera até o campo
     * caber com folga na largura real, e só então subi-lo no quadro.
     *
     * O recuo é proporcional, calculado do próprio frustum, então funciona
     * em qualquer proporção de tela sem tabela de exceções.
     */
    const estreitoTela = largura < 900;
    if (estreitoTela) {
      const raioAtual = escalar(rota.raio, t);
      const meiaLarguraAtual =
        Math.tan((camera.fov * GRAU) / 2) * distancia * camera.aspect;
      const ocupacao = raioAtual / Math.max(1, meiaLarguraAtual);
      const LIMITE = 0.62; // o campo ocupa no máximo 62% da largura
      if (ocupacao > LIMITE) {
        distancia *= ocupacao / LIMITE;
        vPos.copy(vFoco).addScaledVector(vDir, -distancia);
      }
    }
    vDireita.copy(vDir).cross(CIMA).normalize();
    vCima.copy(vDireita).cross(vDir).normalize();

    const meiaAltura = Math.tan((camera.fov * GRAU) / 2) * distancia;
    const meiaLargura = meiaAltura * camera.aspect;

    /**
     * Desvio lateral — a regra que mantém o texto legível.
     *
     * Queremos que a borda interna da região caia em `BORDA` da largura da
     * tela, deixando a metade oposta livre para o texto. Em fração de tela, a
     * meia-região mede `raio / (2 · meiaLargura)`; o centro precisa então
     * estar em `BORDA + meiaRegiao`, o que dá o desvio abaixo. Como a conta
     * usa a largura real do frustum, o resultado se adapta sozinho a qualquer
     * janela: tela mais estreita, desvio maior.
     *
     * Em telas estreitas não existe "outro lado". Aí o assunto sobe, o texto
     * fica embaixo, e a separação passa a ser vertical.
     */
    const estreito = estreitoTela;
    const lado = estreito ? 0 : escalar(rota.lado, t);
    const raio = escalar(rota.raio, t);

    vAlvo.copy(vFoco);

    if (!estreito && lado !== 0) {
      const BORDA = 0.52;
      const meiaRegiao = raio / Math.max(1, 2 * meiaLargura);
      const fracao = Math.min(0.5, (BORDA - 0.5) * 2 + 2 * meiaRegiao);
      vAlvo.addScaledVector(vDireita, -lado * fracao * meiaLargura);
    } else if (estreito) {
      /* sobe o campo para o terço superior: o texto ocupa os dois terços
         de baixo, e a separação passa a ser vertical em vez de lateral */
      vAlvo.addScaledVector(vCima, -0.46 * meiaAltura);
    }

    /* reação do mouse: presente, mas discreta — o protagonista é o scroll */
    if (!semMovimento) {
      vAlvo.addScaledVector(vDireita, mouse.current.x * meiaLargura * 0.035);
      vAlvo.addScaledVector(vCima, mouse.current.y * meiaAltura * 0.03);
    }

    /* inclinação de curva: a câmera "deita" um pouco ao contornar o fundo */
    const deriva = (vPos.x - camera.position.x) / Math.max(d, 0.001);
    const giroAlvo = semMovimento
      ? 0
      : THREE.MathUtils.clamp(-deriva * 0.0022, -0.06, 0.06);
    giro.current += (giroAlvo - giro.current) * Math.min(1, d * 1.6);

    camera.position.copy(vPos);
    camera.up.set(0, 1, 0);
    camera.lookAt(vAlvo);
    camera.rotateZ(giro.current);

    /* atmosfera */
    if (scene.fog) {
      scene.fog.near += (escalar(rota.nevoaPerto, t) - scene.fog.near) * Math.min(1, d * 2.4);
      scene.fog.far += (escalar(rota.nevoaLonge, t) - scene.fog.far) * Math.min(1, d * 2.4);

      const i = Math.min(rota.ultimo, Math.floor(t));
      const j = Math.min(rota.ultimo, i + 1);
      corNevoa.copy(rota.nevoaCor[i]).lerp(rota.nevoaCor[j], t - i);
      scene.fog.color.lerp(corNevoa, Math.min(1, d * 2.4));
      // O fundo acompanha a névoa: sem isso o horizonte "descola" da cena.
      if (scene.background && scene.background.isColor) {
        scene.background.lerp(corNevoa, Math.min(1, d * 2.4));
      }
    }
    camera.userData.exposicao = escalar(rota.expo, t);
    camera.userData.rota = t;
    /* Publicados para o rig de luz: progresso normalizado e lado do assunto. */
    camera.userData.progresso = u;
    camera.userData.lado = estreito ? 0 : lado;
    camera.userData.distanciaFoco = distancia;
  });

  useEffect(() => {
    camera.aspect = size.width / Math.max(1, size.height);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

/* ------------------------------------------------------ pós-processamento */

/**
 * Bloom seletivo pelo limiar de luminância: só o que já é emissivo vira luz.
 * Fica desligado nos aparelhos de menor capacidade, onde os brilhos aditivos
 * o realce do vidro e do metal sustenta sozinho a leitura da luz.
 */
/**
 * Bloom. O limiar subiu de 0.72 para 0.94 e a intensidade padrão caiu para
 * 0.18: com o ambiente agora claro, um bloom generoso lavava a imagem inteira
 * e comia o contraste do texto. Nesta faixa ele só alcança o que é de fato
 * fonte de luz — sancas do teto, telas, traços de interface — que é o papel
 * que o efeito deveria ter desde o começo.
 */
export function Pos({ intensidade = 0.12, escala = 1, limiar = 0.94, desfoque = false }) {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    const alvo = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: 0,
    });
    const c = new EffectComposer(gl, alvo);
    c.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      intensidade,
      0.85,
      limiar
    );
    c.addPass(bloom);

    /**
     * Profundidade de campo. É o que separa "render em tempo real" de
     * "fotografia": o plano em foco fica nítido e o resto some suavemente.
     * O `focus` é atualizado a cada quadro com a distância real da câmera ao
     * alvo, e a abertura é pequena de propósito — desfoque exagerado vira
     * efeito, e aqui ele precisa passar despercebido.
     */
    let bokeh = null;
    if (desfoque) {
      bokeh = new BokehPass(scene, camera, { focus: 40, aperture: 0.00055, maxblur: 0.006 });
      c.addPass(bokeh);
    }
    c.addPass(new OutputPass());
    c.userData = { bokeh };
    return c;
  }, [gl, scene, camera, intensidade, limiar, desfoque]);

  useEffect(() => {
    const dpr = gl.getPixelRatio();
    composer.setPixelRatio(dpr * escala);
    composer.setSize(size.width, size.height);
  }, [composer, gl, size, escala]);

  useEffect(() => () => composer.dispose(), [composer]);

  useFrame(() => {
    gl.toneMappingExposure = camera.userData.exposicao || 1;
    const b = composer.userData?.bokeh;
    if (b) {
      const alvo = camera.userData.distanciaFoco || 40;
      const u = b.materialBokeh.uniforms;
      u.focus.value += (alvo - u.focus.value) * 0.08; // acompanha sem saltar
    }
    composer.render();
  }, 1);

  return null;
}

/** Sem pós-processamento, a exposição ainda acompanha a viagem. */
export function Exposicao() {
  const { gl, camera } = useThree();
  useFrame(() => {
    gl.toneMappingExposure = camera.userData.exposicao || 1;
  });
  return null;
}

/**
 * Materiais — a lista fechada aprovada na direção de arte.
 *
 * Vidro, alumínio escovado, nogueira, concreto claro, mármore discreto e LED
 * branco quente. Nada fora disso, e nada neon.
 *
 * Todos resolvem o brilho por REFLEXO do mapa de ambiente e pela iluminação;
 * `emissive` fica em zero em todos, exceto o LED. É essa disciplina que
 * mantém a cena parecendo fotografada em vez de colorida.
 */

import { useMemo } from "react";
import * as THREE from "three";
import { COR } from "@/components/landing/mundo/paleta";

/** Concreto claro / estofado: fosco, reflexo largo e fraco. */
export function useConcreto(cor = COR.concretoClaro, aspereza = 0.88, metal = 0.02) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: cor,
        roughness: aspereza,
        metalness: metal,
        envMapIntensity: 0.75,
      }),
    [cor, aspereza, metal]
  );
}

/**
 * Mármore polido. `roughness` baixo com `metalness` baixo é o que produz o
 * reflexo suave e alongado de pedra — diferente do reflexo nítido do metal.
 */
export function useMarmore(cor = COR.marmore, aspereza = 0.12) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: cor,
        roughness: aspereza,
        metalness: 0.04,
        envMapIntensity: 1.25,
      }),
    [cor, aspereza]
  );
}

/** Nogueira: quente, fosca, verniz discreto. */
export function useMadeira(cor = COR.nogueira) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: cor,
        roughness: 0.55,
        metalness: 0.0,
        envMapIntensity: 0.6,
      }),
    [cor]
  );
}

/** Alumínio escovado — caixilhos, perfis, detalhes. */
export function useAluminio(cor = COR.aluminio, aspereza = 0.4) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: cor,
        roughness: aspereza,
        metalness: 0.95,
        envMapIntensity: 1.3,
      }),
    [cor, aspereza]
  );
}

/**
 * Vidro de janela visto de DENTRO: quase invisível, com um véu de reflexo.
 * Sem `transmission` — refração real custa um passe inteiro e o que
 * precisamos aqui é da superfície, não da distorção.
 */
export function useVidroJanela(cor = COR.vidro, opacidade = 0.1) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: cor,
        transparent: true,
        opacity: opacidade,
        roughness: 0.03,
        metalness: 0.3,
        envMapIntensity: 1.8,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [cor, opacidade]
  );
}

/** Vidro de fachada visto de FORA: mais escuro e muito mais reflexivo. */
export function useVidroTorre(cor = COR.vidroTorre, opacidade = 0.62) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: cor,
        transparent: true,
        opacity: opacidade,
        roughness: 0.06,
        metalness: 0.72,
        envMapIntensity: 1.7,
      }),
    [cor, opacidade]
  );
}

/** LED branco quente — sancas e o traço aceso dos painéis de dado. */
export function useLed(cor = COR.sol, forca = 0.7) {
  return useMemo(
    () =>
      new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: forca }),
    [cor, forca]
  );
}

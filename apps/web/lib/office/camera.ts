/**
 * Escala que o design chama de "100%": a da prancha 01 (tile de 42,4 px).
 * O zoom exibido é `escala / ZOOM_UNIT`; o kit pede de 50% a 300%.
 * Fica fora da cena para poder ser importado sem carregar o PixiJS (que quebra no SSR).
 */
export const ZOOM_UNIT = 1.06;

/** Zoom da câmera ao abrir um checkpoint: 200% na unidade do design (prancha 02). */
export const CHECKPOINT_SCALE = 2 * ZOOM_UNIT;

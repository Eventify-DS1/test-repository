/**
 * Constantes de configuración para animaciones
 */

export const ANIMATION_DURATIONS = {
  fast: 500,
  normal: 800,
  slow: 1200,
  counter: 2000,
  stagger: 1000,
} as const;

export const ANIMATION_DELAYS = {
  none: 0,
  short: 200,
  medium: 400,
  long: 600,
} as const;

export const ANIMATION_EASINGS = {
  expo: 'easeOutExpo',
  elastic: 'easeOutElastic',
  spring: 'spring(1, 80, 10, 0)',
  bounce: 'easeOutBounce',
} as const;

export const STAGGER_DELAYS = {
  letter: 30,
  card: 150,
  item: 100,
} as const;

export const INTERSECTION_THRESHOLDS = {
  low: 0.1,
  medium: 0.3,
  high: 0.5,
} as const;


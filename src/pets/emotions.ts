import { EmotionCoordinate, EmotionType } from '../types/pet';

/**
 * Mathematical 3x3 Sprite Sheet Order:
 * ┌────────────┬────────────┬────────────┐
 * │ 0. FELIZ   │ 1. MOLESTO │ 2. RISA    │
 * │ (Fila 0,0) │ (Fila 0,1) │ (Fila 0,2) │
 * ├────────────┼────────────┼────────────┤
 * │ 3. CURIOSO │ 4. SORPRESA│ 5. DORMIR  │
 * │ (Fila 1,0) │ (Fila 1,1) │ (Fila 1,2) │
 * ├────────────┼────────────┼────────────┤
 * │ 6. COMER   │ 7. SALUDA  │ 8. PENSAR  │
 * │ (Fila 2,0) │ (Fila 2,1) │ (Fila 2,2) │
 * └────────────┴────────────┴────────────┘
 */
export const EMOTIONS_MAP: Record<EmotionType, EmotionCoordinate> = {
  feliz: {
    index: 0,
    row: 0,
    col: 0,
    label: 'Feliz',
    emoji: '😊',
  },
  molesto: {
    index: 1,
    row: 0,
    col: 1,
    label: 'Molesto',
    emoji: '😒',
  },
  risa: {
    index: 2,
    row: 0,
    col: 2,
    label: 'Risa',
    emoji: '😆',
  },
  curioso: {
    index: 3,
    row: 1,
    col: 0,
    label: 'Curioso',
    emoji: '🤔',
  },
  sorpresa: {
    index: 4,
    row: 1,
    col: 1,
    label: 'Sorprendido',
    emoji: '😮',
  },
  durmiendo: {
    index: 5,
    row: 1,
    col: 2,
    label: 'Durmiendo',
    emoji: '😴',
  },
  comiendo: {
    index: 6,
    row: 2,
    col: 0,
    label: 'Comiendo',
    emoji: '😋',
  },
  saluda: {
    index: 7,
    row: 2,
    col: 1,
    label: 'Saludando',
    emoji: '👋',
  },
  pensando: {
    index: 8,
    row: 2,
    col: 2,
    label: 'Pensando',
    emoji: '💭',
  },
};

export const ALLOWED_EMOTIONS: EmotionType[] = [
  'feliz',
  'molesto',
  'risa',
  'curioso',
  'sorpresa',
  'durmiendo',
  'comiendo',
  'saluda',
  'pensando',
];

export function normalizeEmotion(raw: string | undefined | null): EmotionType {
  if (!raw) return 'feliz';
  const clean = raw.toLowerCase().trim();

  if (clean === 'sorprendido' || clean === 'sorpresa' || clean === 'sorprend.') return 'sorpresa';
  if (clean === 'saludando' || clean === 'saluda') return 'saluda';
  if (clean === 'comiendo' || clean === 'comer') return 'comiendo';
  if (clean === 'durmiendo' || clean === 'dormir' || clean === 'cansado') return 'durmiendo';
  if (clean === 'pensativo' || clean === 'pensando' || clean === 'pensar') return 'pensando';
  if (clean === 'enojado' || clean === 'molesto' || clean === 'furioso') return 'molesto';
  if (clean === 'riendo' || clean === 'risa' || clean === 'alegre') return 'risa';
  if (clean === 'curioso' || clean === 'duda' || clean === 'pregunta') return 'curioso';
  if (clean === 'feliz' || clean === 'contento') return 'feliz';

  return ALLOWED_EMOTIONS.includes(clean as EmotionType) ? (clean as EmotionType) : 'feliz';
}

/**
 * Mathematical 3x3 grid calculation
 */
export function getSpriteCellRect(index: number, sheetWidth: number, sheetHeight: number) {
  const cellWidth = sheetWidth / 3;
  const cellHeight = sheetHeight / 3;
  const col = index % 3;
  const row = Math.floor(index / 3);

  return {
    x: col * cellWidth,
    y: row * cellHeight,
    width: cellWidth,
    height: cellHeight,
    col,
    row,
  };
}

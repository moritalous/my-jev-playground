export const BACK_Y = 22;
export const FRONT_Y = 91;

export const FAR_SCALE = 0.6;

export function depthToY(t: number): number {
  return BACK_Y + (FRONT_Y - BACK_Y) * t ** 1.3;
}

export function scaleAt(t: number): number {
  return FAR_SCALE + (1 - FAR_SCALE) * t;
}

const ROW_STEP = 1 / 7;

export function rowDepth(row: number, rows: number): number {
  if (rows <= 1) return 1;
  const step = Math.min(ROW_STEP, 1 / (rows - 1));
  return Math.max(0, 1 - row * step);
}

export const DEPTH_RULES = [1, 5 / 7, 3 / 7, 1 / 7].map((t) => depthToY(t) + 3);

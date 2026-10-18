export const SCORE_MAX = 3;

export const DENSITY_CUTOFF = 1.5;

export function densityOf(marks: number[]): number {
  if (marks.length === 0) return 0;
  return Math.round((marks.reduce((sum, m) => sum + m, 0) / marks.length) * 10) / 10;
}

export const isElevated = (density: number | null | undefined) => (density ?? 0) >= DENSITY_CUTOFF;

export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[\s()-]/g, "");
  const match = /^(?:\+?254|0)([17]\d{8})$/.exec(digits);
  return match ? `+254${match[1]}` : null;
}

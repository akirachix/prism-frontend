export interface ContentRow {
  label: string;
  value: string;
}

export interface ContentSection {
  title: string;
  rows: ContentRow[];
}

const DOMAIN_WORDS: Record<string, string> = {
  AUTISM: "Social communication and play",
  ADHD: "Attention and activity",
  DYSLEXIA: "Reading and spelling",
};

const LEVEL_WORDS: Record<string, string> = {
  LOW: "No concern seen",
  MEDIUM: "Some signs to watch",
  ELEVATED: "Worth extra support",
};

const KEY_WORDS: Record<string, string> = {
  levels: "Results by area",
  combined: "Together",
  teacher: "Teacher",
  parent: "Parent",
  concern: "Extra support suggested",
  primaryDomain: "Main area to support",
  discrepancies: "Teacher and parent saw these differently",
  completed_at: "Finished on",
};

const HIDDEN_KEYS = new Set([
  "kind",
  "answers",
  "responder_id",
  "age_gate",
  "scores",
  "densityScore",
  "computed_at",
  "updated_at",
]);

export function humanize(key: string): string {
  if (DOMAIN_WORDS[key]) return DOMAIN_WORDS[key];
  if (KEY_WORDS[key]) return KEY_WORDS[key];
  const text = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;

export function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(Math.round(value * 100) / 100);
  if (typeof value === "string") {
    if (LEVEL_WORDS[value]) return LEVEL_WORDS[value];
    if (DOMAIN_WORDS[value]) return DOMAIN_WORDS[value];
    if (ISO_DATE.test(value)) {
      return new Date(value).toLocaleDateString("en-KE", {
        dateStyle: "medium",
      });
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? "None" : value.map(displayValue).join(", ");
  }
  return "—";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function describeReport(
  content: Record<string, unknown>,
): ContentSection[] {
  const sections: ContentSection[] = [];
  const summary: ContentRow[] = [];

  function walk(title: string, value: Record<string, unknown>) {
    const rows: ContentRow[] = [];
    for (const [key, item] of Object.entries(value)) {
      if (HIDDEN_KEYS.has(key)) continue;
      if (isObject(item)) walk(`${title} · ${humanize(key)}`, item);
      else rows.push({ label: humanize(key), value: displayValue(item) });
    }
    if (rows.length > 0) sections.push({ title, rows });
  }

  for (const [key, value] of Object.entries(content)) {
    if (HIDDEN_KEYS.has(key)) continue;
    if (isObject(value)) walk(humanize(key), value);
    else summary.push({ label: humanize(key), value: displayValue(value) });
  }

  if (summary.length > 0) sections.unshift({ title: "Summary", rows: summary });
  return sections;
}

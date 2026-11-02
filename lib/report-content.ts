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
  MODERATE: "Some signs to watch",
  HIGH: "Worth extra support",
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
  summary: "Overview",
  primary_domain: "Main area to support",
  support_plan_recommended: "Support plan suggested",
  next_step: "Next step",
  domains: "Results by area",
  not_screened: "Areas not looked at further",
  level: "What we saw",
  meaning: "What this means",
  score: "Score",
  overall_score: "Overall score",
};

const NOT_SCREENED_TEXT = "No further questions were needed";

const HIDDEN_KEYS = new Set([
  "kind",
  "answers",
  "responder_id",
  "age_gate",
  "scores",
  "densityScore",
  "computed_at",
  "updated_at",
  "scale_max",
  "tool",
  "band_label",
  "domain",
  "status",
  "disclaimer",
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

function isObjectList(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.length > 0 && value.every(isObject);
}

function areaName(item: Record<string, unknown>): string {
  const domain = typeof item.domain === "string" ? item.domain : "";
  return DOMAIN_WORDS[domain] ?? humanize(domain || "Area");
}

/** The report's own disclaimer, shown once in the warning box instead of as a row. */
export function reportDisclaimer(
  content: Record<string, unknown>,
): string | null {
  const text = content.disclaimer;
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

const SCORE_KEYS = new Set(["score", "overall_score"]);

/** One row; a score is shown with the top of its scale, e.g. "2.8 out of 3". */
function rowFor(
  key: string,
  item: unknown,
  parent: Record<string, unknown>,
): ContentRow {
  let value = displayValue(item);
  if (SCORE_KEYS.has(key) && typeof item === "number") {
    const max = parent.scale_max;
    const rounded = String(Math.round(item * 10) / 10);
    value = typeof max === "number" ? `${rounded} out of ${max}` : rounded;
  }
  return { label: humanize(key), value };
}

export function describeReport(
  content: Record<string, unknown>,
): ContentSection[] {
  const sections: ContentSection[] = [];
  const summary: ContentRow[] = [];

  function rowsOf(value: Record<string, unknown>): ContentRow[] {
    return Object.entries(value)
      .filter(([key, item]) => !HIDDEN_KEYS.has(key) && !isObject(item))
      .filter(([, item]) => !(Array.isArray(item) && item.length === 0))
      .map(([key, item]) => rowFor(key, item, value));
  }

  function list(key: string, items: Record<string, unknown>[]) {
    const detailed = items.some((item) => rowsOf(item).length > 0);
    if (!detailed) {
      sections.push({
        title: humanize(key),
        rows: items.map((item) => ({
          label: areaName(item),
          value: NOT_SCREENED_TEXT,
        })),
      });
      return;
    }
    for (const item of items) {
      const rows = rowsOf(item);
      if (rows.length > 0) sections.push({ title: areaName(item), rows });
    }
  }

  function walk(title: string, value: Record<string, unknown>) {
    const rows: ContentRow[] = [];
    for (const [key, item] of Object.entries(value)) {
      if (HIDDEN_KEYS.has(key)) continue;
      if (isObjectList(item)) list(key, item);
      else if (isObject(item)) walk(`${title} · ${humanize(key)}`, item);
      else rows.push(rowFor(key, item, value));
    }
    if (rows.length > 0) sections.push({ title, rows });
  }

  for (const [key, value] of Object.entries(content)) {
    if (HIDDEN_KEYS.has(key)) continue;
    if (isObjectList(value)) list(key, value);
    else if (isObject(value)) walk(humanize(key), value);
    else if (Array.isArray(value) && value.length === 0) continue;
    else summary.push({ label: humanize(key), value: displayValue(value) });
  }

  if (summary.length > 0) sections.unshift({ title: "Summary", rows: summary });
  return sections;
}

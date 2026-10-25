export function labelOf(status: string): string {
  const text = status.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDay(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
  });
}

export function relativeDay(value: string, now = new Date()): string {
  const date = new Date(value);
  const start = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(now) - start(date)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return formatDay(value);
}

export function initials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "ST";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export const AVATAR_COLOURS = [
  "#ff8c42",
  "#b8d4e8",
  "#d62839",
  "#2f77b5",
  "#0a2a66",
];

export function avatarColour(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLOURS[hash % AVATAR_COLOURS.length];
}

export type PillTone = "orange" | "blush" | "sky" | "outline" | "red" | "grey";

export function formatLongDay(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

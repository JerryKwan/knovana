/**
 * Formats a Date object into an ISO 8601 string containing local timezone offset,
 * which is commonly used in Obsidian YAML frontmatter (e.g. 2024-12-01T14:30:00+08:00).
 */
export function getISOStringWithOffset(date: Date = new Date()): string {
  const tzOffset = -date.getTimezoneOffset();
  const diff = tzOffset >= 0 ? "+" : "-";
  const pad = (num: number) => String(num).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  const offsetHours = pad(Math.floor(Math.abs(tzOffset) / 60));
  const offsetMinutes = pad(Math.abs(tzOffset) % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${diff}${offsetHours}:${offsetMinutes}`;
}

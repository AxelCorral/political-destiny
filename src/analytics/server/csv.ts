function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n]/u.test(text)) return `"${text.replace(/"/gu, '""')}"`;
  return text;
}

/** Minimal CSV serializer — no dependency needed for this few-columns, few-thousand-rows use case. */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]!);
  const header = columns.join(",");
  const lines = rows.map((row) => columns.map((column) => escapeCsvCell(row[column])).join(","));
  return [header, ...lines].join("\n");
}

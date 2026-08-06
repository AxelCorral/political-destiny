/** Minimal, dependency-free CSV writer. */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (/[",\n;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return columns ? `${columns.join(",")}\n` : "";
  const cols = columns ?? Object.keys(rows[0]!);
  const header = cols.join(",");
  const lines = rows.map((row) => cols.map((col) => escapeCell(row[col])).join(","));
  return `${[header, ...lines].join("\n")}\n`;
}

/** Minimal RFC4180-ish CSV parser: handles quoted cells with embedded commas/newlines. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;
  const push = () => {
    row.push(cell);
    cell = "";
  };
  const pushRow = () => {
    push();
    rows.push(row);
    row = [];
  };
  while (i < text.length) {
    const char = text[i]!;
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += char;
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      push();
      i += 1;
      continue;
    }
    if (char === "\n") {
      pushRow();
      i += 1;
      continue;
    }
    if (char === "\r") {
      i += 1;
      continue;
    }
    cell += char;
    i += 1;
  }
  if (cell.length > 0 || row.length > 0) pushRow();
  const [header, ...body] = rows.filter((r) => !(r.length === 1 && r[0] === ""));
  if (!header) return [];
  return body.map((cells) =>
    Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])),
  );
}

export const num = (value: string | undefined): number => Number.parseFloat(value ?? "0") || 0;
export const bool = (value: string | undefined): boolean => value === "true";
export const str = (value: string | undefined): string => value ?? "";

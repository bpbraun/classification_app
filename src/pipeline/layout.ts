/** A run of text from a PDF page, positioned in PDF units (y grows upward). */
export interface TextItem {
  page: number;
  x: number;
  y: number;
  text: string;
}

/** Items that share a baseline, left to right. */
export interface Line {
  page: number;
  y: number;
  items: TextItem[];
}

const SAME_LINE_TOLERANCE = 3;

/** Groups a page's items into lines, top to bottom. */
export function groupLines(items: readonly TextItem[]): Line[] {
  const sorted = items
    .filter((i) => i.text.trim().length > 0)
    .sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);
  const lines: Line[] = [];
  for (const item of sorted) {
    const last = lines.at(-1);
    if (last && last.page === item.page && Math.abs(last.y - item.y) <= SAME_LINE_TOLERANCE) {
      last.items.push(item);
      last.items.sort((a, b) => a.x - b.x);
    } else {
      lines.push({ page: item.page, y: item.y, items: [item] });
    }
  }
  return lines;
}

export function lineText(line: Line): string {
  return normalizeSpace(line.items.map((i) => i.text).join(" "));
}

export function normalizeSpace(text: string): string {
  return text.replace(/\s+/g, " ").replace(/\(\s+/g, "(").trim();
}

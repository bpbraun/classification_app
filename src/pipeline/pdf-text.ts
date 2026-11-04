import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { getDocument, type PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem } from "./layout";

export async function sha256File(path: string): Promise<string> {
  return createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
}

/** Reads positioned text from the requested pages of a PDF. Page numbers start at 1. */
export async function readTextItems(path: string, pages: readonly number[]): Promise<TextItem[]> {
  const data = new Uint8Array(await readFile(path));
  const task = getDocument({ data, useSystemFonts: true });
  const pdf = await task.promise;
  try {
    const perPage = await Promise.all(pages.map((page) => pageItems(pdf, page)));
    return perPage.flat();
  } finally {
    await task.destroy();
  }
}

async function pageItems(pdf: PDFDocumentProxy, page: number): Promise<TextItem[]> {
  const content = await (await pdf.getPage(page)).getTextContent();
  return content.items.flatMap((item) =>
    "str" in item ? [{ page, x: item.transform[4], y: item.transform[5], text: item.str }] : [],
  );
}

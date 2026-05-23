import "server-only";

const PDF_SIGNATURE = "%PDF-";
const MIN_READABLE_TEXT_LENGTH = 120;
const MAX_EXTRACTED_TEXT_LENGTH = 18000;

export class PdfTextExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfTextExtractionError";
  }
}

function decodePdfLiteralString(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function decodePdfHexString(value: string) {
  const compact = value.replace(/\s+/g, "");

  if (compact.length < 4 || compact.length % 2 !== 0) {
    return "";
  }

  const bytes: number[] = [];

  for (let index = 0; index < compact.length; index += 2) {
    const byte = Number.parseInt(compact.slice(index, index + 2), 16);

    if (Number.isNaN(byte)) {
      return "";
    }

    bytes.push(byte);
  }

  return Buffer.from(bytes).toString("utf8");
}

function cleanExtractedText(value: string) {
  return value
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\p{L}\p{N}\p{P}\p{Sc}\p{Zs}\n]/gu, " ")
    .trim()
    .slice(0, MAX_EXTRACTED_TEXT_LENGTH);
}

export function extractReadableTextFromPdf(pdf: Buffer) {
  const header = pdf.subarray(0, PDF_SIGNATURE.length).toString("latin1");

  if (header !== PDF_SIGNATURE) {
    throw new PdfTextExtractionError("Il file non sembra un PDF valido.");
  }

  const source = pdf.toString("latin1");
  const chunks: string[] = [];
  const literalMatches = source.matchAll(/\((?:\\.|[^\\)]){2,}\)/g);

  for (const match of literalMatches) {
    chunks.push(decodePdfLiteralString(match[0].slice(1, -1)));
  }

  const hexMatches = source.matchAll(/<([0-9a-fA-F\s]{8,})>/g);

  for (const match of hexMatches) {
    chunks.push(decodePdfHexString(match[1]));
  }

  const text = cleanExtractedText(chunks.join("\n"));

  if (text.length < MIN_READABLE_TEXT_LENGTH) {
    throw new PdfTextExtractionError(
      "Il PDF non contiene testo leggibile senza OCR."
    );
  }

  return text;
}

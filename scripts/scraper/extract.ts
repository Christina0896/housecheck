export type LandExtraction = {
  acres: number;
  hectares: number;
  approximate: boolean;
  evidenceText: string;
  sourceUnit: "acre" | "hectare";
};

type Candidate = LandExtraction & { score: number; index: number };

const APPROXIMATE_MARKER = String.raw`(?:approximately|approx\.?|c\.?|circa|about|roughly)?`;
const NUMBER = String.raw`(\d{1,4}(?:[.,]\d{1,4})?)`;
const ACRE_PATTERN = new RegExp(
  String.raw`${APPROXIMATE_MARKER}\s*${NUMBER}\s*(?:acres?|ac\b)`,
  "gi",
);
const HECTARE_PATTERN = new RegExp(
  String.raw`${APPROXIMATE_MARKER}\s*${NUMBER}\s*(?:hectares?|ha\b)`,
  "gi",
);

export function extractLandSize(text: string): LandExtraction | null {
  const normalized = normalizeWhitespace(text);
  const candidates = [
    ...buildCandidates(normalized, ACRE_PATTERN, "acre"),
    ...buildCandidates(normalized, HECTARE_PATTERN, "hectare"),
  ];

  if (!candidates.length) return null;

  candidates.sort((a, b) => b.score - a.score || a.index - b.index);
  const best = candidates[0];
  return {
    acres: round(best.acres, 4),
    hectares: round(best.hectares, 4),
    approximate: best.approximate,
    evidenceText: best.evidenceText,
    sourceUnit: best.sourceUnit,
  };
}

function buildCandidates(
  text: string,
  pattern: RegExp,
  unit: "acre" | "hectare",
): Candidate[] {
  const candidates: Candidate[] = [];
  pattern.lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const value = parseListingNumber(match[1]);
    if (!Number.isFinite(value) || value <= 0) continue;

    const index = match.index ?? 0;
    const contextStart = Math.max(0, index - 90);
    const contextEnd = Math.min(text.length, index + match[0].length + 90);
    const context = text.slice(contextStart, contextEnd);
    const lowerContext = context.toLowerCase();
    let score = 1;

    for (const phrase of [
      "standing on",
      "set on",
      "sits on",
      "extends to",
      "comprising",
      "comprises",
      "the property",
      "the holding",
      "site area",
      "grounds",
      "land included",
    ]) {
      if (lowerContext.includes(phrase)) score += 3;
    }

    for (const phrase of [
      "nearby",
      "surrounding farmland",
      "views over",
      "neighbouring",
      "farm extending",
      "within a",
    ]) {
      if (lowerContext.includes(phrase)) score -= 3;
    }

    const raw = match[0];
    const approximate = /approximately|approx\.?|c\.?|circa|about|roughly/i.test(raw);
    const acres = unit === "acre" ? value : value * 2.47105381;
    const hectares = unit === "hectare" ? value : value / 2.47105381;

    candidates.push({
      acres,
      hectares,
      approximate,
      evidenceText: context.trim(),
      sourceUnit: unit,
      score,
      index,
    });
  }

  return candidates;
}

export function extractPrice(text: string): number {
  const match = text.match(/€\s*([\d,.]+)/);
  if (!match) return 0;
  return Math.round(parseListingNumber(match[1]));
}

export function extractBedrooms(text: string): number {
  return extractCount(text, [
    /(\d+)\s*(?:bed|beds|bedroom|bedrooms)\b/i,
    /bedrooms?\s*[:\-]?\s*(\d+)/i,
  ]);
}

export function extractBathrooms(text: string): number {
  return extractCount(text, [
    /(\d+)\s*(?:bath|baths|bathroom|bathrooms)\b/i,
    /bathrooms?\s*[:\-]?\s*(\d+)/i,
  ]);
}

export function extractFloorAreaSqm(text: string): number | null {
  const metric = text.match(/(\d{2,5}(?:[.,]\d+)?)\s*(?:m²|m2|sq\.?\s*m(?:etres?)?)/i);
  if (metric) return round(parseListingNumber(metric[1]), 2);

  const imperial = text.match(/(\d{3,6}(?:[.,]\d+)?)\s*(?:sq\.?\s*ft|ft²)/i);
  if (imperial) return round(parseListingNumber(imperial[1]) * 0.092903, 2);

  return null;
}

export function extractBerRating(text: string): string | null {
  const direct = text.match(/\bBER\s*(?:rating)?\s*[:\-]?\s*([A-G][1-3])\b/i);
  if (direct) return direct[1].toUpperCase();
  return null;
}

export function extractEircode(text: string): string | null {
  const match = text.toUpperCase().match(
    /\b((?:[AC-FHKNPRTV-Y]\d{2}|D6W)\s?[0-9AC-FHKNPRTV-Y]{4})\b/,
  );
  if (!match) return null;
  const compact = match[1].replace(/\s+/g, "");
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

export function normalizeDescription(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function summarize(text: string, maxLength = 280): string {
  const clean = normalizeWhitespace(text);
  if (clean.length <= maxLength) return clean;
  const clipped = clean.slice(0, maxLength + 1);
  const sentenceEnd = Math.max(
    clipped.lastIndexOf(". "),
    clipped.lastIndexOf("! "),
    clipped.lastIndexOf("? "),
  );
  if (sentenceEnd > maxLength * 0.55) return clipped.slice(0, sentenceEnd + 1);
  return `${clipped.slice(0, maxLength).trimEnd()}…`;
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function extractCount(text: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number.parseInt(match[1], 10);
  }
  return 0;
}

function parseListingNumber(value: string): number {
  const cleaned = value.trim();
  const commaCount = (cleaned.match(/,/g) ?? []).length;
  const dotCount = (cleaned.match(/\./g) ?? []).length;

  if (commaCount === 1 && dotCount === 0) {
    const digitsAfterComma = cleaned.split(",")[1]?.length ?? 0;
    return Number.parseFloat(
      digitsAfterComma <= 2 ? cleaned.replace(",", ".") : cleaned.replace(/,/g, ""),
    );
  }

  return Number.parseFloat(cleaned.replace(/,/g, ""));
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

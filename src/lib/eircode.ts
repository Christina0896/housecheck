const EIRCODE_PATTERN = /\b((?:[A-Z]\d{2}|D6W)\s?[A-Z0-9]{4})\b/i;

export function normaliseEircode(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.toUpperCase().match(EIRCODE_PATTERN);
  if (!match) return null;
  const compact = match[1].replace(/\s+/g, "");
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

export function extractEircode(text: string): string | null {
  return normaliseEircode(text);
}

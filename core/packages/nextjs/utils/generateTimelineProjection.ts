const MIN_MONTHS = 2;
const MAX_MONTHS = 5 * 12;

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const DURATION_PART_RE = /^([\d.]+)\s*(month|months|year|years)$/i;

export const formatDurationRange = (lowMonths: number, highMonths: number): string => {
  if (lowMonths >= 12 && highMonths >= 12) {
    const lowY = Math.round((lowMonths / 12) * 2) / 2;
    const highY = Math.round((highMonths / 12) * 2) / 2;
    return `${lowY}-${highY} years`;
  }
  if (highMonths < 12) {
    return `${lowMonths}-${highMonths} months`;
  }
  const lowLabel = lowMonths === 1 ? "1 month" : `${lowMonths} months`;
  const highYears = Math.round((highMonths / 12) * 2) / 2;
  const highLabel = highYears === 1 ? "1 year" : `${highYears} years`;
  return `${lowLabel} – ${highLabel}`;
};

const parseDurationPartToMonths = (part: string): number | null => {
  const match = part.trim().match(DURATION_PART_RE);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return match[2].toLowerCase().startsWith("year") ? num * 12 : num;
};

/** Normalizes stored values (e.g. "2 years – 3 years") to display form "2-3 years". */
export const formatTimelineProjectionDisplay = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const parts = trimmed.split(/\s*[–-]\s*/);
  if (parts.length !== 2) return value;

  const lowMonths = parseDurationPartToMonths(parts[0]);
  const highMonths = parseDurationPartToMonths(parts[1]);
  if (lowMonths === null || highMonths === null) return value;

  return formatDurationRange(lowMonths, highMonths);
};

/** Random case timeline band between 2 months and 5 years (e.g. "2-3 years"). */
export const generateTimelineProjection = (): string => {
  const low = randomInt(MIN_MONTHS, MAX_MONTHS - 1);
  const high = randomInt(low + 1, MAX_MONTHS);
  return formatDurationRange(low, high);
};

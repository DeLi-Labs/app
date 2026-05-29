/** Realistic litigation damages tiers (USD, low–high). */
const DAMAGES_TIERS: ReadonlyArray<readonly [number, number]> = [
  [500_000, 2_000_000],
  [1_000_000, 3_000_000],
  [2_000_000, 5_000_000],
  [3_000_000, 8_000_000],
  [5_000_000, 12_000_000],
  [8_000_000, 20_000_000],
  [12_000_000, 30_000_000],
  [20_000_000, 50_000_000],
  [35_000_000, 80_000_000],
  [50_000_000, 120_000_000],
];

const DAMAGES_RANGE_RE = /^([\d.]+)\s*([KMkm]?)\s*[-–]\s*([\d.]+)\s*([KMkm]?)\s*\$?$/;

const toUsd = (num: number, unit: string): number => {
  if (unit.toUpperCase() === "M") return num * 1_000_000;
  if (unit.toUpperCase() === "K") return num * 1_000;
  return num;
};

export const formatDamagesRange = (lowUsd: number, highUsd: number): string => {
  if (highUsd >= 1_000_000) {
    const lowM = Math.round((lowUsd / 1_000_000) * 2) / 2;
    const highM = Math.round((highUsd / 1_000_000) * 2) / 2;
    return `${lowM}-${highM}M$`;
  }
  const lowK = Math.round(lowUsd / 100_000) * 100;
  const highK = Math.round(highUsd / 100_000) * 100;
  return `${lowK}-${highK}K$`;
};

/** Normalizes stored values (e.g. "2M-5M$") to display form "2-5M$". */
export const formatEstimatedDamagesDisplay = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const match = trimmed.match(DAMAGES_RANGE_RE);
  if (!match) return value;

  const lowUsd = toUsd(parseFloat(match[1]), match[2]);
  const highUsd = toUsd(parseFloat(match[3]), match[4]);
  return formatDamagesRange(lowUsd, highUsd);
};

/**
 * Picks a random realistic estimated-damages band for new campaign metadata (e.g. "2-5M$").
 */
export const generateEstimatedDamages = (): string => {
  const tier = DAMAGES_TIERS[Math.floor(Math.random() * DAMAGES_TIERS.length)];
  const [tierLow, tierHigh] = tier;
  const span = tierHigh - tierLow;
  const jitterLow = span * 0.15 * Math.random();
  const jitterHigh = span * 0.1 * Math.random();
  let low = tierLow + jitterLow;
  let high = tierHigh - jitterHigh;
  if (high <= low) {
    high = low + span * 0.4;
  }
  return formatDamagesRange(low, high);
};

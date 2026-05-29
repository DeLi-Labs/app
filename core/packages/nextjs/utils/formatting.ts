/** Renders stored `\n` escape sequences as real line breaks for display. */
export const normalizeMultilineText = (text: string): string =>
  text.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");

export const formatDollar = (val: string | number | undefined | null) => {
  if (val === undefined || val === null) return "$0";
  const num = typeof val === "string" ? parseFloat(val) : (val as number);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatNumber = (val: string | number | undefined | null) => {
  if (val === undefined || val === null) return "0";
  const num = typeof val === "string" ? parseFloat(val) : (val as number);
  return new Intl.NumberFormat("en-US").format(num);
};

export const getChartPriceMaxFractionDigits = (value: number): number => {
  if (!Number.isFinite(value)) return 8;
  const abs = Math.abs(value);
  if (abs >= 1) return 4;
  if (abs >= 0.01) return 6;
  return 8;
};

export const formatChartPrice = (value: number): string => {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: getChartPriceMaxFractionDigits(value),
  }).format(value);
};

/** Rounds a token amount to the same precision used for chart price display (for swap quote inputs). */
export const formatAmountToChartPrecision = (value: number | string): string => {
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  if (!Number.isFinite(num)) return typeof value === "string" ? value : "0";

  return new Intl.NumberFormat(undefined, {
    useGrouping: false,
    maximumFractionDigits: getChartPriceMaxFractionDigits(num),
  }).format(num);
};

export const formatTokenTableDollar = (
  val?: string | number | null,
  { alwaysShowCents = false }: { alwaysShowCents?: boolean } = {},
) => {
  if (val === undefined || val === null || val === "") return "$0";
  const num = typeof val === "string" ? Number.parseFloat(val) : val;
  if (Number.isNaN(num)) return "$0";

  const noFraction = num > 1000;

  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: noFraction ? 0 : alwaysShowCents ? 2 : 0,
    maximumFractionDigits: noFraction ? 0 : 2,
  })}`;
};

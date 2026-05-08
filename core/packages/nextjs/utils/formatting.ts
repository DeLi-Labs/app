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

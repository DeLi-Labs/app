export const DEFAULT_NUMERAIRE_LOGO_URL = "/numeraire-logos/usd-coin-usdc-logo.png";

export const NUMERAIRE_LOGO_BY_ADDRESS: Record<string, string> = {
  "0x545FEe85C38DC3369B21430FDFB086F51834BFa7": "/numeraire-logos/usd-coin-usdc-logo.png",
};

export function getNumeraireLogoUrl(numeraireAddress?: string | null): string {
  const key = (numeraireAddress ?? "").trim().toLowerCase();
  if (!key) return DEFAULT_NUMERAIRE_LOGO_URL;
  return NUMERAIRE_LOGO_BY_ADDRESS[key] ?? DEFAULT_NUMERAIRE_LOGO_URL;
}

export const CAMPAIGN_NUMERAIRE_ADDRESSES: readonly `0x${string}`[] = [
  "0x545FEe85C38DC3369B21430FDFB086F51834BFa7",
] as const;

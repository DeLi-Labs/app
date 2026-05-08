export const DEFAULT_NUMERAIRE_LOGO_URL = "/numeraire-logos/usd-coin-usdc-logo.png";

export const NUMERAIRE_LOGO_BY_ADDRESS: Record<string, string> = {
  "0xa965c3fbf0dc87367858f791fadae2d6fde9f0f7": "/numeraire-logos/usd-coin-usdc-logo.png",
};

export function getNumeraireLogoUrl(numeraireAddress?: string | null): string {
  const key = (numeraireAddress ?? "").trim().toLowerCase();
  if (!key) return DEFAULT_NUMERAIRE_LOGO_URL;
  return NUMERAIRE_LOGO_BY_ADDRESS[key] ?? DEFAULT_NUMERAIRE_LOGO_URL;
}

export const CAMPAIGN_NUMERAIRE_ADDRESSES: readonly `0x${string}`[] = [
  "0xA965C3FbF0dc87367858F791FADAE2d6FdE9f0F7",
] as const;

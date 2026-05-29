export const DEFAULT_NUMERAIRE_LOGO_URL = "/numeraire-logos/usd-coin-usdc-logo.png";

export const NUMERAIRE_LOGO_BY_ADDRESS: Record<string, string> = {
  "0xccC58F3AbE26395fd65f339bE33d6D0885d70430": "/numeraire-logos/usd-coin-usdc-logo.png",
};

export function getNumeraireLogoUrl(numeraireAddress?: string | null): string {
  const key = (numeraireAddress ?? "").trim().toLowerCase();
  if (!key) return DEFAULT_NUMERAIRE_LOGO_URL;
  return NUMERAIRE_LOGO_BY_ADDRESS[key] ?? DEFAULT_NUMERAIRE_LOGO_URL;
}

export const CAMPAIGN_NUMERAIRE_ADDRESSES: readonly `0x${string}`[] = [
  "0xccC58F3AbE26395fd65f339bE33d6D0885d70430",
] as const;

import { normalizeExternalUrl } from "~~/utils/openCorporatesUrl";

export const isValidHttpUrl = (url: string): boolean => {
  try {
    const parsed = new URL(normalizeExternalUrl(url));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const hostMatches = (url: string, matchers: string[]): boolean => {
  try {
    const parsed = new URL(normalizeExternalUrl(url));
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return matchers.some(m => host === m || host.endsWith(`.${m}`));
  } catch {
    return false;
  }
};

export const isValidEspacenetUrl = (url: string): boolean => hostMatches(url, ["espacenet.com"]);

export const isValidEpoUrl = (url: string): boolean => hostMatches(url, ["epo.org"]);

export const isValidLinkedinUrl = (url: string): boolean => hostMatches(url, ["linkedin.com"]);

export type RegistryUrlValidationResult = { valid: true; normalized: string } | { valid: false; error: string };

const validateWithMatcher = (
  url: string,
  label: string,
  matcher: (u: string) => boolean,
  example: string,
  requireValue: boolean,
): RegistryUrlValidationResult => {
  const trimmed = url.trim();
  if (!trimmed) {
    return requireValue ? { valid: false, error: `${label} URL is required` } : { valid: false, error: "" };
  }
  if (!matcher(trimmed)) {
    return { valid: false, error: `Enter a valid ${label} URL (e.g. ${example})` };
  }
  return { valid: true, normalized: normalizeExternalUrl(trimmed) };
};

export const validateEspacenetUrl = (url: string, requireValue = true): RegistryUrlValidationResult =>
  validateWithMatcher(
    url,
    "Espacenet",
    isValidEspacenetUrl,
    "https://worldwide.espacenet.com/patent/...",
    requireValue,
  );

export const validateEpoUrl = (url: string, requireValue = true): RegistryUrlValidationResult =>
  validateWithMatcher(url, "EPO", isValidEpoUrl, "https://register.epo.org/...", requireValue);

export const validateLinkedinUrl = (url: string, requireValue = true): RegistryUrlValidationResult =>
  validateWithMatcher(url, "LinkedIn", isValidLinkedinUrl, "https://www.linkedin.com/in/...", requireValue);

export const validateOwnerWebsiteUrl = (url: string, requireValue = true): RegistryUrlValidationResult => {
  const trimmed = url.trim();
  if (!trimmed) {
    return requireValue
      ? { valid: false, error: "Owner's website URL is required" }
      : { valid: false, error: "" };
  }
  if (!isValidHttpUrl(trimmed)) {
    return { valid: false, error: "Enter a valid website URL (e.g. https://example.com)" };
  }
  return { valid: true, normalized: normalizeExternalUrl(trimmed) };
};

export const getEspacenetFieldError = (url: string, requireValue = false): string | null => {
  const result = validateEspacenetUrl(url, requireValue);
  return result.valid ? null : result.error || null;
};

export const getEpoFieldError = (url: string, requireValue = false): string | null => {
  const result = validateEpoUrl(url, requireValue);
  return result.valid ? null : result.error || null;
};

export const getLinkedinFieldError = (url: string, requireValue = false): string | null => {
  const result = validateLinkedinUrl(url, requireValue);
  return result.valid ? null : result.error || null;
};

export const getOwnerWebsiteFieldError = (url: string, requireValue = false): string | null => {
  const result = validateOwnerWebsiteUrl(url, requireValue);
  return result.valid ? null : result.error || null;
};

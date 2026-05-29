const OPENCORPORATES_HOST = "opencorporates.com";

/** Company page path: /companies/{jurisdiction}/{company_number} */
const OPENCORPORATES_COMPANY_PATH = /^\/companies\/[^/]+\/[^/]+/i;

export const normalizeExternalUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const isValidOpenCorporatesCompanyUrl = (url: string): boolean => {
  try {
    const parsed = new URL(normalizeExternalUrl(url));
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (host !== OPENCORPORATES_HOST) return false;

    return OPENCORPORATES_COMPANY_PATH.test(parsed.pathname);
  } catch {
    return false;
  }
};

export type OpenCorporatesUrlValidationResult =
  | { valid: true; normalized: string }
  | { valid: false; error: string };

export const validateOpenCorporatesCompanyUrl = (url: string): OpenCorporatesUrlValidationResult => {
  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, error: "OpenCorporates page URL is required" };
  }
  if (!isValidOpenCorporatesCompanyUrl(trimmed)) {
    return {
      valid: false,
      error:
        "Enter a valid OpenCorporates company URL (e.g. https://opencorporates.com/companies/us_ca/1234567)",
    };
  }
  return { valid: true, normalized: normalizeExternalUrl(trimmed) };
};

/** Inline field validation: empty errors only when requireValue (e.g. on Continue). */
export const getOpenCorporatesFieldError = (url: string, requireValue = false): string | null => {
  const trimmed = url.trim();
  if (!trimmed) {
    return requireValue ? "OpenCorporates page URL is required" : null;
  }
  const result = validateOpenCorporatesCompanyUrl(trimmed);
  return result.valid ? null : result.error;
};

export const IP_STATUSES = [
  { value: 0, code: "P1", label: "Detection / monitoring" },
  { value: 1, code: "P2", label: "Patent strength analysis" },
  { value: 2, code: "P3", label: "Infringement analysis" },
  { value: 3, code: "P4", label: "Damages quantification" },
  { value: 4, code: "P5", label: "Defendant due diligence" },
  { value: 5, code: "P6", label: "Strategy decision" },
  { value: 6, code: "P7", label: "Cease-and-desist / formal notice" },
  { value: 7, code: "P8", label: "Settlement / licensing negotiation (pre-suit)" },
  { value: 8, code: "L1", label: "Statement of Claim filing" },
  { value: 9, code: "L2", label: "Service of process" },
  { value: 10, code: "L3", label: "Preliminary Objections" },
  { value: 11, code: "L4", label: "Statement of Defence" },
  { value: 12, code: "L5", label: "Reply / rejoinder cycle" },
  { value: 13, code: "L6", label: "Closure of written procedure" },
  { value: 14, code: "L7", label: "Interim procedure / case management" },
  { value: 15, code: "L8", label: "Oral procedure / hearing" },
  { value: 16, code: "L9", label: "First-instance decision" },
  { value: 17, code: "L10", label: "Provisional measures (PI track)" },
  { value: 18, code: "A1", label: "Appeal - Court of Appeal" },
  { value: 19, code: "A2", label: "Damages reassessment" },
  { value: 20, code: "A3", label: "Enforcement of judgment" },
  { value: 21, code: "A4", label: "Settlement execution" },
] as const;

export type IpStatusValue = (typeof IP_STATUSES)[number]["value"];

export const DEFAULT_IP_STATUS: IpStatusValue = 0;

export function getIpStatusLabel(status: number | null | undefined): string {
  if (status === null || status === undefined) return "Unknown";
  return IP_STATUSES.find(item => item.value === status)?.label ?? "Unknown";
}

export function getIpStatusLabelWithCode(status: number | null | undefined): string {
  if (status === null || status === undefined) return "Unknown";
  const item = IP_STATUSES.find(entry => entry.value === status);
  return item ? `${item.code} ${item.label}` : "Unknown";
}

export type IpStatusPhase = "PRELITIGATION" | "LITIGATION" | "POSTLITIGATION";

export const IP_STATUS_PHASES: readonly IpStatusPhase[] = [
  "PRELITIGATION",
  "LITIGATION",
  "POSTLITIGATION",
] as const;

export function getIpStatusPhase(status: number | null | undefined): IpStatusPhase {
  if (status === null || status === undefined || !isValidIpStatus(status)) {
    return "PRELITIGATION";
  }
  if (status <= 7) return "PRELITIGATION";
  if (status <= 17) return "LITIGATION";
  return "POSTLITIGATION";
}

export function getIpStatusPhaseIndex(status: number | null | undefined): number {
  return IP_STATUS_PHASES.indexOf(getIpStatusPhase(status));
}

export function getIpStatusesForPhaseIndex(phaseIndex: number) {
  const phase = IP_STATUS_PHASES[phaseIndex];
  if (!phase) return [];

  if (phase === "PRELITIGATION") {
    return IP_STATUSES.filter(item => item.value <= 7);
  }
  if (phase === "LITIGATION") {
    return IP_STATUSES.filter(item => item.value >= 8 && item.value <= 17);
  }
  return IP_STATUSES.filter(item => item.value >= 18);
}

export function isValidIpStatus(status: number): status is IpStatusValue {
  return IP_STATUSES.some(item => item.value === status);
}

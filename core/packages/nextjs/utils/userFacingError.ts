import { getParsedError } from "~~/utils/scaffold-eth/getParsedError";

type ErrorLike = {
  code?: number | string;
  cause?: unknown;
  shortMessage?: string;
  details?: string;
  message?: string;
};

const INSUFFICIENT_GAS_PATTERNS = [
  "insufficient funds for gas",
  "exceeds the balance of the account",
  "intrinsic gas too low",
  "not enough funds for gas",
];

const USER_REJECTED_PATTERNS = ["user rejected", "user denied", "rejected the request", "action_rejected"];

const containsAnyPattern = (value: string, patterns: string[]) => {
  const normalized = value.toLowerCase();
  return patterns.some(pattern => normalized.includes(pattern));
};

const extractAllErrorStrings = (error: unknown): string[] => {
  const values: string[] = [];
  if (!error) return values;

  const parsed = getParsedError(error as any);
  if (parsed) values.push(parsed);

  const stack: unknown[] = [error];
  const visited = new WeakSet<object>();
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (visited.has(current)) continue;
    visited.add(current);

    const e = current as ErrorLike;
    if (typeof e.message === "string") values.push(e.message);
    if (typeof e.shortMessage === "string") values.push(e.shortMessage);
    if (typeof e.details === "string") values.push(e.details);
    if (e.cause) stack.push(e.cause);
  }

  return values;
};

const extractAllErrorCodes = (error: unknown): Array<number | string> => {
  const values: Array<number | string> = [];
  if (!error || typeof error !== "object") return values;

  const stack: unknown[] = [error];
  const visited = new WeakSet<object>();
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (visited.has(current)) continue;
    visited.add(current);

    const e = current as ErrorLike;
    if (typeof e.code === "number" || typeof e.code === "string") {
      values.push(e.code);
    }
    if (e.cause) stack.push(e.cause);
  }

  return values;
};

export const getUserFacingErrorMessage = (error: unknown, fallback: string): string => {
  const candidates = extractAllErrorStrings(error);
  const codes = extractAllErrorCodes(error);
  const merged = candidates.join(" || ");

  if (containsAnyPattern(merged, INSUFFICIENT_GAS_PATTERNS)) {
    return "Not enough ETH for gas fees. Add ETH to your wallet and try again.";
  }

  if (
    codes.includes(4001) ||
    codes.includes("ACTION_REJECTED") ||
    codes.includes("USER_REJECTED_REQUEST") ||
    containsAnyPattern(merged, USER_REJECTED_PATTERNS)
  ) {
    return "Transaction was rejected in your wallet.";
  }

  return fallback;
};

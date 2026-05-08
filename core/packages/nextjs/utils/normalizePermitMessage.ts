import { type Address, getAddress } from "viem";
import type { PermitMessage } from "~~/types";

/**
 * Normalize Permit2 EIP-712 payload before wallet signing.
 * Ensures addresses are checksummed and numeric fields stay as decimal strings so MetaMask/Viem hash the same digest.
 */
export const normalizePermitMessageForWallet = (permit: PermitMessage): PermitMessage => ({
  domain: {
    name: "Permit2",
    chainId: Number(permit.domain.chainId),
    verifyingContract: getAddress(permit.domain.verifyingContract as Address),
  },
  types: permit.types,
  primaryType: "PermitSingle",
  message: {
    details: {
      token: getAddress(permit.message.details.token as Address),
      amount: String(permit.message.details.amount),
      expiration: String(permit.message.details.expiration),
      nonce: String(permit.message.details.nonce),
    },
    spender: getAddress(permit.message.spender as Address),
    sigDeadline: String(permit.message.sigDeadline),
  },
});

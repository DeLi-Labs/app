/**
 * Sends ETH from Anvil's default account (Foundry account #0) to the ADMIN_APP_PK address.
 * For local chain only — the sender private key is public.
 *
 * Usage (from repo root):
 *   yarn workspace @se-2/nextjs next:fund-admin-app
 *
 * Or from packages/nextjs:
 *   node --env-file=.env ./scripts/fund-admin-app.mjs
 *
 * Optional env:
 *   RPC_URL — defaults to Anvil http://127.0.0.1:8545
 *   FUND_AMOUNT_ETH — defaults to "10"
 */

import { createPublicClient, createWalletClient, formatEther, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

const deliLabsLocal = { ...foundry, name: "DeLi Labs" };

/** Anvil / forge script default: first wallet, pre-funded on local chain */
const ANVIL_DEFAULT_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

function normalizePk(pk) {
  const trimmed = String(pk).trim();
  if (!trimmed) return null;
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
}

const adminPk = normalizePk(process.env.ADMIN_APP_PK);
if (!adminPk) {
  console.error(
    "ADMIN_APP_PK is missing. Load env e.g. node --env-file=.env ./scripts/fund-admin-app.mjs",
  );
  process.exit(1);
}

const rpcUrl = process.env.RPC_URL?.trim() || deliLabsLocal.rpcUrls.default.http[0];
const amountEth = process.env.FUND_AMOUNT_ETH?.trim() || "10";
let value;
try {
  value = parseEther(amountEth);
} catch {
  console.error(`Invalid FUND_AMOUNT_ETH: ${amountEth}`);
  process.exit(1);
}

const chain = {
  ...deliLabsLocal,
  rpcUrls: { default: { http: [rpcUrl] } },
};

const funder = privateKeyToAccount(ANVIL_DEFAULT_PRIVATE_KEY);
const recipient = privateKeyToAccount(adminPk);

const publicClient = createPublicClient({
  chain,
  transport: http(rpcUrl),
});
const walletClient = createWalletClient({
  account: funder,
  chain,
  transport: http(rpcUrl),
});

const funderBal = await publicClient.getBalance({ address: funder.address });
const recipientBalBefore = await publicClient.getBalance({ address: recipient.address });

console.log(`RPC:        ${rpcUrl}`);
console.log(`Funder:     ${funder.address} (Anvil default #0)`);
console.log(`Recipient:  ${recipient.address} (ADMIN_APP_PK)`);
console.log(`Funder bal: ${formatEther(funderBal)} ETH`);
console.log(`Recipient:  ${formatEther(recipientBalBefore)} ETH`);
console.log(`Sending:    ${amountEth} ETH`);

if (funderBal < value) {
  console.error("Funder balance is too low. Is Anvil running with default accounts?");
  process.exit(1);
}

const hash = await walletClient.sendTransaction({
  account: funder,
  chain,
  to: recipient.address,
  value,
});
await publicClient.waitForTransactionReceipt({ hash });

const recipientBalAfter = await publicClient.getBalance({ address: recipient.address });
console.log(`Tx:         ${hash}`);
console.log(`Recipient:  ${formatEther(recipientBalAfter)} ETH`);

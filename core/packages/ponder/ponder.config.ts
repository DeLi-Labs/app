import { config as loadDotenv } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { createConfig } from "ponder";
import deployedContracts from "../nextjs/contracts/deployedContracts";
import externalContracts from "../nextjs/contracts/externalContracts";
import scaffoldConfig from "../nextjs/scaffold.config";

/** Ponder CLI does not load `packages/ponder/.env` for `dev` / `serve` (only `start` shells it in). */
const ponderPackageDir = dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: resolve(ponderPackageDir, ".env") });
loadDotenv({ path: resolve(ponderPackageDir, ".env.local"), override: true });

const targetNetwork = scaffoldConfig.targetNetworks[0];

const deployedContractsForNetwork = deployedContracts[targetNetwork.id];
const externalContractsForNetwork = externalContracts[targetNetwork.id];
if (!deployedContractsForNetwork) {
  throw new Error(`No deployed contracts found for network ID ${targetNetwork.id}`);
}

type DeployedContractForPonder = { deployedOnBlock?: number };

/** Blocks where `generateTsAbis.js` had no broadcast receipt (e.g. only in deployments/*.json). */
const fallbackStartBlock = (() => {
  const blocks = (Object.values(deployedContractsForNetwork) as DeployedContractForPonder[])
    .map((c) => c.deployedOnBlock)
    .filter((b): b is number => typeof b === "number" && b > 0);
  return blocks.length > 0 ? Math.min(...blocks) : 0;
})();

/** Same JSON-RPC as Next server (`RPC_URL`). */
const rpcUrl = process.env.RPC_URL?.trim();
if (!rpcUrl) {
  throw new Error(
    "RPC_URL is required for Ponder (same as Next.js). Set it in the environment or packages/ponder/.env",
  );
}

const chains = {
  [targetNetwork.name]: {
    id: targetNetwork.id,
    rpc: rpcUrl,
  },
};

const deployedContractNames = Object.keys(deployedContractsForNetwork);
const deployed = Object.fromEntries(deployedContractNames.map((contractName) => {
  return [contractName, {
    chain: targetNetwork.name as string,
    abi: deployedContractsForNetwork[contractName].abi,
    address: deployedContractsForNetwork[contractName].address,
    startBlock:
      deployedContractsForNetwork[contractName].deployedOnBlock ?? fallbackStartBlock,
  }];
}));

const externalContractNames = Object.keys(externalContractsForNetwork);
const external = Object.fromEntries(externalContractNames.map((contractName) => {
  return [contractName, {
    chain: targetNetwork.name as string,
    abi: externalContractsForNetwork[contractName].abi,
    address: externalContractsForNetwork[contractName].address,
    startBlock:
      deployedContractsForNetwork["CampaignManager"]?.deployedOnBlock ?? fallbackStartBlock,
  }];
}));

export default createConfig({
  chains: chains,
  contracts: { ...deployed, ...external },
});


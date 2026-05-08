import { ArweaveStorageGateway } from "./impl/ArweaveStorageGateway";
import { FilecoinStorageGateway } from "./impl/FilecoinStorageGateway";
import { IPFSStorageGateway } from "./impl/IPFSStorageGateway";
import { LocalDatabaseStorageGateway } from "./impl/LocalDatabaseStorageGateway";
import type { IStorageGateway } from "./storage";

export const enum StorageGatewayType {
  IPFS = "IPFS",
  ARWEAVE = "ARWEAVE",
  LOCAL = "LOCAL",
  FILECOIN = "FILECOIN",
}

const registry: Record<StorageGatewayType, () => IStorageGateway> = {
  [StorageGatewayType.IPFS]: () => new IPFSStorageGateway(),
  [StorageGatewayType.ARWEAVE]: () => new ArweaveStorageGateway(),
  [StorageGatewayType.LOCAL]: () => new LocalDatabaseStorageGateway(),
  [StorageGatewayType.FILECOIN]: () => new FilecoinStorageGateway(),
};

/**
 * Factory function to create a storage gateway instance
 *
 * @param type - The type of storage gateway to create
 * @returns An instance of the requested storage gateway
 */
export function createStorageGateway(): IStorageGateway {
  const type = process.env.STORAGE_GATEWAY_TYPE as StorageGatewayType;
  if (!type) {
    throw new Error("STORAGE_GATEWAY_TYPE is not set");
  }

  const factory = registry[type];
  if (!factory) {
    throw new Error(`Unknown storage gateway type: "${type}". Valid types are: ${Object.keys(registry).join(", ")}`);
  }
  return factory();
}

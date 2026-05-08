import { StorageGatewayType } from "../StorageGatewayFactory";
import type { IStorageGateway, RetrieveResult, StorageResult, StoreOptions } from "../storage";
import { Synapse, parseUnits } from "@filoz/synapse-sdk";
import { type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

/**
 * Filecoin storage gateway implementation using Synapse SDK
 */

const USDFC_DEPOSIT = "2.5";

export class FilecoinStorageGateway implements IStorageGateway {
  private synapse: Synapse;

  constructor(privateKey?: string) {
    const pk = privateKey || process.env.FILECOIN_PRIVATE_KEY;
    if (!pk) {
      throw new Error("Filecoin private key is required for FilecoinStorageGateway");
    }

    const formattedPk = pk.startsWith("0x") ? pk : `0x${pk}`;
    const account = privateKeyToAccount(formattedPk as Hex);

    this.synapse = Synapse.create({
      account: account as any,
      withCDN: true,
      source: "deli-app",
    });
  }

  async store(data: Buffer | Uint8Array, _options?: StoreOptions): Promise<StorageResult> {
    try {
      return await this._storeWithRetry(data as Uint8Array, 1);
    } catch (error) {
      throw new Error(`Failed to store data to Filecoin: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async _storeWithRetry(data: Uint8Array, retries: number): Promise<StorageResult> {
    try {
      const { pieceCid, copies, complete, failedAttempts } = await this.synapse.storage.upload(data);
      if (!complete && copies.length === 0 && failedAttempts.length > 0) {
        throw new Error("Failed to store data to Filecoin. All copy attempts failed.");
      }
      const size = data.length;
      const uri = `filecoin://${pieceCid.toString()}`;
      return {
        uri,
        hash: pieceCid.toString(),
        size,
      };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (retries > 0 && errorMessage.includes("InsufficientLockupFunds")) {
        const hash = await this.synapse.payments.depositWithPermitAndApproveOperator({
          amount: parseUnits(USDFC_DEPOSIT),
        });
        await this.synapse.client.waitForTransactionReceipt({ hash });
        return this._storeWithRetry(data, retries - 1);
      }

      throw error;
    }
  }

  async storeJson<T extends Record<string, unknown>>(json: T, options?: StoreOptions): Promise<StorageResult> {
    const jsonString = JSON.stringify(json);
    const jsonBuffer = Buffer.from(jsonString, "utf-8");
    return this.store(jsonBuffer, {
      ...options,
      contentType: options?.contentType || "application/json",
    });
  }

  async retrieve(uri: string): Promise<RetrieveResult> {
    if (!uri.startsWith("filecoin://")) {
      throw new Error(`Invalid Filecoin URI: ${uri}`);
    }

    const pieceCid = uri.replace("filecoin://", "");

    try {
      const downloadedData = await this.synapse.storage.download({ pieceCid });
      const data = Buffer.from(downloadedData);
      const size = data.length;

      // Try to detect content type from data
      let contentType: string | undefined;
      try {
        const text = data.toString("utf-8");
        JSON.parse(text);
        contentType = "application/json";
      } catch {
        // Not JSON, keep undefined
      }

      return {
        data,
        contentType,
        size,
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve data from Filecoin: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async retrieveJson<T extends Record<string, unknown>>(uri: string): Promise<T> {
    const result = await this.retrieve(uri);
    try {
      const text =
        result.data instanceof Buffer ? result.data.toString("utf-8") : new TextDecoder().decode(result.data);
      return JSON.parse(text) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON from Filecoin: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async exists(uri: string): Promise<boolean> {
    if (!uri.startsWith("filecoin://")) {
      return false;
    }

    try {
      const result = await this.retrieve(uri);
      return result.size > 0;
    } catch {
      return false;
    }
  }

  async delete(_uri: string): Promise<boolean> {
    // Deletion is not supported for Filecoin with Synapse SDK
    return false;
  }

  getStorageType(): string {
    return StorageGatewayType.FILECOIN;
  }
}

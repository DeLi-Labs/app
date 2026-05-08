import { StorageGatewayType } from "../StorageGatewayFactory";
import type { IStorageGateway, RetrieveResult, StorageResult, StoreOptions } from "../storage";
import { MemoryBlockstore } from "blockstore-core/memory";
import { importFile } from "ipfs-unixfs-importer";
import { PinataSDK } from "pinata";

/**
 * IPFS storage gateway implementation using Pinata SDK.
 * Requires PINATA_JWT and PINATA_GATEWAY (gateway domain, e.g. gateway.pinata.cloud or your dedicated gateway).
 */
export class IPFSStorageGateway implements IStorageGateway {
  private readonly pinata: PinataSDK;
  private readonly blockstore: MemoryBlockstore;

  constructor(options?: { jwt?: string; gateway?: string }) {
    const jwt = options?.jwt ?? process.env.PINATA_JWT ?? "";
    const gateway = options?.gateway ?? process.env.PINATA_GATEWAY ?? "gateway.pinata.cloud";
    if (!jwt) {
      throw new Error(
        "PINATA_JWT is not set. Set PINATA_JWT (or pass jwt in options) to use IPFS storage with Pinata.",
      );
    }
    this.pinata = new PinataSDK({
      pinataJwt: jwt,
      pinataGateway: gateway,
    });
    this.blockstore = new MemoryBlockstore();
  }

  /** Compute CIDv0 for the given bytes (same algorithm as Pinata with cid_version "v0"). */
  async computeCidV0(buffer: Uint8Array): Promise<string> {
    const result = await importFile({ content: buffer }, this.blockstore, { cidVersion: 0, rawLeaves: false });
    return result.cid.toString();
  }

  async store(data: Buffer | Uint8Array, options?: StoreOptions): Promise<StorageResult> {
    const buffer = Buffer.from(data);
    const cid = await this.computeCidV0(buffer);
    const uri = `ipfs://${cid}`;

    if (await this.exists(uri)) {
      return { uri, hash: cid, size: buffer.length };
    }

    const file = new File([buffer], "data", {
      type: options?.contentType ?? "application/octet-stream",
    });
    const upload = await this.pinata.upload.public.file(file, { cid_version: "v0" });

    return {
      uri: `ipfs://${upload.cid}`,
      hash: upload.cid,
      size: upload.size ?? buffer.length,
    };
  }

  async storeJson<T extends Record<string, unknown>>(json: T, _options?: StoreOptions): Promise<StorageResult> {
    const jsonString = JSON.stringify(json);
    const jsonBuffer = Buffer.from(jsonString, "utf-8");
    return this.store(jsonBuffer, {
      ..._options,
      contentType: _options?.contentType ?? "application/json",
    });
  }

  async retrieve(uri: string): Promise<RetrieveResult> {
    if (!uri.startsWith("ipfs://")) {
      throw new Error(`Invalid IPFS URI: ${uri}`);
    }
    const cid = uri.replace("ipfs://", "");
    const url = await this.pinata.gateways.public.convert(cid);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to retrieve from IPFS (${res.status}): ${uri}`);
    }
    const data = Buffer.from(await res.arrayBuffer());
    return {
      data,
      contentType: res.headers.get("content-type") ?? undefined,
      size: data.length,
    };
  }

  async retrieveJson<T extends Record<string, unknown>>(uri: string): Promise<T> {
    const result = await this.retrieve(uri);
    try {
      const text =
        result.data instanceof Buffer ? result.data.toString("utf-8") : new TextDecoder().decode(result.data);
      return JSON.parse(text) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON from IPFS: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async exists(uri: string): Promise<boolean> {
    if (!uri.startsWith("ipfs://")) return false;
    const cid = uri.replace("ipfs://", "");
    try {
      const url = await this.pinata.gateways.public.convert(cid);
      const res = await fetch(url, { method: "HEAD" });
      return res.ok;
    } catch {
      return false;
    }
  }

  async existsByData(data: Buffer | Uint8Array): Promise<boolean> {
    const cid = await this.computeCidV0(Buffer.from(data));
    return this.exists(`ipfs://${cid}`);
  }

  async delete(_uri: string): Promise<boolean> {
    throw new Error("Deletion is not supported for IPFS (Pinata)");
  }

  getStorageType(): string {
    return StorageGatewayType.IPFS;
  }
}

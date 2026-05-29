import { type Address, createPublicClient, encodeAbiParameters, encodeFunctionData, http, keccak256 } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";
import externalContracts from "~~/contracts/externalContracts";
import scaffoldConfig from "~~/scaffold.config";
import { createIndexerGateway } from "~~/services/gateway/indexer/IndexerGatewayFactory";
import { createStorageGateway } from "~~/services/gateway/storage/StorageGatewayFactory";
import type {
  Campaign,
  CampaignPeriodAvgPriceDataItem,
  CampaignPeriodDataItem,
  CampaignPeriodName,
  CampaignUploadFormData,
  PermitMessage,
} from "~~/types";
import { generateDefendantRecoverability, generatePatentStrength } from "~~/utils/generateCampaignDdVerdict";
import { generateEstimatedDamages } from "~~/utils/generateEstimatedDamages";
import { generateTimelineProjection } from "~~/utils/generateTimelineProjection";
import { getRpcHttpUrl } from "~~/utils/scaffold-eth/networks";

const TICK_SPACING = 30;

/** Q64.96 min sqrt price + 1 (safe limit for quote when zeroForOne = false). */
const MIN_SQRT_PRICE_X96_PLUS_ONE = 4295128740n;
/** Q64.96 max sqrt price - 1 (safe limit for quote when zeroForOne = true). */
const MAX_SQRT_PRICE_X96_MINUS_ONE = 1461446703485210103287273052203988822378723970341n;

// Must match AuthCaptureEscrow.PAYMENT_INFO_TYPEHASH
const PAYMENT_INFO_TYPEHASH = keccak256(
  new TextEncoder().encode(
    "PaymentInfo(address operator,address payer,address receiver,address token,uint120 maxAmount,uint48 preApprovalExpiry,uint48 authorizationExpiry,uint48 refundExpiry,uint16 minFeeBps,uint16 maxFeeBps,address feeReceiver,uint256 salt)",
  ),
);

function getPublicClient(chainId: number) {
  const chain = scaffoldConfig.targetNetworks.find(n => n.id === chainId);
  if (!chain) {
    throw new Error(`Chain ${chainId} not found in scaffold config`);
  }

  return createPublicClient({
    chain,
    transport: http(getRpcHttpUrl(chainId)),
  });
}

/** PoolKey matches CampaignManager: currency0 = license, currency1 = numeraire. */
function getPoolKey(campaign: Campaign, hookAddress: `0x${string}`) {
  return {
    currency0: campaign.licenseAddress as `0x${string}`,
    currency1: campaign.numeraireAddress as `0x${string}`,
    fee: 0,
    tickSpacing: TICK_SPACING as 30,
    hooks: hookAddress,
  };
}

export class CampaignProvider {
  private indexerGateway = createIndexerGateway();
  private storageGateway = createStorageGateway();
  private readonly defaultChainId: number;
  private readonly fixedHookContract: { address: string; abi: readonly unknown[] };
  private readonly dynamicHookContract: { address: string; abi: readonly unknown[] };
  private readonly defaultCampaignManagerContract: { address: string; abi: readonly unknown[] };
  private readonly permit2Contract: { address: string; abi: readonly unknown[] };
  private readonly permit2Address: Address;

  constructor(chainId: number) {
    this.defaultChainId = chainId;
    const chainContracts = (
      deployedContracts as Record<number, Record<string, { address: string; abi: readonly unknown[] }>>
    )[this.defaultChainId];
    const fixedHook = chainContracts?.FixedPriceLicenseHook;
    const dynamicHook = chainContracts?.DynamicPriceLicenseHook;
    if (!fixedHook) {
      throw new Error(`FixedPriceLicenseHook not deployed on chain ${this.defaultChainId}`);
    }
    if (!dynamicHook) {
      throw new Error(`DynamicPriceLicenseHook not deployed on chain ${this.defaultChainId}`);
    }
    this.fixedHookContract = fixedHook;
    this.dynamicHookContract = dynamicHook;

    const routerContract = chainContracts?.LicenseSwapRouter;
    if (!routerContract) {
      throw new Error(`LicenseSwapRouter not deployed on chain ${this.defaultChainId}`);
    }

    const campaignManagerContract = chainContracts?.CampaignManager;
    if (!campaignManagerContract) {
      throw new Error(`CampaignManager not deployed on chain ${this.defaultChainId}`);
    }
    this.defaultCampaignManagerContract = campaignManagerContract;

    // Get Permit2 contract from external contracts
    const externalChainContracts = (
      externalContracts as Record<number, Record<string, { address: string; abi: readonly unknown[] }>>
    )[this.defaultChainId];
    const permit2Contract = externalChainContracts?.Permit2;
    if (!permit2Contract) {
      throw new Error(`Permit2 not configured for chain ${this.defaultChainId}`);
    }
    this.permit2Contract = permit2Contract;
    this.permit2Address = permit2Contract.address as Address;
  }

  async getCampaignDetails(licenseAddress: string): Promise<Campaign | null> {
    return this.indexerGateway.getCampaignDetails(licenseAddress);
  }

  async getCampaignPeriodData(
    licenseAddress: string,
    period: CampaignPeriodName,
    fromTimestamp: bigint,
    toTimestamp?: bigint,
  ): Promise<CampaignPeriodDataItem[]> {
    return this.indexerGateway.getCampaignPeriodData(licenseAddress, period, fromTimestamp, toTimestamp);
  }

  async getCampaignPeriodAvgPriceData(
    licenseAddress: string,
    period: CampaignPeriodName,
    limit: number,
  ): Promise<CampaignPeriodAvgPriceDataItem[]> {
    return this.indexerGateway.getCampaignPeriodAvgPriceData(licenseAddress, period, limit);
  }

  private getHookForCampaign(campaign: Campaign): { address: string; abi: readonly unknown[] } {
    return campaign.licenseType === "DYNAMIC" ? this.dynamicHookContract : this.fixedHookContract;
  }

  /**
   * Quote swap: returns the other leg of the swap (unspecified amount).
   * @param amountRaw Magnitude of the specified amount (input or output).
   * @param exactInput If true, amountRaw is input (negative amountSpecified); if false, amountRaw is output (positive amountSpecified).
   * @param zeroForOne false = buy (numeraire → license), true = sell (license → numeraire).
   */
  async getQuote(campaign: Campaign, amountRaw: bigint, exactInput: boolean, zeroForOne: boolean): Promise<bigint> {
    const client = getPublicClient(this.defaultChainId);
    const hook = this.getHookForCampaign(campaign);
    const poolKey = getPoolKey(campaign, hook.address as `0x${string}`);
    const swapParams = {
      zeroForOne,
      amountSpecified: exactInput ? -amountRaw : amountRaw,
      sqrtPriceLimitX96: zeroForOne ? MIN_SQRT_PRICE_X96_PLUS_ONE : MAX_SQRT_PRICE_X96_MINUS_ONE,
    };
    const result = await client.readContract({
      address: hook.address as `0x${string}`,
      abi: [...hook.abi],
      functionName: "quote",
      args: [poolKey, swapParams],
    });
    return BigInt(result as bigint);
  }

  /**
   * Get the current nonce for a user/token/spender combination from Permit2
   */
  async getPermit2Nonce(userAddress: Address, tokenAddress: Address, spenderAddress: Address): Promise<bigint> {
    const client = getPublicClient(this.defaultChainId);

    const allowance = await client.readContract({
      address: this.permit2Address,
      abi: [...this.permit2Contract.abi],
      functionName: "allowance",
      args: [userAddress, tokenAddress, spenderAddress],
    });

    // allowance returns [amount, expiration, nonce]
    return BigInt((allowance as readonly [bigint, bigint, bigint])[2]);
  }

  /**
   * Create a Permit2 permit message for EIP-712 signing
   * Note: The domain separator is computed automatically by the signing library from the domain fields
   */
  async createPermitMessage(
    userAddress: Address,
    tokenAddress: Address,
    amount: bigint,
    spenderAddress: Address,
    deadline: bigint,
  ): Promise<PermitMessage> {
    const nonce = await this.getPermit2Nonce(userAddress, tokenAddress, spenderAddress);

    // Calculate expiration: 30 days from now (in seconds)
    const expiration = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60);

    return {
      domain: {
        name: "Permit2",
        chainId: this.defaultChainId,
        verifyingContract: this.permit2Address,
      },
      types: {
        PermitSingle: [
          { name: "details", type: "PermitDetails" },
          { name: "spender", type: "address" },
          { name: "sigDeadline", type: "uint256" },
        ],
        PermitDetails: [
          { name: "token", type: "address" },
          { name: "amount", type: "uint160" },
          { name: "expiration", type: "uint48" },
          { name: "nonce", type: "uint48" },
        ],
      },
      primaryType: "PermitSingle",
      message: {
        details: {
          token: tokenAddress,
          amount: amount.toString(), // uint160 as string
          expiration: expiration.toString(), // uint48 as string
          nonce: nonce.toString(), // uint48 as string
        },
        spender: spenderAddress,
        sigDeadline: deadline.toString(), // uint256 as string
      },
    };
  }

  /**
   * Get the Permit2PaymentCollector address from CampaignManager
   */
  async getPermit2TokenCollectorAddress(campaignManagerAddress: Address): Promise<Address> {
    const client = getPublicClient(this.defaultChainId);
    const permit2TokenCollector = await client.readContract({
      address: campaignManagerAddress,
      abi: [...this.defaultCampaignManagerContract.abi],
      functionName: "permit2TokenCollector",
    });
    return permit2TokenCollector as Address;
  }

  async uploadCampaignMetadata(formData: CampaignUploadFormData): Promise<string> {
    // Compose metadata JSON
    const metadata = {
      denomination: {
        unit: formData.denominationUnit,
        amount: formData.denominationAmount,
      },
      licenseDuration: formData.licenseDuration,
      territoryRestriction: formData.territoryRestriction,
      usageRightsDefinition: formData.usageRightsDefinition,
      caseDescription: formData.caseDescription,
      estimatedDamages: generateEstimatedDamages(),
      patentStrength: generatePatentStrength(),
      defendantRecoverability: generateDefendantRecoverability(),
      timelineProjection: generateTimelineProjection(),
      defendant: formData.defendant,
      defendantOpenCorporatesPage: formData.defendantOpenCorporatesPage,
      transferrabilityFlag: formData.transferrabilityFlag,
    };

    // Upload metadata JSON
    const metadataResult = await this.storageGateway.storeJson(metadata, {
      contentType: "application/json",
    });

    return metadataResult.uri;
  }
}

export default CampaignProvider;

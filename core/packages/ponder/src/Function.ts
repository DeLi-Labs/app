import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { eq, and } from "drizzle-orm";
import { ponder } from "ponder:registry";
import schema from "ponder:schema";

const {
  ip,
  attachment,
  campaign,
  treasuryLicenseBalance,
  campaignHourData,
  campaignDayData,
  campaignWeekData,
  campaignMonthData,
  account,
  mainStats,
  category,
  industry,
} = schema;
import { zeroAddress, decodeFunctionData, decodeEventLog, getEventSelector, getAbiItem, formatUnits, type Address } from "viem";
import { createStorageGateway } from "../../nextjs/services/gateway/storage/StorageGatewayFactory";
import { INDUSTRIES } from "../../nextjs/utils/industryData";

import { ERC20_DECIMALS_ABI, ERC20_TOTAL_SUPPLY_ABI, getTokenPriceUSD, parseLicenseMetadata, quoteOneLicensePriceNumeraire } from "./helpers";

// Load .env file explicitly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../.env") });

const GLOBAL_STATS_ID = "global";

const industryToCategoryMap = new Map<string, string>(
  INDUSTRIES.map(({ industry, parentCategory }) => [industry, parentCategory]),
);

function resolveCategory(industries: string[]): string | null {
  const counts = new Map<string, number>();
  for (const ind of industries) {
    const cat = industryToCategoryMap.get(ind);
    if (cat) counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  const maxCount = Math.max(...counts.values());
  return [...counts.entries()].find(([, count]) => count === maxCount)?.[0] ?? null;
}

// Lazy initialization of storage gateway to avoid errors during Ponder startup
let storageGateway: ReturnType<typeof createStorageGateway> | null = null;

function getStorageGateway() {
  if (!storageGateway) {
    try {
      // Debug: log the environment variable value
      const envValue = process.env.STORAGE_GATEWAY_TYPE;
      
      if (!envValue) {
        throw new Error("STORAGE_GATEWAY_TYPE environment variable is not set. Please set it in .env file (IPFS, ARWEAVE, or LOCAL)");
      }
      
      storageGateway = createStorageGateway();
    } catch (error) {
      console.error("[Storage Gateway] Failed to create storage gateway:", error);
      // Re-throw the original error to preserve the actual error message
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  return storageGateway;
}

ponder.on("IPERC721:Transfer", async ({ event, context }) => {
  const { from, to, tokenId } = event.args;
  const isMint = from === zeroAddress;
  const contract = context.contracts.IPERC721;
  const campaignManagerAddress = context.contracts.CampaignManager?.address?.toLowerCase();

  if (!contract) {
    console.error("IPERC721 contract not found in context.contracts");
    return;
  }

  const recipient = (to as string).toLowerCase() as Address;

  if (!isMint) {
    if (campaignManagerAddress && recipient === campaignManagerAddress) {
      return;
    }

    try {
      await context.db.update(ip, { tokenId }).set({
        accountAddress: recipient,
      });
    } catch (error) {
      console.error(`Error updating current holder for tokenId ${tokenId}:`, error);
    }
    return;
  }

  try {
    const tokenUri = await context.client.readContract({
      abi: contract.abi,
      address: contract.address,
      functionName: "tokenURI",
      args: [tokenId],
    });

    if (!tokenUri) {
      console.warn(`No tokenURI found for tokenId ${tokenId}`);
      return;
    }

    const metadata = await getStorageGateway().retrieveJson<{
      name: string;
      patentNumber: string;
      inventorNames: string;
      jurisdiction: string[];
      registrationAuthority: string;
      patentClassification: string;
      filingDate: string;
      grantDate: string;
      espacenetUrl?: string;
      epoUrl?: string;
      ownerLinkedinUrl?: string;
      ownerWebsiteUrl?: string;
      description: string;
      image: string;
      industry?: string[];
      attachments?: Array<{
        name: string;
        type: "ENCRYPTED" | "PLAIN";
        description: string;
        fileType: string;
        fileSizeBytes: number;
        uri: string;
      }>;
    }>(tokenUri);

    if (!metadata.name || !metadata.description || !metadata.image) {
      console.warn(`Incomplete metadata for tokenId ${tokenId}:`, metadata);
    }

    const industries = metadata.industry || [];
    const categoryId = resolveCategory(industries);

    // Upsert account (create if first mint for this address)
    const existingAccount = await context.db.find(account, { address: recipient });
    if (existingAccount) {
      await context.db.update(account, { address: recipient }).set({
        uniquePatents: existingAccount.uniquePatents + 1n,
      });
    } else {
      await context.db.insert(account).values({
        address: recipient,
        uniquePatents: 1n,
        campaignAmount: 0n,
        totalEmittedLicenseValueUSD: 0,
        totalSwaps: 0n,
        totalInteractions: 0n,
      });
    }

    // Upsert mainStats
    const existingStats = await context.db.find(mainStats, { id: GLOBAL_STATS_ID });
    const isNewOwner = !existingAccount;
    if (existingStats) {
      await context.db.update(mainStats, { id: GLOBAL_STATS_ID }).set({
        uniquePatents: existingStats.uniquePatents + 1n,
        uniquePatentOwners: existingStats.uniquePatentOwners + (isNewOwner ? 1n : 0n),
      });
    } else {
      await context.db.insert(mainStats).values({
        id: GLOBAL_STATS_ID,
        uniquePatents: 1n,
        totalEmittedLicensesValueUSD: 0,
        totalTradingVolumeUSD: 0,
        uniquePatentOwners: 1n,
        totalInteractions: 0n,
        totalSales: 0n,
        campaignAmount: 0n,
        retailPercent: 0,
        growthPercent: 0,
      });
    }

    // Upsert industry rows (parent category is ensured inside the loop)
    for (const ind of industries) {
      const indCategoryId = industryToCategoryMap.get(ind);
      if (!indCategoryId) continue;
      const existingIndustry = await context.db.find(industry, { id: ind });
      if (!existingIndustry) {
        // Ensure parent category exists
        const parentCat = await context.db.find(category, { id: indCategoryId });
        if (!parentCat) {
          await context.db.insert(category).values({
            id: indCategoryId,
            totalEmittedLicensesValueUSD: 0,
            totalTradingVolumeUSD: 0,
            topGrowth24hCampaignLicenseAddress: null,
            totalInteractions: 0n,
            totalSales: 0n,
            retailPercent: 0,
            growthPercent: 0,
          });
        }
        await context.db.insert(industry).values({
          id: ind,
          categoryId: indCategoryId,
          totalEmittedLicensesValueUSD: 0,
          totalTradingVolumeUSD: 0,
          topGrowth24hCampaignLicenseAddress: null,
          totalInteractions: 0n,
          totalSales: 0n,
          retailPercent: 0,
          growthPercent: 0,
        });
      }
    }

    await context.db.insert(ip).values({
      tokenId,
      accountAddress: recipient,
      name: metadata.name || "",
      patentNumber: metadata.patentNumber || "",
      inventorNames: metadata.inventorNames || "",
      jurisdiction: metadata.jurisdiction || [],
      registrationAuthority: metadata.registrationAuthority || "",
      patentClassification: metadata.patentClassification || "",
      filingDate: metadata.filingDate || "",
      grantDate: metadata.grantDate || "",
      espacenetUrl: metadata.espacenetUrl || "",
      epoUrl: metadata.epoUrl || "",
      ownerLinkedinUrl: metadata.ownerLinkedinUrl || "",
      ownerWebsiteUrl: metadata.ownerWebsiteUrl || "",
      description: metadata.description || "",
      image: metadata.image || "",
      creationTimestamp: event.block.timestamp,
      industry: industries,
      categoryId,
      retailPercent: 0,
      growthPercent: 0,
      totalInteractions: 0n,
      totalSales: 0n,
      totalEmittedLicensesValueUSD: 0,
      totalTradingVolumeUSD: 0,
      topGrowth24hCampaignLicenseAddress: null,
    });

    if (metadata.attachments && metadata.attachments.length > 0) {
      const attachmentValues = metadata.attachments.map((att) => ({
        id: randomUUID(),
        ipTokenId: tokenId,
        name: att.name || "",
        type: att.type || ("PLAIN" as const),
        description: att.description || "",
        fileType: att.fileType || "",
        fileSizeBytes: BigInt(att.fileSizeBytes || 0),
        uri: att.uri || "",
      }));

      await context.db.insert(attachment).values(attachmentValues);
    }
  } catch (error) {
    console.error(`Error processing mint for tokenId ${tokenId}:`, error);
  }
});

/** Map CampaignManager LicenseType enum to string for indexing. */
function licenseTypeToString(licenseType: number): "DYNAMIC" | "FIXED" {
  return licenseType === 0 ? "DYNAMIC" : "FIXED";
}

function getHookContractForLicenseType(
  contracts: {
    FixedPriceLicenseHook?: { address?: Address; abi: readonly unknown[] };
    DynamicPriceLicenseHook?: { address?: Address; abi: readonly unknown[] };
  },
  licenseType: "DYNAMIC" | "FIXED",
) {
  return licenseType === "DYNAMIC" ? contracts.DynamicPriceLicenseHook : contracts.FixedPriceLicenseHook;
}

ponder.on("CampaignManager:CampaignInitialized", async ({ event, context }) => {
  const patentId = event.args.patentId;
  const licenseAddress = event.args.license;
  const numeraireAddress = event.args.numeraire;
  const poolId = event.args.poolId;

  const campaignManagerContract = context.contracts.CampaignManager;
  const licenseContract = context.contracts.LicenseERC20;

  if (!campaignManagerContract) {
    console.error("CampaignManager contract not found in context.contracts");
    return;
  }

  if (!licenseContract) {
    console.error("LicenseERC20 contract not found in context.contracts");
    return;
  }

  const rawLicenseType =
    (event.args as { licenseType?: number }).licenseType ??
    (await context.client.readContract({
      abi: licenseContract.abi,
      address: licenseAddress,
      functionName: "licenseType",
    }));
  const licenseType = licenseTypeToString(Number(rawLicenseType));

  try {
    const licenseSymbol = await context.client.readContract({
      abi: licenseContract.abi,
      address: licenseAddress,
      functionName: "symbol",
    });
    const numeraireSymbol = await context.client
      .readContract({
        abi: licenseContract.abi,
        address: numeraireAddress,
        functionName: "symbol",
      })
      .catch(() => "");

    const licenceMetadataUri = await context.client.readContract({
      abi: licenseContract.abi,
      address: licenseAddress,
      functionName: "licenceMetadataUri",
    });

    if (!licenceMetadataUri) {
      console.warn(`No licenceMetadataUri found for license ${licenseAddress}`);
      return;
    }

    const metadata = await getStorageGateway().retrieveJson<{
      denomination: {
        unit: "PER_ITEM" | "PER_HOUR" | "PER_DAY" | "PER_BYTE" | "PER_1000_TOKEN";
        amount: number | string;
      };
      licenseDuration?: number | string;
      territoryRestriction?: string[];
      usageRightsDefinition?: string;
      caseDescription?: string;
      estimatedDamages?: string;
      patentStrength?: string;
      defendantRecoverability?: string;
      timelineProjection?: string;
      defendant?: string;
      defendantOpenCorporatesPage?: string;
      transferrabilityFlag?: "Transferrable" | "NonTransferrable";
    }>(licenceMetadataUri);

    if (!metadata.denomination || !metadata.denomination.unit || metadata.denomination.amount === undefined) {
      console.warn(`Incomplete campaign metadata for license ${licenseAddress}:`, metadata);
      return;
    }

    const amountRaw = parseFloat(String(metadata.denomination.amount).replace(",", "."));

    if (Number.isNaN(amountRaw) || amountRaw < 0) {
      console.warn(`Invalid denomination amount for license ${licenseAddress}:`, metadata.denomination.amount);
      return;
    }
    const normalizedLicense = licenseAddress.toLowerCase() as Address;
    const normalizedNumeraire = numeraireAddress.toLowerCase() as Address;

    // Initialize campaign market metrics from on-chain state right after pool init.
    let licenseDecimals = 18;
    let numeraireDecimals = 18;
    let totalSupplyRaw = 0n;
    let numeraireUSDPrice = 1;

    try {
      const [lDec, nDec, totalSupply, usdPrice] = await Promise.all([
        context.client.readContract({
          abi: ERC20_DECIMALS_ABI,
          address: normalizedLicense,
          functionName: "decimals",
        }),
        context.client.readContract({
          abi: ERC20_DECIMALS_ABI,
          address: normalizedNumeraire,
          functionName: "decimals",
        }),
        context.client.readContract({
          abi: ERC20_TOTAL_SUPPLY_ABI,
          address: normalizedLicense,
          functionName: "totalSupply",
        }),
        getTokenPriceUSD(normalizedNumeraire, { client: context.client }).catch(() => 1),
      ]);

      licenseDecimals = Number(lDec ?? 18);
      numeraireDecimals = Number(nDec ?? 18);
      totalSupplyRaw = (totalSupply as bigint) ?? 0n;
      numeraireUSDPrice = usdPrice;
    } catch {
      // Keep defaults if any initialization read fails.
    }

    const hookContract = getHookContractForLicenseType(context.contracts, licenseType);
    const currentPrice =
      hookContract?.address && hookContract?.abi
        ? await quoteOneLicensePriceNumeraire({
            client: context.client,
            hookAddress: hookContract.address as `0x${string}`,
            hookAbi: hookContract.abi,
            licenseAddress: normalizedLicense,
            numeraireAddress: normalizedNumeraire,
            licenseDecimals,
            numeraireDecimals,
          }).catch(() => 0)
        : 0;
    const totalSupply = Number(formatUnits(totalSupplyRaw, licenseDecimals));
    const totalEmittedLicensesValueUSD = totalSupply * currentPrice * numeraireUSDPrice;

    let onChainMetadata: ReturnType<typeof parseLicenseMetadata> = null;
    try {
      onChainMetadata = parseLicenseMetadata(
        await context.client.readContract({
          abi: licenseContract.abi,
          address: licenseAddress,
          functionName: "metadata",
        }),
      );
    } catch (error) {
      console.warn(`Failed to read on-chain metadata for license ${licenseAddress}:`, error);
    }

    await context.db.insert(campaign).values({
      licenseAddress: normalizedLicense,
      licenseSymbol: (licenseSymbol as string) || "",
      ipTokenId: patentId,
      numeraireAddress: normalizedNumeraire,
      numeraireSymbol: (numeraireSymbol as string) || "",
      poolId,
      licenseType,
      denominationUnit: metadata.denomination.unit,
      denominationAmount: amountRaw,
      creationTimestamp: event.block.timestamp,
      licenseDuration: metadata.licenseDuration ? BigInt(metadata.licenseDuration.toString()) : 0n,
      territoryRestriction: metadata.territoryRestriction || [],
      usageRightsDefinition: metadata.usageRightsDefinition || "",
      caseDescription: metadata.caseDescription || "",
      estimatedDamages: metadata.estimatedDamages || "",
      patentStrength: metadata.patentStrength || "",
      defendantRecoverability: metadata.defendantRecoverability || "",
      timelineProjection: metadata.timelineProjection || "",
      defendant: metadata.defendant || "",
      defendantOpenCorporatesPage: metadata.defendantOpenCorporatesPage || "",
      transferrabilityFlag: metadata.transferrabilityFlag || "Transferrable",
      status: onChainMetadata?.status ?? null,
      statusUpdateTimestamp: onChainMetadata?.statusUpdateTimestamp ?? null,
      statusUpdateExplanation: onChainMetadata?.statusUpdateExplanation ?? null,
      currentPrice,
      totalSupply,
      totalEmittedLicensesValueUSD,
      totalTradingVolumeUSD: 0,
    });

    // Initialize aggregate emitted-value metrics at campaign creation, so totals are
    // correct even before the first swap event arrives.
    const ipRecord = await context.db.find(ip, { tokenId: patentId });
    if (ipRecord) {
      await context.db.update(ip, { tokenId: patentId }).set({
        totalEmittedLicensesValueUSD: ipRecord.totalEmittedLicensesValueUSD + totalEmittedLicensesValueUSD,
      });

      const ownerAccount = await context.db.find(account, { address: ipRecord.accountAddress });
      if (ownerAccount) {
        await context.db.update(account, { address: ipRecord.accountAddress }).set({
          totalEmittedLicenseValueUSD: ownerAccount.totalEmittedLicenseValueUSD + totalEmittedLicensesValueUSD,
        });
      }

      if (ipRecord.categoryId) {
        const categoryRecord = await context.db.find(category, { id: ipRecord.categoryId });
        if (categoryRecord) {
          await context.db.update(category, { id: ipRecord.categoryId }).set({
            totalEmittedLicensesValueUSD:
              categoryRecord.totalEmittedLicensesValueUSD + totalEmittedLicensesValueUSD,
          });
        }
      }

      for (const ind of new Set(ipRecord.industry)) {
        const industryRecord = await context.db.find(industry, { id: ind });
        if (!industryRecord) continue;
        await context.db.update(industry, { id: ind }).set({
          totalEmittedLicensesValueUSD:
            industryRecord.totalEmittedLicensesValueUSD + totalEmittedLicensesValueUSD,
        });
      }
    }

    // Increment account.campaignAmount for IP owner
    if (ipRecord) {
      const ownerAccount = await context.db.find(account, { address: ipRecord.accountAddress });
      if (ownerAccount) {
        await context.db.update(account, { address: ipRecord.accountAddress }).set({
          campaignAmount: ownerAccount.campaignAmount + 1n,
        });
      }
    }

    // Increment mainStats.campaignAmount
    const stats = await context.db.find(mainStats, { id: GLOBAL_STATS_ID });
    if (stats) {
      await context.db.update(mainStats, { id: GLOBAL_STATS_ID }).set({
        campaignAmount: stats.campaignAmount + 1n,
        totalEmittedLicensesValueUSD: stats.totalEmittedLicensesValueUSD + totalEmittedLicensesValueUSD,
      });
    }
  } catch (error) {
    console.error(`Error processing campaign initialization for patentId ${patentId}:`, error);
  }
});

ponder.on("LicenseERC20:MetadataUpdated", async ({ event, context }) => {
  const licenseAddress = event.log.address.toLowerCase() as Address;
  const contractMetadata = parseLicenseMetadata(event.args.metadata);

  if (!contractMetadata) {
    console.warn(`Could not parse MetadataUpdated payload for license ${licenseAddress}`);
    return;
  }

  try {
    await context.db.update(campaign, { licenseAddress }).set({
      status: contractMetadata.status,
      statusUpdateTimestamp: contractMetadata.statusUpdateTimestamp,
      statusUpdateExplanation: contractMetadata.statusUpdateExplanation,
    });
  } catch (error) {
    console.error(`Error processing MetadataUpdated for license ${licenseAddress}:`, error);
  }
});


/** Compute period start timestamp, snapshot value, and growth % for a given window. */
function computePeriodGrowth(
  eventTimestamp: bigint,
  totalValueNumeraire: number,
  existingStartTimestamp: bigint | null,
  existingStartValue: number | null,
  previousTotalValueNumeraire: number,
  windowSeconds: bigint,
): {
  periodStartTimestamp: bigint;
  periodStartTotalValueNumeraire: number;
  periodTotalValueNumeraireGrowth: number;
} {
  const periodStart = (eventTimestamp / windowSeconds) * windowSeconds;
  const isNewPeriod =
    existingStartTimestamp == null ||
    existingStartValue == null ||
    existingStartTimestamp < periodStart;
  const periodStartTimestamp = isNewPeriod ? periodStart : existingStartTimestamp;
  const periodStartTotalValueNumeraire = isNewPeriod ? previousTotalValueNumeraire : existingStartValue;
  const periodTotalValueNumeraireGrowth =
    periodStartTotalValueNumeraire > 0
      ? ((totalValueNumeraire - periodStartTotalValueNumeraire) * 100) /
        periodStartTotalValueNumeraire
      : 0;
  return {
    periodStartTimestamp,
    periodStartTotalValueNumeraire,
    periodTotalValueNumeraireGrowth,
  };
}

const ONE_HOUR = 3600n;
const ONE_DAY = 24n * ONE_HOUR;
const ONE_WEEK = 7n * ONE_DAY;
const ONE_MONTH = 30n * ONE_DAY;

type PeriodTable = typeof campaignHourData | typeof campaignDayData | typeof campaignWeekData | typeof campaignMonthData;
type DbContext = { db: Parameters<Parameters<typeof ponder.on>[1]>[0]["context"]["db"] };

async function findPeriodRow(
  context: DbContext,
  table: PeriodTable,
  addr: Address,
  periodStart: bigint,
) {
  const rows = await context.db.sql
    .select()
    .from(table)
    .where(and(eq(table.licenseAddress, addr), eq(table.periodStartTimestamp, periodStart)))
    .limit(1);
  return rows[0] ?? null;
}

async function upsertCampaignPeriodRow(
  context: DbContext,
  table: PeriodTable,
  periodStartTimestamp: bigint,
  licenseAddress: Address,
  currentPrice: number,
  totalSalesDelta: bigint,
  totalInteractionsDelta: bigint,
  emittedLicensesValueUSDDelta: number,
  totalTradingVolumeUSDDelta: number,
): Promise<void> {
  const existing = await findPeriodRow(context, table, licenseAddress, periodStartTimestamp);
  const pricePeriodStartScaled =
    existing?.sqrtPriceX96PeriodStart ?? BigInt(Math.round(Math.max(currentPrice, 0) * 1e18));
  const totalSales = (existing?.totalSales ?? 0n) + totalSalesDelta;
  const totalInteractions = (existing?.totalInteractions ?? 0n) + totalInteractionsDelta;
  const retailPercent = totalSales > 0n ? (Number(totalSales - totalInteractions) * 100) / Number(totalSales) : 0;

  const totalEmittedLicensesValueUSD = (existing?.totalEmittedLicensesValueUSD ?? 0) + emittedLicensesValueUSDDelta;
  const totalTradingVolumeUSD = (existing?.totalTradingVolumeUSD ?? 0) + totalTradingVolumeUSDDelta;

  const priceHuman = currentPrice;
  const pricePeriodStartHuman = Number(pricePeriodStartScaled) / 1e18;
  const growthPercent =
    pricePeriodStartHuman > 0 ? ((priceHuman - pricePeriodStartHuman) / pricePeriodStartHuman) * 100 : 0;

  const highPrice = existing
    ? Math.max(priceHuman, existing.highPrice)
    : priceHuman;
  const lowPrice = existing
    ? Math.min(priceHuman, existing.lowPrice)
    : priceHuman;
  const avgPrice = existing
    ? (existing.avgPrice + priceHuman) / 2
    : priceHuman;

  const values = {
    periodStartTimestamp,
    licenseAddress,
    sqrtPriceX96PeriodStart: pricePeriodStartScaled,
    highPrice,
    lowPrice,
    avgPrice,
    growthPercent,
    retailPercent,
    totalInteractions,
    totalSales,
    totalEmittedLicensesValueUSD,
    totalTradingVolumeUSD,
  };

  if (existing) {
    await context.db.update(table, { id: existing.id }).set(values);
  } else {
    await context.db.insert(table).values({ id: randomUUID(), ...values });
  }
}

/** Compute updated retailPercent, totalInteractions (non-retail count), and totalSales after one sell event. */
function computeRetailUpdate(
  prevTotalInteractions: bigint,
  prevTotalSales: bigint,
  isNonRetail: boolean,
): { retailPercent: number; totalInteractions: bigint; totalSales: bigint } {
  const totalInteractions = prevTotalInteractions + (isNonRetail ? 1n : 0n);
  const totalSales = prevTotalSales + 1n;
  const retailSales = totalSales - totalInteractions;
  const retailPercent = totalSales > 0n ? (Number(retailSales) * 100) / Number(totalSales) : 0;
  return { retailPercent, totalInteractions, totalSales };
}

ponder.on("IPoolManager:Swap", async ({ event, context }) => {
  const routerContract = context.contracts.LicenseSwapRouter;
  const poolManagerContract = context.contracts.IPoolManager;
  const campaignManagerContract = context.contracts.CampaignManager;
  const licenseContract = context.contracts.LicenseERC20;

  if (!routerContract?.address || !poolManagerContract) return;
  const routerAddress = routerContract.address.toLowerCase() as Address;
  const sender = (event.args.sender as string).toLowerCase();
  if (sender !== routerAddress) return;

  const poolIdHex = event.args.id as `0x${string}`;
  const amount0 = event.args.amount0;
  const amount1 = event.args.amount1;
  const timestamp = event.block.timestamp;

  const campaignRows = await context.db.sql
    .select({
      licenseAddress: campaign.licenseAddress,
      numeraireAddress: campaign.numeraireAddress,
      licenseType: campaign.licenseType,
      ipTokenId: campaign.ipTokenId,
      totalEmittedLicensesValueUSD: campaign.totalEmittedLicensesValueUSD,
      totalTradingVolumeUSD: campaign.totalTradingVolumeUSD,
    })
    .from(campaign)
    .where(eq(campaign.poolId, poolIdHex));
  const campaignRow = campaignRows[0];
  if (!campaignRow) return;

  const licenseAddress = campaignRow.licenseAddress as Address;
  const numeraireAddress = campaignRow.numeraireAddress as Address;
  const isSell = amount0 > 0n;

  let licenseDecimals = 18;
  let numeraireDecimals = 18;
  try {
    const [lDec, nDec] = await Promise.all([
      context.client.readContract({
        abi: ERC20_DECIMALS_ABI,
        address: licenseAddress,
        functionName: "decimals",
      }),
      context.client.readContract({
        abi: ERC20_DECIMALS_ABI,
        address: numeraireAddress,
        functionName: "decimals",
      }),
    ]);
    licenseDecimals = Number(lDec ?? 18);
    numeraireDecimals = Number(nDec ?? 18);
  } catch {
    // keep defaults
  }

  // Compute USD value of this swap
  const absAmount1 = amount1 < 0n ? -amount1 : amount1;
  let numeraireUSDPrice = 1;
  try {
    numeraireUSDPrice = await getTokenPriceUSD(numeraireAddress, { client: context.client });
  } catch {
    console.error(`Failed to get price for numeraire ${numeraireAddress}`);
  }
  const swapValueUSD = (Number(absAmount1) / 10 ** numeraireDecimals) * numeraireUSDPrice;

  // Determine retail vs non-retail
  const ipRecord = await context.db.find(ip, { tokenId: campaignRow.ipTokenId });
  let patentOwnerSafe: Address | null = null;
  if (campaignManagerContract && licenseContract?.abi && ipRecord) {
    try {
      const safe = await context.client.readContract({
        abi: campaignManagerContract.abi,
        address: campaignManagerContract.address!,
        functionName: "userSafes",
        args: [ipRecord.accountAddress],
      });
      patentOwnerSafe = (safe as Address) ?? null;
    } catch {
      // leave null
    }
  }
  const txFrom = (event.transaction.from ?? zeroAddress).toLowerCase() as Address;
  const nonRetail =
    isSell && patentOwnerSafe != null && txFrom === patentOwnerSafe.toLowerCase();

  const totalSalesDelta = isSell ? 1n : 0n;
  const totalInteractionsDelta = nonRetail ? 1n : 0n;

  // Compute emittedLicensesValueUSD = totalSupply * current price (USD snapshot)
  let totalSupply = 0n;
  try {
    totalSupply = (await context.client.readContract({
      abi: ERC20_TOTAL_SUPPLY_ABI,
      address: licenseAddress,
      functionName: "totalSupply",
    })) as bigint;
  } catch {
    // keep 0
  }
  const hookContract = getHookContractForLicenseType(
    context.contracts,
    campaignRow.licenseType as "DYNAMIC" | "FIXED",
  );
  const currentPrice =
    hookContract?.address && hookContract?.abi
      ? await quoteOneLicensePriceNumeraire({
          client: context.client,
          hookAddress: hookContract.address as `0x${string}`,
          hookAbi: hookContract.abi,
          licenseAddress,
          numeraireAddress,
          licenseDecimals,
          numeraireDecimals,
        }).catch(() => 0)
      : 0;
  const totalSupplyHuman = Number(formatUnits(totalSupply, licenseDecimals));
  const emittedLicensesValueUSD = totalSupplyHuman * currentPrice * numeraireUSDPrice;

  const emittedValueDelta = emittedLicensesValueUSD - campaignRow.totalEmittedLicensesValueUSD;

  const periodStart1h = (timestamp / ONE_HOUR) * ONE_HOUR;
  const periodStart24h = (timestamp / ONE_DAY) * ONE_DAY;
  const periodStart1w = (timestamp / ONE_WEEK) * ONE_WEEK;
  const periodStart1m = (timestamp / ONE_MONTH) * ONE_MONTH;

  const upsert = async (table: PeriodTable, periodStart: bigint) =>
    upsertCampaignPeriodRow(
      context,
      table,
      periodStart,
      licenseAddress,
      currentPrice,
      totalSalesDelta,
      totalInteractionsDelta,
      emittedValueDelta,
      swapValueUSD,
    );

  await Promise.all([
    upsert(campaignHourData, periodStart1h),
    upsert(campaignDayData, periodStart24h),
    upsert(campaignWeekData, periodStart1w),
    upsert(campaignMonthData, periodStart1m),
  ]);

  await context.db.update(campaign, { licenseAddress }).set({
    currentPrice,
    totalSupply: totalSupplyHuman,
    totalEmittedLicensesValueUSD: emittedLicensesValueUSD,
    totalTradingVolumeUSD: campaignRow.totalTradingVolumeUSD + swapValueUSD,
  });

  const currentDayData = await findPeriodRow(context, campaignDayData, licenseAddress, periodStart24h);

  // --- Update IP aggregates ---
  if (ipRecord) {
    let topGrowthUpdate: { topGrowth24hCampaignLicenseAddress: Address } | undefined;
    if (currentDayData) {
      const storedTop = ipRecord.topGrowth24hCampaignLicenseAddress;
      let shouldSetCurrent = !storedTop;
      if (storedTop) {
        const prevTopData = await findPeriodRow(context, campaignDayData, storedTop, periodStart24h);
        shouldSetCurrent = !prevTopData || currentDayData.growthPercent > prevTopData.growthPercent;
      }
      if (shouldSetCurrent) {
        topGrowthUpdate = { topGrowth24hCampaignLicenseAddress: licenseAddress };
      }
    }

    const ipGrowthUpdate: Record<string, unknown> = {
      growthPercent: currentDayData?.growthPercent ?? ipRecord.growthPercent,
      ...(topGrowthUpdate ?? {}),
    };

    if (isSell) {
      const ipRetail = computeRetailUpdate(ipRecord.totalInteractions, ipRecord.totalSales, nonRetail);
      await context.db.update(ip, { tokenId: ipRecord.tokenId }).set({
        ...ipGrowthUpdate,
        totalInteractions: ipRetail.totalInteractions,
        totalSales: ipRetail.totalSales,
        retailPercent: ipRetail.retailPercent,
        totalTradingVolumeUSD: ipRecord.totalTradingVolumeUSD + swapValueUSD,
        totalEmittedLicensesValueUSD: ipRecord.totalEmittedLicensesValueUSD + emittedValueDelta,
      });
    } else {
      await context.db.update(ip, { tokenId: ipRecord.tokenId }).set(ipGrowthUpdate);
    }
  }

  // --- Update account aggregates ---
  if (ipRecord && isSell) {
    const ownerAccount = await context.db.find(account, { address: ipRecord.accountAddress });
    if (ownerAccount) {
      await context.db.update(account, { address: ipRecord.accountAddress }).set({
        totalSwaps: ownerAccount.totalSwaps + 1n,
        totalInteractions: ownerAccount.totalInteractions + (nonRetail ? 1n : 0n),
        totalEmittedLicenseValueUSD: ownerAccount.totalEmittedLicenseValueUSD + emittedValueDelta,
      });
    }
  }

  // --- Update mainStats ---
  if (isSell) {
    const stats = await context.db.find(mainStats, { id: GLOBAL_STATS_ID });
    if (stats) {
      const globalRetail = computeRetailUpdate(stats.totalInteractions, stats.totalSales, nonRetail);

      await context.db.update(mainStats, { id: GLOBAL_STATS_ID }).set({
        totalInteractions: globalRetail.totalInteractions,
        totalSales: globalRetail.totalSales,
        retailPercent: globalRetail.retailPercent,
        totalTradingVolumeUSD: stats.totalTradingVolumeUSD + swapValueUSD,
        totalEmittedLicensesValueUSD: stats.totalEmittedLicensesValueUSD + emittedValueDelta,
      });
    }
  }

  // --- Update category & industry aggregates ---
  if (ipRecord?.categoryId) {
    const catRecord = await context.db.find(category, { id: ipRecord.categoryId });
    if (catRecord) {
      const catUpdate: Record<string, unknown> = {};
      if (isSell) {
        const catRetail = computeRetailUpdate(catRecord.totalInteractions, catRecord.totalSales, nonRetail);
        catUpdate.totalInteractions = catRetail.totalInteractions;
        catUpdate.totalSales = catRetail.totalSales;
        catUpdate.retailPercent = catRetail.retailPercent;
        catUpdate.totalTradingVolumeUSD = catRecord.totalTradingVolumeUSD + swapValueUSD;
        catUpdate.totalEmittedLicensesValueUSD = catRecord.totalEmittedLicensesValueUSD + emittedValueDelta;
      }

      if (currentDayData) {
        let shouldUpdateTop = !catRecord.topGrowth24hCampaignLicenseAddress;
        if (!shouldUpdateTop && catRecord.topGrowth24hCampaignLicenseAddress) {
          const prevTopData = await findPeriodRow(context, campaignDayData, catRecord.topGrowth24hCampaignLicenseAddress, periodStart24h);
          shouldUpdateTop = !prevTopData || currentDayData.growthPercent > prevTopData.growthPercent;
        }
        if (shouldUpdateTop) {
          catUpdate.topGrowth24hCampaignLicenseAddress = licenseAddress;
        }
      }

      if (Object.keys(catUpdate).length > 0) {
        await context.db.update(category, { id: ipRecord.categoryId }).set(catUpdate);
      }
    }

    for (const ind of new Set(ipRecord.industry)) {
      const indRecord = await context.db.find(industry, { id: ind });
      if (!indRecord) continue;

      const indUpdate: Record<string, unknown> = {};
      if (isSell) {
        const indRetail = computeRetailUpdate(indRecord.totalInteractions, indRecord.totalSales, nonRetail);
        indUpdate.totalInteractions = indRetail.totalInteractions;
        indUpdate.totalSales = indRetail.totalSales;
        indUpdate.retailPercent = indRetail.retailPercent;
        indUpdate.totalTradingVolumeUSD = indRecord.totalTradingVolumeUSD + swapValueUSD;
        indUpdate.totalEmittedLicensesValueUSD = indRecord.totalEmittedLicensesValueUSD + emittedValueDelta;
      }

      if (currentDayData) {
        let shouldUpdateTop = !indRecord.topGrowth24hCampaignLicenseAddress;
        if (!shouldUpdateTop && indRecord.topGrowth24hCampaignLicenseAddress) {
          const prevTopData = await findPeriodRow(context, campaignDayData, indRecord.topGrowth24hCampaignLicenseAddress, periodStart24h);
          shouldUpdateTop = !prevTopData || currentDayData.growthPercent > prevTopData.growthPercent;
        }
        if (shouldUpdateTop) {
          indUpdate.topGrowth24hCampaignLicenseAddress = licenseAddress;
        }
      }

      if (Object.keys(indUpdate).length > 0) {
        await context.db.update(industry, { id: ind }).set(indUpdate);
      }
    }
  }
});

ponder.on("AuthCaptureEscrow:PaymentCaptured", async ({ event, context }) => {
  const escrowContract = context.contracts.AuthCaptureEscrow;
  const campaignManagerContract = context.contracts.CampaignManager;
  const licenseContract = context.contracts.LicenseERC20;
  if (!escrowContract) {
    console.error("AuthCaptureEscrow contract not found in context.contracts");
    return;
  }
  const licenseAbi = licenseContract?.abi ?? [];

  const txHash = event.transaction.hash;
  const tx = await context.client.getTransaction({ hash: txHash });
  if (!tx?.input || tx.input === "0x") {
    console.warn(`PaymentCaptured: no transaction input for ${txHash}`);
    return;
  }

  // PaymentCaptured can be from a direct escrow.capture call or from CampaignManager.capture (e.g. download attachment).
  // Decode the top-level tx: if it's to CampaignManager, use its ABI; otherwise use escrow ABI.
  const cmAddress = campaignManagerContract?.address?.toLowerCase();
  const isCampaignManagerTx = tx.to && cmAddress && tx.to.toLowerCase() === cmAddress;
  if (!isCampaignManagerTx || !campaignManagerContract) {
    // Only handle PaymentCaptured from CampaignManager
    return;
  }
  const abi = campaignManagerContract.abi;

  let decoded: { functionName: string; args: [unknown, bigint, ...unknown[]] };
  try {
    decoded = decodeFunctionData({
      abi,
      data: tx.input as `0x${string}`,
    }) as { functionName: string; args: [unknown, bigint, ...unknown[]] };
  } catch (e) {
    console.warn(`PaymentCaptured: failed to decode calldata for ${txHash}`, e);
    return;
  }

  if (decoded.functionName !== "capture") return;

  const [paymentInfo, amount] = decoded.args;
  const receiver = (paymentInfo as { receiver: Address }).receiver;
  const license = (paymentInfo as { token: Address }).token;
  if (amount === 0n) return;

  const treasuryAddress = receiver.toLowerCase() as Address;
  const licenseAddress = license.toLowerCase() as Address;
  const id = `${treasuryAddress}-${licenseAddress}`;

  // Get PoolPriceSnapshot from same tx (emitted by CampaignManager after capture).
  let numeraire: Address | null = null;
  if (campaignManagerContract) {
    const poolPriceSnapshotEvent = getAbiItem({
      abi: campaignManagerContract.abi,
      name: "PoolPriceSnapshot",
    });
    if (poolPriceSnapshotEvent?.type === "event") {
      const poolPriceSnapshotTopic = getEventSelector(poolPriceSnapshotEvent);
      const receipt = await context.client.getTransactionReceipt({ hash: txHash });
      const cmAddress = campaignManagerContract.address?.toLowerCase();
      for (const log of receipt?.logs ?? []) {
        if (log.address?.toLowerCase() !== cmAddress || log.topics[0] !== poolPriceSnapshotTopic) continue;
        const decoded = decodeEventLog({
          abi: [poolPriceSnapshotEvent],
          data: log.data,
          topics: log.topics,
        });
        if (decoded.args.license.toLowerCase() === licenseAddress) {
          numeraire = decoded.args.numeraire;
          break;
        }
      }
    }
  }

  const numeraireAddress = (numeraire ?? zeroAddress).toLowerCase() as Address;

  let licenseName = "";
  let licenseSymbol = "";
  let licenseDecimals = 18;
  let numeraireName = "";
  let numeraireSymbol = "";
  let numeraireDecimals = 18;
  try {
    const [lName, lSymbol, lDec] = await Promise.all([
      context.client.readContract({ abi: licenseAbi, address: license, functionName: "name" }),
      context.client.readContract({ abi: licenseAbi, address: license, functionName: "symbol" }),
      context.client.readContract({ abi: licenseAbi, address: license, functionName: "decimals" }).catch(() => 18),
    ]);
    licenseName = (lName as string) ?? "";
    licenseSymbol = (lSymbol as string) ?? "";
    licenseDecimals = Number(lDec ?? 18);
  } catch {
    // keep defaults
  }

  const existing = await context.db.find(treasuryLicenseBalance, { id });
  const amountHuman = Number(formatUnits(amount, licenseDecimals));
  const newBalance = (existing?.balance ?? 0) + amountHuman;
  const campaignRows = await context.db.sql
    .select({
      licenseType: campaign.licenseType,
      numeraireAddress: campaign.numeraireAddress,
    })
    .from(campaign)
    .where(eq(campaign.licenseAddress, licenseAddress))
    .limit(1);
  const campaignRow = campaignRows[0];
  const resolvedNumeraireAddress = ((campaignRow?.numeraireAddress as Address | undefined) ?? numeraireAddress) as Address;
  if (resolvedNumeraireAddress !== zeroAddress) {
    try {
      const [nName, nSymbol, nDec] = await Promise.all([
        context.client.readContract({ abi: licenseAbi, address: resolvedNumeraireAddress, functionName: "name" }),
        context.client.readContract({ abi: licenseAbi, address: resolvedNumeraireAddress, functionName: "symbol" }),
        context.client
          .readContract({ abi: licenseAbi, address: resolvedNumeraireAddress, functionName: "decimals" })
          .catch(() => 18),
      ]);
      numeraireName = (nName as string) ?? "";
      numeraireSymbol = (nSymbol as string) ?? "";
      numeraireDecimals = Number(nDec ?? 18);
    } catch {
      // keep defaults
    }
  }
  const hookContract = campaignRow?.licenseType
    ? getHookContractForLicenseType(context.contracts, campaignRow.licenseType as "DYNAMIC" | "FIXED")
    : undefined;
  const priceHuman =
    hookContract?.address && hookContract?.abi
      ? await quoteOneLicensePriceNumeraire({
          client: context.client,
          hookAddress: hookContract.address as `0x${string}`,
          hookAbi: hookContract.abi,
          licenseAddress,
          numeraireAddress: resolvedNumeraireAddress,
          licenseDecimals,
          numeraireDecimals,
        }).catch(() => 0)
      : 0;
  const totalValueNumeraire = newBalance * priceHuman;

  const ONE_HOUR_T = 3600n;
  const ONE_DAY_T = 24n * ONE_HOUR_T;
  const ONE_WEEK_T = 7n * ONE_DAY_T;
  const ONE_MONTH_T = 30n * ONE_DAY_T;

  const previousTotalValueNumeraire = existing?.totalValueNumeraire ?? totalValueNumeraire;

  const g1h = computePeriodGrowth(
    event.block.timestamp,
    totalValueNumeraire,
    existing?.periodStartTimestamp1h ?? null,
    existing?.periodStartTotalValueNumeraire1h ?? null,
    previousTotalValueNumeraire,
    ONE_HOUR_T,
  );
  const g24h = computePeriodGrowth(
    event.block.timestamp,
    totalValueNumeraire,
    existing?.periodStartTimestamp24h ?? null,
    existing?.periodStartTotalValueNumeraire24h ?? null,
    previousTotalValueNumeraire,
    ONE_DAY_T,
  );
  const g1w = computePeriodGrowth(
    event.block.timestamp,
    totalValueNumeraire,
    existing?.periodStartTimestamp1w ?? null,
    existing?.periodStartTotalValueNumeraire1w ?? null,
    previousTotalValueNumeraire,
    ONE_WEEK_T,
  );
  const g1m = computePeriodGrowth(
    event.block.timestamp,
    totalValueNumeraire,
    existing?.periodStartTimestamp1m ?? null,
    existing?.periodStartTotalValueNumeraire1m ?? null,
    previousTotalValueNumeraire,
    ONE_MONTH_T,
  );

  if (existing) {
    await context.db.update(treasuryLicenseBalance, { id }).set({
      balance: newBalance,
      totalValueNumeraire,
      numeraireAddress: resolvedNumeraireAddress,
      numeraireName,
      numeraireSymbol,
      periodStartTimestamp1h: g1h.periodStartTimestamp,
      periodStartTotalValueNumeraire1h: g1h.periodStartTotalValueNumeraire,
      periodTotalValueNumeraireGrowth1h: g1h.periodTotalValueNumeraireGrowth,
      periodStartTimestamp24h: g24h.periodStartTimestamp,
      periodStartTotalValueNumeraire24h: g24h.periodStartTotalValueNumeraire,
      periodTotalValueNumeraireGrowth24h: g24h.periodTotalValueNumeraireGrowth,
      periodStartTimestamp1w: g1w.periodStartTimestamp,
      periodStartTotalValueNumeraire1w: g1w.periodStartTotalValueNumeraire,
      periodTotalValueNumeraireGrowth1w: g1w.periodTotalValueNumeraireGrowth,
      periodStartTimestamp1m: g1m.periodStartTimestamp,
      periodStartTotalValueNumeraire1m: g1m.periodStartTotalValueNumeraire,
      periodTotalValueNumeraireGrowth1m: g1m.periodTotalValueNumeraireGrowth,
    });
  } else {
    await context.db.insert(treasuryLicenseBalance).values({
      id,
      treasuryAddress,
      licenseAddress,
      licenseName,
      licenseSymbol,
      numeraireAddress: resolvedNumeraireAddress,
      numeraireName,
      numeraireSymbol,
      balance: newBalance,
      totalValueNumeraire,
      periodStartTimestamp1h: g1h.periodStartTimestamp,
      periodStartTotalValueNumeraire1h: g1h.periodStartTotalValueNumeraire,
      periodTotalValueNumeraireGrowth1h: g1h.periodTotalValueNumeraireGrowth,
      periodStartTimestamp24h: g24h.periodStartTimestamp,
      periodStartTotalValueNumeraire24h: g24h.periodStartTotalValueNumeraire,
      periodTotalValueNumeraireGrowth24h: g24h.periodTotalValueNumeraireGrowth,
      periodStartTimestamp1w: g1w.periodStartTimestamp,
      periodStartTotalValueNumeraire1w: g1w.periodStartTotalValueNumeraire,
      periodTotalValueNumeraireGrowth1w: g1w.periodTotalValueNumeraireGrowth,
      periodStartTimestamp1m: g1m.periodStartTimestamp,
      periodStartTotalValueNumeraire1m: g1m.periodStartTotalValueNumeraire,
      periodTotalValueNumeraireGrowth1m: g1m.periodTotalValueNumeraireGrowth,
    });
  }
});
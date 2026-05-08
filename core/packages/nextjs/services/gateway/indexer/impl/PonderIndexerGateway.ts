import { IIndexerGateway } from "../indexer";
import { GraphQLClient } from "graphql-request";
import { formatUnits, zeroAddress } from "viem";
import { getSdk } from "~~/generated/graphql";
import type { CampaignPeriodName } from "~~/types";
import {
  CampaignPeriodAvgPriceDataItem,
  DiscoverIP,
  OwnerIPWithCampaigns,
  PatentDetail,
  PatentDetailCampaign,
} from "~~/types";

export class PonderIndexerGateway implements IIndexerGateway {
  private client: ReturnType<typeof getSdk>;

  constructor() {
    const ponderUrl = process.env.PONDER_URL || "http://localhost:42069/graphql";
    const graphQLClient = new GraphQLClient(ponderUrl);
    this.client = getSdk(graphQLClient);
  }

  async getIpList(
    page: number,
    pageSize: number,
    orderBy?: string,
    orderDirection?: "asc" | "desc",
    category?: string,
    name?: string,
  ): Promise<{ items: DiscoverIP[]; totalCount: number }> {
    try {
      const offset = page * pageSize;
      const where: any = {};
      if (category && category !== "All categories") {
        where.categoryId = category;
      }
      if (name) {
        where.name_contains = name.trim();
      }

      const result = await this.client.DiscoverIps({
        limit: pageSize,
        offset,
        orderBy,
        orderDirection,
        where,
      });

      return {
        items: result.ips.items.map(ip => this.mapDiscoverIpToIP(ip)),
        totalCount: result.ips.totalCount,
      };
    } catch (error) {
      console.error("Error fetching filtered IP list from Ponder:", error);
      throw new Error(`Failed to fetch IP list: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getOwnerIpsWithCampaigns(ownerAddress: string): Promise<OwnerIPWithCampaigns[]> {
    try {
      const result = await this.client.OwnerIpsWithCampaigns({
        where: {
          accountAddress: ownerAddress.toLowerCase(),
        },
        orderBy: "tokenId",
        orderDirection: "asc",
        limit: 1000,
      });

      return result.ips.items.map(ip => ({
        tokenId: Number(ip.tokenId),
        category: ip.categoryId ?? null,
        image: ip.image,
        name: ip.name,
        description: ip.description,
        growthPercent: ip.growthPercent,
        totalEmittedLicensesValueUSD: ip.totalEmittedLicensesValueUSD,
        campaigns:
          ip.campaigns?.items.map(campaign => ({
            licenseAddress: campaign.licenseAddress,
            licenseSymbol: campaign.licenseSymbol,
            numeraireSymbol: campaign.numeraireSymbol,
            poolId: campaign.poolId,
            denominationUnit: campaign.denominationUnit,
            denominationAmount: campaign.denominationAmount,
            currentPrice: campaign.currentPrice,
            totalSupply: campaign.totalSupply,
            totalEmittedLicensesValueUSD: campaign.totalEmittedLicensesValueUSD,
          })) ?? [],
      }));
    } catch (error) {
      console.error(`Error fetching owner IPs with campaigns for ${ownerAddress}:`, error);
      throw new Error(
        `Failed to fetch owner IPs with campaigns: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getCampaignPeriodAvgPriceData(
    licenseAddress: string,
    period: CampaignPeriodName,
    limit: number,
  ): Promise<CampaignPeriodAvgPriceDataItem[]> {
    try {
      const where = {
        licenseAddress: licenseAddress.toLowerCase(),
      };
      const result = await this.client.CampaignPeriodAvgPriceDatas({
        whereHour: where,
        whereDay: where,
        whereWeek: where,
        whereMonth: where,
        orderBy: "periodStartTimestamp",
        orderDirection: "desc",
        limit,
        fetchHour: period === "hour",
        fetchDay: period === "day",
        fetchWeek: period === "week",
        fetchMonth: period === "month",
      });

      const data =
        result.campaignHourDatas ?? result.campaignDayDatas ?? result.campaignWeekDatas ?? result.campaignMonthDatas;
      if (!data?.items) {
        return [];
      }

      return data.items.map(item => ({
        timestamp: this.toStringValue(item.timestamp),
        avgPrice: String(item.avgPrice),
      }));
    } catch (error) {
      console.error(`Error fetching campaign ${period} avg-price data for ${licenseAddress}:`, error);
      throw new Error(
        `Failed to fetch campaign period avg-price data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getPatentDetail(tokenId: number): Promise<PatentDetail> {
    try {
      const result = await this.client.PatentDetail({
        tokenId: tokenId.toString(),
      });

      const ip = result.ip;
      if (!ip) {
        throw new Error(`Patent with tokenId ${tokenId} not found`);
      }

      const campaigns: PatentDetailCampaign[] =
        ip.campaigns?.items.map(c => {
          const latestDay = c.campaignDayDatas?.items?.[0];
          const latestHour = c.campaignHourDatas?.items?.[0];

          return {
            licenseType: c.licenseType === "DYNAMIC" || c.licenseType === "FIXED" ? c.licenseType : "FIXED",
            licenseAddress: c.licenseAddress,
            licenseSymbol: c.licenseSymbol ?? "",
            numeraireAddress: c.numeraireAddress ?? "",
            numeraireSymbol: c.numeraireSymbol ?? "",
            usageRightsDefinition: c.usageRightsDefinition ?? "",
            transferabilityFlags: c.transferrabilityFlag === "NonTransferrable" ? "NonTransferable" : "Transferable",
            licenseDuration: this.toStringValue(c.licenseDuration),
            denominationUnit: c.denominationUnit,
            denominationAmount: c.denominationAmount,
            currentPrice: c.currentPrice,
            totalSupply: c.totalSupply,
            totalEmittedLicensesValueUSD: c.totalEmittedLicensesValueUSD,
            totalTradingVolumeUSD: c.totalTradingVolumeUSD,
            growth24h: latestDay?.growthPercent ?? null,
            retailPercent: latestHour?.retailPercent ?? null,
            hourlyPrices:
              c.campaignHourDatas?.items.map(h => ({
                timestamp: this.toStringValue(h.periodStartTimestamp),
                avgPrice: h.avgPrice,
              })) ?? [],
          };
        }) ?? [];

      return {
        tokenId: Number(tokenId),
        name: ip.name,
        image: ip.image,
        description: ip.description,
        industry: ip.industry ?? [],
        categoryId: ip.categoryId ?? null,
        owner: (ip.accountAddress ?? zeroAddress) as `0x${string}`,
        inventorNames: ip.inventorNames,
        status: ip.status ?? null,
        statusUpdateTimestamp:
          ip.statusUpdateTimestamp === null || ip.statusUpdateTimestamp === undefined
            ? null
            : this.toStringValue(ip.statusUpdateTimestamp),
        statusUpdateExplanation: ip.statusUpdateExplanation ?? null,
        patentNumber: ip.patentNumber,
        jurisdiction: ip.jurisdiction,
        registrationAuthority: ip.registrationAuthority,
        filingDate: ip.filingDate,
        grantDate: ip.grantDate,
        patentClassification: ip.patentClassification,
        creationTimestamp: this.toStringValue(ip.creationTimestamp),
        campaigns,
      };
    } catch (error) {
      console.error(`Error fetching patent detail for tokenId ${tokenId}:`, error);
      throw new Error(`Failed to fetch patent detail: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getLatestIPs(limit: number): Promise<OwnerIPWithCampaigns[]> {
    try {
      const result = await this.client.LatestIps({
        limit: limit * 2, // Fetch more as some might not have campaigns
      });

      if (!result.ips || !result.ips.items) {
        return [];
      }

      return result.ips.items
        .map((ip: any) => ({
          tokenId: Number(ip.tokenId),
          category: ip.categoryId ?? null,
          image: ip.image,
          name: ip.name,
          description: ip.description,
          growthPercent: ip.growthPercent,
          totalEmittedLicensesValueUSD: ip.totalEmittedLicensesValueUSD,
          campaigns:
            ip.campaigns?.items.map((campaign: any) => ({
              licenseAddress: campaign.licenseAddress,
              licenseSymbol: campaign.licenseSymbol,
              numeraireSymbol: campaign.numeraireSymbol,
              poolId: campaign.poolId,
              denominationUnit: campaign.denominationUnit,
              denominationAmount: campaign.denominationAmount,
              currentPrice: campaign.currentPrice,
              totalSupply: campaign.totalSupply,
              totalEmittedLicensesValueUSD: campaign.totalEmittedLicensesValueUSD,
            })) ?? [],
        }))
        .filter((ip: any) => ip.campaigns && ip.campaigns.length > 0)
        .slice(0, limit);
    } catch (error) {
      console.error(`Error fetching latest IPs:`, error);
      throw new Error(`Failed to fetch latest IPs: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getMainStats(): Promise<any> {
    try {
      const result = await this.client.MainStats({});

      if (!result.mainStats) {
        return null;
      }

      const stats = result.mainStats;
      return {
        id: stats.id,
        uniquePatents: Number(stats.uniquePatents),
        totalEmittedLicensesValueUSD: stats.totalEmittedLicensesValueUSD,
        totalTradingVolumeUSD: stats.totalTradingVolumeUSD,
        uniquePatentOwners: Number(stats.uniquePatentOwners),
        totalInteractions: Number(stats.totalInteractions),
        totalSales: Number(stats.totalSales),
        campaignAmount: Number(stats.campaignAmount),
        retailPercent: stats.retailPercent,
        growthPercent: stats.growthPercent,
      };
    } catch (error) {
      console.error(`Error fetching main stats:`, error);
      throw new Error(`Failed to fetch main stats: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getCategoryData(): Promise<any> {
    try {
      const result = await this.client.Categories({});

      if (!result.categorys || !result.categorys.items) {
        return [];
      }

      return result.categorys.items.map(cat => {
        const { ips, ...rest } = cat;
        return {
          ...rest,
          ipCount: ips?.totalCount ?? 0,
        };
      });
    } catch (error) {
      console.error(`Error fetching categories data:`, error);
      throw new Error(`Failed to fetch category data: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getAllCampaigns24hVolume(): Promise<number> {
    try {
      const result = await (this.client as any).AllCampaigns24hVolume({
        limit: 1000,
      });

      if (!result.campaigns || !result.campaigns.items) {
        return 0;
      }

      const totalVolume = result.campaigns.items.reduce((acc: number, campaign: any) => {
        const latestDayData = campaign.campaignDayDatas?.items?.[0];
        const volume = latestDayData?.totalTradingVolumeUSD ?? 0;
        return acc + volume;
      }, 0);

      return totalVolume;
    } catch (error) {
      console.error(`Error fetching all campaigns 24h volume:`, error);
      throw new Error(
        `Failed to fetch all campaigns 24h volume: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private toStringValue(value: unknown): string {
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "bigint") return String(value);
    return "";
  }

  private mapDiscoverIpToIP(ip: any): DiscoverIP {
    const topCampaign = ip.topGrowth24hCampaign
      ? {
          ...ip.topGrowth24hCampaign,
          denomination: {
            unit: ip.topGrowth24hCampaign.denominationUnit,
            amount: parseFloat(formatUnits(BigInt(ip.topGrowth24hCampaign.denominationAmount), 18)),
          },
          growth24h: ip.topGrowth24hCampaign.campaignDayDatas?.items?.[0]?.growthPercent ?? null,
          dayData: ip.topGrowth24hCampaign.campaignDayDatas?.items?.[0] ?? null,
        }
      : undefined;

    return {
      tokenId: Number(ip.tokenId),
      accountAddress: ip.accountAddress,
      name: ip.name,
      patentNumber: ip.patentNumber,
      inventorNames: ip.inventorNames,
      jurisdiction: ip.jurisdiction,
      registrationAuthority: ip.registrationAuthority,
      patentClassification: ip.patentClassification,
      filingDate: ip.filingDate,
      grantDate: ip.grantDate,
      description: ip.description,
      image: ip.image,
      creationTimestamp: ip.creationTimestamp,
      status: ip.status ?? null,
      statusUpdateTimestamp: ip.statusUpdateTimestamp ?? null,
      statusUpdateExplanation: ip.statusUpdateExplanation ?? null,
      reasonCode: ip.reasonCode ?? null,
      caseReference: ip.caseReference ?? null,
      industry: ip.industry ?? [],
      categoryId: ip.categoryId ?? null,
      retailPercent: ip.retailPercent,
      growthPercent: ip.growthPercent,
      totalInteractions: Number(ip.totalInteractions),
      totalSales: Number(ip.totalSales),
      totalEmittedLicensesValueUSD: ip.totalEmittedLicensesValueUSD,
      totalTradingVolumeUSD: ip.totalTradingVolumeUSD,
      topGrowth24hCampaignLicenseAddress: ip.topGrowth24hCampaignLicenseAddress ?? null,
      topCampaign,
    };
  }
}

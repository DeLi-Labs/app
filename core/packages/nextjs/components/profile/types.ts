import type { PatentCategory } from "~~/utils/patentCategoryColors";
import type { OwnerIPCampaign } from "~~/types";

export type ProfileTab = "ips" | "campaigns";

export type NormalizedIpItem = {
  tokenId: number;
  category: PatentCategory;
  image: string;
  name: string;
  description: string;
  growthPercent: number;
  totalEmittedLicensesValueUSD: number;
  campaigns: OwnerIPCampaign[];
};

export type NormalizedCampaignItem = OwnerIPCampaign & {
  tokenId: number;
  patentName: string;
  patentCategory: PatentCategory;
  patentImage: string;
};

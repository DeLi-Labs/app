import {
  CAMPAIGN_ICON,
  CREATIVE_ICON,
  ENERGY_ICON,
  ENGINEERING_ICON,
  IP_ICON,
  MEDICINE_ICON,
  RESOURCES_ICON,
  TECHNOLOGY_ICON,
} from "~~/components/assets/common";
import { PATENT_CATEGORY_COLORS, type PatentCategory } from "~~/utils/patentCategoryColors";
import type { NormalizedCampaignItem, NormalizedIpItem } from "~~/components/profile/types";
import type { OwnerIPWithCampaigns } from "~~/types";

const VALID_CATEGORIES: PatentCategory[] = ["Medicine", "Engineering", "Energy", "Technology", "Resources", "Creative"];

export const categoryIcons: Record<PatentCategory, typeof MEDICINE_ICON> = {
  Medicine: MEDICINE_ICON,
  Engineering: ENGINEERING_ICON,
  Energy: ENERGY_ICON,
  Technology: TECHNOLOGY_ICON,
  Resources: RESOURCES_ICON,
  Creative: CREATIVE_ICON,
};

export const tabIcons = {
  ips: IP_ICON,
  campaigns: CAMPAIGN_ICON,
} as const;

export const safeCategory = (category: string | null | undefined): PatentCategory => {
  if (category && VALID_CATEGORIES.includes(category as PatentCategory)) {
    return category as PatentCategory;
  }
  return "Technology";
};

export const truncateMiddleAddress = (value?: string, head = 6, tail = 4) => {
  if (!value) return "";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
};

export const trimWithEllipsis = (value: string, maxLength = 250) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
};

export const formatCompactValue = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  })
    .format(value)
    .toLowerCase();
};

export const formatUnit = (unit: string) => unit.toLowerCase().replace(/_/g, " ").replace("per", "/");

/** Matches `PatentHeaderGeneralData` license mode value (placeholder token, not on-chain symbol). */
export const CAMPAIGN_DISPLAY_TOKEN = "TKN";

export const formatCampaignDenominationForDisplay = (amount: number | string, unit: string) =>
  `${amount} ${CAMPAIGN_DISPLAY_TOKEN} ${formatUnit(unit)}`;

export const normalizeOwnerItems = (items: OwnerIPWithCampaigns[]): NormalizedIpItem[] => {
  return items.map(item => ({
    ...item,
    category: safeCategory(item.category),
    image: item.image ?? "",
  }));
};

export const flattenCampaigns = (ips: NormalizedIpItem[]): NormalizedCampaignItem[] => {
  return ips.flatMap(ip =>
    ip.campaigns.map(campaign => ({
      ...campaign,
      tokenId: ip.tokenId,
      patentName: ip.name,
      patentCategory: ip.category,
      patentImage: ip.image,
    })),
  );
};

export const categoryStroke = (category: PatentCategory) =>
  `linear-gradient(${PATENT_CATEGORY_COLORS[category].start}, ${PATENT_CATEGORY_COLORS[category].end})`;

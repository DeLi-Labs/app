import { onchainTable, relations, onchainEnum, index } from "ponder";

// Enum for attachment type
export const attachmentType = onchainEnum("attachment_type", [
  "ENCRYPTED",
  "PLAIN",
]);

// Enum for denomination unit
export const denominationUnit = onchainEnum("denomination_unit", [
  "PER_ITEM",
  "PER_HOUR",
  "PER_DAY",
  "PER_BYTE",
  "PER_1000_TOKEN",
]);

// Enum for transferrability flag
export const transferrabilityFlag = onchainEnum("transferrability_flag", [
  "Transferrable",
  "NonTransferrable",
]);

// Main stats (aggregate stats; id = uuid primary key)
export const mainStats = onchainTable("main_stats", (t) => ({
  id: t.text().primaryKey(),
  uniquePatents: t.bigint().notNull(),
  totalEmittedLicensesValueUSD: t.real().notNull(), // current total value of all emitted licenses across all campaigns
  totalTradingVolumeUSD: t.real().notNull(), // cumulative trading volume in protocol for all time
  uniquePatentOwners: t.bigint().notNull(),
  totalInteractions: t.bigint().notNull(),
  totalSales: t.bigint().notNull(),
  campaignAmount: t.bigint().notNull(),
  retailPercent: t.real().notNull(),
  growthPercent: t.real().notNull(),
}));

// Account (per-address stats; address = primary key)
export const account = onchainTable("account", (t) => ({
  address: t.hex().primaryKey(),
  uniquePatents: t.bigint().notNull(),
  campaignAmount: t.bigint().notNull(),
  totalEmittedLicenseValueUSD: t.real().notNull(), // current total value of all emitted licenses by this account
  totalSwaps: t.bigint().notNull(),
  totalInteractions: t.bigint().notNull(),
}));

// Main IP table (corresponds to IPDetails type)
export const ip = onchainTable("ip", (t) => ({
  tokenId: t.bigint().primaryKey(),
  accountAddress: t.hex().notNull(), // FK to account (current holder, updated on transfer)
  name: t.text().notNull(),
  patentNumber: t.text().notNull(),
  inventorNames: t.text().notNull(),
  jurisdiction: t.text().array().notNull(),
  registrationAuthority: t.text().notNull(),
  patentClassification: t.text().notNull(),
  filingDate: t.text().notNull(),
  grantDate: t.text().notNull(),
  espacenetUrl: t.text().notNull(),
  epoUrl: t.text().notNull(),
  ownerLinkedinUrl: t.text().notNull(),
  ownerWebsiteUrl: t.text().notNull(),
  description: t.text().notNull(),
  image: t.text().notNull(),
  creationTimestamp: t.bigint().notNull(),
  industry: t.text().array().notNull(),
  categoryId: t.text(), // FK to category (one-to-one)
  retailPercent: t.real().notNull(),
  growthPercent: t.real().notNull(),
  totalInteractions: t.bigint().notNull(),
  totalSales: t.bigint().notNull(),
  totalEmittedLicensesValueUSD: t.real().notNull(), // current total value of all emitted licenses across campaigns for this IP
  totalTradingVolumeUSD: t.real().notNull(), // cumulative trading volume across all campaigns of this IP
  topGrowth24hCampaignLicenseAddress: t.hex(), // FK to campaign.licenseAddress (one-to-one)
}));


// Attachment table (one-to-many with IP)
export const attachment = onchainTable("attachment", (t) => ({
  id: t.text().primaryKey(), // generated uuid
  ipTokenId: t.bigint().notNull(), // Foreign key to ip.tokenId
  name: t.text().notNull(),
  type: attachmentType().notNull(),
  description: t.text().notNull(),
  fileType: t.text().notNull(),
  fileSizeBytes: t.bigint().notNull(),
  uri: t.text().notNull(),
}));

// Campaign table (one-to-many with IP); licenseAddress = primary key
// licenseType: "DYNAMIC" | "FIXED" from CampaignManager.CampaignInitialized.licenseType
export const campaign = onchainTable("campaign", (t) => ({
  licenseAddress: t.hex().primaryKey(),
  licenseSymbol: t.text().notNull(),
  ipTokenId: t.bigint().notNull(), // Foreign key to ip.tokenId
  numeraireAddress: t.hex().notNull(),
  numeraireSymbol: t.text().notNull(),
  poolId: t.hex().notNull(),
  licenseType: t.text().notNull(), // "DYNAMIC" or "FIXED"
  denominationUnit: denominationUnit().notNull(),
  denominationAmount: t.real().notNull(),
  creationTimestamp: t.bigint().notNull(),
  licenseDuration: t.bigint().notNull(),
  territoryRestriction: t.text().array().notNull(),
  usageRightsDefinition: t.text().notNull(),
  caseDescription: t.text().notNull(),
  estimatedDamages: t.text().notNull(),
  patentStrength: t.text().notNull(),
  defendantRecoverability: t.text().notNull(),
  timelineProjection: t.text().notNull(),
  defendant: t.text().notNull(),
  defendantOpenCorporatesPage: t.text().notNull(),
  transferrabilityFlag: transferrabilityFlag().notNull(),
  status: t.integer(),
  statusUpdateTimestamp: t.bigint(),
  statusUpdateExplanation: t.text(),
  currentPrice: t.real().notNull(),
  totalSupply: t.real().notNull(), // current total supply of license tokens (decimal-adjusted)
  totalEmittedLicensesValueUSD: t.real().notNull(), // current total value of all emitted licenses for this campaign (totalSupply * price)
  totalTradingVolumeUSD: t.real().notNull(), // cumulative trading volume for this campaign
}));

// Category (referenced by ip one-to-one)
export const category = onchainTable("category", (t) => ({
  id: t.text().primaryKey(),
  totalEmittedLicensesValueUSD: t.real().notNull(),
  totalTradingVolumeUSD: t.real().notNull(),
  topGrowth24hCampaignLicenseAddress: t.hex(), // FK to campaign.licenseAddress
  totalInteractions: t.bigint().notNull(),
  totalSales: t.bigint().notNull(),
  retailPercent: t.real().notNull(),
  growthPercent: t.real().notNull(),
}));

// Industry (same shape as category)
export const industry = onchainTable("industry", (t) => ({
  id: t.text().primaryKey(),
  categoryId: t.text().notNull(), // FK to category (category -> industry one-to-many)
  totalEmittedLicensesValueUSD: t.real().notNull(),
  totalTradingVolumeUSD: t.real().notNull(),
  topGrowth24hCampaignLicenseAddress: t.hex(), // FK to campaign.licenseAddress
  totalInteractions: t.bigint().notNull(),
  totalSales: t.bigint().notNull(),
  retailPercent: t.real().notNull(),
  growthPercent: t.real().notNull(),
}));

// Campaign time-series aggregates (licenseAddress = campaign license address)
export const campaignHourData = onchainTable("campaign_hour_data", (t) => ({
  id: t.text().primaryKey(), // generated uuid
  periodStartTimestamp: t.bigint().notNull(),
  licenseAddress: t.hex().notNull(),
  totalEmittedLicensesValueUSD: t.real().notNull(),
  totalTradingVolumeUSD: t.real().notNull(),
  sqrtPriceX96PeriodStart: t.bigint().notNull(),
  highPrice: t.real().notNull(),
  lowPrice: t.real().notNull(),
  avgPrice: t.real().notNull(),
  growthPercent: t.real().notNull(),
  retailPercent: t.real().notNull(),
  totalInteractions: t.bigint().notNull(),
  totalSales: t.bigint().notNull(),
}), (table) => ({
  licensePeriodIdx: index().on(table.licenseAddress, table.periodStartTimestamp),
}));

export const campaignDayData = onchainTable("campaign_day_data", (t) => ({
  id: t.text().primaryKey(), // generated uuid
  periodStartTimestamp: t.bigint().notNull(),
  licenseAddress: t.hex().notNull(),
  totalEmittedLicensesValueUSD: t.real().notNull(),
  totalTradingVolumeUSD: t.real().notNull(),
  sqrtPriceX96PeriodStart: t.bigint().notNull(),
  highPrice: t.real().notNull(),
  lowPrice: t.real().notNull(),
  avgPrice: t.real().notNull(),
  growthPercent: t.real().notNull(),
  retailPercent: t.real().notNull(),
  totalInteractions: t.bigint().notNull(),
  totalSales: t.bigint().notNull(),
}), (table) => ({
  licensePeriodIdx: index().on(table.licenseAddress, table.periodStartTimestamp),
}));

export const campaignWeekData = onchainTable("campaign_week_data", (t) => ({
  id: t.text().primaryKey(), // generated uuid
  periodStartTimestamp: t.bigint().notNull(),
  licenseAddress: t.hex().notNull(),
  totalEmittedLicensesValueUSD: t.real().notNull(),
  totalTradingVolumeUSD: t.real().notNull(),
  sqrtPriceX96PeriodStart: t.bigint().notNull(),
  highPrice: t.real().notNull(),
  lowPrice: t.real().notNull(),
  avgPrice: t.real().notNull(),
  growthPercent: t.real().notNull(),
  retailPercent: t.real().notNull(),
  totalInteractions: t.bigint().notNull(),
  totalSales: t.bigint().notNull(),
}), (table) => ({
  licensePeriodIdx: index().on(table.licenseAddress, table.periodStartTimestamp),
}));

export const campaignMonthData = onchainTable("campaign_month_data", (t) => ({
  id: t.text().primaryKey(), // generated uuid
  periodStartTimestamp: t.bigint().notNull(),
  licenseAddress: t.hex().notNull(),
  totalEmittedLicensesValueUSD: t.real().notNull(),
  totalTradingVolumeUSD: t.real().notNull(),
  sqrtPriceX96PeriodStart: t.bigint().notNull(),
  highPrice: t.real().notNull(),
  lowPrice: t.real().notNull(),
  avgPrice: t.real().notNull(),
  growthPercent: t.real().notNull(),
  retailPercent: t.real().notNull(),
  totalInteractions: t.bigint().notNull(),
  totalSales: t.bigint().notNull(),
}), (table) => ({
  licensePeriodIdx: index().on(table.licenseAddress, table.periodStartTimestamp),
}));

// Treasury license balance: per-Safe, per-license (updated on each capture; price from PoolPriceSnapshot in same tx).
export const treasuryLicenseBalance = onchainTable("treasury_license_balance", (t) => ({
  id: t.text().primaryKey(), // `${treasuryAddress}-${licenseAddress}`
  treasuryAddress: t.hex().notNull(),
  licenseAddress: t.hex().notNull(),
  licenseName: t.text().notNull(),
  licenseSymbol: t.text().notNull(),
  numeraireAddress: t.hex().notNull(),
  numeraireName: t.text().notNull(),
  numeraireSymbol: t.text().notNull(),
  balance: t.real().notNull(),
  totalValueNumeraire: t.real().notNull(),
  periodStartTimestamp1h: t.bigint(),
  periodStartTotalValueNumeraire1h: t.real(),
  periodTotalValueNumeraireGrowth1h: t.real(),
  periodStartTimestamp24h: t.bigint(),
  periodStartTotalValueNumeraire24h: t.real(),
  periodTotalValueNumeraireGrowth24h: t.real(),
  periodStartTimestamp1w: t.bigint(),
  periodStartTotalValueNumeraire1w: t.real(),
  periodTotalValueNumeraireGrowth1w: t.real(),
  periodStartTimestamp1m: t.bigint(),
  periodStartTotalValueNumeraire1m: t.real(),
  periodTotalValueNumeraireGrowth1m: t.real(),
}));

// Define relationships
export const ipRelations = relations(ip, ({ one, many }) => ({
  account: one(account, {
    fields: [ip.accountAddress],
    references: [account.address],
  }),
  category: one(category, {
    fields: [ip.categoryId],
    references: [category.id],
  }),
  topGrowth24hCampaign: one(campaign, {
    fields: [ip.topGrowth24hCampaignLicenseAddress],
    references: [campaign.licenseAddress],
  }),
  attachments: many(attachment),
  campaigns: many(campaign),
}));

export const attachmentRelations = relations(attachment, ({ one }) => ({
  ip: one(ip, {
    fields: [attachment.ipTokenId],
    references: [ip.tokenId],
  }),
}));

export const campaignRelations = relations(campaign, ({ one, many }) => ({
  ip: one(ip, {
    fields: [campaign.ipTokenId],
    references: [ip.tokenId],
  }),
  campaignHourDatas: many(campaignHourData),
  campaignDayDatas: many(campaignDayData),
  campaignWeekDatas: many(campaignWeekData),
  campaignMonthDatas: many(campaignMonthData),
}));

export const campaignHourDataRelations = relations(campaignHourData, ({ one }) => ({
  campaign: one(campaign, {
    fields: [campaignHourData.licenseAddress],
    references: [campaign.licenseAddress],
  }),
}));

export const campaignDayDataRelations = relations(campaignDayData, ({ one }) => ({
  campaign: one(campaign, {
    fields: [campaignDayData.licenseAddress],
    references: [campaign.licenseAddress],
  }),
}));

export const campaignWeekDataRelations = relations(campaignWeekData, ({ one }) => ({
  campaign: one(campaign, {
    fields: [campaignWeekData.licenseAddress],
    references: [campaign.licenseAddress],
  }),
}));

export const campaignMonthDataRelations = relations(campaignMonthData, ({ one }) => ({
  campaign: one(campaign, {
    fields: [campaignMonthData.licenseAddress],
    references: [campaign.licenseAddress],
  }),
}));

export const categoryRelations = relations(category, ({ one, many }) => ({
  topGrowth24hCampaign: one(campaign, {
    fields: [category.topGrowth24hCampaignLicenseAddress],
    references: [campaign.licenseAddress],
  }),
  industries: many(industry),
  ips: many(ip),
}));

export const industryRelations = relations(industry, ({ one }) => ({
  category: one(category, {
    fields: [industry.categoryId],
    references: [category.id],
  }),
  topGrowth24hCampaign: one(campaign, {
    fields: [industry.topGrowth24hCampaignLicenseAddress],
    references: [campaign.licenseAddress],
  }),
}));

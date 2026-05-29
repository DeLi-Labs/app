import formidable from "formidable";
import type { Address, TypedData } from "viem";

export type IP = {
  tokenId: number;
  name: string;
  description: string;
  image: string;
  creationTimestamp: string;
  categoryId: string | null;
  totalEmittedLicensesValueUSD: number;
  campaigns?: Campaign[];
  topCampaign?: any;
};

export type DiscoverIP = IP & {
  accountAddress: string;
  patentNumber: string;
  inventorNames: string;
  jurisdiction: string[];
  registrationAuthority: string;
  patentClassification: string;
  filingDate: string;
  grantDate: string;
  industry: string[];
  categoryId: string | null;
  retailPercent: number;
  growthPercent: number;
  totalInteractions: number;
  totalSales: number;
  totalTradingVolumeUSD: number;
  topGrowth24hCampaignLicenseAddress: string | null;
};

export type IPList = IP[];

export type IPListResponse = {
  items: IP[];
  totalCount: number;
};

export type OwnerIPCampaign = {
  licenseAddress: string;
  licenseSymbol: string;
  numeraireSymbol: string;
  poolId: string;
  denominationUnit: "PER_ITEM" | "PER_HOUR" | "PER_DAY" | "PER_BYTE" | "PER_1000_TOKEN";
  denominationAmount: number;
  currentPrice: number;
  totalSupply: number;
  totalEmittedLicensesValueUSD: number;
};

export type OwnerIPWithCampaigns = {
  tokenId: number;
  category: string | null;
  /** Patent hero image URI (same as indexer `image` field). */
  image: string;
  name: string;
  description: string;
  growthPercent: number;
  totalEmittedLicensesValueUSD: number;
  campaigns: OwnerIPCampaign[];
};

export type IPDetails = {
  tokenId: number;
  owner: Address;
  name: string;
  patentNumber: string;
  inventorNames: string;
  jurisdiction: string[];
  registrationAuthority: string;
  patentClassification: string;
  filingDate: string;
  grantDate: string;
  description: string;
  industry: string[];
  categoryId: string | null;
  image: string;
  attachments: Attachment[];
};

export type Attachment = {
  name: string;
  type: "ENCRYPTED" | "PLAIN";
  description: string;
  fileType: string;
  fileSizeBytes: number;
  uri: string;
};

/** License type name from CampaignManager LicenseType enum (indexed from chain). */
export type CampaignLicenseType = "DYNAMIC" | "FIXED";

export type Campaign = {
  licenseAddress: string;
  numeraireAddress: string;
  poolId: string;
  /** License type: "DYNAMIC" (AMM) or "FIXED" (fixed price). */
  licenseType: CampaignLicenseType;
  denomination: {
    unit: "PER_ITEM" | "PER_HOUR" | "PER_DAY" | "PER_BYTE" | "PER_1000_TOKEN";
    amount: number;
  };
  territoryRestriction: string[];
  usageRightsDefinition: string;
  caseDescription: string;
  estimatedDamages: string;
  patentStrength: string;
  defendantRecoverability: string;
  timelineProjection: string;
  defendant: string;
  defendantOpenCorporatesPage: string;
  transferrabilityFlag: "Transferrable" | "NonTransferrable";
  licenseDuration: number;
  status: number | null;
  statusUpdateTimestamp: string | null;
  statusUpdateExplanation: string | null;
};

export type PatentDetailCampaign = {
  licenseAddress: string;
  licenseSymbol: string;
  numeraireAddress: string;
  numeraireSymbol: string;
  licenseType: CampaignLicenseType;
  usageRightsDefinition: string;
  caseDescription: string;
  estimatedDamages: string;
  patentStrength: string;
  defendantRecoverability: string;
  timelineProjection: string;
  defendant: string;
  defendantOpenCorporatesPage: string;
  transferabilityFlags: "Transferable" | "NonTransferable";
  licenseDuration: string;
  denominationUnit: string;
  denominationAmount: number;
  currentPrice: number;
  totalSupply: number;
  totalEmittedLicensesValueUSD: number;
  totalTradingVolumeUSD: number;
  growth24h: number | null;
  retailPercent: number | null;
  hourlyPrices: {
    timestamp: string;
    avgPrice: number;
  }[];
  status: number | null;
  statusUpdateTimestamp: string | null;
  statusUpdateExplanation: string | null;
};

export type PatentDetail = {
  tokenId: number;
  name: string;
  image: string;
  description: string;
  industry: string[];
  categoryId: string | null;
  owner: Address;
  inventorNames: string;
  patentNumber: string;
  jurisdiction: string[];
  registrationAuthority: string;
  filingDate: string;
  grantDate: string;
  espacenetUrl: string;
  epoUrl: string;
  ownerLinkedinUrl: string;
  ownerWebsiteUrl: string;
  patentClassification: string;
  creationTimestamp: string;
  campaigns: PatentDetailCampaign[];
};

export type CampaignPeriodName = "hour" | "day" | "week" | "month";

export type CampaignPeriodDataItem = {
  id: string;
  periodStartTimestamp: string;
  licenseAddress: string;
  sqrtPriceX96PeriodStart: string;
  highPrice: string;
  lowPrice: string;
  avgPrice: string;
  growthPercent: number;
  retailPercent: number;
  totalInteractions: string;
  totalSales: string;
};

export type CampaignPeriodAvgPriceDataItem = {
  timestamp: string;
  avgPrice: string;
};

export type TreasuryTokenView = {
  licenseSymbol: string;
  licenseAddress: string;
  balance: string;
  numeraireSymbol: string;
  totalValueNumeraire: string;
  growth1h: number | null;
  growth24h: number | null;
  growth1w: number | null;
  growth1m: number | null;
};

export type UploadFormData = {
  name: string;
  description: string;
  patentNumber: string;
  inventorNames: string;
  jurisdiction: string[];
  registrationAuthority: string;
  patentClassification: string;
  filingDate: string;
  grantDate: string;
  espacenetUrl: string;
  epoUrl: string;
  ownerLinkedinUrl: string;
  ownerWebsiteUrl: string;
  industry: string[];
  image: formidable.File;
  attachments: Array<{
    file: formidable.File;
    name: string;
    description: string;
    type: "ENCRYPTED" | "PLAIN";
  }>;
};

/** Attachment item as returned by the upload attachment endpoint; used when submitting IP metadata from pre-uploaded URIs. */
export type PreUploadedAttachment = {
  name: string;
  type: string;
  sizeBytes: number;
  uri: string;
  description?: string;
  encrypted?: boolean;
};

/** IP metadata JSON body when image and attachments are already uploaded (URIs only). */
export type IpMetadataFromUris = {
  name: string;
  description: string;
  image: string;
  patentNumber: string;
  inventorNames: string;
  jurisdiction: string[];
  registrationAuthority: string;
  patentClassification: string;
  filingDate: string;
  grantDate: string;
  espacenetUrl: string;
  epoUrl: string;
  ownerLinkedinUrl: string;
  ownerWebsiteUrl: string;
  industry: string[];
  attachments: PreUploadedAttachment[];
};

export type CampaignUploadFormData = {
  denominationUnit: "PER_ITEM" | "PER_HOUR" | "PER_DAY" | "PER_BYTE" | "PER_1000_TOKEN";
  denominationAmount: number;
  licenseDuration: number;
  territoryRestriction: string[];
  usageRightsDefinition: string;
  caseDescription: string;
  defendant: string;
  defendantOpenCorporatesPage: string;
  transferrabilityFlag: "Transferrable" | "NonTransferrable";
};

// Permit2 PermitSingle typed data structure for EIP-712 signing
// This matches the structure required by viem's signTypedData
export type Permit2TypedData = {
  PermitSingle: [
    { name: "details"; type: "PermitDetails" },
    { name: "spender"; type: "address" },
    { name: "sigDeadline"; type: "uint256" },
  ];
  PermitDetails: [
    { name: "token"; type: "address" },
    { name: "amount"; type: "uint160" },
    { name: "expiration"; type: "uint48" },
    { name: "nonce"; type: "uint48" },
  ];
} & TypedData;

// Permit message structure for EIP-712 signing
// Note: Values are kept as strings/numbers for JSON serialization in API responses
// but TypeScript types ensure they match Address and numeric types
export type PermitMessage = {
  domain: {
    name: "Permit2";
    chainId: number;
    verifyingContract: Address;
  };
  types: Permit2TypedData;
  primaryType: "PermitSingle";
  message: {
    details: {
      token: Address;
      amount: string; // uint160 as string for JSON serialization (can be converted to bigint)
      expiration: string; // uint48 as string for JSON serialization (can be converted to number)
      nonce: string; // uint48 as string for JSON serialization (can be converted to number)
    };
    spender: Address;
    sigDeadline: string; // uint256 as string for JSON serialization (can be converted to bigint)
  };
};
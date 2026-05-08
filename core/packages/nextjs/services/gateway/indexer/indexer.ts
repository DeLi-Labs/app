/**
 * Abstract indexer gateway interface that supports multiple indexer backends
 * (The Graph, Ponder, custom indexers, etc.)
 */
import type {
  Campaign,
  CampaignPeriodAvgPriceDataItem,
  CampaignPeriodDataItem,
  CampaignPeriodName,
  DiscoverIP,
  IPDetails,
  IPList,
  OwnerIPWithCampaigns,
  PatentDetail,
  TreasuryTokenView,
} from "~~/types";

/**
 * Abstract indexer gateway interface
 *
 * Implementations should provide concrete indexer backends:
 * - GraphIndexerGateway (for The Graph)
 * - PonderIndexerGateway (for Ponder)
 * - CustomIndexerGateway (for custom indexers)
 * - etc.
 */
export interface IIndexerGateway {
  /**
   * Get list of IPs from the indexer with pagination and filtering
   *
   * @returns Promise resolving to an object with IPs and total count
   */
  getIpList(
    page: number,
    pageSize: number,
    orderBy?: string,
    orderDirection?: "asc" | "desc",
    category?: string,
    name?: string,
  ): Promise<{ items: DiscoverIP[]; totalCount: number }>;

  /**
   * Get list of IPs from the indexer
   *
   * @returns Promise resolving to an array of IPs
   */
  getIpListMCP(page: number, pageSize: number): Promise<IPList>;

  /**
   * Get IP details by token ID from the indexer
   *
   * @param tokenId - The token ID of the IP to retrieve
   * @returns Promise resolving to IP details
   */
  getIpDetailsMCP(tokenId: number): Promise<IPDetails>;

  /**
   * Get all IPs owned by a specific address with their campaigns.
   *
   * @param ownerAddress - The owner address to filter IPs by
   * @returns Promise resolving to owner IPs with campaign aggregates
   */
  getOwnerIpsWithCampaigns(ownerAddress: string): Promise<OwnerIPWithCampaigns[]>;

  /**
   * Get campaign details by token ID and license address
   *
   * @param tokenId - The token ID of the IP
   * @param licenseAddress - The license (campaign) contract address
   * @returns Promise resolving to campaign details, or null if not found
   */
  getCampaignDetailsMCP(licenseAddress: string): Promise<Campaign | null>;

  /**
   * Get campaign period data (time-series aggregates) for a license address.
   *
   * @param licenseAddress - The campaign license contract address
   * @param period - The period granularity: "hour", "day", "week", or "month"
   * @param fromTimestamp - Only return periods with periodStartTimestamp >= this value
   * @returns Promise resolving to an array of period data items
   */
  getCampaignPeriodDataMCP(
    licenseAddress: string,
    period: CampaignPeriodName,
    fromTimestamp: bigint,
    toTimestamp?: bigint,
  ): Promise<CampaignPeriodDataItem[]>;

  /**
   * Get campaign period avg-price points (timestamp + avgPrice only) for charting.
   *
   * @param licenseAddress - The campaign license contract address
   * @param period - The period granularity: "hour", "day", "week", or "month"
   * @param limit - Maximum number of points to return
   */
  getCampaignPeriodAvgPriceData(
    licenseAddress: string,
    period: CampaignPeriodName,
    limit: number,
  ): Promise<CampaignPeriodAvgPriceDataItem[]>;

  /**
   * Get treasury license balances for a Safe (treasury) address from the indexer.
   *
   * @param treasuryAddress - The Safe (treasury) address
   * @returns Promise resolving to token views (license symbol, name, balance, numeraire, growth %)
   */
  /**
   * Get full patent detail (IP + campaign aggregates) by token ID.
   *
   * @param tokenId - The token ID of the patent
   * @returns Promise resolving to patent detail with campaign trading data
   */
  getPatentDetail(tokenId: number): Promise<PatentDetail>;

  getTreasuryLicenseBalancesMCP(treasuryAddress: string): Promise<TreasuryTokenView[]>;

  /**
   * Get main platform statistics
   *
   * @returns Promise resolving to main statistics data
   */
  getMainStats(): Promise<any>;

  /**
   * Get latest IPs by creation timestamp.
   *
   * @param limit - Maximum number of IPs to return
   * @returns Promise resolving to latest IPs with campaigns
   */
  getLatestIPs(limit: number): Promise<OwnerIPWithCampaigns[]>;

  /**
   * Get category table data
   *
   * @returns Promise resolving to category data
   */
  getCategoryData(): Promise<any>;

  /**
   * Get total 24h trading volume across all campaigns by summing individual campaign 24h data.
   */
  getAllCampaigns24hVolume(): Promise<number>;
}

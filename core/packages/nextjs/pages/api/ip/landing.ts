import "reflect-metadata";
import { createHandler, Get } from "next-api-decorators";
import IpProvider from "~~/services/provider/ip";

class IpHandler {
  private ipProvider: IpProvider;

  constructor() {
    this.ipProvider = new IpProvider();
  }

  @Get()
  async getLandingPageData() {
    const stats = await this.ipProvider.getMainStats();
    const categories = await this.ipProvider.getCategoryData();
    const latestIps = await this.ipProvider.getLatestIPs(10);
    const totalTradingVolume24hUSD = await this.ipProvider.getAllCampaigns24hVolume();

    return {
      stats: {
        ...stats,
        totalTradingVolume24hUSD,
      },
      categories,
      latestIps,
    };
  }
}

export default createHandler(IpHandler);

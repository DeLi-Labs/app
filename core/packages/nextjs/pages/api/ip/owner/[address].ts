import "reflect-metadata";
import { createHandler, Get, Query } from "next-api-decorators";
import { isAddress } from "viem";
import type { OwnerIPWithCampaigns } from "~~/types";
import IpProvider from "~~/services/provider/ip";

class OwnerIpCampaignsHandler {
  private ipProvider: IpProvider;

  constructor() {
    this.ipProvider = new IpProvider();
  }

  @Get()
  async getOwnerIpsWithCampaigns(@Query("address") address: string): Promise<OwnerIPWithCampaigns[]> {
    if (!address || typeof address !== "string") {
      throw new Error("Missing or invalid address path parameter");
    }

    const ownerAddress = address.trim().toLowerCase();
    if (!isAddress(ownerAddress)) {
      throw new Error("Invalid Ethereum address");
    }

    return this.ipProvider.getOwnerIpsWithCampaigns(ownerAddress);
  }
}

export default createHandler(OwnerIpCampaignsHandler);

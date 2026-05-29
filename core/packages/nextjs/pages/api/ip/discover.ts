import "reflect-metadata";
import { createHandler, Get, Query, ParseNumberPipe, DefaultValuePipe } from "next-api-decorators";
import IpProvider from "~~/services/provider/ip";

class DiscoverIpHandler {
  private ipProvider: IpProvider;

  constructor() {
    this.ipProvider = new IpProvider();
  }

  @Get()
  async getIpList(
    @Query("page", DefaultValuePipe(0), ParseNumberPipe()) page: number,
    @Query("pageSize", DefaultValuePipe(10), ParseNumberPipe()) pageSize: number,
    @Query("orderBy") orderBy?: string,
    @Query("orderDirection") orderDirection?: "asc" | "desc",
    @Query("category") category?: string,
    @Query("name") name?: string,
  ) {
    const ipList = await this.ipProvider.getIpList(page, pageSize, orderBy, orderDirection, category, name);
    return ipList;
  }
}

export default createHandler(DiscoverIpHandler);

import "reflect-metadata";
import { createHandler, Get, Query, ParseNumberPipe } from "next-api-decorators";
import type { PatentDetail } from "~~/types";
import IpProvider from "~~/services/provider/ip";

class PatentDetailHandler {
  private ipProvider: IpProvider;

  constructor() {
    this.ipProvider = new IpProvider();
  }

  @Get()
  async getPatentDetail(@Query("tokenId", ParseNumberPipe()) tokenId: number): Promise<PatentDetail> {
    return this.ipProvider.getPatentDetail(tokenId);
  }
}

export default createHandler(PatentDetailHandler);

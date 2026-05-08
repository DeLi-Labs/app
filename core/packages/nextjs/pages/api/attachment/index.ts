import "reflect-metadata";
import { createHandler, Get, Query, Res } from "next-api-decorators";
import * as Next from "next";
import { createStorageGateway } from "~~/services/gateway/storage/StorageGatewayFactory";
import { IStorageGateway } from "~~/services/gateway/storage/storage";
import { handleAttachmentError, sendErrorResponse } from "~~/utils/apiUtils";

class AttachmentBySrcHandler {
  private storageGateway: IStorageGateway;

  constructor() {
    this.storageGateway = createStorageGateway();
  }

  @Get()
  async getAttachmentBySrc(@Query("src") src: string, @Res() res: Next.NextApiResponse) {
    if (!src) {
      return sendErrorResponse(res, 400, "Missing src", "Query parameter 'src' is required.");
    }

    try {
      const result = await this.storageGateway.retrieve(src);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Content-Type", result.contentType || "application/octet-stream");
      res.setHeader("Content-Length", String(result.size));
      res.status(200).end(result.data);
    } catch (error) {
      return handleAttachmentError(error, res);
    }
  }
}

export default createHandler(AttachmentBySrcHandler);

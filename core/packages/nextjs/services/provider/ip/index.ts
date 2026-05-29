import { readFileSync } from "fs";
import { createIndexerGateway } from "~~/services/gateway/indexer/IndexerGatewayFactory";
import { IIndexerGateway } from "~~/services/gateway/indexer/indexer";
import { createStorageGateway } from "~~/services/gateway/storage/StorageGatewayFactory";
import { IStorageGateway, RetrieveResult } from "~~/services/gateway/storage/storage";
import { Attachment, DiscoverIP, IPDetails, IPList, OwnerIPWithCampaigns, PatentDetail } from "~~/types";
import { IpMetadataFromUris, UploadFormData } from "~~/types";

class IpProvider {
  private indexerGateway: IIndexerGateway;
  private storageGateway: IStorageGateway;

  constructor() {
    this.indexerGateway = createIndexerGateway();
    this.storageGateway = createStorageGateway();
  }

  async getMainStats() {
    return await this.indexerGateway.getMainStats();
  }

  async getLatestIPs(limit: number): Promise<OwnerIPWithCampaigns[]> {
    return await this.indexerGateway.getLatestIPs(limit);
  }

  async getCategoryData() {
    return await this.indexerGateway.getCategoryData();
  }

  async getAllCampaigns24hVolume() {
    return await this.indexerGateway.getAllCampaigns24hVolume();
  }

  async getIpList(
    page: number,
    pageSize: number,
    orderBy?: string,
    orderDirection?: "asc" | "desc",
    category?: string,
    name?: string,
  ): Promise<{ items: DiscoverIP[]; totalCount: number }> {
    return await this.indexerGateway.getIpList(page, pageSize, orderBy, orderDirection, category, name);
  }

  async getIpListPage(page: number, pageSize: number): Promise<IPList> {
    return await this.indexerGateway.getIpListPage(page, pageSize);
  }

  async getIpDetails(tokenId: number): Promise<IPDetails> {
    return await this.indexerGateway.getIpDetails(tokenId);
  }

  async getOwnerIpsWithCampaigns(ownerAddress: string): Promise<OwnerIPWithCampaigns[]> {
    return await this.indexerGateway.getOwnerIpsWithCampaigns(ownerAddress);
  }

  async getPatentDetail(tokenId: number): Promise<PatentDetail> {
    return await this.indexerGateway.getPatentDetail(tokenId);
  }

  async getImageBySrc(src: string): Promise<RetrieveResult> {
    return await this.storageGateway.retrieve(src);
  }

  async uploadIpMetadata(formData: UploadFormData): Promise<string> {
    // Upload image file
    const imageBuffer = readFileSync(formData.image.filepath);
    const imageResult = await this.storageGateway.store(imageBuffer, {
      contentType: formData.image.mimetype || "image/jpeg",
    });

    // Upload attachment files
    const attachmentUploads = await Promise.all(
      formData.attachments.map(async (attachment: any) => {
        const fileBuffer = readFileSync(attachment.file.filepath);
        const fileResult = await this.storageGateway.store(fileBuffer, {
          contentType: attachment.file.mimetype || "application/octet-stream",
        });

        return {
          name: attachment.name,
          type: attachment.type,
          description: attachment.description,
          fileType: attachment.file.mimetype || "application/octet-stream",
          fileSizeBytes: attachment.file.size,
          uri: fileResult.uri,
        } as Attachment;
      }),
    );

    const metadata = {
      name: formData.name,
      patentNumber: formData.patentNumber,
      inventorNames: formData.inventorNames,
      jurisdiction: formData.jurisdiction,
      registrationAuthority: formData.registrationAuthority,
      patentClassification: formData.patentClassification,
      filingDate: formData.filingDate,
      grantDate: formData.grantDate,
      espacenetUrl: formData.espacenetUrl,
      epoUrl: formData.epoUrl,
      ownerLinkedinUrl: formData.ownerLinkedinUrl,
      ownerWebsiteUrl: formData.ownerWebsiteUrl,
      industry: formData.industry,
      description: formData.description,
      image: imageResult.uri,
      attachments: attachmentUploads,
    };

    // Upload metadata JSON
    const metadataResult = await this.storageGateway.storeJson(metadata, {
      contentType: "application/json",
    });

    return metadataResult.uri;
  }

  async uploadIpMetadataFromUris(data: IpMetadataFromUris): Promise<string> {
    const attachments: Attachment[] = data.attachments.map(a => ({
      name: a.name,
      type: a.encrypted ? "ENCRYPTED" : "PLAIN",
      description: a.description ?? "",
      fileType: a.type,
      fileSizeBytes: a.sizeBytes,
      uri: a.uri,
    }));

    const metadata = {
      name: data.name,
      description: data.description,
      image: data.image,
      patentNumber: data.patentNumber,
      inventorNames: data.inventorNames,
      jurisdiction: data.jurisdiction,
      registrationAuthority: data.registrationAuthority,
      patentClassification: data.patentClassification,
      filingDate: data.filingDate,
      grantDate: data.grantDate,
      espacenetUrl: data.espacenetUrl,
      epoUrl: data.epoUrl,
      ownerLinkedinUrl: data.ownerLinkedinUrl,
      ownerWebsiteUrl: data.ownerWebsiteUrl,
      industry: data.industry,
      attachments,
    };

    const metadataResult = await this.storageGateway.storeJson(metadata, {
      contentType: "application/json",
    });

    return metadataResult.uri;
  }
}

export default IpProvider;

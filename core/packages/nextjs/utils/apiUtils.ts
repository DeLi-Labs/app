import { type ApiErrorBody, getErrorStatusCode } from "~~/utils/scaffold-eth/errors";
import formidable from "formidable";
import { IncomingMessage } from "http";
import type { NextApiResponse } from "next";
import scaffoldConfig from "~~/scaffold.config";
import { CampaignUploadFormData, UploadFormData } from "~~/types";
import { INDUSTRIES } from "~~/utils/industryData";

/**
 * Send a standard error response. Contract: { error: string, details?: string }.
 * Clients should display message as details ?? error.
 */
export function sendErrorResponse(
  res: NextApiResponse,
  statusCode: number,
  error: string,
  details?: string,
): NextApiResponse | void {
  const body: ApiErrorBody = details !== undefined ? { error, details } : { error };
  return res.status(statusCode).json(body);
}

type ParseResult = { success: true; data: UploadFormData } | { success: false; error: string };

type CampaignParseResult =
  | { success: true; data: CampaignUploadFormData; chainId: number }
  | { success: false; error: string };

/**
 * Extracts a single value from formidable fields (handles both single values and arrays)
 */
/**
 * Extracts all values from formidable fields (handles both single values and arrays)
 */
const getFieldValues = (field: formidable.Fields[string] | undefined): string[] => {
  if (!field) return [];
  return Array.isArray(field) ? field : [field];
};

/**
 * Extracts a single value from formidable fields (handles both single values and arrays)
 */
const getFieldValue = (field: formidable.Fields[string] | undefined): string | undefined => {
  if (!field) return undefined;
  return Array.isArray(field) ? field[0] : field;
};

/**
 * Extracts a single file from formidable files (handles both single files and arrays)
 */
const getFile = (file: formidable.Files[string] | undefined): formidable.File | undefined => {
  if (!file) return undefined;
  return Array.isArray(file) ? file[0] : file;
};

/**
 * Parses attachments from form fields and files
 */
const parseAttachments = (fields: formidable.Fields, files: formidable.Files): UploadFormData["attachments"] => {
  const attachments: UploadFormData["attachments"] = [];
  let index = 0;

  while (true) {
    const fileKey = `attachments[${index}]`;
    const nameKey = `attachments[${index}].name`;
    const descriptionKey = `attachments[${index}].description`;
    const typeKey = `attachments[${index}].type`;

    const file = getFile(files[fileKey]);
    const name = getFieldValue(fields[nameKey]);
    const description = getFieldValue(fields[descriptionKey]);
    const type = getFieldValue(fields[typeKey]) as "ENCRYPTED" | "PLAIN" | undefined;

    if (!file) {
      break; // No more attachments
    }

    if (name && description && type && (type === "ENCRYPTED" || type === "PLAIN")) {
      attachments.push({
        file,
        name,
        description,
        type,
      });
    }

    index++;
  }

  return attachments;
};

/**
 * Parses multipart/form-data request into UploadFormData
 *
 * @param req - Incoming HTTP request
 * @returns ParseResult with either success and data, or error message
 */
export const parseFormData = async (req: IncomingMessage): Promise<ParseResult> => {
  try {
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    // Extract and validate required fields
    const name = getFieldValue(fields.name);
    const patentNumber = getFieldValue(fields.patentNumber);
    const inventorNames = getFieldValue(fields.inventorNames);
    const jurisdiction = getFieldValues(fields.jurisdiction);
    const registrationAuthority = getFieldValue(fields.registrationAuthority);
    const patentClassification = getFieldValue(fields.patentClassification);
    const filingDate = getFieldValue(fields.filingDate);
    const grantDate = getFieldValue(fields.grantDate);
    const description = getFieldValue(fields.description);
    const industry = getFieldValues(fields.industry);

    if (
      !name ||
      !patentNumber ||
      !inventorNames ||
      jurisdiction.length === 0 ||
      !registrationAuthority ||
      !patentClassification ||
      !filingDate ||
      !grantDate ||
      !description ||
      industry.length === 0
    ) {
      return {
        success: false,
        error:
          "Name, patent number, inventor names, jurisdiction, registration authority, patent classification, filing date, grant date, description, and at least one industry are required",
      };
    }

    const validIndustries = INDUSTRIES.map(item => item.industry);
    const invalidIndustries = industry.filter(i => !validIndustries.includes(i as any));
    if (invalidIndustries.length > 0) {
      return {
        success: false,
        error: `Invalid industries provided: ${invalidIndustries.join(", ")}`,
      };
    }

    // Extract and validate image file
    const imageFile = getFile(files.image);
    if (!imageFile) {
      return { success: false, error: "Image file is required" };
    }

    // Parse attachments
    const attachments = parseAttachments(fields, files);

    const statusStr = getFieldValue(fields.status);
    const statusUpdateTimestampStr = getFieldValue(fields.statusUpdateTimestamp);
    const statusUpdateExplanation = getFieldValue(fields.statusUpdateExplanation);
    const reasonCodeStr = getFieldValue(fields.reasonCode);
    const caseReference = getFieldValue(fields.caseReference);

    const formData: UploadFormData = {
      name,
      patentNumber,
      inventorNames: inventorNames || "",
      jurisdiction,
      registrationAuthority,
      patentClassification,
      filingDate,
      grantDate,
      description,
      status: statusStr ? parseInt(statusStr) : undefined,
      statusUpdateTimestamp: statusUpdateTimestampStr ? parseInt(statusUpdateTimestampStr) : undefined,
      statusUpdateExplanation,
      reasonCode: reasonCodeStr ? parseInt(reasonCodeStr) : undefined,
      caseReference,
      industry,
      image: imageFile,
      attachments,
    };

    return { success: true, data: formData };
  } catch (error) {
    console.error("Error parsing form data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse form data",
    };
  }
};

/**
 * Extract domain from request headers or environment
 */
export function getExpectedDomain(req: IncomingMessage): string {
  return process.env.SIWE_DOMAIN || (req.headers.host ? new URL(`http://${req.headers.host}`).hostname : "localhost");
}

export type AttachmentUploadFormData = {
  file: formidable.File;
  encrypted: boolean;
};

type ParseAttachmentUploadResult =
  | { success: true; data: AttachmentUploadFormData }
  | { success: false; error: string };

/**
 * Parses multipart form for single-file attachment upload.
 * Expects field "file" (required) and optional "encrypted" (true when value is "true").
 *
 * @param req - Incoming HTTP request
 * @returns ParseAttachmentUploadResult with either success and data, or error message
 */
export const parseAttachmentUploadForm = async (req: IncomingMessage): Promise<ParseAttachmentUploadResult> => {
  try {
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    const file = getFile(files.file);
    if (!file) {
      return { success: false, error: "File is required" };
    }

    const encryptedRaw = getFieldValue(fields.encrypted);
    const encrypted = encryptedRaw === "true" || encryptedRaw === "1";

    return {
      success: true,
      data: { file, encrypted },
    };
  } catch (error) {
    console.error("Error parsing attachment upload form:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse form data",
    };
  }
};

/**
 * Parses form data for campaign metadata upload
 *
 * @param req - Incoming HTTP request
 * @returns CampaignParseResult with either success and data, or error message
 */
export const parseCampaignFormData = async (req: IncomingMessage): Promise<CampaignParseResult> => {
  try {
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB
      keepExtensions: true,
    });

    const [fields] = await form.parse(req);

    // Extract and validate denomination unit
    const denominationUnit = getFieldValue(fields.denominationUnit) as
      | CampaignUploadFormData["denominationUnit"]
      | undefined;
    const validUnits: CampaignUploadFormData["denominationUnit"][] = [
      "PER_ITEM",
      "PER_HOUR",
      "PER_DAY",
      "PER_BYTE",
      "PER_1000_TOKEN",
    ];

    if (!denominationUnit || !validUnits.includes(denominationUnit)) {
      return {
        success: false,
        error: `Denomination unit is required and must be one of: ${validUnits.join(", ")}`,
      };
    }

    // Extract and validate denomination amount
    const denominationAmountStr = getFieldValue(fields.denominationAmount);
    if (!denominationAmountStr) {
      return { success: false, error: "Denomination amount is required" };
    }

    const denominationAmount = parseFloat(denominationAmountStr);
    if (isNaN(denominationAmount) || denominationAmount <= 0) {
      return { success: false, error: "Denomination amount must be a positive number" };
    }

    // Extract and validate license duration
    const licenseDurationStr = getFieldValue(fields.licenseDuration);
    if (!licenseDurationStr) {
      return { success: false, error: "License duration is required" };
    }
    const licenseDuration = parseInt(licenseDurationStr);
    if (isNaN(licenseDuration) || licenseDuration <= 0) {
      return { success: false, error: "License duration must be a positive number" };
    }

    // Extract territory restrictions
    const territoryRestriction = getFieldValues(fields.territoryRestriction);
    const usageRightsDefinition = getFieldValue(fields.usageRightsDefinition) || "";
    const transferrabilityFlag = (getFieldValue(fields.transferrabilityFlag) ||
      "Transferrable") as CampaignUploadFormData["transferrabilityFlag"];

    const chainIdRaw = getFieldValue(fields.chainId);
    if (!chainIdRaw || !chainIdRaw.trim()) {
      return { success: false, error: "chainId is required" };
    }
    const parsedChainId = parseInt(chainIdRaw, 10);
    if (!Number.isInteger(parsedChainId) || !scaffoldConfig.targetNetworks.some(n => n.id === parsedChainId)) {
      return { success: false, error: "Invalid or unsupported chainId" };
    }
    const chainId = parsedChainId;

    const formData: CampaignUploadFormData = {
      denominationUnit,
      denominationAmount,
      licenseDuration,
      territoryRestriction,
      usageRightsDefinition,
      transferrabilityFlag,
    };

    return { success: true, data: formData, chainId };
  } catch (error) {
    console.error("Error parsing campaign form data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse campaign form data",
    };
  }
};

/**
 * Handle error and return appropriate HTTP response for attachment endpoints.
 * Uses standard error contract { error, details? }.
 */
export function handleAttachmentError(error: unknown, res: NextApiResponse): NextApiResponse | void {
  if (!(error instanceof Error)) {
    return sendErrorResponse(res, 500, "Failed to fetch attachment");
  }

  const statusCode = getErrorStatusCode(error);
  const message = error.message || "An error occurred";

  if (statusCode >= 500) {
    console.error("Error fetching attachment:", error);
  }

  return sendErrorResponse(res, statusCode, message);
}

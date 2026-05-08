import { IsNotEmpty, IsNumber, IsString, IsOptional, ValidateNested, Matches, IsBoolean } from "class-validator";
import { Transform, Type } from "class-transformer";

class PermitDomainDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Transform(({ value }) => (typeof value === "string" ? Number(value) : value))
  @IsNumber()
  chainId!: number;

  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: "verifyingContract must be a valid Ethereum address" })
  verifyingContract!: string;
}

class PermitDetailsDTO {
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: "token must be a valid Ethereum address" })
  token!: string;

  /** Must stay a string: values exceed Number.MAX_SAFE_INTEGER (implicit conversion would corrupt the permit). */
  @IsString()
  @IsNotEmpty()
  amount!: string;

  @IsString()
  @IsNotEmpty()
  expiration!: string;

  @IsString()
  @IsNotEmpty()
  nonce!: string;
}

class PermitMessageBodyDTO {
  @ValidateNested()
  @Type(() => PermitDetailsDTO)
  details!: PermitDetailsDTO;

  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: "spender must be a valid Ethereum address" })
  spender!: string;

  @IsString()
  @IsNotEmpty()
  sigDeadline!: string;
}

class PermitMessageDTO {
  @ValidateNested()
  @Type(() => PermitDomainDTO)
  domain!: PermitDomainDTO;

  @IsNotEmpty()
  types!: Record<string, unknown>;

  @IsNotEmpty()
  @IsString()
  primaryType!: string;

  @ValidateNested()
  @Type(() => PermitMessageBodyDTO)
  message!: PermitMessageBodyDTO;
}

class PermitDTO {
  @ValidateNested()
  @Type(() => PermitMessageDTO)
  @IsNotEmpty()
  message!: PermitMessageDTO;

  @IsString()
  @Matches(/^0x[a-fA-F0-9]+$/, { message: "Signature must be a valid hex string starting with 0x" })
  @IsNotEmpty()
  signature!: string;
}

// DTO class for request body validation (used for both quote and authorize endpoints)
export class Permit2RequestDTO {
  /**
   * License token amount as a decimal string (e.g. "1.5"). Prefer string over JSON number to avoid float drift.
   * Numeric JSON values are converted with full precision up to 18 fraction digits.
   */
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    if (typeof value === "number" && Number.isFinite(value)) {
      return value.toLocaleString("fullwide", { useGrouping: false, maximumFractionDigits: 18 });
    }
    return String(value).trim();
  })
  @IsString()
  @Matches(/^(?!0+\.?0*$)\d+(\.\d+)?$|^(?!0+$)\d*\.\d+$/, {
    message: "Amount must be a positive decimal string",
  })
  amount!: string;

  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: "userAddress must be a valid Ethereum address" })
  @IsNotEmpty()
  userAddress!: string;

  /** If true (default): buy (numeraire → license); if false: sell (license → numeraire). When permit is not provided: used for the first (prepare) call. When permit is provided: optional; if sent (e.g. by MCP finalize), API uses it; else inferred from permit token. */
  @IsOptional()
  @IsBoolean()
  buy?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => PermitDTO)
  permit?: PermitDTO;

  @IsOptional()
  paymentInfo?: Record<string, unknown>;
}

export class QuoteRequestDTO extends Permit2RequestDTO {}

export class AttachmentRequestDTO {
  @IsOptional()
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: "address must be a valid Ethereum address" })
  address?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    if (typeof value === "number" && Number.isFinite(value)) {
      return value.toLocaleString("fullwide", { useGrouping: false, maximumFractionDigits: 18 });
    }
    return String(value).trim();
  })
  @IsString()
  @Matches(/^(?!0+\.?0*$)\d+(\.\d+)?$|^(?!0+$)\d*\.\d+$/, {
    message: "Amount must be a positive decimal string when provided",
  })
  amount?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PermitDTO)
  permit?: PermitDTO;

  @IsOptional()
  paymentInfo?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  @Matches(/^0x[a-fA-F0-9]+$/, { message: "signature must be a hex string with 0x prefix" })
  signature?: string;

  @IsOptional()
  @IsString()
  opaqueToken?: string;
}

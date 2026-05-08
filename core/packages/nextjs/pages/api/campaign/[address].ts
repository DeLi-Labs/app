import "reflect-metadata";
import { Body, createHandler, Get, Post, Query, Res, ValidationPipe } from "next-api-decorators";
import type { NextApiResponse } from "next";
import { createPublicClient, createWalletClient, http, isAddress, parseUnits, type Address, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import deployedContracts from "~~/contracts/deployedContracts";
import externalContracts from "~~/contracts/externalContracts";
import scaffoldConfig from "~~/scaffold.config";
import CampaignProvider from "~~/services/provider/campaign";
import type { CampaignPeriodName, PermitMessage } from "~~/types";
import { validatePermitMessage } from "~~/utils/permit";
import { QuoteRequestDTO } from "~~/utils/quote";
import { sendErrorResponse } from "~~/utils/apiUtils";
import { getRpcHttpUrl } from "~~/utils/scaffold-eth/networks";

const VALID_PERIODS: CampaignPeriodName[] = ["hour", "day", "week", "month"];
const TICK_SPACING = 30;
const LICENSE_DECIMALS = 18;

function currentPeriodStart(period: CampaignPeriodName): bigint {
  const now = new Date();
  let d: Date;
  switch (period) {
    case "hour":
      d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()));
      break;
    case "day":
      d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      break;
    case "week": {
      const day = now.getUTCDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday));
      break;
    }
    case "month":
      d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      break;
  }
  return BigInt(Math.floor(d.getTime() / 1000));
}

type RelayChainResources = {
  chainId: number;
  chain: Chain;
  rpcUrl: string;
  routerAddress: Address;
  routerAbi: readonly unknown[];
  fixedHookAddress: Address;
  dynamicHookAddress: Address;
  permit2Address: Address;
};

const relayResourcesByChain = new Map<number, RelayChainResources>();

function getRelayResources(chainId: number): RelayChainResources {
  let cached = relayResourcesByChain.get(chainId);
  if (cached) {
    return cached;
  }
  const chain = scaffoldConfig.targetNetworks.find(n => n.id === chainId);
  if (!chain) {
    throw new Error(`Chain ${chainId} not found in scaffold config`);
  }
  const rpcUrl = getRpcHttpUrl(chainId);

  const chainContracts = (
    deployedContracts as Record<number, Record<string, { address: string; abi: readonly unknown[] }>>
  )[chainId];
  const router = chainContracts?.LicenseSwapRouter;
  const routerAddress = router?.address as Address | undefined;
  const fixedHook = chainContracts?.FixedPriceLicenseHook?.address as Address | undefined;
  const dynamicHook = chainContracts?.DynamicPriceLicenseHook?.address as Address | undefined;

  if (!routerAddress) {
    throw new Error(`LicenseSwapRouter not deployed on chain ${chainId}`);
  }
  if (!fixedHook) {
    throw new Error(`FixedPriceLicenseHook not deployed on chain ${chainId}`);
  }
  if (!dynamicHook) {
    throw new Error(`DynamicPriceLicenseHook not deployed on chain ${chainId}`);
  }
  const permit2 = (externalContracts as Record<number, Record<string, { address: string }>>)[chainId]?.Permit2;
  if (!permit2?.address) {
    throw new Error(`Permit2 not configured on chain ${chainId}`);
  }

  cached = {
    chainId,
    chain,
    rpcUrl,
    routerAddress,
    routerAbi: router.abi,
    fixedHookAddress: fixedHook,
    dynamicHookAddress: dynamicHook,
    permit2Address: permit2.address as Address,
  };
  relayResourcesByChain.set(chainId, cached);
  return cached;
}

function parseRequiredQueryChainId(chainIdQuery: string | undefined): number {
  if (chainIdQuery === undefined || chainIdQuery.trim() === "") {
    throw new Error("Missing chainId");
  }
  const n = Number(chainIdQuery);
  if (!Number.isInteger(n) || !scaffoldConfig.targetNetworks.some(c => c.id === n)) {
    throw new Error("Invalid chainId");
  }
  return n;
}

class CampaignPeriodDataHandler {
  @Get()
  async getCampaignPeriodData(
    @Query("address") address: string,
    @Query("period") period: string,
    @Query("view") view: string | undefined,
    @Query("limit") limit: string | undefined,
    @Query("periodStartTimestamp") periodStartTimestamp: string | undefined,
    @Query("periodEndTimestamp") periodEndTimestamp: string | undefined,
    @Query("chainId") chainIdQuery: string | undefined,
    @Res() res: NextApiResponse,
  ) {
    if (!address || typeof address !== "string") {
      return res.status(400).json({ error: "Missing or invalid address path parameter" });
    }
    const trimmed = address.trim().toLowerCase();
    if (!isAddress(trimmed)) {
      return res.status(400).json({ error: "Invalid Ethereum address" });
    }

    if (!period || !VALID_PERIODS.includes(period as CampaignPeriodName)) {
      return res
        .status(400)
        .json({ error: `Missing or invalid period param. Must be one of: ${VALID_PERIODS.join(", ")}` });
    }

    const validPeriod = period as CampaignPeriodName;
    const requestedView = view?.trim().toLowerCase();

    let requestChainId: number;
    try {
      requestChainId = parseRequiredQueryChainId(chainIdQuery);
    } catch {
      return res.status(400).json({ error: "Invalid chainId query parameter" });
    }
    const campaignProvider = new CampaignProvider(requestChainId);

    if (requestedView === "avgprice") {
      let parsedLimit = 12;
      if (limit !== undefined) {
        const limitNumber = Number(limit);
        if (!Number.isInteger(limitNumber) || limitNumber <= 0) {
          return res.status(400).json({ error: "limit must be a positive integer" });
        }
        parsedLimit = Math.min(limitNumber, 1000);
      }

      try {
        const items = await campaignProvider.getCampaignPeriodAvgPriceData(trimmed, validPeriod, parsedLimit);
        return res.status(200).json({
          licenseAddress: trimmed,
          period: validPeriod,
          limit: parsedLimit,
          items,
        });
      } catch (err) {
        console.error("Campaign period avg-price data error:", err);
        const message = err instanceof Error ? err.message : "Failed to fetch campaign period avg-price data";
        return res.status(500).json({ error: message });
      }
    }

    let fromTimestamp: bigint;
    if (periodStartTimestamp) {
      const parsed = Number(periodStartTimestamp);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return res.status(400).json({ error: "periodStartTimestamp must be a non-negative unix timestamp (seconds)" });
      }
      fromTimestamp = BigInt(Math.floor(parsed));
    } else {
      fromTimestamp = currentPeriodStart(validPeriod);
    }

    let toTimestamp: bigint | undefined;
    if (periodEndTimestamp) {
      const parsed = Number(periodEndTimestamp);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return res.status(400).json({ error: "periodEndTimestamp must be a non-negative unix timestamp (seconds)" });
      }
      toTimestamp = BigInt(Math.floor(parsed));
    }

    try {
      const data = await campaignProvider.getCampaignPeriodData(trimmed, validPeriod, fromTimestamp, toTimestamp);
      return res
        .status(200)
        .json({ licenseAddress: trimmed, period: validPeriod, fromTimestamp: fromTimestamp.toString(), items: data });
    } catch (err) {
      console.error("Campaign period data error:", err);
      const message = err instanceof Error ? err.message : "Failed to fetch campaign period data";
      return res.status(500).json({ error: message });
    }
  }

  @Post()
  async relaySwap(
    @Query("address") address: string,
    @Query("chainId") chainIdQuery: string | undefined,
    @Body(ValidationPipe()) body: QuoteRequestDTO,
    @Res() res: NextApiResponse,
  ) {
    try {
      if (!body.permit) {
        return sendErrorResponse(res, 400, "Missing permit", "Signed permit message is required.");
      }
      if (!address || typeof address !== "string") {
        return sendErrorResponse(res, 400, "Missing or invalid address", "Campaign address is required in path.");
      }

      const campaignId = address.trim().toLowerCase();
      const adminPk = process.env.ADMIN_APP_PK;
      if (!adminPk) {
        return sendErrorResponse(res, 500, "Missing admin key", "ADMIN_APP_PK is not configured.");
      }

      const userAddr = body.userAddress as Address;
      const permitMsg = body.permit.message as PermitMessage;

      let relayChainId: number;
      try {
        relayChainId = parseRequiredQueryChainId(chainIdQuery);
      } catch {
        return sendErrorResponse(res, 400, "Missing or invalid chainId", "A valid chainId query parameter is required.");
      }

      const permitChainId = permitMsg.domain.chainId;
      if (permitChainId !== relayChainId) {
        return sendErrorResponse(
          res,
          400,
          "chainId mismatch",
          `Query chainId (${relayChainId}) must match the permit domain chainId (${permitChainId}).`,
        );
      }

      let relay: RelayChainResources;
      try {
        relay = getRelayResources(relayChainId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return sendErrorResponse(res, 500, "Relay chain misconfigured", msg);
      }

      const campaignProvider = new CampaignProvider(relayChainId);
      const campaign = await campaignProvider.getCampaignDetails(campaignId);
      if (!campaign) {
        return sendErrorResponse(res, 404, "Campaign not found", "The campaign does not exist.");
      }

      const permitTokenAddr = permitMsg.message.details.token as Address;
      const amountLicenseRaw = parseUnits(body.amount, LICENSE_DECIMALS);
      const numeraireAddr = campaign.numeraireAddress as Address;
      const buy = body.buy ?? permitTokenAddr.toLowerCase() === numeraireAddr.toLowerCase();

      let amountOutRaw: bigint;
      let amountInRaw: bigint;
      if (buy) {
        amountOutRaw = amountLicenseRaw;
        amountInRaw = await campaignProvider.getQuote(campaign, amountOutRaw, false, false);
      } else {
        amountInRaw = amountLicenseRaw;
        amountOutRaw = await campaignProvider.getQuote(campaign, amountInRaw, true, true);
      }

      const validationResult = await validatePermitMessage(permitMsg, body.permit.signature, {
        chainId: relayChainId,
        permit2Address: relay.permit2Address,
        tokenAddress: permitTokenAddr,
        routerAddress: relay.routerAddress,
        userAddress: userAddr,
        amountInRaw,
      });
      if (!validationResult.valid) {
        return sendErrorResponse(res, 400, validationResult.error ?? "Validation failed", validationResult.details);
      }

      const poolKey = {
        currency0: campaign.licenseAddress as Address,
        currency1: campaign.numeraireAddress as Address,
        fee: 0,
        tickSpacing: TICK_SPACING,
        hooks: (campaign.licenseType === "DYNAMIC" ? relay.dynamicHookAddress : relay.fixedHookAddress) as Address,
      };
      const permitSingle = {
        details: {
          token: permitTokenAddr,
          amount: BigInt(permitMsg.message.details.amount),
          expiration: Number(permitMsg.message.details.expiration),
          nonce: Number(permitMsg.message.details.nonce),
        },
        spender: permitMsg.message.spender as Address,
        sigDeadline: BigInt(permitMsg.message.sigDeadline),
      };

      const account = privateKeyToAccount(adminPk as `0x${string}`);
      const publicClient = createPublicClient({ chain: relay.chain, transport: http(relay.rpcUrl) });
      const walletClient = createWalletClient({
        account,
        chain: relay.chain,
        transport: http(relay.rpcUrl),
      });

      const swapArgs = [
        poolKey,
        amountOutRaw,
        amountInRaw,
        !buy,
        "0x",
        userAddr,
        permitSingle,
        body.permit.signature as `0x${string}`,
      ] as const;

      try {
        await publicClient.simulateContract({
          address: relay.routerAddress,
          abi: relay.routerAbi,
          functionName: "swapExactOutputSingleFor",
          args: [...swapArgs],
          account,
        });
      } catch (simErr) {
        const errMsg = simErr instanceof Error ? simErr.message : String(simErr);
        const short =
          simErr && typeof simErr === "object" && "shortMessage" in simErr
            ? String((simErr as { shortMessage: string }).shortMessage)
            : "";
        return sendErrorResponse(res, 500, "Swap simulation failed", short ? `${short}\n${errMsg}` : errMsg);
      }

      const hash = await walletClient.writeContract({
        address: relay.routerAddress,
        abi: relay.routerAbi,
        functionName: "swapExactOutputSingleFor",
        args: [...swapArgs],
        account,
      });

      return res.status(200).json({ txHash: hash });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to relay swap";
      return sendErrorResponse(res, 500, "Failed to relay swap", message);
    }
  }
}

export default createHandler(CampaignPeriodDataHandler);

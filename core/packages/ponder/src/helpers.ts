import { formatUnits, type Address } from "viem";
import externalContracts from "../../nextjs/contracts/externalContracts";
import scaffoldConfig from "../../nextjs/scaffold.config";

export const ERC20_DECIMALS_ABI = [
    {
        type: "function" as const,
        name: "decimals",
        inputs: [],
        outputs: [{ type: "uint8", internalType: "uint8" }],
        stateMutability: "view" as const,
    },
] as const;

export const ERC20_TOTAL_SUPPLY_ABI = [
    {
        type: "function" as const,
        name: "totalSupply",
        inputs: [],
        outputs: [{ type: "uint256", internalType: "uint256" }],
        stateMutability: "view" as const,
    },
] as const;

export const TICK_SPACING = 30;
export const MIN_SQRT_PRICE_X96_PLUS_ONE = 4295128740n;

// mapping from allowed numeraire to pool id of this numeraire with USDC
// if no pool id is provided then numeraire is denominated to USD as 1:1 ratio (e.g. USDC, USDT, etc.)
export const ADDRESS_TO_POOL_ID: Partial<Record<`0x${string}`, `0x${string}`>> = {
    // Mock Numeraire (from packages/foundry/deployments/31337.json) -> zero pool id
    "0xee99593bf469cd98769e8e18926b126c8b2e4f2b": "0x0",
} as const;

export function getPoolIdForAddress(address: `0x${string}`): `0x${string}` | undefined {
    const normalized = address.toLowerCase() as `0x${string}`;
    return ADDRESS_TO_POOL_ID[normalized];
}

export type ParsedLicenseMetadata = {
    status: number;
    statusUpdateTimestamp: bigint;
    statusUpdateExplanation: string;
};

/** viem returns struct getters as positional arrays; events use named objects. */
export function parseLicenseMetadata(raw: unknown): ParsedLicenseMetadata | null {
    if (raw == null) return null;

    if (Array.isArray(raw)) {
        const [status, statusUpdateTimestamp, statusUpdateExplanation] = raw;
        if (status === undefined || status === null) return null;
        return {
            status: Number(status),
            statusUpdateTimestamp: BigInt(statusUpdateTimestamp ?? 0),
            statusUpdateExplanation: String(statusUpdateExplanation ?? ""),
        };
    }

    if (typeof raw === "object") {
        const obj = raw as Record<string, unknown>;
        if (!("status" in obj)) return null;
        return {
            status: Number(obj.status),
            statusUpdateTimestamp: BigInt((obj.statusUpdateTimestamp as bigint | number | string) ?? 0),
            statusUpdateExplanation: String(obj.statusUpdateExplanation ?? ""),
        };
    }

    return null;
}

function getStateViewContract() {
    const chainId = scaffoldConfig.targetNetworks[0].id as keyof typeof externalContracts;
    return externalContracts[chainId].StateView;
}

export type GetTokenPriceInPoolParams = {
    client: ReadContractClient;
};

export type ReadContractClient = {
    readContract: (args: {
        address: `0x${string}`;
        abi: readonly unknown[];
        functionName: string;
        args?: readonly unknown[];
    }) => Promise<unknown>;
};

export async function getTokenPriceUSD(
    address: `0x${string}`,
    params: GetTokenPriceInPoolParams,
): Promise<number> {
    const poolId = getPoolIdForAddress(address);
    if (poolId === undefined) {
        throw new Error(`No poolId found for address ${address}`);
    }
    if (poolId === "0x0") {
        return 1;
    }
    const stateView = getStateViewContract();
    const [sqrtPriceX96, numeraireDecimals] = await Promise.all([
        params.client
            .readContract({
                address: stateView.address.toLowerCase() as `0x${string}`,
                abi: stateView.abi,
                functionName: "getSlot0",
                args: [poolId],
            })
            .then((res) => (res as readonly [bigint, ...unknown[]])[0]),
        params.client.readContract({ address, abi: ERC20_DECIMALS_ABI, functionName: "decimals" }).then((d) => Number(d ?? 18)),
    ]);
    const q192 = 2n ** 192n;
    const priceRaw = (sqrtPriceX96 * sqrtPriceX96) / q192;
    const usdcScale = 10n ** 6n;
    const numeraireScale = 10n ** BigInt(numeraireDecimals);
    return Number((priceRaw * usdcScale) / numeraireScale);
}

/** Human-readable price: 1 token0 in token1 units. Price = (sqrtPriceX96/2^96)^2 * 10^token1Decimals / 10^token0Decimals. */
export async function quoteOneLicensePriceNumeraire(params: {
    client: ReadContractClient;
    hookAddress: `0x${string}`;
    hookAbi: readonly unknown[];
    licenseAddress: Address;
    numeraireAddress: Address;
    licenseDecimals: number;
    numeraireDecimals: number;
}): Promise<number> {
    const oneLicenseRaw = 10n ** BigInt(params.licenseDecimals);
    const quoteRaw = (await params.client.readContract({
        address: params.hookAddress,
        abi: params.hookAbi,
        functionName: "quote",
        args: [
            {
                currency0: params.licenseAddress,
                currency1: params.numeraireAddress,
                fee: 0,
                tickSpacing: TICK_SPACING,
                hooks: params.hookAddress,
            },
            {
                // Exact output of 1 license token (token0), quoted in numeraire (token1).
                zeroForOne: false,
                amountSpecified: oneLicenseRaw,
                sqrtPriceLimitX96: MIN_SQRT_PRICE_X96_PLUS_ONE,
            },
        ],
    })) as bigint;

    return Number(formatUnits(quoteRaw, params.numeraireDecimals));
}

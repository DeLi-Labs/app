import { type Hex, encodeAbiParameters } from "viem";

/**
 * Uniswap v4 tick bounds (from TickMath). Ticks must be aligned to tickSpacing (30).
 */
const MIN_TICK = -887272;
const MAX_TICK = 887272;
const TICK_SPACING = 30;

// Keep aligned bounds inside TickMath's inclusive range.
// For negative min tick, floor() would go below MIN_TICK (e.g. -887280), which reverts with InvalidTick(int24).
const MIN_TICK_ALIGNED = Math.ceil(MIN_TICK / TICK_SPACING) * TICK_SPACING;
const MAX_TICK_ALIGNED = Math.floor(MAX_TICK / TICK_SPACING) * TICK_SPACING;

/**
 * Price = token1 per token0, scaled by 1e18 (same as FixedPriceLicenseHook).
 * Converts that price to the nearest Uniswap tick (price at tick t is 1.0001^t).
 * Result is aligned to TICK_SPACING (30).
 */
export function priceToTick(priceWei: bigint): number {
  if (priceWei <= 0n) throw new Error("price must be positive");
  const priceRatio = Number(priceWei) / 1e18;
  const tick = Math.log(priceRatio) / Math.log(1.0001);
  return alignTickToSpacing(Math.round(tick));
}

function alignTickToSpacing(tick: number): number {
  const remainder = tick % TICK_SPACING;
  if (remainder === 0) return tick;
  if (tick > 0) {
    return remainder >= TICK_SPACING / 2 ? tick + (TICK_SPACING - remainder) : tick - remainder;
  }
  return remainder <= -TICK_SPACING / 2 ? tick - remainder - TICK_SPACING : tick - remainder;
}

/**
 * Clamps tick to valid aligned range.
 */
function clampTick(tick: number): number {
  const aligned = alignTickToSpacing(tick);
  return Math.max(MIN_TICK_ALIGNED, Math.min(MAX_TICK_ALIGNED, aligned));
}

function assertTickInRange(tick: number): void {
  if (tick < MIN_TICK || tick > MAX_TICK) {
    throw new Error(`tick ${tick} out of TickMath range [${MIN_TICK}, ${MAX_TICK}]`);
  }
  if (tick % TICK_SPACING !== 0) {
    throw new Error(`tick ${tick} is not aligned to spacing ${TICK_SPACING}`);
  }
}

/**
 * Largest possible tick (aligned). Used as tickUpper for dynamic campaigns.
 */
export function getMaxTickAligned(): number {
  return MAX_TICK_ALIGNED;
}

/**
 * Builds tickLower from price (token1 per token0, 1e18). Clamped so tickLower < tickUpper.
 */
export function priceToTickLower(priceWei: bigint): number {
  const tickUpper = getMaxTickAligned();
  const tickLowerMax = tickUpper - TICK_SPACING;
  return Math.min(clampTick(priceToTick(priceWei)), tickLowerMax);
}

/** LicenseType: 0 = DYNAMIC, 1 = FIXED (matches CampaignManager enum) */
export const CampaignType = { DYNAMIC: 0, FIXED: 1 } as const;
export type CampaignTypeValue = (typeof CampaignType)[keyof typeof CampaignType];

/** Fixed campaign params: price (token1 per token0, 1e18) */
export type FixedParams = { type: "fixed"; price: string };

/** Dynamic campaign params: tickLower (from price), tickUpper (max) */
export type DynamicParams = { type: "dynamic"; tickLower: number; tickUpper: number };

export type CampaignParams = FixedParams | DynamicParams;

/**
 * Encodes _params bytes for CampaignManager.initialize(..., totalTokensToSell, _params).
 * - Fixed: abi.encode(uint256 price)
 * - Dynamic: abi.encode(int24 tickLower, int24 tickUpper)
 */
export function encodeCampaignParams(campaignType: CampaignTypeValue, priceWei: bigint): Hex {
  if (campaignType === CampaignType.FIXED) {
    return encodeAbiParameters([{ type: "uint256" }], [priceWei]);
  }
  const tickLower = priceToTickLower(priceWei);
  const tickUpper = getMaxTickAligned();
  assertTickInRange(tickLower);
  assertTickInRange(tickUpper);
  if (tickLower >= tickUpper) {
    throw new Error(`invalid dynamic tick range: tickLower (${tickLower}) must be < tickUpper (${tickUpper})`);
  }
  return encodeAbiParameters([{ type: "int24" }, { type: "int24" }], [tickLower, tickUpper]);
}

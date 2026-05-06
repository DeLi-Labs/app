// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPoolManager} from "@v4-core/interfaces/IPoolManager.sol";
import {PoolId} from "@v4-core/types/PoolId.sol";
import {StateLibrary} from "@v4-core/libraries/StateLibrary.sol";
import {SwapMath} from "@v4-core/libraries/SwapMath.sol";
import {TickMath} from "@v4-core/libraries/TickMath.sol";
import {TickBitmap} from "@v4-core/libraries/TickBitmap.sol";
import {BitMath} from "@v4-core/libraries/BitMath.sol";
import {ProtocolFeeLibrary} from "@v4-core/libraries/ProtocolFeeLibrary.sol";
import {LiquidityMath} from "@v4-core/libraries/LiquidityMath.sol";
import {SafeCast} from "@v4-core/libraries/SafeCast.sol";

/// @title PoolQuoteLib
/// @notice View-only quote for a concentrated liquidity pool swap (replicates Pool.swap loop using StateLibrary + SwapMath).
library PoolQuoteLib {
    using SafeCast for uint256;

    /// @notice Quote the unspecified amount for a swap (exact input -> output, or exact output -> input).
    /// @param manager Pool manager (must support extsload).
    /// @param poolId Pool id.
    /// @param tickSpacing Pool tick spacing.
    /// @param amountSpecified Negative for exact in, positive for exact out.
    /// @param zeroForOne True if swapping token0 for token1.
    /// @param sqrtPriceLimitX96 Price limit (zeroForOne: min price; oneForZero: max price).
    /// @return amountCalculated The other leg: for exact in this is output (positive), for exact out this is negative of input.
    function quoteView(
        IPoolManager manager,
        PoolId poolId,
        int24 tickSpacing,
        int256 amountSpecified,
        bool zeroForOne,
        uint160 sqrtPriceLimitX96
    ) internal view returns (int256 amountCalculated) {
        (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee) = StateLibrary.getSlot0(manager, poolId);
        uint128 liquidity = StateLibrary.getLiquidity(manager, poolId);

        uint256 protocolFeeDir =
            zeroForOne ? ProtocolFeeLibrary.getZeroForOneFee(protocolFee) : ProtocolFeeLibrary.getOneForZeroFee(protocolFee);
        uint24 swapFee = protocolFeeDir == 0 ? lpFee : ProtocolFeeLibrary.calculateSwapFee(uint16(protocolFeeDir), lpFee);

        if (swapFee >= SwapMath.MAX_SWAP_FEE && amountSpecified > 0) return 0;
        if (amountSpecified == 0) return 0;

        int256 amountSpecifiedRemaining = amountSpecified;
        amountCalculated = 0;

        unchecked {
            while (amountSpecifiedRemaining != 0 && sqrtPriceX96 != sqrtPriceLimitX96) {
                uint160 stepStartX96 = sqrtPriceX96;
                (int24 tickNext, bool initialized) =
                    _nextInitializedTickWithinOneWord(manager, poolId, tick, tickSpacing, zeroForOne);

                if (tickNext <= TickMath.MIN_TICK) tickNext = TickMath.MIN_TICK;
                if (tickNext >= TickMath.MAX_TICK) tickNext = TickMath.MAX_TICK;

                uint160 sqrtPriceNextX96 = TickMath.getSqrtPriceAtTick(tickNext);
                uint160 sqrtPriceTargetX96 =
                    SwapMath.getSqrtPriceTarget(zeroForOne, sqrtPriceNextX96, sqrtPriceLimitX96);

                uint256 amountIn;
                uint256 amountOut;
                uint256 feeAmount;
                (sqrtPriceX96, amountIn, amountOut, feeAmount) = SwapMath.computeSwapStep(
                    sqrtPriceX96, sqrtPriceTargetX96, liquidity, amountSpecifiedRemaining, swapFee
                );

                if (amountSpecified > 0) {
                    amountSpecifiedRemaining -= amountOut.toInt256();
                    amountCalculated -= (amountIn + feeAmount).toInt256();
                } else {
                    amountSpecifiedRemaining += (amountIn + feeAmount).toInt256();
                    amountCalculated += amountOut.toInt256();
                }

                if (sqrtPriceX96 == sqrtPriceNextX96 && initialized) {
                    (, int128 liquidityNet) = StateLibrary.getTickLiquidity(manager, poolId, tickNext);
                    if (zeroForOne) liquidityNet = -liquidityNet;
                    liquidity = LiquidityMath.addDelta(liquidity, liquidityNet);
                    tick = zeroForOne ? tickNext - 1 : tickNext;
                } else if (sqrtPriceX96 != stepStartX96) {
                    tick = TickMath.getTickAtSqrtPrice(sqrtPriceX96);
                }
            }
        }

        return amountCalculated;
    }

    /// @dev Next initialized tick in one word using a loaded bitmap word (view replacement for TickBitmap.nextInitializedTickWithinOneWord).
    function _nextInitializedTickWithinOneWord(
        IPoolManager manager,
        PoolId poolId,
        int24 tick,
        int24 tickSpacing,
        bool lte
    ) private view returns (int24 next, bool initialized) {
        unchecked {
            int24 compressed = TickBitmap.compress(tick, tickSpacing);

            if (lte) {
                (int16 wordPos, uint8 bitPos) = TickBitmap.position(compressed);
                uint256 word = StateLibrary.getTickBitmap(manager, poolId, wordPos);
                uint256 mask = type(uint256).max >> (uint256(type(uint8).max) - bitPos);
                uint256 masked = word & mask;
                initialized = masked != 0;
                next = initialized
                    ? (compressed - int24(uint24(bitPos - BitMath.mostSignificantBit(masked)))) * tickSpacing
                    : (compressed - int24(uint24(bitPos))) * tickSpacing;
            } else {
                (int16 wordPos, uint8 bitPos) = TickBitmap.position(compressed + 1);
                uint256 word = StateLibrary.getTickBitmap(manager, poolId, wordPos);
                uint256 mask = ~((1 << bitPos) - 1);
                uint256 masked = word & mask;
                initialized = masked != 0;
                next = initialized
                    ? (compressed + 1 + int24(uint24(BitMath.leastSignificantBit(masked) - bitPos))) * tickSpacing
                    : (compressed + 1 + int24(uint24(type(uint8).max - bitPos))) * tickSpacing;
            }
        }
    }
}

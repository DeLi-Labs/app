// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { BaseCustomCurve } from "../base/BaseCustomCurve.sol";
import { BaseHook } from "uniswap-hooks/base/BaseHook.sol";
import { SwapParams } from "@uniswap/v4-core/src/types/PoolOperation.sol";
import { BalanceDelta } from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import { PoolId } from "@v4-core/types/PoolId.sol";
import { PoolKey } from "@v4-core/types/PoolKey.sol";
import { Currency } from "@uniswap/v4-core/src/types/Currency.sol";
import { CurrencySettler } from "uniswap-hooks/utils/CurrencySettler.sol";

/**
 * @title BaseLicenseHook
 * @notice A Uniswap V4 hook that overrides the AMM with a fixed, updateable price
 * @dev This hook uses BaseCustomCurve to completely bypass the concentrated liquidity
 *      AMM and execute swaps at a specified fixed price ratio.
 *
 *      With currency0=license and currency1=numeraire, price is numeraire per license (token1 per token0).
 *      For example, if price = 5e18, then 1 license (token0) costs 5 numeraire (token1).
 */
abstract contract BaseFixedPriceHook is BaseCustomCurve {
    using CurrencySettler for Currency;

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Price must be greater than zero
    error InvalidPrice();

    /// @notice Function not implemented
    error NotImplemented();

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when the price is updated
    event PriceUpdated(PoolId indexed id, uint256 oldPrice, uint256 newPrice);

    /*//////////////////////////////////////////////////////////////
                                 STATE
    //////////////////////////////////////////////////////////////*/

    /// @notice The fixed price: token1 (numeraire) per token0 (license), scaled by 1e18
    /// @dev Example: 1e18 means 1 license = 1 numeraire; 5e18 means 1 license costs 5 numeraire
    mapping(PoolId poolId => uint256 price) public prices;

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Update the fixed swap price
     * @param _newPrice The new price (numeraire per license, scaled by 1e18)
     */
    function _setPrice(PoolId id, uint256 _newPrice) internal {
        if (_newPrice == 0) revert InvalidPrice();

        uint256 oldPrice = prices[id];
        prices[id] = _newPrice;

        emit PriceUpdated(id, oldPrice, _newPrice);
    }

    /*//////////////////////////////////////////////////////////////
                           SWAP LOGIC (CORE)
    //////////////////////////////////////////////////////////////*/

    function _getUnspecifiedAmount(PoolKey memory key, SwapParams calldata params)
        internal
        view
        virtual
        override
        returns (uint256 unspecifiedAmount)
    {
        bool exactInput = params.amountSpecified < 0;
        uint256 specifiedAmount = exactInput ? uint256(-params.amountSpecified) : uint256(params.amountSpecified);

        uint256 price = prices[key.toId()];

        if (exactInput) {
            // User specified input amount, calculate output
            if (params.zeroForOne) {
                // Swapping token0 -> token1
                // output = input * price / 1e18
                unspecifiedAmount = (specifiedAmount * price) / 1e18;
            } else {
                // Swapping token1 -> token0
                // output = input * 1e18 / price
                unspecifiedAmount = (specifiedAmount * 1e18) / price;
            }
        } else {
            // User specified output amount, calculate input needed (round up to avoid under-delivery)
            if (params.zeroForOne) {
                // Swapping token0 -> token1, user wants specific token1 output
                // input = ceil(output * 1e18 / price)
                unspecifiedAmount = (specifiedAmount * 1e18 + price - 1) / price;
            } else {
                // Swapping token1 -> token0, user wants specific token0 output
                // input = ceil(output * price / 1e18)
                unspecifiedAmount = (specifiedAmount * price + 1e18 - 1) / 1e18;
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                    LIQUIDITY MANAGEMENT (NOT IMPLEMENTED)
    //////////////////////////////////////////////////////////////*/

    function _getAmountIn(AddLiquidityParams memory params)
        internal
        view
        override
        returns (uint256 amount0, uint256 amount1, uint256 liquidity)
    {
        revert NotImplemented();
    }

    function _getAmountOut(RemoveLiquidityParams memory params)
        internal
        view
        override
        returns (uint256 amount0, uint256 amount1, uint256 liquidity)
    {
        revert NotImplemented();
    }

    function _mint(AddLiquidityParams memory params, BalanceDelta callerDelta, BalanceDelta feesAccrued, uint256 shares)
        internal
        override
    {
        revert NotImplemented();
    }

    function _burn(
        RemoveLiquidityParams memory params,
        BalanceDelta callerDelta,
        BalanceDelta feesAccrued,
        uint256 shares
    ) internal override {
        revert NotImplemented();
    }

    function _getSwapFeeAmount(SwapParams calldata params, uint256 unspecifiedAmount)
        internal
        view
        override
        returns (uint256 swapFeeAmount)
    {
        return 0;
    }
}

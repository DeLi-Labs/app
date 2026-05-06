// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { PoolKey } from "@v4-core/types/PoolKey.sol";
import { Currency } from "@v4-core/types/Currency.sol";
import { SwapParams } from "@v4-core/types/PoolOperation.sol";

/// @title ILicenseHook
/// @notice Common interface for all license hook variants.
interface ILicenseHook {
    function initializeCampaign(bytes calldata params) external;
    function deposit(Currency currency, uint256 amount) external;
    function withdraw(Currency currency, uint256 amount, address recipient) external;
    function quote(PoolKey calldata key, SwapParams calldata params) external view returns (uint256 result);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {V4Router} from "@v4-periphery/V4Router.sol";
import {IV4Router} from "@v4-periphery/interfaces/IV4Router.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {ReentrancyLock} from "@v4-periphery/base/ReentrancyLock.sol";
import {Permit2Forwarder} from "@v4-periphery/base/Permit2Forwarder.sol";
import {Actions} from "@v4-periphery/libraries/Actions.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {
    IERC20Minimal
} from "@uniswap/v4-core/src/interfaces/external/IERC20Minimal.sol";
import {
    IAllowanceTransfer
} from "permit2/src/interfaces/IAllowanceTransfer.sol";
import {ILicenseHook} from "./interfaces/ILicenseHook.sol";
import {LicenseType} from "./CampaignManager.sol";

contract LicenseSwapRouter is V4Router, ReentrancyLock, Permit2Forwarder {
    error PoolHookMismatch(address expected, address actual);
    error Permit2NotApproved(
        address payer,
        address token,
        uint256 amount,
        uint256 approvedAmount
    );
    error UnauthorizedRelayer(address caller);
    error InvalidPermitOwner();
    error InvalidPermitSpender(address expected, address actual);

    address public authorizedRelayer;
    address private overrideSender;

    constructor(
        IPoolManager _poolManager,
        IAllowanceTransfer _permit2,
        address _authorizedRelayer
    ) V4Router(_poolManager) Permit2Forwarder(_permit2) {
        authorizedRelayer = _authorizedRelayer;
    }

    function msgSender() public view override returns (address) {
        if (overrideSender != address(0)) {
            return overrideSender;
        }
        return _getLocker();
    }

    function swapExactOutputSingleFor(
        PoolKey calldata poolKey,
        uint128 amountOut,
        uint128 amountInMaximum,
        bool zeroForOne,
        bytes calldata hookData,
        address permitOwner,
        IAllowanceTransfer.PermitSingle calldata permitSingle,
        bytes calldata permitSignature
    ) external isNotLocked {
        if (permitOwner == address(0)) {
            revert InvalidPermitOwner();
        }
        if (msg.sender != permitOwner && msg.sender != authorizedRelayer) {
            revert UnauthorizedRelayer(msg.sender);
        }
        if (permitSingle.spender != address(this)) {
            revert InvalidPermitSpender(address(this), permitSingle.spender);
        }

        // Handle Permit2 approval if signature provided
        if (permitSignature.length > 0) {
            // Call Permit2 permit - will revert if signature is invalid, expired, or nonce is wrong
            // If permit succeeds, we have approval and can proceed with swap
            permit2.permit(permitOwner, permitSingle, permitSignature);
        }

        // Encode actions: SWAP_EXACT_OUT_SINGLE, SETTLE_ALL, TAKE_ALL
        bytes memory actions = abi.encodePacked(
            uint8(Actions.SWAP_EXACT_OUT_SINGLE),
            uint8(Actions.SETTLE_ALL),
            uint8(Actions.TAKE_ALL)
        );

        // Encode params for each action
        bytes[] memory params = new bytes[](3);

        // SWAP_EXACT_OUT_SINGLE params
        params[0] = abi.encode(
            IV4Router.ExactOutputSingleParams({
                poolKey: poolKey,
                zeroForOne: zeroForOne,
                amountOut: amountOut,
                amountInMaximum: amountInMaximum,
                hookData: hookData
            })
        );

        if (zeroForOne) {
            // Selling currency0 for currency1: settle input (currency0), take output (currency1)
            params[1] = abi.encode(poolKey.currency0, amountInMaximum);
            params[2] = abi.encode(poolKey.currency1, amountOut);
        } else {
            // Selling currency1 for currency0: settle input (currency1), take output (currency0)
            params[1] = abi.encode(poolKey.currency1, amountInMaximum);
            params[2] = abi.encode(poolKey.currency0, amountOut);
        }

        // Execute with msgSender overridden to the permit owner so SETTLE_ALL uses permitOwner as payer.
        overrideSender = permitOwner;
        poolManager.unlock(abi.encode(actions, params));
        overrideSender = address(0);
    }

    function _pay(
        Currency token,
        address payer,
        uint256 amount
    ) internal override {
        if (payer == address(this)) {
            token.transfer(address(poolManager), amount);
        } else {
            address tokenAddress = Currency.unwrap(token);
            // Check if Permit2 is approved
            uint256 allowance = IERC20Minimal(tokenAddress).allowance(
                payer,
                address(permit2)
            );
            if (allowance < amount) {
                revert Permit2NotApproved(
                    payer,
                    tokenAddress,
                    amount,
                    allowance
                );
            }
            permit2.transferFrom(
                payer,
                address(poolManager),
                uint160(amount),
                tokenAddress
            );
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ILicenseHook} from "../interfaces/ILicenseHook.sol";
import {Currency} from "@v4-core/types/Currency.sol";
import {BaseHook} from "uniswap-hooks/base/BaseHook.sol";
import {IPoolManager} from "@v4-core/interfaces/IPoolManager.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CurrencySettler} from "uniswap-hooks/utils/CurrencySettler.sol";

abstract contract AbstractLicenseHook is ILicenseHook, Ownable {
    using CurrencySettler for Currency;

    error InvalidCallbackType();

    event Deposited(
        Currency indexed currency,
        address indexed depositor,
        uint256 amount
    );
    event Withdrawn(
        Currency indexed currency,
        address indexed recipient,
        uint256 amount
    );

    uint8 internal constant CALLBACK_DEPOSIT = 1;
    uint8 internal constant CALLBACK_WITHDRAW = 2;

    struct DepositCallbackData {
        uint8 callbackType;
        Currency currency;
        address sender;
        uint256 amount;
    }

    IPoolManager public immutable manager;

    constructor(
        IPoolManager _poolManager,
        address _owner
    ) Ownable(_owner) {
        manager = _poolManager;
    }

    function deposit(Currency currency, uint256 amount) external onlyOwner {
        manager.unlock(
            abi.encode(
                DepositCallbackData({
                    callbackType: CALLBACK_DEPOSIT,
                    currency: currency,
                    sender: msg.sender,
                    amount: amount
                })
            )
        );
    }

    function withdraw(
        Currency currency,
        uint256 amount,
        address recipient
    ) external onlyOwner {
        manager.unlock(
            abi.encode(
                DepositCallbackData({
                    callbackType: CALLBACK_WITHDRAW,
                    currency: currency,
                    sender: recipient,
                    amount: amount
                })
            )
        );
    }

    /// @dev Sender's ERC20 goes to the PoolManager; hook receives ERC-6909 claims against it.
    function _processDeposit(Currency currency, uint256 amount, address sender) internal returns (bytes memory) {
        currency.settle(manager, sender, amount, false);
        currency.take(manager, address(this), amount, true);
        emit Deposited(currency, sender, amount);
        return "";
    }

    /// @dev Burns the hook's ERC-6909 claims and sends ERC20 from the PoolManager to the recipient.
    function _processWithdraw(Currency currency, uint256 amount, address sender) internal returns (bytes memory) {
        currency.settle(manager, address(this), amount, true);
        currency.take(manager, sender, amount, false);
        emit Withdrawn(currency, sender, amount);
        return "";
    }
}

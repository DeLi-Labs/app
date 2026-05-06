// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { BaseFixedPriceHook } from "./base/BaseFixedPriceHook.sol";
import { IPoolManager } from "@v4-core/interfaces/IPoolManager.sol";
import { PoolKey } from "@v4-core/types/PoolKey.sol";
import { BaseHook } from "uniswap-hooks/base/BaseHook.sol";
import { SwapParams, ModifyLiquidityParams } from "@v4-core/types/PoolOperation.sol";
import { PoolId } from "@v4-core/types/PoolId.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { AbstractLicenseHook } from "../AbstractLicenseHook.sol";
import { Currency } from "@uniswap/v4-core/src/types/Currency.sol";

contract FixedPriceLicenseHook is BaseFixedPriceHook, AbstractLicenseHook {
    error RedeemNotAllowed();
    error ModifyingLiquidityNotAllowed();
    error DonatingNotAllowed();
    error PatentNotDelegated();
    error CampaignStopped();
    error CampaignNotInitialized();
    error CampaignAlreadyInitialized();

    event CampaignInitialized(PoolId indexed poolId, uint256 patentId, uint256 price);

    IERC721 public immutable patentErc721;

    mapping(PoolId poolId => uint256 patentId) public patentIds;
    mapping(PoolId poolId => bool stopped) public isStopped;

    constructor(IPoolManager _poolManager, address _owner, IERC721 _patentErc721)
        BaseHook(_poolManager)
        AbstractLicenseHook(_poolManager, _owner)
    {
        patentErc721 = _patentErc721;
    }

    // owner of contract always should be campaign manager
    modifier onlyInitializedCampaign(PoolId poolId) {
        uint256 patentId = patentIds[poolId];
        require(patentId != 0, CampaignNotInitialized());
        require(patentErc721.ownerOf(patentId) == owner(), PatentNotDelegated());
        _;
    }

    modifier onlyNotStopped(PoolId poolId) {
        require(!isStopped[poolId], CampaignStopped());
        _;
    }

    function setStopped(PoolId poolId, bool _stopped) external onlyOwner {
        isStopped[poolId] = _stopped;
    }

    function initializeCampaign(bytes calldata params) external onlyOwner {
        (PoolId poolId, uint256 patentId, uint256 price) = abi.decode(params, (PoolId, uint256, uint256));
        
        require(patentIds[poolId] == 0, CampaignAlreadyInitialized());
        require(patentErc721.ownerOf(patentId) == owner(), PatentNotDelegated());
        
        patentIds[poolId] = patentId;
        _setPrice(poolId, price);
        emit CampaignInitialized(poolId, patentId, price);
    }

    function unlockCallback(bytes calldata rawData) public override onlyPoolManager returns (bytes memory) {
        uint8 callbackType = abi.decode(rawData, (uint8));

        if (callbackType == CALLBACK_DEPOSIT) {
            (Currency currency, address sender, uint256 amount) = abi.decode(rawData[32:], (Currency, address, uint256));
            return _processDeposit(currency, amount, sender);
        } else if (callbackType == CALLBACK_WITHDRAW) {
            (Currency currency, address sender, uint256 amount) = abi.decode(rawData[32:], (Currency, address, uint256));
            return _processWithdraw(currency, amount, sender);
        } else {
            return super.unlockCallback(rawData);
        }
    }

    function quote(PoolKey calldata key, SwapParams calldata params)
        external
        view
        returns (uint256 result)
    {
        return _getUnspecifiedAmount(key, params);
    }

    function _getUnspecifiedAmount(PoolKey memory key, SwapParams calldata params)
        internal
        view
        override
        onlyInitializedCampaign(key.toId())
        onlyNotStopped(key.toId())
        returns (uint256 unspecifiedAmount)
    {
        return super._getUnspecifiedAmount(key, params);
    }

    function _beforeInitialize(address sender, PoolKey calldata key, uint160 sqrtPriceX96)
        internal
        override
        onlyInitializedCampaign(key.toId())
        onlyNotStopped(key.toId())
        returns (bytes4)
    {
        return super._beforeInitialize(sender, key, sqrtPriceX96);
    }

    function _beforeAddLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, bytes calldata)
        internal
        pure
        override
        returns (bytes4)
    {
        revert ModifyingLiquidityNotAllowed();
    }

    function _beforeRemoveLiquidity(address, PoolKey calldata, ModifyLiquidityParams calldata, bytes calldata)
        internal
        pure
        override
        returns (bytes4)
    {
        revert ModifyingLiquidityNotAllowed();
    }

    function _beforeDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        internal
        pure
        override
        returns (bytes4)
    {
        revert DonatingNotAllowed();
    }
}

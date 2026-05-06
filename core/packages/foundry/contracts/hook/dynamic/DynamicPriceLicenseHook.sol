// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "uniswap-hooks/base/BaseHook.sol";
import {IPoolManager} from "@v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "@v4-core/types/PoolKey.sol";
import {PoolId} from "@v4-core/types/PoolId.sol";
import {Currency} from "@v4-core/types/Currency.sol";
import {
    SwapParams,
    ModifyLiquidityParams
} from "@v4-core/types/PoolOperation.sol";
import {BalanceDelta} from "@v4-core/types/BalanceDelta.sol";
import {TickMath} from "@v4-core/libraries/TickMath.sol";

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {
    IUnlockCallback
} from "@v4-core/interfaces/callback/IUnlockCallback.sol";
import {CurrencySettler} from "uniswap-hooks/utils/CurrencySettler.sol";
import {
    BeforeSwapDelta,
    BeforeSwapDeltaLibrary
} from "@v4-core/types/BeforeSwapDelta.sol";
import {Hooks} from "@v4-core/libraries/Hooks.sol";
import {LiquidityAmounts} from "@v4-core-test/utils/LiquidityAmounts.sol";
import {PoolQuoteLib} from "../../libraries/PoolQuoteLib.sol";
import {AbstractLicenseHook} from "../AbstractLicenseHook.sol";

/// @title DynamicPriceLicenseHook
/// @notice Uniswap V4 hook for license pools with dynamic AMM pricing and a price floor/cap.
/// @dev Uses native concentrated liquidity. Only the owner (CampaignManager) can add/remove liquidity.
///      Price is bounded by [tickLower, tickUpper]; liquidity is seeded in that range.
contract DynamicPriceLicenseHook is
    BaseHook,
    Ownable,
    IUnlockCallback,
    AbstractLicenseHook
{
    using CurrencySettler for Currency;

    error ModifyingLiquidityNotAllowed();
    error DonatingNotAllowed();
    error PatentNotDelegated();
    error CampaignStopped();
    error CampaignNotInitialized();
    error CampaignAlreadyInitialized();
    error OnlyPoolManager();
    error InvalidTickRange();
    error InsufficientLicenseBalance();

    event CampaignInitialized(
        PoolId indexed poolId,
        uint256 patentId,
        int24 tickLower,
        int24 tickUpper
    );
    event LiquiditySeeded(
        PoolId indexed poolId,
        uint256 amount0,
        uint128 liquidity
    );

    struct ModifyLiquidityCallbackData {
        uint8 callbackType;
        PoolKey key;
        int24 lower;
        int24 upper;
        uint128 liquidity;
    }

    uint8 internal constant CALLBACK_MODIFY_LIQUIDITY = 3;

    IERC721 public immutable patentErc721;

    mapping(PoolId poolId => uint256 patentId) public patentIds;
    mapping(PoolId poolId => bool stopped) public isStopped;
    mapping(PoolId poolId => int24) public tickLower;
    mapping(PoolId poolId => int24) public tickUpper;

    bytes32 public constant SEED_SALT = bytes32(0);

    constructor(
        IPoolManager _poolManager,
        address _owner,
        IERC721 _patentErc721
    ) BaseHook(_poolManager) AbstractLicenseHook(_poolManager, _owner) {
        patentErc721 = _patentErc721;
    }

    function setStopped(PoolId poolId, bool _stopped) external onlyOwner {
        isStopped[poolId] = _stopped;
    }

    function initializeCampaign(bytes calldata params) external onlyOwner {
        (PoolId id, uint256 _patentId, int24 _tickLower, int24 _tickUpper) = abi
            .decode(params, (PoolId, uint256, int24, int24));
        require(patentIds[id] == 0, CampaignAlreadyInitialized());
        require(_tickLower < _tickUpper, InvalidTickRange());
        require(
            patentErc721.ownerOf(_patentId) == owner(),
            PatentNotDelegated()
        );
        patentIds[id] = _patentId;
        tickLower[id] = _tickLower;
        tickUpper[id] = _tickUpper;
        emit CampaignInitialized(id, _patentId, _tickLower, _tickUpper);
    }

    function unlockCallback(
        bytes calldata rawData
    ) external override onlyPoolManager returns (bytes memory) {
        uint8 callbackType = abi.decode(rawData, (uint8));

        if (callbackType == CALLBACK_DEPOSIT) {
            (Currency currency, address sender, uint256 amount) = abi.decode(
                rawData[32:],
                (Currency, address, uint256)
            );
            return _processDeposit(currency, amount, sender);
        } else if (callbackType == CALLBACK_WITHDRAW) {
            (Currency currency, address sender, uint256 amount) = abi.decode(
                rawData[32:],
                (Currency, address, uint256)
            );
            return _processWithdraw(currency, amount, sender);
        } else if (callbackType == CALLBACK_MODIFY_LIQUIDITY) {
            (PoolKey memory key, int24 lower, int24 upper, uint128 liquidity) = abi.decode(
                rawData[32:],
                (PoolKey, int24, int24, uint128)
            );
            return _processModifyLiquidity(key, lower, upper, liquidity);
        } else {
            revert InvalidCallbackType();
        }
    }

    function quote(PoolKey calldata key, SwapParams calldata params)
        external
        view
        returns (uint256 result)
    {
        PoolId id = key.toId();
        require(patentIds[id] != 0, CampaignNotInitialized());
        require(patentErc721.ownerOf(patentIds[id]) == owner(), PatentNotDelegated());
        require(!isStopped[id], CampaignStopped());

        int256 amountSpecified = params.amountSpecified;
        uint160 sqrtPriceLimitX96 = params.zeroForOne
            ? TickMath.getSqrtPriceAtTick(tickLower[id])
            : TickMath.getSqrtPriceAtTick(tickUpper[id]);

        int256 amountCalculated = PoolQuoteLib.quoteView(
            poolManager, id, key.tickSpacing, amountSpecified, params.zeroForOne, sqrtPriceLimitX96
        );
        result = amountCalculated < 0 ? uint256(-amountCalculated) : uint256(amountCalculated);
    }

    function _processModifyLiquidity(
        PoolKey memory key,
        int24 lower,
        int24 upper,
        uint128 liquidity
    ) internal returns (bytes memory) {
        (BalanceDelta delta, ) = poolManager.modifyLiquidity(
            key,
            ModifyLiquidityParams({
                tickLower: lower,
                tickUpper: upper,
                liquidityDelta: int256(uint256(liquidity)),
                salt: SEED_SALT
            }),
            ""
        );

        if (delta.amount0() < 0) {
            key.currency0.settle(
                poolManager,
                address(this),
                uint256(int256(-delta.amount0())),
                true
            );
        }
        if (delta.amount1() < 0) {
            key.currency1.settle(
                poolManager,
                address(this),
                uint256(int256(-delta.amount1())),
                true
            );
        }
        if (delta.amount0() > 0) {
            key.currency0.take(
                poolManager,
                address(this),
                uint256(int256(delta.amount0())),
                true
            );
        }
        if (delta.amount1() > 0) {
            key.currency1.take(
                poolManager,
                address(this),
                uint256(int256(delta.amount1())),
                true
            );
        }

        return abi.encode(liquidity);
    }

    function _beforeInitialize(address, PoolKey calldata key, uint160)
        internal
        view
        override
        returns (bytes4)
    {
        require(patentIds[key.toId()] != 0, CampaignNotInitialized());
        require(
            patentErc721.ownerOf(patentIds[key.toId()]) == owner(),
            PatentNotDelegated()
        );
        require(!isStopped[key.toId()], CampaignStopped());
        return this.beforeInitialize.selector;
    }

    /// @dev Seeds liquidity automatically after pool initialization.
    ///      License tokens must be on this hook (e.g. via deposit()) before poolManager.initialize is called.
    function _afterInitialize(
        address,
        PoolKey calldata key,
        uint160,
        int24
    ) internal override returns (bytes4) {
        PoolId id = key.toId();
        int24 lower = tickLower[id];
        int24 upper = tickUpper[id];

        uint256 amount0 = poolManager.balanceOf(
            address(this),
            key.currency0.toId()
        );
        require(amount0 > 0, InsufficientLicenseBalance());

        uint160 sqrtLower = TickMath.getSqrtPriceAtTick(lower);
        uint160 sqrtUpper = TickMath.getSqrtPriceAtTick(upper);
        uint128 liquidity = LiquidityAmounts.getLiquidityForAmount0(
            sqrtLower,
            sqrtUpper,
            amount0
        );

        poolManager.unlock(
            abi.encode(
                ModifyLiquidityCallbackData({
                    callbackType: CALLBACK_MODIFY_LIQUIDITY,
                    key: key,
                    lower: lower,
                    upper: upper,
                    liquidity: liquidity
                })
            )
        );

        emit LiquiditySeeded(id, amount0, liquidity);

        return this.afterInitialize.selector;
    }

    function _beforeSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata,
        bytes calldata
    ) internal view override returns (bytes4, BeforeSwapDelta, uint24) {
        require(patentIds[key.toId()] != 0, CampaignNotInitialized());
        require(
            patentErc721.ownerOf(patentIds[key.toId()]) == owner(),
            PatentNotDelegated()
        );
        require(!isStopped[key.toId()], CampaignStopped());
        return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function _beforeAddLiquidity(
        address,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) internal pure override returns (bytes4) {
        revert ModifyingLiquidityNotAllowed();
    }

    function _beforeRemoveLiquidity(
        address,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) internal pure override returns (bytes4) {
        revert ModifyingLiquidityNotAllowed();
    }

    function _beforeDonate(
        address,
        PoolKey calldata,
        uint256,
        uint256,
        bytes calldata
    ) internal pure override returns (bytes4) {
        revert DonatingNotAllowed();
    }

    function getHookPermissions()
        public
        pure
        override
        returns (Hooks.Permissions memory permissions)
    {
        return
            Hooks.Permissions({
                beforeInitialize: true,
                afterInitialize: true,
                beforeAddLiquidity: true,
                beforeRemoveLiquidity: true,
                afterAddLiquidity: false,
                afterRemoveLiquidity: false,
                beforeSwap: true,
                afterSwap: false,
                beforeDonate: true,
                afterDonate: false,
                beforeSwapReturnDelta: false,
                afterSwapReturnDelta: false,
                afterAddLiquidityReturnDelta: false,
                afterRemoveLiquidityReturnDelta: false
            });
    }
}

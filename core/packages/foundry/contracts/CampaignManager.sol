// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPoolManager} from "@v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "@v4-core/types/PoolKey.sol";
import {Currency} from "@v4-core/types/Currency.sol";
import {StateLibrary} from "@v4-core/libraries/StateLibrary.sol";
import {IHooks} from "@v4-core/interfaces/IHooks.sol";
import {LicenseERC20} from "./LicenseERC20.sol";
import {TickMath} from "@v4-core/libraries/TickMath.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {PoolId} from "@v4-core/types/PoolId.sol";
import {IAuthCaptureEscrow} from "./interfaces/IAuthCaptureEscrow.sol";
import {ILicenseHook} from "./interfaces/ILicenseHook.sol";

/// @title LicenseType
/// @notice Enum representing the type of license hook to use.
enum LicenseType {
    DYNAMIC,
    FIXED
}

/// @title CampaignManager
/// @notice Deploys campaigns with configuration; seeds pool.
contract CampaignManager is Ownable, IERC721Receiver {
    error InvalidAssetNumeraireOrder();
    error NumeraireNotAllowed();
    error PatentNotOwned();
    error InvalidOperator();
    error InvalidLicenseContract();
    error PatentNotStaked();
    error PatentAlreadyStaked();
    error NotStaker();
    error CampaignAlreadyInitialized();
    error InvalidReceiver();

    event CampaignInitialized(
        uint256 patentId,
        address license,
        address numeraire,
        PoolId poolId,
        LicenseType licenseType
    );

    event PatentStaked(uint256 patentId, address staker);
    event PatentRedeemed(uint256 patentId, address staker);

    event UserSafeCreated(address indexed user, address indexed safe);

    event PoolPriceSnapshot(
        address indexed license,
        address indexed numeraire,
        uint160 sqrtPriceX96,
        int24 tick,
        uint48 timestamp
    );

    int24 public constant TICK_SPACING = 30;
    uint48 public constant PRE_APPROVAL_EXPIRY = 1 days;
    uint48 public constant AUTHORIZATION_EXPIRY = 1 days;
    uint48 public constant REFUND_EXPIRY = 1 days;

    mapping(LicenseType licenseType => ILicenseHook licenseHook) public licenseHooks;

    IPoolManager public immutable poolManager;
    IERC721 public immutable patentErc721;
    IAuthCaptureEscrow public immutable authCaptureEscrow;

    address public immutable permit2TokenCollector;

    mapping(IERC20 numeraire => bool) public allowedNumeraires;
    mapping(uint256 patentId => address staker) public stakedPatents;
    mapping(LicenseERC20 license => IERC20 numeraire) public numeraires;

    constructor(
        address _owner,
        IPoolManager _manager,
        IERC721 _patentErc721,
        IERC20[] memory _allowedNumeraires,
        ILicenseHook _fixedPriceLicenseHook,
        ILicenseHook _dynamicPriceLicenseHook,
        IAuthCaptureEscrow _authCaptureEscrow,
        address _permit2TokenCollector
    ) Ownable(_owner) {
        patentErc721 = _patentErc721;
        poolManager = _manager;
        authCaptureEscrow = _authCaptureEscrow;
        permit2TokenCollector = _permit2TokenCollector;

        licenseHooks[LicenseType.FIXED] = _fixedPriceLicenseHook;
        licenseHooks[LicenseType.DYNAMIC] = _dynamicPriceLicenseHook;

        for (uint256 i = 0; i < _allowedNumeraires.length; i++) {
            allowedNumeraires[_allowedNumeraires[i]] = true;
        }
    }

    function initialize(
        uint256 patentId,
        string memory assetMetadataUri,
        bytes32 licenseSalt,
        IERC20 numeraire,
        LicenseType licenseType,
        uint256 totalTokensToSell,
        bytes calldata _params
    ) external {
        _validateGeneral(
            assetMetadataUri,
            patentId,
            licenseSalt,
            numeraire,
            licenseType
        );

        LicenseERC20 license = new LicenseERC20{salt: licenseSalt}(
            patentErc721,
            patentId,
            assetMetadataUri,
            licenseType
        );

        ILicenseHook licenseHook = licenseHooks[licenseType];

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(address(license)),
            currency1: Currency.wrap(address(numeraire)),
            hooks: IHooks(address(licenseHook)),
            fee: 0,
            tickSpacing: TICK_SPACING
        });

        license.mint(address(this), totalTokensToSell);
        license.approve(address(licenseHook), totalTokensToSell);
        licenseHook.deposit(Currency.wrap(address(license)), totalTokensToSell);

        bytes memory params;

        if (licenseType == LicenseType.FIXED) {
            (uint256 price) = abi.decode(_params, (uint256));
            params = abi.encode(poolKey.toId(), patentId, price);
        } else if (licenseType == LicenseType.DYNAMIC) {
            (int24 tickLower, int24 tickUpper) = abi.decode(_params, (int24, int24));
            params = abi.encode(poolKey.toId(), patentId, _alignTickSpacing(tickLower), _alignTickSpacing(tickUpper));
        }

        licenseHook.initializeCampaign(params);

        if (licenseType == LicenseType.FIXED) {
            poolManager.initialize(poolKey, TickMath.getSqrtPriceAtTick(0));
        } else {
            (int24 tickLower,) = abi.decode(_params, (int24, int24));
            // Initialize at tickLower: liquidity in [tickLower, tickUpper] is active and 100% in currency0 (license) at this tick
            poolManager.initialize(poolKey, TickMath.getSqrtPriceAtTick(_alignTickSpacing(tickLower)));
        }

        numeraires[license] = numeraire;

        emit CampaignInitialized(
            patentId,
            address(license),
            address(numeraire),
            poolKey.toId(),
            licenseType
        );
    }

    // called by any user who want to settle licensed action
    function authorize(
        IAuthCaptureEscrow.PaymentInfo memory paymentInfo,
        bytes calldata collectorData
    ) external {
        LicenseERC20 license = LicenseERC20(paymentInfo.token);
        uint256 patentId = license.patentId();

        require(patentId != 0, InvalidLicenseContract());

        require(paymentInfo.operator == address(this), InvalidOperator());

        authCaptureEscrow.authorize(
            paymentInfo,
            paymentInfo.maxAmount,
            permit2TokenCollector,
            collectorData
        );
    }

    // can be called only by patent owner
    function capture(
        IAuthCaptureEscrow.PaymentInfo memory paymentInfo,
        uint256 amount
    ) external {
        LicenseERC20 license = LicenseERC20(paymentInfo.token);
        uint256 patentId = license.patentId();

        require(patentId != 0, InvalidLicenseContract());

        // Verify caller owns the patent or is the owner of the contract
        require(
            stakedPatents[patentId] == msg.sender ||
            msg.sender == owner(),
            PatentNotOwned()
        );

        // Verify operator matches
        require(paymentInfo.operator == address(this), InvalidOperator());

        // Tokens are sent directly to the patent staker's Safe (paymentInfo.receiver).
        authCaptureEscrow.capture(paymentInfo, amount, 0, address(0));

        // Emit pool state so indexers can compute value in numeraire.
        IERC20 numeraire = numeraires[license];
        ILicenseHook licenseHook = licenseHooks[license.licenseType()];

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(address(license)),
            currency1: Currency.wrap(address(numeraire)),
            hooks: IHooks(address(licenseHook)),
            fee: 0,
            tickSpacing: TICK_SPACING
        });
        
        (uint160 sqrtPriceX96, int24 tick,,) = StateLibrary.getSlot0(poolManager, poolKey.toId());
        emit PoolPriceSnapshot(
            address(license),
            address(numeraire),
            sqrtPriceX96,
            tick,
            uint48(block.timestamp)
        );
    }
    
    function validateAssetOrder(
        IERC20 numeraire,
        bytes32 salt,
        string memory assetMetadataUri,
        uint256 patentId,
        LicenseType licenseType,
        IERC721 patentRegistry,
        address deployer
    ) public pure {
        // Compute the address of the contract to be deployed and verify it's compatible with uni v4
        bytes32 bytecodeHash = keccak256(
            abi.encodePacked(
                type(LicenseERC20).creationCode,
                abi.encode(
                    patentRegistry,
                    patentId,
                    assetMetadataUri,
                    licenseType
                )
            )
        );
        address asset = Create2.computeAddress(salt, bytecodeHash, deployer);
        // Check that the asset (license) address is lower than the numeraire address (uni v4 requirement: currency0 < currency1)
        require(asset < address(numeraire), InvalidAssetNumeraireOrder());
    }

    function _validateGeneral(
        string memory assetMetadataUri,
        uint256 patentId,
        bytes32 licenseSalt,
        IERC20 numeraire,
        LicenseType licenseType
    ) internal view {
        // Check that patent is staked
        require(stakedPatents[patentId] != address(0), PatentNotStaked());
        // Check that the patent is staked and the caller is the staker
        require(stakedPatents[patentId] == msg.sender, PatentNotOwned());
        // Verify that the patent is actually owned by this contract (staked)
        require(
            patentErc721.ownerOf(patentId) == address(this),
            PatentNotStaked()
        );
        validateAssetOrder(
            numeraire,
            licenseSalt,
            assetMetadataUri,
            patentId,
            licenseType,
            patentErc721,
            address(this)
        );
        // Check that the numeraire is allowed
        require(allowedNumeraires[numeraire], NumeraireNotAllowed());
    }


    /// @notice Rounds tick to the nearest valid tick that is a multiple of TICK_SPACING.
    /// @dev Handles Solidity's truncated-toward-zero modulo for negative ticks.
    /// @param tick The tick to align (e.g. from price or user input).
    /// @return The nearest tick that satisfies tick % TICK_SPACING == 0.
    function _alignTickSpacing(int24 tick) internal pure returns (int24) {
        int24 remainder = tick % TICK_SPACING;
        if (remainder == 0) {
            return tick;
        }
        if (tick > 0) {
            return remainder > TICK_SPACING / 2 ? tick + (TICK_SPACING - remainder) : tick - remainder;
        }
        // tick < 0: remainder is in (-TICK_SPACING, 0], round toward nearer multiple
        return remainder < -TICK_SPACING / 2 ? tick - remainder - TICK_SPACING : tick - remainder;
    }

    /// @notice Handles receipt of ERC721 tokens. This function is called when a patent NFT is transferred to this contract.
    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata
    ) external override returns (bytes4) {
        // Only accept tokens from the patent ERC721 contract
        require(msg.sender == address(patentErc721), "Invalid token contract");

        // Check that patent is not already staked
        require(stakedPatents[tokenId] == address(0), PatentAlreadyStaked());

        // Record the staker
        stakedPatents[tokenId] = from;

        emit PatentStaked(tokenId, from);

        return IERC721Receiver.onERC721Received.selector;
    }

    /// @notice Redeems (unstakes) a patent NFT. Only the original staker can redeem.
    /// @dev The hook will block operations if the patent owner is not the campaign manager.
    /// @param patentId The patent token ID to redeem
    function redeem(uint256 patentId) external {
        address staker = stakedPatents[patentId];
        require(staker != address(0), PatentNotStaked());
        require(staker == msg.sender, NotStaker());

        // Clear the staking record
        delete stakedPatents[patentId];

        // Transfer the patent back to the staker
        patentErc721.safeTransferFrom(address(this), staker, patentId);

        emit PatentRedeemed(patentId, staker);
    }
}

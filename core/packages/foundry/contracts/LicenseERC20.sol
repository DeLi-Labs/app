// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {LicenseType} from "./CampaignManager.sol";
import {Metadata} from "./CaseMetadata.sol";

/// @title LicenseERC20
/// @notice ERC20 representing a license token for a given patent. Minting is restricted to the patent owner.
contract LicenseERC20 is ERC20 {
    error OnlyPatentOwner();

    event MetadataUpdated(Metadata metadata);

    IERC721 public immutable patentErc721;
    uint256 public immutable patentId;

    LicenseType public immutable licenseType;
    string public licenceMetadataUri;
    Metadata public metadata;

    /// @notice Deploys the License ERC20 for a specific patent.
    /// @param _patentErc721 Patent ERC721 contract.
    /// @param _patentId Patent token ID this license is bound to.
    /// @param _licenceMetadataUri Metadata URI for the license token.
    constructor(
        IERC721 _patentErc721,
        uint256 _patentId,
        string memory _licenceMetadataUri,
        LicenseType _licenseType
    )
        ERC20(
            "LiquidIpProtocolLicense",
            string(
                abi.encodePacked(
                    "LIPL-",
                    Strings.toString(_patentId),
                    "-",
                    Strings.toString(uint24(uint160(address(this))))
                )
            )
        )
    {
        require(
            msg.sender == _patentErc721.ownerOf(_patentId),
            OnlyPatentOwner()
        );

        patentErc721 = _patentErc721;
        patentId = _patentId;
        licenceMetadataUri = _licenceMetadataUri;
        licenseType = _licenseType;
    }

    /// @notice Updates dynamic case metadata for this license.
    /// @dev Only callable by the current patent owner (CampaignManager when staked).
    function updateMetadata(Metadata memory _newMetadata) external {
        require(
            msg.sender == patentErc721.ownerOf(patentId),
            OnlyPatentOwner()
        );
        metadata = _newMetadata;
        emit MetadataUpdated(_newMetadata);
    }

    /// @notice Mints license tokens. Only callable by the current patent owner.
    /// @param to Recipient address.
    /// @param amount Amount of tokens to mint.
    function mint(address to, uint256 amount) external {
        require(
            msg.sender == patentErc721.ownerOf(patentId),
            OnlyPatentOwner()
        );
        _mint(to, amount);
    }
}

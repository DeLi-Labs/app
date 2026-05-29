// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title PatentERC721
/// @dev Current architecture of a protocol assumes that metadata is stored in EigenDA
contract IPERC721 is ERC721URIStorage, Ownable {
    error NotTheOwnerOfUnderlyingAsset(address underlyingAsset, uint256 underlyingAssetId, address requester);
    error AssetNotApproved(address underlyingAsset);

    uint256 public _nextTokenId;

    mapping(uint256 tokenId => address underlyingAsset) public underlyingAssets;
    mapping(uint256 tokenId => uint256 underlyingAssetId)
        public underlyingAssetIds;
    mapping(address underlyingAsset => bool) public isApprovedAsset;

    /// @notice Deploys the Patent ERC721.
    /// @param _owner Address that will own this contract.
    constructor(address _owner) ERC721("IP NFT", "IPNFT") Ownable(_owner) {
        _nextTokenId = 1;
    }

    /// @notice Mints a new patent NFT with the given static metadata URI.
    /// @dev Should accept and validate proof that msg.sender completed KYC and ownership of IP is verified. TODO: add proof validation
    /// @dev May accept params of underlying asset (in case if IP is derived from other protocol)
    /// @dev We validate if the underlying asset is owned by the msg.sender assuming that asset protocol is trusted.
    /// @dev In case there is no underlying asset, underlyingAsset and underlyingAssetId should be set to address(0) and 0 respectively.
    /// @param _uri Static metadata URI to set.
    /// @param _underlyingAsset The underlying asset contract.
    /// @param _underlyingAssetId The underlying asset token ID.
    /// @return tokenId The newly minted token ID.
    function mint(
        string memory _uri,
        IERC721 _underlyingAsset,
        uint256 _underlyingAssetId
    ) external returns (uint256) {
        address underlyingAssetAddress = address(_underlyingAsset);
        if (underlyingAssetAddress != address(0)) {
            if (_underlyingAsset.ownerOf(_underlyingAssetId) != msg.sender) {
                revert NotTheOwnerOfUnderlyingAsset(
                    underlyingAssetAddress,
                    _underlyingAssetId,
                    msg.sender
                );
            }
            if (!isApprovedAsset[underlyingAssetAddress]) {
                revert AssetNotApproved(underlyingAssetAddress);
            }
        }

        _mint(msg.sender, _nextTokenId);
        _setTokenURI(_nextTokenId, _uri);

        underlyingAssets[_nextTokenId] = underlyingAssetAddress;
        underlyingAssetIds[_nextTokenId] = _underlyingAssetId;

        _nextTokenId++;
        return _nextTokenId - 1;
    }

    /// @notice Adds an approved underlying asset to the contract.
    /// @dev DAO governed function
    /// @param _underlyingAsset The underlying asset contract to add.
    function addApprovedAsset(address _underlyingAsset) external {
        isApprovedAsset[_underlyingAsset] = true;
    }
}

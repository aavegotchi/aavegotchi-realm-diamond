// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";
import "../../libraries/LibDiamond.sol";
import "../../libraries/LibStrings.sol";
import "../../libraries/LibMeta.sol";
import "../../libraries/LibERC721.sol";
import {IERC721} from "../../interfaces/IERC721.sol";
import {ERC721Marketplace} from "../../interfaces/ERC721Marketplace.sol";

contract ERC721Facet is Modifiers {
  // bytes4 private constant ERC721_RECEIVED = 0x150b7a02;

  function tokenIdsOfOwner(address _owner) external view returns (uint256[] memory tokenIds_) {
    return s.ownerTokenIds[_owner];
  }

  function totalSupply() external view returns (uint256) {
    return s.tokenIds.length;
  }

  /// @notice Enumerate valid NFTs
  /// @dev Throws if `_index` >= `totalSupply()`.
  /// @param _index A counter less than `totalSupply()`
  /// @return tokenId_ The token identifier for the `_index`th NFT,
  ///  (sort order not specified)
  function tokenByIndex(uint256 _index) external view returns (uint256 tokenId_) {
    require(_index < s.tokenIds.length, "AavegotchiFacet: _index is greater than total supply.");
    tokenId_ = s.tokenIds[_index];
  }

  /// @notice Count all NFTs assigned to an owner
  /// @dev NFTs assigned to the zero address are considered invalid, and this.
  ///  function throws for queries about the zero address.
  /// @param _owner An address for whom to query the balance
  /// @return balance_ The number of NFTs owned by `_owner`, possibly zero
  function balanceOf(address _owner) external view returns (uint256 balance_) {
    balance_ = s.ownerTokenIds[_owner].length;
  }

  /// @notice Find the owner of an NFT
  /// @dev NFTs assigned to zero address are considered invalid, and queries
  ///  about them do throw.
  /// @param _tokenId The identifier for an NFT
  /// @return owner_ The address of the owner of the NFT
  function ownerOf(uint256 _tokenId) external view returns (address owner_) {
    owner_ = s.parcels[_tokenId].owner;
  }

  /// @notice Get the approved address for a single NFT
  /// @dev Throws if `_tokenId` is not a valid NFT.
  /// @param _tokenId The NFT to find the approved address for
  /// @return approved_ The approved address for this NFT, or the zero address if there is none
  function getApproved(uint256 _tokenId) external view returns (address approved_) {
    require(s.parcels[_tokenId].owner != address(0), "AavegotchiFacet: tokenId is invalid or is not owned");
    approved_ = s.approved[_tokenId];
  }

  /// @notice Query if an address is an authorized operator for another address
  /// @param _owner The address that owns the NFTs
  /// @param _operator The address that acts on behalf of the owner
  /// @return approved_ True if `_operator` is an approved operator for `_owner`, false otherwise
  function isApprovedForAll(address _owner, address _operator) external view returns (bool approved_) {
    approved_ = s.operators[_owner][_operator];
  }

  /// @notice Transfers the ownership of an NFT from one address to another address
  /// @dev Throws unless `msg.sender` is the current owner, an authorized
  ///  operator, or the approved address for this NFT. Throws if `_from` is
  ///  not the current owner. Throws if `_to` is the zero address. Throws if
  ///  `_tokenId` is not a valid NFT. When transfer is complete, this function
  ///  checks if `_to` is a smart contract (code size > 0). If so, it calls
  ///  `onERC721Received` on `_to` and throws if the return value is not
  ///  `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`.
  /// @param _from The current owner of the NFT
  /// @param _to The new owner
  /// @param _tokenId The NFT to transfer
  /// @param _data Additional data with no specified format, sent in call to `_to`
  function safeTransferFrom(
    address _from,
    address _to,
    uint256 _tokenId,
    bytes calldata _data
  ) public {
    address sender = LibMeta.msgSender();
    LibERC721.transferFrom(sender, _from, _to, _tokenId);
    LibERC721.checkOnERC721Received(sender, _from, _to, _tokenId, _data);

    //Update baazaar listing

    if (s.aavegotchiDiamond != address(0)) {
      ERC721Marketplace(s.aavegotchiDiamond).updateERC721Listing(address(this), _tokenId, _from);
    }
  }

  /// @notice Transfers the ownership of an NFT from one address to another address
  /// @dev This works identically to the other function with an extra data parameter,
  ///  except this function just sets data to "".
  /// @param _from The current owner of the NFT
  /// @param _to The new owner
  /// @param _tokenId The NFT to transfer
  function safeTransferFrom(
    address _from,
    address _to,
    uint256 _tokenId
  ) external {
    address sender = LibMeta.msgSender();
    LibERC721.transferFrom(sender, _from, _to, _tokenId);
    LibERC721.checkOnERC721Received(sender, _from, _to, _tokenId, "");

    //Update baazaar listing
    if (s.aavegotchiDiamond != address(0)) {
      ERC721Marketplace(s.aavegotchiDiamond).updateERC721Listing(address(this), _tokenId, _from);
    }
  }

  /// @notice Transfer ownership of an NFT -- THE CALLER IS RESPONSIBLE
  ///  TO CONFIRM THAT `_to` IS CAPABLE OF RECEIVING NFTS OR ELSE
  ///  THEY MAY BE PERMANENTLY LOST
  /// @dev Throws unless `msg.sender` is the current owner, an authorized
  ///  operator, or the approved address for this NFT. Throws if `_from` is
  ///  not the current owner. Throws if `_to` is the zero address. Throws if
  ///  `_tokenId` is not a valid NFT.
  /// @param _from The current owner of the NFT
  /// @param _to The new owner
  /// @param _tokenId The NFT to transfer
  function transferFrom(
    address _from,
    address _to,
    uint256 _tokenId
  ) external {
    address sender = LibMeta.msgSender();
    LibERC721.transferFrom(sender, _from, _to, _tokenId);

    if (s.aavegotchiDiamond != address(0)) {
      ERC721Marketplace(s.aavegotchiDiamond).updateERC721Listing(address(this), _tokenId, _from);
    }
  }

  /// @notice Change or reaffirm the approved address for an NFT
  /// @dev The zero address indicates there is no approved address.
  ///  Throws unless `msg.sender` is the current NFT owner, or an authorized
  ///  operator of the current owner.
  /// @param _approved The new approved NFT controller
  /// @param _tokenId The NFT to approve
  function approve(address _approved, uint256 _tokenId) external {
    address owner = s.parcels[_tokenId].owner;
    address sender = LibMeta.msgSender();
    require(owner == sender || s.operators[owner][sender], "ERC721: Not owner or operator of token.");
    s.approved[_tokenId] = _approved;
    emit LibERC721.Approval(owner, _approved, _tokenId);
  }

  /// @notice Enable or disable approval for a third party ("operator") to manage
  ///  all of `msg.sender`'s assets
  /// @dev Emits the ApprovalForAll event. The contract MUST allow
  ///  multiple operators per owner.
  /// @param _operator Address to add to the set of authorized operators
  /// @param _approved True if the operator is approved, false to revoke approval
  function setApprovalForAll(address _operator, bool _approved) external {
    address sender = LibMeta.msgSender();
    s.operators[sender][_operator] = _approved;
    emit LibERC721.ApprovalForAll(sender, _operator, _approved);
  }

  function name() external pure returns (string memory) {
    return "Gotchiverse REALM Parcel";
  }

  /// @notice An abbreviated name for NFTs in this contract
  function symbol() external pure returns (string memory) {
    return "REALM";
  }

  /// @notice A distinct Uniform Resource Identifier (URI) for a given asset.
  /// @dev Throws if `_tokenId` is not a valid NFT. URIs are defined in RFC
  ///  3986. The URI may point to a JSON file that conforms to the "ERC721
  ///  Metadata JSON Schema".
  function tokenURI(uint256 _tokenId) external pure returns (string memory) {
    return LibStrings.strWithUint("https://app.aavegotchi.com/metadata/realm/", _tokenId); //Here is your URL!
  }

  function setIndex(uint256 _tokenId) external onlyOwner {
    address owner = this.ownerOf(_tokenId);
    s.ownerTokenIdIndexes[owner][_tokenId] -= 1;
  }

  struct MintParcelInput {
    uint256 coordinateX;
    uint256 coordinateY;
    uint256 parcelId;
    uint256 size; //0=humble, 1=reasonable, 2=spacious vertical, 3=spacious horizontal, 4=partner
    uint256 fomoBoost;
    uint256 fudBoost;
    uint256 kekBoost;
    uint256 alphaBoost;
  }

  function safeBatchTransfer(
    address _from,
    address _to,
    uint256[] calldata _tokenIds,
    bytes calldata _data
  ) external {
    for (uint256 index = 0; index < _tokenIds.length; index++) {
      safeTransferFrom(_from, _to, _tokenIds[index], _data);
    }
  }
}

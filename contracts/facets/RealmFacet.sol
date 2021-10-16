// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../libraries/AppStorage.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibStrings.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibERC721.sol";
import {InstallationDiamond} from "../interfaces/InstallationDiamond.sol";

contract RealmVoucherFacet is Modifiers {
  bytes4 private constant ERC721_RECEIVED = 0x150b7a02;

  function tokenIdsOfOwner(address _owner) external view returns (uint256[] memory tokenIds_) {
    return LibERC721._tokenIdsOfOwner(_owner);
  }

  function totalSupply() external view returns (uint256 totalSupply_) {
    totalSupply_ = s.tokenIds.length;
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
    balance_ = s.parcelBalance[_owner];
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
    LibERC721._transferFrom(sender, _from, _to, _tokenId);
    LibERC721.checkOnERC721Received(sender, _from, _to, _tokenId, _data);
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
    LibERC721._transferFrom(sender, _from, _to, _tokenId);
    LibERC721.checkOnERC721Received(sender, _from, _to, _tokenId, "");
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
    LibERC721._transferFrom(sender, _from, _to, _tokenId);
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
    return "Gotchiverse";
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
    return LibStrings.strWithUint("https://aavegotchi.com/metadata/realm/", _tokenId); //Here is your URL!
  }

  struct MintParcelInput {
    uint32 coordinateX;
    uint32 coordinateY;
    uint256 parcelId;
    uint256 size; //0=humble, 1=reasonable, 2=spacious vertical, 3=spacious horizontal, 4=partner
    uint256 fomoBoost;
    uint256 fudBoost;
    uint256 kekBoost;
    uint256 alphaBoost;
  }

  function mintParcels(
    address _to,
    uint256[] calldata _tokenIds,
    MintParcelInput[] memory _metadata
  ) external onlyOwner {
    for (uint256 index = 0; index < _tokenIds.length; index++) {
      uint256 tokenId = _tokenIds[index];
      MintParcelInput memory metadata = _metadata[index];
      require(_tokenIds.length == _metadata.length, "Inputs must be same length");

      Parcel storage parcel = s.tokenIdToParcel[tokenId];
      parcel.owner = _to;
      parcel.coordinateX = metadata.coordinateX;
      parcel.coordinateY = metadata.coordinateY;
      parcel.parcelId = metadata.parcelId;
      parcel.size = metadata.size;

      parcel.alchemicaBoost[0] = metadata.fudBoost;
      parcel.alchemicaBoost[1] = metadata.fomoBoost;
      parcel.alchemicaBoost[2] = metadata.alphaBoost;
      parcel.alchemicaBoost[3] = metadata.kekBoost;

      LibERC721._safeMint(msg.sender, _tokenIds[index]);
    }
  }

  function safeBatchTransfer(
    uint256[] calldata _tokenIds,
    address _to,
    bytes calldata _data
  ) external {
    for (uint256 index = 0; index < _tokenIds.length; index++) {
      safeTransferFrom(msg.sender, _to, _tokenIds[index], _data);
    }
  }

  /*
  function getParcelInfo(uint256 _tokenId) external view returns (Parcel memory) {
    return s.tokenIdToParcel[_tokenId];
  }
  */

  function claimableAlchemica(uint256 _tokenId, uint16 _type) public view returns (uint256) {
    // revert("Function not implemented");

    Parcel storage parcel = s.parcels[_tokenId];
    uint256 harvestRate = parcel.alchemicaHarvestRate[_type];
    uint256 remaining = parcel.alchemicaRemaining[_type];
    uint256 timeSinceLastClaim = parcel.timeSinceLastClaim[_type];
    uint256 capacity = parcel.alchemicaCapacity[_type];
    uint256 unclaimed = parcel.unclaimedAlchemica[_type];

    uint256 claimable = (harvestRate * timeSinceLastClaim) + unclaimed;

    if (claimable > capacity) claimable = capacity;
    if (claimable > remaining) claimable = remaining;
    return claimable;

    //How much alchemica can be claimed at the current moment
    //Formula:
    //const claimable = (currentHarvestRate * timeSinceLastClaim) + unclaimedAlchemica
    //If claimable > alchemicaCapacity, return alchemicaCapacity
    //If alchemicaCapacity > alchemicaRemaining, return alchemicaRemaining
  }

  function claimAlchemica(
    uint256 _tokenId,
    uint16 _type,
    uint256 _amount
  ) external {
    //Claims alchemica from parcel
    //Alchemica must be harvested and deposited into reservoir

    uint256 claimable = claimableAlchemica(_tokenId, _type);

    //Mint these tokens
    //Send some directly to player based on Parcel reservoir level
    //The remaining get transferred to the Great Portal and spilled around the map
  }

  function placeInstallations(
    uint256 _tokenId,
    uint256[] calldata _itemIds,
    uint256[] calldata _x,
    uint256[] calldata _y
  ) external onlyParcelOwner(_tokenId) {
    require(_itemIds.length <= 5, "RealmFacet: Cannot attach more than 5 installations in one txn");
    for (uint256 i = 0; i < _itemIds.length; i++) {
      _placeInstallation(_tokenId, _itemIds[i], _x[i], _y[i]);
    }
  }

  function removeInstallations(
    uint256 _tokenId,
    uint256[] calldata _itemIds,
    uint256[] calldata _x,
    uint256[] calldata _y
  ) external onlyParcelOwner(_tokenId) {
    //Removes installations from parcel
    //Burns installation nft
    //Refunds user % of alchemica spent
  }

  //Place installation cannot remove, only add and re-arrange
  function _placeInstallation(
    uint256 _tokenId,
    uint256 _itemId,
    uint256 _x,
    uint256 _y
  ) internal {
    uint8[5] memory widths = [
      8, //humble
      16, //reasonable
      32, //spacious vertical
      64, //spacious horizontal
      64 //partner
    ];

    uint8[5] memory heights = [
      8, //humble
      16, //reasonable
      64, //spacious vertical
      32, //spacious horizontal
      64 //partner
    ];

    //temporary
    uint32 width = 8;
    uint32 height = 8;

    // Installation memory installation = s.installationTypes[_itemId];
    InstallationDiamond installationContract = InstallationDiamond(s.installationContract);
    InstallationDiamond.Installation memory installation = installationContract.getInstallationType(_itemId);

    uint16 alchemicaType = installation.alchemicaType;

    if (installation.installationType == 0) {
      //todo: If the installation is a harvester: Increase / Decrease the parcel's harvest rate
    } else if (installation.installationType == 1) {
      //todo: If the installation is a reservoir: Increase / Decrease the parcel's reservoir capacity
    }

    Parcel storage parcel = s.parcels[_tokenId];

    //Check if these slots are available onchain
    for (uint256 index = _x; index < _x + width; index++) {
      require(_x <= widths[parcel.size]);

      for (uint256 i = _y; i < _y + height; i++) {
        require(parcel.buildGrid[_x][_y] == 0, "RealmFacet: Invalid spot!");
        require(_y <= heights[parcel.size]);

        //Update onchain
        parcel.buildGrid[_x][_y] = _itemId;
      }
    }
  }
}

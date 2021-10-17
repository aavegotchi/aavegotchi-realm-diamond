// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../libraries/AppStorage.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibStrings.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibERC721.sol";
import {InstallationDiamond} from "../interfaces/InstallationDiamond.sol";

contract RealmVoucherFacet is Modifiers {
  // bytes4 private constant ERC721_RECEIVED = 0x150b7a02;

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

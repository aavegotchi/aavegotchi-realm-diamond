// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../libraries/AppStorage.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibStrings.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibERC721.sol";
import {InstallationDiamond} from "../interfaces/InstallationDiamond.sol";

contract RealmFacet is Modifiers {
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
    uint32[] calldata _tokenIds,
    MintParcelInput[] memory _metadata
  ) external onlyOwner {
    for (uint256 index = 0; index < _tokenIds.length; index++) {
      uint32 tokenId = _tokenIds[index];
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

      LibERC721._safeMint(_to, tokenId);
    }
  }

  /*
  function getParcelInfo(uint256 _tokenId) external view returns (Parcel memory) {
    return s.tokenIdToParcel[_tokenId];
  }
  */
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {InstallationDiamond} from "../interfaces/InstallationDiamond.sol";
import {LibAppStorage, AppStorage, Parcel} from "./AppStorage.sol";

library LibRealm {
  event SurveyParcel(uint256 _tokenId, uint256[] _alchemicas);

  //Place installation
  function placeInstallation(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();
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

    InstallationDiamond installationsDiamond = InstallationDiamond(s.installationsDiamond);
    InstallationDiamond.InstallationType memory installation = installationsDiamond.getInstallationType(_installationId);

    Parcel storage parcel = s.parcels[_realmId];

    //Check if these slots are available onchain
    require(_x <= widths[parcel.size] - installation.width - 1, "LibRealm: x exceeding width");
    require(_y <= heights[parcel.size] - installation.height - 1, "LibRealm: y exceeding height");
    for (uint256 indexW = _x; indexW < _x + installation.width; indexW++) {
      for (uint256 indexH = _y; indexH < _y + installation.height; indexH++) {
        require(parcel.buildGrid[indexW][indexH] == 0, "LibRealm: Invalid spot");
        parcel.buildGrid[indexW][indexH] = _installationId;
      }
    }
  }

  function removeInstallation(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();
    InstallationDiamond installationsDiamond = InstallationDiamond(s.installationsDiamond);
    InstallationDiamond.InstallationType memory installation = installationsDiamond.getInstallationType(_installationId);
    Parcel storage parcel = s.parcels[_realmId];
    require(parcel.buildGrid[_x][_y] == _installationId, "LibRealm: wrong installationId");
    for (uint256 indexW = _x; indexW < _x + installation.width; indexW++) {
      for (uint256 indexH = _y; indexH < _y + installation.height; indexH++) {
        parcel.buildGrid[indexW][indexH] = 0;
      }
    }
  }

  function calculateAmount(
    uint256 _tokenId,
    uint256[] memory randomWords,
    uint256 i
  ) internal view returns (uint256) {
    AppStorage storage s = LibAppStorage.diamondStorage();
    return (randomWords[i] % s.totalAlchemicas[s.parcels[_tokenId].size][i]) / 4; //25% of initial supply
  }

  function updateRemainingAlchemicaFirstRound(uint256 _tokenId, uint256[] memory randomWords) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();
    uint256[] memory alchemicas = new uint256[](4);
    for (uint8 i; i < 4; i++) {
      uint256 amount = calculateAmount(_tokenId, randomWords, i);
      uint256 boost = s.parcels[_tokenId].alchemicaBoost[i]; //@todo: calculate final boost amount

      s.parcels[_tokenId].alchemicaRemaining[i] = amount + boost;
      alchemicas[i] = amount + boost;
    }
    emit SurveyParcel(_tokenId, alchemicas);
  }

  // TODO test formula
  function updateRemainingAlchemica(uint256 _tokenId, uint256[] memory randomWords) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();
    uint256[] memory alchemicas = new uint256[](4);
    for (uint8 i; i < 4; i++) {
      uint256 amount = calculateAmount(_tokenId, randomWords, i) * 3; //75%;
      uint256 roundAmount = amount / 9; //75% / 9 = 8.3%
      uint256 boost = s.parcels[_tokenId].alchemicaBoost[i]; //@todo: calculate final boost amount

      s.parcels[_tokenId].alchemicaRemaining[i] += roundAmount + boost;
      alchemicas[i] = roundAmount + boost;
    }
    emit SurveyParcel(_tokenId, alchemicas);
  }
}

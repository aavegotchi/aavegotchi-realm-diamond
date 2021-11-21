// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {InstallationDiamond} from "../interfaces/InstallationDiamond.sol";
import {LibAppStorage, AppStorage, Parcel} from "./AppStorage.sol";

library LibRealm {
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

    InstallationDiamond installationContract = InstallationDiamond(s.installationContract);
    InstallationDiamond.InstallationType memory installation = installationContract.getInstallationType(_installationId);

    uint16 alchemicaType = installation.alchemicaType;
    Parcel storage parcel = s.parcels[_realmId];

    if (installation.installationType == 0) {
      parcel.alchemicaHarvestRate[alchemicaType] += installation.harvestRate;
    } else if (installation.installationType == 1) {
      parcel.alchemicaCapacity[alchemicaType] += installation.capacity;
    }

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
    Parcel storage parcel = s.parcels[_realmId];
    require(parcel.buildGrid[_x][_y] == _installationId, "LibRealm: wrong installationId");
    //todo update grid
  }
}

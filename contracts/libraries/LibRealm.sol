// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {InstallationDiamondInterface} from "../interfaces/InstallationDiamondInterface.sol";
import {TileDiamondInterface} from "../interfaces/TileDiamond.sol";
import "./AppStorage.sol";
import "./BinomialRandomizer.sol";

library LibRealm {
  event SurveyParcel(uint256 _tokenId, uint256 _round, uint256[] _alchemicas);

  uint256 constant MAX_SUPPLY = 420069;

  //Place installation
  function placeInstallation(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();
    uint256[5] memory widths = getWidths();

    uint256[5] memory heights = getHeights();

    InstallationDiamondInterface installationsDiamond = InstallationDiamondInterface(s.installationsDiamond);
    InstallationDiamondInterface.InstallationType memory installation = installationsDiamond.getInstallationType(_installationId);

    Parcel storage parcel = s.parcels[_realmId];

    //Check if these slots are available onchain
    require(_x <= widths[parcel.size] - installation.width, "LibRealm: x exceeding width");
    require(_y <= heights[parcel.size] - installation.height, "LibRealm: y exceeding height");

    // Track the start position of the build grid
    parcel.startPositionBuildGrid[_x][_y] = _installationId;

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
    InstallationDiamondInterface installationsDiamond = InstallationDiamondInterface(s.installationsDiamond);
    InstallationDiamondInterface.InstallationType memory installation = installationsDiamond.getInstallationType(_installationId);
    Parcel storage parcel = s.parcels[_realmId];
    require(parcel.buildGrid[_x][_y] == _installationId, "LibRealm: wrong installationId");
    require(parcel.startPositionBuildGrid[_x][_y] == _installationId, "LibRealm: wrong startPosition");
    for (uint256 indexW = _x; indexW < _x + installation.width; indexW++) {
      for (uint256 indexH = _y; indexH < _y + installation.height; indexH++) {
        parcel.buildGrid[indexW][indexH] = 0;
      }
    }
    parcel.startPositionBuildGrid[_x][_y] = 0;
  }

  function placeTile(
    uint256 _realmId,
    uint256 _tileId,
    uint256 _x,
    uint256 _y
  ) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();
    uint256[5] memory widths = getWidths();

    uint256[5] memory heights = getHeights();

    TileDiamondInterface tilesDiamond = TileDiamondInterface(s.tileDiamond);
    TileDiamondInterface.TileType memory tile = tilesDiamond.getTileType(_tileId);

    Parcel storage parcel = s.parcels[_realmId];

    //Check if these slots are available onchain
    require(_x <= widths[parcel.size] - tile.width, "LibRealm: x exceeding width");
    require(_y <= heights[parcel.size] - tile.height, "LibRealm: y exceeding height");

    parcel.startPositionTileGrid[_x][_y] = _tileId;

    for (uint256 indexW = _x; indexW < _x + tile.width; indexW++) {
      for (uint256 indexH = _y; indexH < _y + tile.height; indexH++) {
        require(parcel.tileGrid[indexW][indexH] == 0, "LibRealm: Invalid spot");
        parcel.tileGrid[indexW][indexH] = _tileId;
      }
    }
  }

  function removeTile(
    uint256 _realmId,
    uint256 _tileId,
    uint256 _x,
    uint256 _y
  ) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();
    TileDiamondInterface tilesDiamond = TileDiamondInterface(s.tileDiamond);
    TileDiamondInterface.TileType memory tile = tilesDiamond.getTileType(_tileId);
    Parcel storage parcel = s.parcels[_realmId];

    require(parcel.tileGrid[_x][_y] == _tileId, "LibRealm: wrong tileId");
    require(parcel.startPositionTileGrid[_x][_y] == _tileId, "LibRealm: wrong startPosition");

    for (uint256 indexW = _x; indexW < _x + tile.width; indexW++) {
      for (uint256 indexH = _y; indexH < _y + tile.height; indexH++) {
        parcel.tileGrid[indexW][indexH] = 0;
      }
    }
    parcel.startPositionTileGrid[_x][_y] = 0;
  }

  function calculateAmount(
    uint256 _tokenId,
    uint256[] memory randomWords,
    uint256 i
  ) internal view returns (uint256) {
    AppStorage storage s = LibAppStorage.diamondStorage();
    return BinomialRandomizer.calculateAlchemicaSurveyAmount(randomWords[i], s.totalAlchemicas[s.parcels[_tokenId].size][i]);
  }

  function updateRemainingAlchemica(
    uint256 _tokenId,
    uint256[] memory randomWords,
    uint256 _round
  ) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();

    s.parcels[_tokenId].currentRound++;
    s.parcels[_tokenId].surveying = false;

    uint256[] memory alchemicas = new uint256[](4);
    uint256[] memory roundAmounts = new uint256[](4);
    for (uint256 i; i < 4; i++) {
      uint256 baseAmount = calculateAmount(_tokenId, randomWords, i); //100%;

      //first round is 25%, rounds after are 8.3%
      uint256 roundAmount = _round == 0 ? baseAmount / 4 : (baseAmount - (baseAmount / 4)) / 9;
      uint256 boost = s.parcels[_tokenId].alchemicaBoost[i] * s.boostMultipliers[i];

      s.parcels[_tokenId].alchemicaRemaining[i] += roundAmount + boost;
      roundAmounts[i] = roundAmount;
      alchemicas[i] = roundAmount + boost;
    }
    //update round alchemica
    s.parcels[_tokenId].roundAlchemica[_round] = alchemicas;
    s.parcels[_tokenId].roundBaseAlchemica[_round] = roundAmounts;
    emit SurveyParcel(_tokenId, _round, alchemicas);
  }

  function getWidths() internal pure returns (uint256[5] memory) {
    uint256[5] memory widths = [
      HUMBLE_WIDTH, //humble
      REASONABLE_WIDTH, //reasonable
      SPACIOUS_WIDTH, //spacious vertical
      SPACIOUS_HEIGHT, //spacious horizontal
      PAARTNER_WIDTH //partner
    ];
    return widths;
  }

  function getHeights() internal pure returns (uint256[5] memory) {
    uint256[5] memory heights = [
      HUMBLE_HEIGHT, //humble
      REASONABLE_HEIGHT, //reasonable
      SPACIOUS_HEIGHT, //spacious vertical
      SPACIOUS_WIDTH, //spacious horizontal
      PAARTNER_HEIGHT //partner
    ];
    return heights;
  }

  function isAccessRightValid(uint256 actionRight, uint256 accessRight) internal pure returns (bool) {
    // 0: Channeling
    // 1: Empty Reservoir
    // 2: Equip Installations
    // 3: Equip Tiles
    // 4: Unequip Installations
    // 5: Unequip Tiles
    // 6: Upgrade Installations
    if (actionRight <= 6) {
      // 0: Only Owner
      // 1: Owner + Lent Out
      // 2: Whitelisted Only
      // 3: Allow blacklisted
      // 4: Anyone
      return accessRight <= 4;
    }
    return false;
  }

  function verifyAccessRight(
    uint256 _realmId,
    uint256 _gotchiId,
    uint256 _actionRight,
    address _sender
  ) internal view {
    AppStorage storage s = LibAppStorage.diamondStorage();
    AavegotchiDiamond diamond = AavegotchiDiamond(s.aavegotchiDiamond);

    uint256 accessRight = s.accessRights[_realmId][_actionRight];
    address parcelOwner = s.parcels[_realmId].owner;

    //Only owner
    if (accessRight == 0) {
      require(_sender == parcelOwner, "LibRealm: Access Right - Only Owner");
    }
    //Owner or borrowed gotchi
    else if (accessRight == 1) {
      if (diamond.isAavegotchiLent(uint32(_gotchiId))) {
        AavegotchiDiamond.GotchiLending memory listing = diamond.getGotchiLendingFromToken(uint32(_gotchiId));
        require(
          _sender == parcelOwner || (_sender == listing.borrower && listing.lender == parcelOwner),
          "LibRealm: Access Right - Only Owner/Borrower"
        );
      } else {
        require(_sender == parcelOwner, "LibRealm: Access Right - Only Owner");
      }
    }
    //whitelisted addresses
    else if (accessRight == 2) {
      require(diamond.isWhitelisted(s.whitelistIds[_realmId][_actionRight], _sender) > 0, "LibRealm: Access Right - Only Whitelisted");
    }
    // //blacklisted addresses
    // else if (accessRight == 3) {}
    //anyone
    else if (accessRight == 4) {
      //do nothing! anyone can perform this action
    }
  }

  function installationInUpgradeQueue(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) internal view returns (bool) {
    AppStorage storage s = LibAppStorage.diamondStorage();

    InstallationDiamondInterface installationsDiamond = InstallationDiamondInterface(s.installationsDiamond);

    (InstallationDiamondInterface.UpgradeQueue[] memory parcelUpgrades, ) = installationsDiamond.getParcelUpgradeQueue(_realmId);
    for (uint256 i; i < parcelUpgrades.length; i++) {
      // Checking whether x and y match is sufficient when start positions are checked in a separate check
      if (
        parcelUpgrades[i].installationId == _installationId &&
        parcelUpgrades[i].coordinateX == uint16(_x) &&
        parcelUpgrades[i].coordinateY == uint16(_y)
      ) {
        return true;
      }
    }
    return false;
  }
}

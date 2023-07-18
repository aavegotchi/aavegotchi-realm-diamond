// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";
import "hardhat/console.sol";

contract MigrationFacet is Modifiers {
  struct ParcelData {
    address owner;
    string parcelAddress;
    string parcelId;
    uint256 coordinateX;
    uint256 coordinateY;
    uint256 district;
    uint256 size;
    uint256[4] alchemicaBoost;
    uint256[4] alchemicaRemaining;
    uint256 currentRound;
    uint256[4] alchemicaHarvestRate;
    uint256[4] lastUpdateTimestamp;
    uint256[4] unclaimedAlchemica;
    uint256 altarId;
    uint256 upgradeQueueCapacity;
    uint256 upgradeQueueLength;
    uint256 lodgeId;
    bool surveying;
    uint16 harvesterCount;
    uint[] buildGrid;
    uint[] tileGrid;
    uint[] startPositionBuildGrid;
    uint[] startPositionTileGrid;
    uint[][] roundBaseAlchemica;
    uint[][] roundAlchemica;
    uint[][] reservoirs;
  }

  function getParcelData(uint _parcelId) external view returns (ParcelData memory output_) {
    output_.owner = s.parcels[_parcelId].owner;
    output_.parcelAddress = s.parcels[_parcelId].parcelAddress;
    output_.parcelId = s.parcels[_parcelId].parcelId;
    output_.coordinateX = s.parcels[_parcelId].coordinateX;
    output_.coordinateY = s.parcels[_parcelId].coordinateY;
    output_.district = s.parcels[_parcelId].district;
    output_.size = s.parcels[_parcelId].size;
    output_.alchemicaBoost = s.parcels[_parcelId].alchemicaBoost;
    output_.alchemicaRemaining = s.parcels[_parcelId].alchemicaRemaining;
    output_.currentRound = s.parcels[_parcelId].currentRound;
    output_.alchemicaHarvestRate = s.parcels[_parcelId].alchemicaHarvestRate;
    output_.lastUpdateTimestamp = s.parcels[_parcelId].lastUpdateTimestamp;
    output_.unclaimedAlchemica = s.parcels[_parcelId].unclaimedAlchemica;
    output_.altarId = s.parcels[_parcelId].altarId;
    output_.upgradeQueueCapacity = s.parcels[_parcelId].upgradeQueueCapacity;
    output_.upgradeQueueLength = s.parcels[_parcelId].upgradeQueueLength;
    output_.lodgeId = s.parcels[_parcelId].lodgeId;
    output_.surveying = s.parcels[_parcelId].surveying;
    output_.harvesterCount = s.parcels[_parcelId].harvesterCount;
  }

  function getGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[16][16] memory output_) {
    Parcel storage parcel = s.parcels[_parcelId];
    uint256[5] memory widths = getWidths();
    uint256[5] memory heights = getHeights();
    uint widthLength = widths[parcel.size];
    uint heightLength = heights[parcel.size];

    console.log("size", parcel.size);
    console.log("widthLength", widthLength);
    console.log("heightLength", heightLength);

    // uint256[widths][heights] memory output;

    for (uint256 i; i < widthLength; i++) {
      for (uint256 j; j < heightLength; j++) {
        if (_gridType == 0) {
          output_[i][j] = parcel.buildGrid[i][j];
        } else if (_gridType == 1) {
          output_[i][j] = parcel.tileGrid[i][j];
        }
      }
    }
  }

  function getStartPositionGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[][] memory output_) {
    Parcel storage parcel = s.parcels[_parcelId];
    uint256[5] memory widths = getWidths();
    uint256[5] memory heights = getHeights();
    uint widthLength = widths[parcel.size];
    uint heightLength = heights[parcel.size];

    for (uint256 i; i < widthLength; i++) {
      for (uint256 j; j < heightLength; j++) {
        if (_gridType == 0) {
          output_[i][j] = parcel.startPositionBuildGrid[i][j];
        } else if (_gridType == 1) {
          output_[i][j] = parcel.startPositionTileGrid[i][j];
        }
      }
    }
  }

  function migrateParcel(uint _parcelId, ParcelData calldata parcelData) external {
    s.parcels[_parcelId].owner = parcelData.owner;
    s.parcels[_parcelId].parcelAddress = parcelData.parcelAddress;
    s.parcels[_parcelId].parcelId = parcelData.parcelId;
    s.parcels[_parcelId].coordinateX = parcelData.coordinateX;
    s.parcels[_parcelId].coordinateY = parcelData.coordinateY;
    s.parcels[_parcelId].district = parcelData.district;
    s.parcels[_parcelId].size = parcelData.size;
    s.parcels[_parcelId].alchemicaBoost = parcelData.alchemicaBoost;
    s.parcels[_parcelId].alchemicaRemaining = parcelData.alchemicaRemaining;
    s.parcels[_parcelId].currentRound = parcelData.currentRound;
    s.parcels[_parcelId].alchemicaHarvestRate = parcelData.alchemicaHarvestRate;
    s.parcels[_parcelId].lastUpdateTimestamp = parcelData.lastUpdateTimestamp;
    s.parcels[_parcelId].unclaimedAlchemica = parcelData.unclaimedAlchemica;
    s.parcels[_parcelId].altarId = parcelData.altarId;
    s.parcels[_parcelId].upgradeQueueCapacity = parcelData.upgradeQueueCapacity;
    s.parcels[_parcelId].upgradeQueueLength = parcelData.upgradeQueueLength;
    s.parcels[_parcelId].lodgeId = parcelData.lodgeId;
    s.parcels[_parcelId].surveying = parcelData.surveying;
    s.parcels[_parcelId].harvesterCount = parcelData.harvesterCount;

    saveBuildGrid(_parcelId, parcelData.buildGrid);
    saveBuildTile(_parcelId, parcelData.tileGrid);
    saveStartPositionBuildGrid(_parcelId, parcelData.startPositionBuildGrid);
    saveRoundBaseAlchemica(_parcelId, parcelData.roundBaseAlchemica);
    saveRoundAlchemica(_parcelId, parcelData.roundAlchemica);
    saveReservoirs(_parcelId, parcelData.reservoirs);
  }

  function saveBuildGrid(uint256 _parcelId, uint[] calldata sparseGrid) public {
    console.log("save build grid");
    require(sparseGrid.length % 3 == 0, "RealmFacet: Invalid sparse grid");
    console.log("sparseGrid.length", sparseGrid.length);
    for (uint i; i < sparseGrid.length; i = i + 3) {
      s.parcels[_parcelId].buildGrid[sparseGrid[i]][sparseGrid[i + 1]] = sparseGrid[i + 2];
    }
  }

  function saveStartPositionBuildGrid(uint256 _parcelId, uint[] calldata sparseGrid) public {
    require(sparseGrid.length % 3 == 0, "RealmFacet: Invalid sparse grid");
    for (uint i; i < sparseGrid.length; i = i + 3) {
      s.parcels[_parcelId].startPositionBuildGrid[sparseGrid[i]][sparseGrid[i + 1]] = sparseGrid[i + 2];
    }
  }

  function saveBuildTile(uint256 _parcelId, uint[] calldata sparseGrid) public {
    require(sparseGrid.length % 3 == 0, "RealmFacet: Invalid sparse grid");
    for (uint i; i < sparseGrid.length; i = i + 3) {
      s.parcels[_parcelId].tileGrid[sparseGrid[i]][sparseGrid[i + 1]] = sparseGrid[i + 2];
    }
  }

  function saveStartPositionBuildTile(uint256 _parcelId, uint[] calldata sparseGrid) public {
    require(sparseGrid.length % 3 == 0, "RealmFacet: Invalid sparse grid");
    for (uint i; i < sparseGrid.length; i = i + 3) {
      s.parcels[_parcelId].startPositionTileGrid[sparseGrid[i]][sparseGrid[i + 1]] = sparseGrid[i + 2];
    }
  }

  function saveRoundBaseAlchemica(uint256 _parcelId, uint[][] calldata roundBaseAlchemica) public {
    for (uint i; i < roundBaseAlchemica.length; i++) {
      s.parcels[_parcelId].roundBaseAlchemica[i] = roundBaseAlchemica[i];
    }
  }

  function saveRoundAlchemica(uint256 _parcelId, uint[][] calldata roundAlchemica) public {
    for (uint i; i < roundAlchemica.length; i++) {
      s.parcels[_parcelId].roundAlchemica[i] = roundAlchemica[i];
    }
  }

  function saveReservoirs(uint256 _parcelId, uint[][] calldata reservoirs) public {
    for (uint i; i < reservoirs.length; i++) {
      s.parcels[_parcelId].reservoirs[i] = reservoirs[i];
    }
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
}

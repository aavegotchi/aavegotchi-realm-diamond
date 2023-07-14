// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";
import "hardhat/console.sol";

contract MigrationFacet is Modifiers {
  struct SimpleParcel {
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
  }

  function getSimpleParcel(uint _parcelId) external view returns (SimpleParcel memory output_) {
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
\    for (uint256 i; i < 16; i++) {
      for (uint256 j; j < 16; j++) {
        if (_gridType == 0) {
          output_[i][j] = s.parcels[_parcelId].buildGrid[i][j];
        } else if (_gridType == 1) {
          output_[i][j] = s.parcels[_parcelId].tileGrid[i][j];
        }
      }
    }
  }

  function migrateParcel(
    uint _parcelId,
    SimpleParcel calldata _simpleParcel,
    uint[] calldata buildGrid,
    uint[] calldata tileGrid,
    uint[] calldata startPositionBuildGrid,
    uint[] calldata startPositionTileGrid
  ) external {
    saveSimpleParcelData(_simpleParcel, _parcelId);
    saveBuildGrid(_parcelId, buildGrid);
    saveBuildTile(_parcelId, tileGrid);
    saveStartPositionBuildGrid(_parcelId, startPositionBuildGrid);
    saveStartPositionBuildTile(_parcelId, startPositionTileGrid);
  }

  function saveSimpleParcelData(SimpleParcel calldata _simpleParcel, uint _parcelId) public {
    s.parcels[_parcelId].owner = _simpleParcel.owner;
    s.parcels[_parcelId].parcelAddress = _simpleParcel.parcelAddress;
    s.parcels[_parcelId].parcelId = _simpleParcel.parcelId;
    s.parcels[_parcelId].coordinateX = _simpleParcel.coordinateX;
    s.parcels[_parcelId].coordinateY = _simpleParcel.coordinateY;
    s.parcels[_parcelId].district = _simpleParcel.district;
    s.parcels[_parcelId].size = _simpleParcel.size;
    s.parcels[_parcelId].alchemicaBoost = _simpleParcel.alchemicaBoost;
    s.parcels[_parcelId].alchemicaRemaining = _simpleParcel.alchemicaRemaining;
    s.parcels[_parcelId].currentRound = _simpleParcel.currentRound;
    s.parcels[_parcelId].alchemicaHarvestRate = _simpleParcel.alchemicaHarvestRate;
    s.parcels[_parcelId].lastUpdateTimestamp = _simpleParcel.lastUpdateTimestamp;
    s.parcels[_parcelId].unclaimedAlchemica = _simpleParcel.unclaimedAlchemica;
    s.parcels[_parcelId].altarId = _simpleParcel.altarId;
    s.parcels[_parcelId].upgradeQueueCapacity = _simpleParcel.upgradeQueueCapacity;
    s.parcels[_parcelId].upgradeQueueLength = _simpleParcel.upgradeQueueLength;
    s.parcels[_parcelId].lodgeId = _simpleParcel.lodgeId;
    s.parcels[_parcelId].surveying = _simpleParcel.surveying;
    s.parcels[_parcelId].harvesterCount = _simpleParcel.harvesterCount;
  }

  function saveBuildGrid(uint256 _parcelId, uint[] calldata sparseGrid) public {
    require(sparseGrid.length % 3 == 0, "RealmFacet: Invalid sparse grid");
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
}

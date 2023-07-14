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

  function getGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[16][16] memory output_) {
    // require(s.parcels[_parcelId].size == 1, "RealmFacet: Not reasonable");
    for (uint256 i; i < 16; i++) {
      for (uint256 j; j < 16; j++) {
        if (_gridType == 0) {
          output_[i][j] = s.parcels[_parcelId].buildGrid[i][j];
        } else if (_gridType == 1) {
          output_[i][j] = s.parcels[_parcelId].tileGrid[i][j];
        }
      }
    }
  }

  function saveSimpleParcelData(SimpleParcel calldata _simpleParcel, uint _parcelId) external {
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

  function saveGrid(uint256 _parcelId, uint[] calldata buildGrid) external {
    for (uint i; i < buildGrid.length; i = i + 3) {
      s.parcels[_parcelId].buildGrid[buildGrid[i]][buildGrid[i + 1]] = buildGrid[i + 2];
    }
  }
}

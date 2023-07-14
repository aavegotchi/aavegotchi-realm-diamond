// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";
import "hardhat/console.sol";

contract MigrationFacet is Modifiers {

  struct Test {
    uint256[64][64] buildGrid; 
    uint256[64][64] tileGrid;
    // mapping(uint256 => uint256[]) roundBaseAlchemica;
    // mapping(uint256 => uint256[]) roundAlchemica;
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

  function saveGrid(uint256 _parcelId, uint[] calldata buildGrid) external {
    for (uint i; i < buildGrid.length; i = i + 3) {
      console.log("Saving grid on", buildGrid[i], buildGrid[i + 1], buildGrid[i + 2]);
      s.parcels[_parcelId].buildGrid[buildGrid[i]][buildGrid[i + 1]] = buildGrid[i + 2];
    }
  }

  function getTokenIds() external view returns (uint256[] memory) {
    return s.tokenIds;
  }

  function migrateParel(
    string calldata _title,
    uint64 _startTime,
    uint64 _durationInMinutes,
    uint256[4] calldata _alchemicaSpent,
    uint256 _realmId
  ) external {
  }
}

/*
  
struct Parcel {
  address owner;
  string parcelAddress; //looks-like-this
  string parcelId; //C-4208-3168-R
  uint256 coordinateX; //x position on the map
  uint256 coordinateY; //y position on the map
  uint256 district;
  uint256 size; //0=humble, 1=reasonable, 2=spacious vertical, 3=spacious horizontal, 4=partner
  uint256[64][64] buildGrid; //x, then y array of positions - for installations
  uint256[64][64] tileGrid; //x, then y array of positions - for tiles under the installations (floor)
  uint256[4] alchemicaBoost; //fud, fomo, alpha, kek
  uint256[4] alchemicaRemaining; //fud, fomo, alpha, kek
  uint256 currentRound; //begins at 0 and increments after surveying has begun
  mapping(uint256 => uint256[]) roundBaseAlchemica; //round alchemica not including boosts
  mapping(uint256 => uint256[]) roundAlchemica; //round alchemica including boosts
  // // alchemicaType => array of reservoir id
  mapping(uint256 => uint256[]) reservoirs;
  uint256[4] alchemicaHarvestRate;
  uint256[4] lastUpdateTimestamp;
  uint256[4] unclaimedAlchemica;
  uint256 altarId;
  uint256 upgradeQueueCapacity;
  uint256 upgradeQueueLength;
  uint256 lodgeId;
  bool surveying;
  uint256[64][64] startPositionBuildGrid;
  uint256[64][64] startPositionTileGrid;
  uint16 harvesterCount;
}

*/

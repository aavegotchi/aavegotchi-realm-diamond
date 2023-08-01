// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";
import "../../libraries/LibERC721.sol";
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

  function migrateParcel(uint _parcelId, ParcelData calldata parcelData) onlyOwner external {
    LibERC721.safeMint(parcelData.owner, _parcelId);

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
    saveTileGrid(_parcelId, parcelData.tileGrid);
    saveStartPositionBuildGrid(_parcelId, parcelData.startPositionBuildGrid);
    saveStartPositionTileGrid(_parcelId, parcelData.startPositionTileGrid);
    saveRoundBaseAlchemica(_parcelId, parcelData.roundBaseAlchemica);
    saveRoundAlchemica(_parcelId, parcelData.roundAlchemica);
    saveReservoirs(_parcelId, parcelData.reservoirs);
  }

  function saveBuildGrid(uint256 _parcelId, uint[] calldata sparseGrid) onlyOwner public {
    require(sparseGrid.length % 3 == 0, "RealmFacet: Invalid sparse grid");
    for (uint i; i < sparseGrid.length; i = i + 3) {
      s.parcels[_parcelId].buildGrid[sparseGrid[i]][sparseGrid[i + 1]] = sparseGrid[i + 2];
    }
  }

  function saveStartPositionBuildGrid(uint256 _parcelId, uint[] calldata sparseGrid) onlyOwner public {
    require(sparseGrid.length % 3 == 0, "RealmFacet: Invalid sparse grid");
    for (uint i; i < sparseGrid.length; i = i + 3) {
      s.parcels[_parcelId].startPositionBuildGrid[sparseGrid[i]][sparseGrid[i + 1]] = sparseGrid[i + 2];
    }
  }

  function saveTileGrid(uint256 _parcelId, uint[] calldata sparseGrid) onlyOwner public {
    require(sparseGrid.length % 3 == 0, "RealmFacet: Invalid sparse grid");
    for (uint i; i < sparseGrid.length; i = i + 3) {
      s.parcels[_parcelId].tileGrid[sparseGrid[i]][sparseGrid[i + 1]] = sparseGrid[i + 2];
    }
  }

  function saveStartPositionTileGrid(uint256 _parcelId, uint[] calldata sparseGrid) onlyOwner public {
    require(sparseGrid.length % 3 == 0, "RealmFacet: Invalid sparse grid");
    for (uint i; i < sparseGrid.length; i = i + 3) {
      s.parcels[_parcelId].startPositionTileGrid[sparseGrid[i]][sparseGrid[i + 1]] = sparseGrid[i + 2];
    }
  }

  function saveRoundBaseAlchemica(uint256 _parcelId, uint[][] calldata roundBaseAlchemica) internal {
    for (uint i; i < roundBaseAlchemica.length; i++) {
      s.parcels[_parcelId].roundBaseAlchemica[i] = roundBaseAlchemica[i];
    }
  }

  function saveRoundAlchemica(uint256 _parcelId, uint[][] calldata roundAlchemica) internal {
    for (uint i; i < roundAlchemica.length; i++) {
      s.parcels[_parcelId].roundAlchemica[i] = roundAlchemica[i];
    }
  }

  function saveReservoirs(uint256 _parcelId, uint[][] calldata reservoirs) internal {
    for (uint i; i < reservoirs.length; i++) {
      s.parcels[_parcelId].reservoirs[i] = reservoirs[i];
    }
  }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";
import {LibERC1155} from "../../libraries/LibERC1155.sol";
import {LibERC721} from "../../libraries/LibERC721.sol";
import "hardhat/console.sol";

struct RoundBaseAlchemica {
  uint256 round;
  uint256[] baseAlchemica;
}

struct RoundAlchemica {
  uint256 round;
  uint256[] alchemica;
}

struct ParcelData {
  address owner;
  string parcelAddress;
  string parcelId;
  uint256 coordinateX;
  uint256 coordinateY;
  uint256 district;
  uint256 size;
  // uint256[64][64] buildGrid;
  // uint256[64][64] tileGrid;
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
  // uint256[64][64] startPositionBuildGrid;
  // uint256[64][64] startPositionTileGrid;
  uint16 harvesterCount;
  RoundBaseAlchemica[] roundBaseAlchemicas;
  RoundAlchemica[] roundAlchemicas;
}

contract RealmsPolygonXGotchichainBridgeFacet is Modifiers {
  event LayerZeroBridgeAdded(address _newLayerZeroBridge);

  address public layerZeroBridge;

  modifier onlyLayerZeroBridge() {
    require(msg.sender == layerZeroBridge, "RealmsPolygonXGotchichainBridgeFacet: Only layerzero bridge");
    _;
  }

  function addLayerZeroBridgeAddress(address _newLayerZeroBridge) external onlyOwner {
    s.layerZeroBridgeAddresses[_newLayerZeroBridge] = true;
    emit LayerZeroBridgeAdded(_newLayerZeroBridge);
  }

  function mintParcelWithId(uint256 tokenId, address toAddress) external onlyOwnerOrLayerZeroBridge {
    LibERC721.safeMint(toAddress, tokenId);
  }

  // function removeItemsFromOwner(address _owner, uint256[] calldata _tokenIds, uint256[] calldata _tokenAmounts) external onlyLayerZeroBridge() {
  //     for (uint256 i; i < _tokenIds.length; i++) {
  //         uint256 tokenId = _tokenIds[i];
  //         uint256 tokenAmount = _tokenAmounts[i];
  //         LibERC1155.removeFromOwner(_owner, tokenId, tokenAmount);
  //     }
  // }

  // function addItemsToOwner(address _owner, uint256[] calldata _tokenIds, uint256[] calldata _tokenAmounts) external onlyLayerZeroBridge() {
  //     for (uint256 i; i < _tokenIds.length; i++) {
  //         uint256 tokenId = _tokenIds[i];
  //         uint256 tokenAmount = _tokenAmounts[i];
  //         LibERC1155.addToOwner(_owner, tokenId, tokenAmount);
  //     }
  // }

  // function setParcelMetadata(uint _id, Parcel memory _parcel) external onlyLayerZeroBridge {
  //     s.parcels[_id] = _aavegotchi;
  //     for (uint i; i < _aavegotchi.equippedWearables.length; i++) {
  //         if (_aavegotchi.equippedWearables[i] != 0) {
  //             uint wearableId = _aavegotchi.equippedWearables[i];
  //             LibItems.addToParent(address(this), _id, wearableId, 1);
  //         }
  //     }
  // }

  //   mapping(uint256 => uint256[]) roundBaseAlchemica; //round alchemica not including boosts
  //   mapping(uint256 => uint256[]) roundAlchemica; //round alchemica including boosts
  //   // // alchemicaType => array of reservoir id
  //   mapping(uint256 => uint256[]) reservoirs;

  function getParcelData(uint256 _tokenId) external view returns (ParcelData memory parcel) {
    parcel.owner = s.parcels[_tokenId].owner;
    parcel.parcelAddress = s.parcels[_tokenId].parcelAddress;
    parcel.parcelId = s.parcels[_tokenId].parcelId;
    parcel.coordinateX = s.parcels[_tokenId].coordinateX;
    parcel.coordinateY = s.parcels[_tokenId].coordinateY;

    parcel.district = s.parcels[_tokenId].district;
    parcel.size = s.parcels[_tokenId].size;
    // parcel.buildGrid = s.parcels[_tokenId].buildGrid;
    // parcel.tileGrid = s.parcels[_tokenId].tileGrid;
    parcel.alchemicaBoost = s.parcels[_tokenId].alchemicaBoost;
    parcel.alchemicaRemaining = s.parcels[_tokenId].alchemicaRemaining;
    parcel.currentRound = s.parcels[_tokenId].currentRound;
    parcel.alchemicaHarvestRate = s.parcels[_tokenId].alchemicaHarvestRate;
    parcel.lastUpdateTimestamp = s.parcels[_tokenId].lastUpdateTimestamp;
    parcel.unclaimedAlchemica = s.parcels[_tokenId].unclaimedAlchemica;
    parcel.altarId = s.parcels[_tokenId].altarId;
    // parcel.upgradeQueueCapacity = s.parcels[_tokenId].upgradeQueueCapacity;
    // parcel.upgradeQueueLength = s.parcels[_tokenId].upgradeQueueLength;

    parcel.lodgeId = s.parcels[_tokenId].lodgeId;
    parcel.surveying = s.parcels[_tokenId].surveying;
    // parcel.startPositionBuildGrid = s.parcels[_tokenId].startPositionBuildGrid;
    // parcel.startPositionTileGrid = s.parcels[_tokenId].startPositionTileGrid;
    parcel.harvesterCount = s.parcels[_tokenId].harvesterCount;

    RoundBaseAlchemica[] memory roundBaseAlchemicas = new RoundBaseAlchemica[](parcel.currentRound);
    RoundAlchemica[] memory roundAlchemicas = new RoundAlchemica[](parcel.currentRound);

    for (uint i; i < parcel.currentRound; i++) {
      RoundBaseAlchemica memory roundBaseAlchemica;
      roundBaseAlchemica.round = i;
      roundBaseAlchemica.baseAlchemica = s.parcels[_tokenId].roundBaseAlchemica[i];
      roundBaseAlchemicas[i] = roundBaseAlchemica;

      RoundAlchemica memory roundAlchemica;
      roundAlchemica.round = i;
      roundAlchemica.alchemica = s.parcels[_tokenId].roundAlchemica[i];
      roundAlchemicas[i] = roundAlchemica;
    }

    if (parcel.currentRound > 0) {
      parcel.roundBaseAlchemicas = roundBaseAlchemicas;
      parcel.roundAlchemicas = roundAlchemicas;
    }

    console.log("leaving getParcelData");
    // return parcel;
  }
}

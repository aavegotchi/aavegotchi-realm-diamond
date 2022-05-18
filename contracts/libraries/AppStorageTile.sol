// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
import {LibDiamond} from "./LibDiamond.sol";

struct TileType {
  //slot 1
  uint8 width;
  uint8 height;
  bool deprecated;
  uint16 tileType;
  uint32 craftTime; // in blocks
  //slot 2
  uint256[4] alchemicaCost; // [fud, fomo, alpha, kek]
  //slot 3
  string name;
}

struct QueueItem {
  //slot 1
  uint256 id;
  //slot 2
  uint40 readyBlock;
  uint16 tileType;
  bool claimed;
  address owner;
}

struct TileAppStorage {
  address realmDiamond;
  address aavegotchiDiamond;
  address pixelcraft;
  address aavegotchiDAO;
  address gltr;
  address[] alchemicaAddresses;
  string baseUri;
  TileType[] tileTypes;
  QueueItem[] craftQueue;
  uint256 nextCraftId;
  //ERC1155 vars
  mapping(address => mapping(address => bool)) operators;
  //ERC998 vars
  mapping(address => mapping(uint256 => mapping(uint256 => uint256))) nftTileBalances;
  mapping(address => mapping(uint256 => uint256[])) nftTiles;
  mapping(address => mapping(uint256 => mapping(uint256 => uint256))) nftTileIndexes;
  mapping(address => mapping(uint256 => uint256)) ownerTileBalances;
  mapping(address => uint256[]) ownerTiles;
  mapping(address => mapping(uint256 => uint256)) ownerTileIndexes;
  // installationId => deprecateTime
  mapping(uint256 => uint256) deprecateTime;
}

library LibAppStorageTile {
  function diamondStorage() internal pure returns (TileAppStorage storage ds) {
    assembly {
      ds.slot := 0
    }
  }
}

contract Modifiers {
  TileAppStorage internal s;

  modifier onlyOwner() {
    LibDiamond.enforceIsContractOwner();
    _;
  }

  modifier onlyRealmDiamond() {
    require(msg.sender == s.realmDiamond, "LibDiamond: Must be realm diamond");
    _;
  }
}

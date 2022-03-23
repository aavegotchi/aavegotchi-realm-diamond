// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
import {LibDiamond} from "./LibDiamond.sol";
import "hardhat/console.sol";

struct TileType {
  uint256 width;
  uint256 height;
  bool deprecated;
  uint16 tileType;
  uint256[] alchemicaCost; // [fud, fomo, alpha, kek]
  uint256 craftTime; // in blocks
  string name;
}

struct QueueItem {
  uint256 id;
  uint256 readyBlock;
  uint256 tileType;
  bool claimed;
  address owner;
}

struct UpgradeQueue {
  uint256 parcelId;
  uint256 coordinateX;
  uint256 coordinateY;
  uint256 tileId;
  uint256 readyBlock;
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
  UpgradeQueue[] upgradeQueue;
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

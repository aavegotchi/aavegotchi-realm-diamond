// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
import {LibDiamond} from "./LibDiamond.sol";

struct InstallationType {
  //slot 1
  uint8 width;
  uint8 height;
  uint16 installationType; //0 = altar, 1 = harvester, 2 = reservoir, 3 = gotchi lodge, 4 = wall, 5 = NFT display, 6 = buildqueue booster
  uint8 level; //max level 9
  uint8 alchemicaType; //0 = none 1 = fud, 2 = fomo, 3 = alpha, 4 = kek
  uint32 spillRadius;
  uint16 spillRate;
  uint8 upgradeQueueBoost;
  uint32 craftTime; // in blocks
  uint32 nextLevelId; //the ID of the next level of this installation. Used for upgrades.
  bool deprecated; //bool
  //slot 2
  uint256[4] alchemicaCost; // [fud, fomo, alpha, kek]
  //slot 3
  uint256 harvestRate;
  //slot 4
  uint256 capacity;
  //slot 5
  uint256[] prerequisites; //IDs of installations that must be present before this installation can be added
  //slot 6
  string name;
  uint40 deprecateTime; //epoch timestamp
}

struct QueueItem {
  address owner;
  uint16 installationType;
  bool claimed;
  uint40 readyBlock;
  uint256 id;
}

struct UpgradeQueue {
  address owner;
  uint16 coordinateX;
  uint16 coordinateY;
  uint40 readyBlock;
  bool claimed;
  uint256 parcelId;
  uint256 installationId;
}

struct InstallationAppStorage {
  address realmDiamond;
  address aavegotchiDiamond;
  address pixelcraft;
  address aavegotchiDAO;
  address gltr;
  address[] alchemicaAddresses;
  string baseUri;
  InstallationType[] installationTypes;
  QueueItem[] craftQueue;
  uint256 nextCraftId;
  //ERC1155 vars
  mapping(address => mapping(address => bool)) operators;
  //ERC998 vars
  mapping(address => mapping(uint256 => mapping(uint256 => uint256))) nftInstallationBalances;
  mapping(address => mapping(uint256 => uint256[])) nftInstallations;
  mapping(address => mapping(uint256 => mapping(uint256 => uint256))) nftInstallationIndexes;
  mapping(address => mapping(uint256 => uint256)) ownerInstallationBalances;
  mapping(address => uint256[]) ownerInstallations;
  mapping(address => mapping(uint256 => uint256)) ownerInstallationIndexes;
  UpgradeQueue[] upgradeQueue;
}

library LibAppStorageInstallation {
  function diamondStorage() internal pure returns (InstallationAppStorage storage ds) {
    assembly {
      ds.slot := 0
    }
  }
}

contract Modifiers {
  InstallationAppStorage internal s;

  modifier onlyOwner() {
    LibDiamond.enforceIsContractOwner();
    _;
  }

  modifier onlyRealmDiamond() {
    require(msg.sender == s.realmDiamond, "LibDiamond: Must be realm diamond");
    _;
  }
}

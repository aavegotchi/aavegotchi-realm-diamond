// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
import {LibDiamond} from "./LibDiamond.sol";
import "hardhat/console.sol";

struct InstallationType {
  uint256 width;
  uint256 height;
  bool deprecated;
  uint16 installationType; //0 = harvester, 1 = reservoir, 2 = altar, 3 = gotchi lodge, 4 = wall, 5 = NFT display
  uint16 level;
  uint16 alchemicaType; //0 = none 1 = fud, 2 = fomo, 3 = alpha, 4 = kek
  uint256[] alchemicaCost; // [fud, fomo, alpha, kek]
  uint256 harvestRate;
  uint256 capacity;
  uint256 spillRadius;
  uint256 spillRate;
  uint256 upgradeQueueBoost;
  uint256 craftTime; // in blocks
  uint256 nextLevelId; //the ID of the next level of this installation. Used for upgrades.
  uint256[] prerequisites; //IDs of installations that must be present before this installation can be added
  string name;
}

//Prerequisites:
/*
Altar : none
Harvester: Altar Lvl 1
Reservoir: Altar Lvl 1
Wall: Altar Lvl 1
Lodge: Altar Lvl 4
Lodge Lvl 4: Lodge Lvl 3 + Altar Level 6
Lodge Lvl 7: Lodge Lvl 6 + Altar Lvl 9
*/

struct QueueItem {
  uint256 id;
  uint256 readyBlock;
  uint256 installationType;
  bool claimed;
  address owner;
}

struct UpgradeQueue {
  uint256 parcelId;
  uint256 coordinateX;
  uint256 coordinateY;
  uint256 installationId;
  uint256 readyBlock;
  bool claimed;
  address owner;
}

struct InstallationAppStorage {
  address realmDiamond;
  address aavegotchiDiamond;
  address pixelCraft;
  address aavegotchiDAO;
  address glmr;
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
  mapping(bytes32 => uint256) upgradeHashes;
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

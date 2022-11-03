// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
import {LibDiamond} from "./LibDiamond.sol";
import {LibMeta} from "./LibMeta.sol";
import "../interfaces/AavegotchiDiamond.sol";

uint256 constant HUMBLE_WIDTH = 8;
uint256 constant HUMBLE_HEIGHT = 8;
uint256 constant REASONABLE_WIDTH = 16;
uint256 constant REASONABLE_HEIGHT = 16;
uint256 constant SPACIOUS_WIDTH = 32;
uint256 constant SPACIOUS_HEIGHT = 64;
uint256 constant PAARTNER_WIDTH = 64;
uint256 constant PAARTNER_HEIGHT = 64;

uint256 constant FUD = 0;
uint256 constant FOMO = 1;
uint256 constant ALPHA = 2;
uint256 constant KEK = 3;

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

struct BounceGate {
  string title;
  uint64 startTime;
  uint64 endTime;
  uint120 priority;
  bool equipped;
  uint64 lastTimeUpdated;
}

struct RequestConfig {
  uint64 subId;
  uint32 callbackGasLimit;
  uint16 requestConfirmations;
  uint32 numWords;
  bytes32 keyHash;
}

struct AppStorage {
  uint256[] tokenIds;
  mapping(uint256 => Parcel) parcels;
  mapping(address => mapping(uint256 => uint256)) ownerTokenIdIndexes;
  mapping(address => uint256[]) ownerTokenIds;
  mapping(address => mapping(address => bool)) operators;
  mapping(uint256 => address) approved;
  address aavegotchiDiamond;
  address[4] alchemicaAddresses; //fud, fomo, alpha, kek
  address installationsDiamond;
  uint256 surveyingRound;
  uint256[4][5] totalAlchemicas;
  uint256[4] boostMultipliers;
  uint256[4] greatPortalCapacity;
  // VRF
  address vrfCoordinator;
  address linkAddress;
  RequestConfig requestConfig;
  mapping(uint256 => uint256) vrfRequestIdToTokenId;
  mapping(uint256 => uint256) vrfRequestIdToSurveyingRound;
  bytes backendPubKey;
  address gameManager;
  mapping(uint256 => uint256) lastExitTime; //for aavegotchis exiting alchemica
  // gotchiId => lastChanneledGotchi
  mapping(uint256 => uint256) gotchiChannelings;
  // parcelId => lastChanneledParcel
  mapping(uint256 => uint256) parcelChannelings;
  // altarLevel => cooldown hours in seconds
  mapping(uint256 => uint256) channelingLimits;
  // parcelId => lastClaimedAlchemica
  mapping(uint256 => uint256) lastClaimedAlchemica;
  address gltrAddress;
  address tileDiamond;
  bool gameActive;
  // parcelId => action: 0 Alchemical Channeling, 1 Emptying Reservoirs => permission: 0 Owner only, 1 Owner + Borrowed Gotchis, 2 whitelisted addresses, 3 blacklisted addresses, 4 Any Gotchi
  mapping(uint256 => mapping(uint256 => uint256)) accessRights;
  // gotchiId => lastChanneledDay
  mapping(uint256 => uint256) lastChanneledDay;
  bool freezeBuilding;
  //NFT DISPLAY STORAGE
  //chainId => contractAddress => allowed
  mapping(uint256 => mapping(address => bool)) nftDisplayAllowed;
  mapping(uint256 => BounceGate) bounceGates;
  // parcelId => action: 0 Alchemical Channeling, 1 Emptying Reservoirs => whitelistIds
  mapping(uint256 => mapping(uint256 => uint32)) whitelistIds;
}

library LibAppStorage {
  function diamondStorage() internal pure returns (AppStorage storage ds) {
    assembly {
      ds.slot := 0
    }
  }
}

contract Modifiers {
  AppStorage internal s;

  modifier onlyParcelOwner(uint256 _tokenId) {
    require(LibMeta.msgSender() == s.parcels[_tokenId].owner, "AppStorage: Only Parcel owner can call");
    _;
  }

  modifier onlyOwner() {
    LibDiamond.enforceIsContractOwner();
    _;
  }

  modifier onlyGotchiOwner(uint256 _gotchiId) {
    AavegotchiDiamond diamond = AavegotchiDiamond(s.aavegotchiDiamond);
    require(LibMeta.msgSender() == diamond.ownerOf(_gotchiId), "AppStorage: Only Gotchi Owner can call");
    _;
  }

  modifier onlyGameManager() {
    require(msg.sender == s.gameManager, "AlchemicaFacet: Only Game Manager");
    _;
  }

  modifier onlyInstallationDiamond() {
    require(LibMeta.msgSender() == s.installationsDiamond, "AppStorage: Only Installation diamond can call");
    _;
  }

  modifier gameActive() {
    require(s.gameActive, "AppStorage: game not active");
    _;
  }

  modifier canBuild() {
    require(!s.freezeBuilding, "AppStorage: Building temporarily disabled");
    _;
  }
}

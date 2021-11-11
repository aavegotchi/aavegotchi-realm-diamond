// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
import {LibDiamond} from "./LibDiamond.sol";
import {LibMeta} from "./LibMeta.sol";

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

// TODO confirm hardcoded values
uint256 constant HUMBLE_FUD_ACT1 = 14154;
uint256 constant HUMBLE_FOMO_ACT1 = 7076;
uint256 constant HUMBLE_ALPHA_ACT1 = 3538;
uint256 constant HUMBLE_KEK_ACT1 = 1414;

uint256 constant REASONABLE_FUD_ACT1 = 56618;
uint256 constant REASONABLE_FOMO_ACT1 = 28308;
uint256 constant REASONABLE_ALPHA_ACT1 = 14154;
uint256 constant REASONABLE_KEK_ACT1 = 5660;

uint256 constant SPACIOUS_FUD_ACT1 = 452946;
uint256 constant SPACIOUS_FOMO_ACT1 = 226472;
uint256 constant SPACIOUS_ALPHA_ACT1 = 113236;
uint256 constant SPACIOUS_KEK_ACT1 = 45294;

uint256 constant PAARTNER_FUD_ACT1 = 905894;
uint256 constant PAARTNER_FOMO_ACT1 = 452946;
uint256 constant PAARTNER_ALPHA_ACT1 = 226472;
uint256 constant PAARTNER_KEK_ACT1 = 90588;

struct Parcel {
  address owner;
  string parcelAddress; //looks-like-this
  string parcelId; //C-4208-3168-R
  uint256 coordinateX; //x position on the map
  uint256 coordinateY; //y position on the map
  uint256 district;
  uint256 size; //0=humble, 1=reasonable, 2=spacious vertical, 3=spacious horizontal, 4=partner
  uint256[64][64] buildGrid; //x, then y array of positions
  uint256[64][64] tileGrid; //x, then y array of positions
  uint256[4] alchemicaBoost; //fud, fomo, alpha, kek
  uint256[4] alchemicaRemaining; //fud, fomo, alpha, kek
  bool[10] roundsClaimed;

  /* will probably be converted into arrays
  mapping(uint256 => uint256) alchemicaRemaining;
  mapping(uint256 => uint256) alchemicaCapacity;
  mapping(uint256 => uint256) alchemicaHarvestRate;
  mapping(uint256 => uint256) timeSinceLastClaim;
  mapping(uint256 => uint256) unclaimedAlchemica;
  */
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
  address installationContract;
  uint8 surveyingRound;
  uint256[4][5] totalAlchemicas;
  // VRF
  address vrfCoordinator;
  address linkAddress;
  RequestConfig requestConfig;
  mapping(uint256 => uint256) vrfRequestIdToTokenId;
  mapping(uint256 => uint8) vrfRequestIdToSurveyingRound;
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
}

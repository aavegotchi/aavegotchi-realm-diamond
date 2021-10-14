// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
import {LibDiamond} from "./LibDiamond.sol";

uint256 constant HUMBLE_WIDTH = 8;
uint256 constant HUMBLE_HEIGHT = 8;
uint256 constant REASONABLE_WIDTH = 16;
uint256 constant REASONABLE_HEIGHT = 16;
uint256 constant SPACIOUS_WIDTH = 32;
uint256 constant SPACIOUS_HEIGHT = 64;
uint256 constant PAARTNER_WIDTH = 64;
uint256 constant PAARTNER_HEIGHT = 64;

struct Parcel {
  address owner;
  uint32 coordinateX; //x position on the map
  uint32 coordinateY; //y position on the map
  uint256 parcelId;
  uint256 size; //0=humble, 1=reasonable, 2=spacious vertical, 3=spacious horizontal, 4=partner
  uint256 fomoBoost;
  uint256 fudBoost;
  uint256 kekBoost;
  uint256 alphaBoost;
  //all set to 0 initially
  uint256 fomo; //amount of fomo
  uint256 fud; //amt of fud remaining
  uint256 kek; //amt of kek remaining
  uint256 alpha; //amt of alpha remaining
  uint256[64][64] buildGrid; //x, then y array of positions
  uint256[64][64] tileGrid; //x, then y array of positions
  /*  
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0 
    0 0 0 0 0 0 0 0
    0 0 0 0 0 0 0 0
    0 0 0 0 0 0 0 0
    0 0 0 0 0 0 0 0
    */
}

struct Installation {
  uint256 itemId; //needs to start at 1, not 0
  uint256 width;
  uint256 height;
}

struct AppStorage {
  uint32[] tokenIds;
  uint32 tokenIdCounter;
  mapping(uint256 => uint256) tokenIdIndexes;
  mapping(address => uint256) parcelBalance;
  mapping(uint256 => Parcel) parcels;
  mapping(address => mapping(uint256 => uint256)) ownerTokenIdIndexes;
  mapping(address => uint32[]) ownerTokenIds;
  mapping(uint256 => Parcel) tokenIdToParcel;
  mapping(address => mapping(address => bool)) operators;
  mapping(uint256 => address) approved;
  mapping(uint256 => Installation) installationTypes;
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

  modifier onlyOwner() {
    LibDiamond.enforceIsContractOwner();
    _;
  }
}

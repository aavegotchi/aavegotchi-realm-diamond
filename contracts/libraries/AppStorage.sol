// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
import {LibDiamond} from "./LibDiamond.sol";

struct ParcelMetadata {
    address owner;
    uint256 parcelId;
    uint256 fomoBoost;
    uint256 fudBoost;
    uint256 kekBoost;
    uint256 alphaBoost;
}

struct AppStorage {
    uint32[] tokenIds;
    mapping(address => uint256) parcelBalance;
    mapping(uint256 => ParcelMetadata) parcels;
    mapping(address => uint32[]) ownerTokenIds;
    mapping(uint256 => ParcelMetadata) tokenIdToParcel;
    mapping(address => mapping(address => bool)) operators;
    mapping(uint256 => address) approved;
}

contract Modifiers {
    AppStorage internal s;

    modifier onlyOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../libraries/AppStorage.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibStrings.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibERC721.sol";
import {InstallationDiamond} from "../interfaces/InstallationDiamond.sol";

contract RealmVoucherFacet is Modifiers {
  // bytes4 private constant ERC721_RECEIVED = 0x150b7a02;

  function claimableAlchemica(uint256 _tokenId, uint16 _type) public view returns (uint256) {
    // revert("Function not implemented");

    Parcel storage parcel = s.parcels[_tokenId];
    uint256 harvestRate = parcel.alchemicaHarvestRate[_type];
    uint256 remaining = parcel.alchemicaRemaining[_type];
    uint256 timeSinceLastClaim = parcel.timeSinceLastClaim[_type];
    uint256 capacity = parcel.alchemicaCapacity[_type];
    uint256 unclaimed = parcel.unclaimedAlchemica[_type];

    uint256 claimable = (harvestRate * timeSinceLastClaim) + unclaimed;

    if (claimable > capacity) claimable = capacity;
    if (claimable > remaining) claimable = remaining;
    return claimable;

    //How much alchemica can be claimed at the current moment
    //Formula:
    //const claimable = (currentHarvestRate * timeSinceLastClaim) + unclaimedAlchemica
    //If claimable > alchemicaCapacity, return alchemicaCapacity
    //If alchemicaCapacity > alchemicaRemaining, return alchemicaRemaining
  }

  function claimAlchemica(
    uint256 _tokenId,
    uint16 _type,
    uint256 _amount
  ) external {
    //Claims alchemica from parcel
    //Alchemica must be harvested and deposited into reservoir

    uint256 claimable = claimableAlchemica(_tokenId, _type);

    //Mint these tokens
    //Send some directly to player based on Parcel reservoir level
    //The remaining get transferred to the Great Portal and spilled around the map
  }
}

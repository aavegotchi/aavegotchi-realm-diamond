// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {InstallationDiamond} from "../interfaces/InstallationDiamond.sol";
import {LibAppStorage, AppStorage, Parcel} from "./AppStorage.sol";

library LibAlchemica {
  //Parcel starts out with 0 harvest rate
  //Player equips harvester, harvest rate begins increasing
  //Available alchemica will always be 0 if reservoir has not been added
  //Once player has equipped a reservoir, the harvested amount will increase until it has reached the capacity.
  //When a player claims the alchemica, the timeSinceLastUpdate is reset to 0, which means the harvested amount is also set back to zero. This prevents the reservoir from immediately refilling after a claim.

  function settleUnclaimedAlchemica(uint256 _tokenId, uint256 _alchemicaType) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();

    //todo: check capacity
    uint256 capacity = s.parcels[_tokenId].reservoirCapacity[_alchemicaType];

    if (alchemicaSinceLastUpdate(_tokenId, _alchemicaType) > capacity) {
      s.parcels[_tokenId].unclaimedAlchemica[_alchemicaType] = capacity;
    } else {
      s.parcels[_tokenId].unclaimedAlchemica[_alchemicaType] += alchemicaSinceLastUpdate(_tokenId, _alchemicaType);
    }

    s.parcels[_tokenId].timeSinceLastUpdate[_alchemicaType] = 0;
  }

  function alchemicaSinceLastUpdate(uint256 _tokenId, uint256 _alchemicaType) internal view returns (uint256) {
    AppStorage storage s = LibAppStorage.diamondStorage();

    return s.parcels[_tokenId].alchemicaHarvestRate[_alchemicaType] * s.parcels[_tokenId].timeSinceLastUpdate[_alchemicaType];
  }

  function increaseTraits(uint256 _realmId, uint256 _installationId) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();

    //todo: First save the current harvested amount

    InstallationDiamond.InstallationType memory installationType = InstallationDiamond(s.installationsDiamond).getInstallationType(_installationId);

    uint256 alchemicaType = installationType.alchemicaType;

    //unclaimed alchemica must be settled before mutating harvestRate and capacity
    settleUnclaimedAlchemica(_realmId, alchemicaType);

    //handle harvester
    if (installationType.harvestRate > 0) {
      s.parcels[_realmId].alchemicaHarvestRate[installationType.alchemicaType] += installationType.harvestRate;
    }

    //reservoir
    if (installationType.capacity > 0) {
      s.parcels[_realmId].reservoirCapacity[installationType.alchemicaType] += installationType.capacity;
    }
  }

  function reduceTraits(uint256 _realmId, uint256 _installationId) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();

    InstallationDiamond.InstallationType memory installationType = InstallationDiamond(s.installationsDiamond).getInstallationType(_installationId);

    uint256 alchemicaType = installationType.alchemicaType;

    //unclaimed alchemica must be settled before mutating harvestRate and capacity
    settleUnclaimedAlchemica(_realmId, alchemicaType);

    if (installationType.harvestRate > 0) {
      s.parcels[_realmId].alchemicaHarvestRate[installationType.alchemicaType] -= installationType.harvestRate;
    }

    if (installationType.capacity > 0) {
      //@todo: handle the case where a user has more harvested than reservoir capacity after the update

      //todo: solution 1: revert until user has claimed
      //todo: solution 2: claim for user and then unequip

      s.parcels[_realmId].reservoirCapacity[installationType.alchemicaType] -= installationType.capacity;
    }
  }
}

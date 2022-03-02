// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {InstallationDiamondInterface} from "../interfaces/InstallationDiamond.sol";
import {LibAppStorage, AppStorage, Parcel} from "./AppStorage.sol";
import "hardhat/console.sol";

library LibAlchemica {
  function settleUnclaimedAlchemica(uint256 _tokenId, uint256 _alchemicaType) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();

    uint256 capacity = s.parcels[_tokenId].reservoirCapacity[_alchemicaType];

    uint256 alchemicaSinceUpdate = alchemicaSinceLastUpdate(_tokenId, _alchemicaType);

    if (alchemicaSinceUpdate > 0) {
      //Cannot settle more than capacity
      if (s.parcels[_tokenId].unclaimedAlchemica[_alchemicaType] + alchemicaSinceUpdate > capacity) {
        s.parcels[_tokenId].unclaimedAlchemica[_alchemicaType] = capacity;
      } else {
        //Increment alchemica
        s.parcels[_tokenId].unclaimedAlchemica[_alchemicaType] += alchemicaSinceUpdate;
      }
    }

    s.parcels[_tokenId].lastUpdateTimestamp[_alchemicaType] = block.timestamp;
  }

  function alchemicaSinceLastUpdate(uint256 _tokenId, uint256 _alchemicaType) internal view returns (uint256) {
    AppStorage storage s = LibAppStorage.diamondStorage();
    uint256 amount = s.parcels[_tokenId].alchemicaHarvestRate[_alchemicaType] *
      (block.timestamp - s.parcels[_tokenId].lastUpdateTimestamp[_alchemicaType]);

    return amount;
  }

  function increaseTraits(uint256 _realmId, uint256 _installationId) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();

    //First save the current harvested amount
    InstallationDiamondInterface.InstallationType memory installationType = InstallationDiamondInterface(s.installationsDiamond).getInstallationType(
      _installationId
    );

    uint256 alchemicaType = installationType.alchemicaType;

    //unclaimed alchemica must be settled before mutating harvestRate and capacity
    settleUnclaimedAlchemica(_realmId, alchemicaType);

    //handle harvester
    if (installationType.harvestRate > 0) {
      s.parcels[_realmId].alchemicaHarvestRate[alchemicaType] += installationType.harvestRate;
    }

    //reservoir
    if (installationType.capacity > 0) {
      s.parcels[_realmId].reservoirCapacity[alchemicaType] += installationType.capacity;

      //increment storage vars
      s.parcels[_realmId].reservoirCount[alchemicaType]++;
      s.parcels[_realmId].spilloverRate[alchemicaType] += installationType.spillRate;
      s.parcels[_realmId].spilloverRadius[alchemicaType] += installationType.spillRadius;
    }

    //Altar
    if (installationType.installationType == 2) {
      require(s.parcels[_realmId].altarId == 0, "LibAlchemica: Cannot equip two altars");
      s.parcels[_realmId].altarId = _installationId;
      s.parcelChannelings[_realmId] = block.timestamp - 24 hours;
    }

    // upgradeQueueBoost
    if (installationType.upgradeQueueBoost > 0) {
      s.parcels[_realmId].upgradeQueueCapacity += installationType.upgradeQueueBoost;
    }
  }

  function reduceTraits(uint256 _realmId, uint256 _installationId) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();

    InstallationDiamondInterface.InstallationType memory installationType = InstallationDiamondInterface(s.installationsDiamond).getInstallationType(
      _installationId
    );

    uint256 alchemicaType = installationType.alchemicaType;

    //unclaimed alchemica must be settled before updating harvestRate and capacity
    settleUnclaimedAlchemica(_realmId, alchemicaType);

    //Decrement harvest variables
    if (installationType.harvestRate > 0) {
      s.parcels[_realmId].alchemicaHarvestRate[alchemicaType] -= installationType.harvestRate;
    }

    //Altar
    if (installationType.installationType == 2) {
      //@question: do we need any special exceptions for the Altar? Should be handled by tech tree
      s.parcels[_realmId].altarId = 0;
    }

    //Decrement reservoir variables
    if (installationType.capacity > 0) {
      s.parcels[_realmId].reservoirCapacity[alchemicaType] -= installationType.capacity;
      s.parcels[_realmId].reservoirCount[alchemicaType]--;
      s.parcels[_realmId].spilloverRate[alchemicaType] -= installationType.spillRate;
      s.parcels[_realmId].spilloverRadius[alchemicaType] -= installationType.spillRadius;

      if (s.parcels[_realmId].unclaimedAlchemica[alchemicaType] > s.parcels[_realmId].reservoirCapacity[alchemicaType]) {
        //step 1 - unequip all harvesters
        //step 2 - claim alchemica balance
        //step 3 - unequip reservoir
        revert("LibAlchemica: Unclaimed alchemica greater than reservoir capacity");
      }
    }

    // upgradeQueueBoost
    if (installationType.upgradeQueueBoost > 0) {
      s.parcels[_realmId].upgradeQueueCapacity -= installationType.upgradeQueueBoost;
    }
  }
}
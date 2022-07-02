// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {InstallationDiamondInterface} from "../interfaces/InstallationDiamondInterface.sol";
import {LibAppStorage, AppStorage, Parcel} from "./AppStorage.sol";

library LibAlchemica {
  function settleUnclaimedAlchemica(uint256 _tokenId, uint256 _alchemicaType) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();

    //todo: only do this every 8 hrs

    uint256 capacity = calculateTotalCapacity(_tokenId, _alchemicaType);

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

  function increaseTraits(
    uint256 _realmId,
    uint256 _installationId,
    bool isUpgrade
  ) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();

    //First save the current harvested amount
    InstallationDiamondInterface.InstallationType memory installationType = InstallationDiamondInterface(s.installationsDiamond).getInstallationType(
      _installationId
    );

    uint256 altarPrerequisite = installationType.prerequisites[0];
    uint256 lodgePrerequisite = installationType.prerequisites[1];

    // check altar requirement
    uint256 equippedAltarId = s.parcels[_realmId].altarId;
    uint256 equippedAltarLevel = InstallationDiamondInterface(s.installationsDiamond).getInstallationType(equippedAltarId).level;

    require(equippedAltarLevel >= altarPrerequisite, "RealmFacet: Altar Tech Tree Reqs not met");

    // check lodge requirement
    if (lodgePrerequisite > 0) {
      uint256 equippedLodgeId = s.parcels[_realmId].lodgeId;
      uint256 equippedLodgeLevel = InstallationDiamondInterface(s.installationsDiamond).getInstallationType(equippedLodgeId).level;
      require(equippedLodgeLevel >= lodgePrerequisite, "RealmFacet: Lodge Tech Tree Reqs not met");
    }

    // check harvester requirement
    if (installationType.installationType == 1) {
      require(s.parcels[_realmId].reservoirs[installationType.alchemicaType].length > 0, "RealmFacet: Must equip reservoir of type");
    }

    uint256 alchemicaType = installationType.alchemicaType;

    //unclaimed alchemica must be settled before mutating harvestRate and capacity
    if (installationType.harvestRate > 0 || installationType.capacity > 0) {
      settleUnclaimedAlchemica(_realmId, alchemicaType);
    }

    //handle harvester
    if (installationType.harvestRate > 0) {
      s.parcels[_realmId].alchemicaHarvestRate[alchemicaType] += installationType.harvestRate;
    }

    //reservoir
    if (installationType.capacity > 0) {
      s.parcels[_realmId].reservoirs[alchemicaType].push(_installationId);
    }

    //Altar
    if (installationType.installationType == 0) {
      require(isUpgrade || s.parcels[_realmId].altarId == 0, "LibAlchemica: Cannot equip two altars");
      s.parcels[_realmId].altarId = _installationId;
    }

    // upgradeQueueBoost
    if (installationType.upgradeQueueBoost > 0) {
      s.parcels[_realmId].upgradeQueueCapacity += installationType.upgradeQueueBoost;
    }
  }

  function reduceTraits(
    uint256 _realmId,
    uint256 _installationId,
    bool isUpgrade
  ) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();

    InstallationDiamondInterface installationsDiamond = InstallationDiamondInterface(s.installationsDiamond);
    InstallationDiamondInterface.InstallationType memory installationType = InstallationDiamondInterface(s.installationsDiamond).getInstallationType(
      _installationId
    );
    InstallationDiamondInterface.InstallationIdIO[] memory installationBalances = installationsDiamond.installationBalancesOfToken(
      address(this),
      _realmId
    );

    for (uint256 i; i < installationBalances.length; i++) {
      InstallationDiamondInterface.InstallationType memory equippedInstallaion = installationsDiamond.getInstallationType(_installationId);

      // check altar requirement
      require(
        InstallationDiamondInterface(s.installationsDiamond).getInstallationType(s.parcels[_realmId].altarId).level >=
          equippedInstallaion.prerequisites[0],
        "RealmFacet: Altar Tech Tree Reqs not met"
      );

      // check lodge requirement
      if (equippedInstallaion.prerequisites[1] > 0) {
        require(
          InstallationDiamondInterface(s.installationsDiamond).getInstallationType(s.parcels[_realmId].lodgeId).level >=
            equippedInstallaion.prerequisites[1],
          "RealmFacet: Lodge Tech Tree Reqs not met"
        );
      }
    }

    uint256 alchemicaType = installationType.alchemicaType;

    //unclaimed alchemica must be settled before updating harvestRate and capacity
    if (installationType.harvestRate > 0 || installationType.capacity > 0) {
      settleUnclaimedAlchemica(_realmId, alchemicaType);
    }

    //Decrement harvest variables
    if (installationType.harvestRate > 0) {
      s.parcels[_realmId].alchemicaHarvestRate[alchemicaType] -= installationType.harvestRate;
    }

    //Altar
    if (installationType.installationType == 0 && !isUpgrade) {
      s.parcels[_realmId].altarId = 0;
    }

    // Lodge
    if (installationType.installationType == 3) {
      s.parcels[_realmId].lodgeId = 0;
    }

    //Decrement reservoir variables
    if (installationType.capacity > 0) {
      for (uint256 i; i < s.parcels[_realmId].reservoirs[alchemicaType].length; i++) {
        if (s.parcels[_realmId].reservoirs[alchemicaType][i] == _installationId) {
          popArray(s.parcels[_realmId].reservoirs[alchemicaType], i);
          break;
        }
      }
      if (s.parcels[_realmId].unclaimedAlchemica[alchemicaType] > calculateTotalCapacity(_realmId, alchemicaType)) {
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

  function calculateTotalCapacity(uint256 _tokenId, uint256 _alchemicaType) internal view returns (uint256 capacity_) {
    AppStorage storage s = LibAppStorage.diamondStorage();
    for (uint256 i; i < s.parcels[_tokenId].reservoirs[_alchemicaType].length; i++) {
      capacity_ += InstallationDiamondInterface(s.installationsDiamond).getReservoirCapacity(s.parcels[_tokenId].reservoirs[_alchemicaType][i]);
    }
  }

  function getAvailableAlchemica(uint256 _realmId, uint256 _alchemicaType) internal view returns (uint256) {
    AppStorage storage s = LibAppStorage.diamondStorage();
    //First get the onchain amount
    uint256 available = s.parcels[_realmId].unclaimedAlchemica[_alchemicaType];
    //Then get the floating amount
    available += alchemicaSinceLastUpdate(_realmId, _alchemicaType);

    uint256 capacity = calculateTotalCapacity(_realmId, _alchemicaType);

    //ensure that available alchemica is not higher than available reservoir capacity
    return available > capacity ? capacity : available;
  }

  function popArray(uint256[] storage _array, uint256 _index) internal {
    _array[_index] = _array[_array.length - 1];
    _array.pop();
  }
}

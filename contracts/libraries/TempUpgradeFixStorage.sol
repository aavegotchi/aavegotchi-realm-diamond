// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library TempUpgradeFixStorage {
  struct Layout {
    uint256 index;
  }

  bytes32 internal constant STORAGE_SLOT = keccak256("aavegotchi.realm.contracts.storage.TempUpgradeFix");

  function layout() internal pure returns (Layout storage l) {
    bytes32 slot = STORAGE_SLOT;
    assembly {
      l.slot := slot
    }
  }
}

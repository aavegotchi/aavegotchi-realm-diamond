// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {LibERC998} from "../libraries/LibERC998.sol";
import {LibERC1155} from "../libraries/LibERC1155.sol";
import {LibAppStorageInstallation, InstallationAppStorage, UpgradeQueue, InstallationType} from "../libraries/AppStorageInstallation.sol";

library LibInstallation {
  function _equipInstallation(
    address _owner,
    uint256 _realmId,
    uint256 _installationId
  ) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    LibERC1155.removeFromOwner(_owner, _installationId, 1);
    LibERC1155.addToOwner(s.realmDiamond, _installationId, 1);
    emit LibERC1155.TransferSingle(address(this), _owner, s.realmDiamond, _installationId, 1);
    LibERC998.addToParent(s.realmDiamond, _realmId, _installationId, 1);
    emit LibERC1155.TransferToParent(s.realmDiamond, _realmId, _installationId, 1);
  }

  function _unequipInstallation(
    address _owner,
    uint256 _realmId,
    uint256 _installationId
  ) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    LibERC998.removeFromParent(s.realmDiamond, _realmId, _installationId, 1);
    emit LibERC1155.TransferFromParent(s.realmDiamond, _realmId, _installationId, 1);

    //add to owner for unequipType 1
    if (s.unequipTypes[_installationId] == 1) {
      LibERC1155.addToOwner(_owner, _installationId, 1);
      emit LibERC1155.TransferSingle(address(this), s.realmDiamond, _owner, _installationId, 1);
    } else {
      //default case: burn
      LibERC1155._burn(s.realmDiamond, _installationId, 1);
    }
  }

  /// @dev It is not expected for any of these dynamic arrays to have more than a small number of elements, so we use a naive removal approach
  function _removeFromParcelIdToUpgradeIds(uint256 _parcel, uint256 _upgradeId) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    uint256[] storage upgradeIds = s.parcelIdToUpgradeIds[_parcel];
    uint256 index = containsId(_upgradeId, upgradeIds);

    if (index != type(uint256).max) {
      uint256 last = upgradeIds[upgradeIds.length - 1];
      upgradeIds[index] = last;
      upgradeIds.pop();
    }
  }

  /// @return index The index of the id in the array. Returns uint256.max if not found
  function containsId(uint256 _id, uint256[] memory _ids) internal pure returns (uint256 index) {
    for (uint256 i; i < _ids.length; ) {
      if (_ids[i] == _id) {
        return i;
      }
      unchecked {
        ++i;
      }
    }
    return type(uint256).max;
  }
}

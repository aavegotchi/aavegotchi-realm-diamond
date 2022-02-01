// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {ERC998} from "../libraries/LibERC998.sol";
import {LibERC1155} from "../libraries/LibERC1155.sol";
import {LibAppStorageInstallation, InstallationAppStorage} from "../libraries/AppStorageInstallation.sol";

library LibInstallation {
  event TransferToParent(address indexed _toContract, uint256 indexed _toTokenId, uint256 indexed _tokenTypeId, uint256 _value);
  event TransferFromParent(address indexed _fromContract, uint256 indexed _fromTokenId, uint256 indexed _tokenTypeId, uint256 _value);

  function _equipInstallation(
    address _owner,
    uint256 _realmId,
    uint256 _installationId
  ) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    LibERC1155.removeFromOwner(_owner, _installationId, 1);
    LibERC1155.addToOwner(s.realmDiamond, _installationId, 1);
    emit LibERC1155.TransferSingle(address(this), _owner, s.realmDiamond, _installationId, 1);
    ERC998.addToParent(s.realmDiamond, _realmId, _installationId, 1);
    emit TransferToParent(s.realmDiamond, _realmId, _installationId, 1);
  }

  function _unequipInstallation(
    uint256 _realmId,
    uint256 _installationId
  ) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    ERC998.removeFromParent(s.realmDiamond, _realmId, _installationId, 1);
    emit TransferFromParent(s.realmDiamond, _realmId, _installationId, 1);
    LibERC1155._burn(s.realmDiamond, _installationId, 1);
  }
}

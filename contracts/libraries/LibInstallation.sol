// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {LibERC998} from "../libraries/LibERC998.sol";
import {LibERC1155} from "../libraries/LibERC1155.sol";
import {LibERC20} from "../libraries/LibERC20.sol";
import {LibAppStorageInstallation, InstallationAppStorage} from "../libraries/AppStorageInstallation.sol";

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

  function _unequipInstallation(uint256 _realmId, uint256 _installationId) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    LibERC998.removeFromParent(s.realmDiamond, _realmId, _installationId, 1);
    emit LibERC1155.TransferFromParent(s.realmDiamond, _realmId, _installationId, 1);
    LibERC1155._burn(s.realmDiamond, _installationId, 1);
  }

  function _splitAlchemica(uint256[] memory _alchemicaCost, address[4] memory _alchemicaAddresses) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    //take the required alchemica and split it
    for (uint256 i = 0; i < _alchemicaCost.length; i++) {
      uint256 greatPortal = (_alchemicaCost[i] * 40) / 100;
      uint256 pixelCraftPart = (_alchemicaCost[i] * 40) / 100;
      uint256 aavegotchiDAO = (_alchemicaCost[i] * 15) / 100;
      uint256 burn = (_alchemicaCost[i] * 5) / 100;
      LibERC20.transferFrom(_alchemicaAddresses[i], msg.sender, s.realmDiamond, greatPortal);
      LibERC20.transferFrom(_alchemicaAddresses[i], msg.sender, s.pixelCraft, pixelCraftPart);
      LibERC20.transferFrom(_alchemicaAddresses[i], msg.sender, s.aavegotchiDAO, aavegotchiDAO);
      LibERC20.transferFrom(_alchemicaAddresses[i], msg.sender, address(0), burn);
    }
  }
}

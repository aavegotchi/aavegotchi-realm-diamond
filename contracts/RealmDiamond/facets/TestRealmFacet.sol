// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../libraries/AppStorage.sol";
import "../../libraries/LibDiamond.sol";
import "../../libraries/LibStrings.sol";
import "../../libraries/LibMeta.sol";
import "../../libraries/LibERC721.sol";
import "../../libraries/LibRealm.sol";
import "../../libraries/LibAlchemica.sol";
import {InstallationDiamondInterface} from "../../interfaces/InstallationDiamondInterface.sol";

contract TestRealmFacet is Modifiers {
  /// @dev Equip installation without signature or owner checks for testing
  function testEquipInstallation(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) external {
    InstallationDiamondInterface.InstallationType memory installation = InstallationDiamondInterface(s.installationsDiamond).getInstallationType(
      _installationId
    );

    require(installation.level == 1, "RealmFacet: Can only equip lvl 1");

    if (installation.installationType == 1 || installation.installationType == 2) {
      require(s.parcels[_realmId].currentRound >= 1, "RealmFacet: Must survey before equipping");
    }
    if (installation.installationType == 3) {
      require(s.parcels[_realmId].lodgeId == 0, "RealmFacet: Lodge already equipped");
      s.parcels[_realmId].lodgeId = _installationId;
    }

    LibRealm.placeInstallation(_realmId, _installationId, _x, _y);
    InstallationDiamondInterface(s.installationsDiamond).equipInstallation(msg.sender, _realmId, _installationId);

    LibAlchemica.increaseTraits(_realmId, _installationId, false);
  }

  /// @dev Remove installation without signature/owner/alchemica effects for testing
  function testRemoveInstallation(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) external {
    LibRealm.removeInstallation(_realmId, _installationId, _x, _y);
    InstallationDiamondInterface(s.installationsDiamond).unequipInstallation(msg.sender, _realmId, _installationId);
    LibAlchemica.reduceTraits(_realmId, _installationId, false);
  }

  function testEquipTile(
    uint256 _realmId,
    uint256 _tileId,
    uint256 _x,
    uint256 _y
  ) external {
    LibRealm.placeTile(_realmId, _tileId, _x, _y);
    TileDiamondInterface(s.tileDiamond).equipTile(msg.sender, _realmId, _tileId);
  }

  function testUnequipTile(
    uint256 _realmId,
    uint256 _tileId,
    uint256 _x,
    uint256 _y
  ) external {
    LibRealm.removeTile(_realmId, _tileId, _x, _y);
    TileDiamondInterface(s.tileDiamond).unequipTile(msg.sender, _realmId, _tileId);
  }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {InstallationType, Modifiers, UpgradeQueue} from "../../libraries/AppStorageInstallation.sol";
import {LibStrings} from "../../libraries/LibStrings.sol";
import {RealmDiamond} from "../../interfaces/RealmDiamond.sol";
import {LibInstallation} from "../../libraries/LibInstallation.sol";
import {LibERC1155} from "../../libraries/LibERC1155.sol";

import "hardhat/console.sol";

contract InstallationAdminFacet is Modifiers {
  event AddressesUpdated(
    address _aavegotchiDiamond,
    address _realmDiamond,
    address _gltr,
    address _pixelcraft,
    address _aavegotchiDAO,
    bytes _backendPubKey
  );

  event UpgradeFinalized(uint256 indexed _realmId, uint256 _coordinateX, uint256 _coordinateY, uint256 _newInstallationId);

  /// @notice Allow the Diamond owner to deprecate an installation
  /// @dev Deprecated installations cannot be crafted by users
  /// @param _installationIds An array containing the identifiers of installations to deprecate
  function deprecateInstallations(uint256[] calldata _installationIds) external onlyOwner {
    for (uint256 i = 0; i < _installationIds.length; i++) {
      s.installationTypes[_installationIds[i]].deprecated = true;
    }
  }

  /// @notice Allow the diamond owner to set some important contract addresses
  /// @param _aavegotchiDiamond The aavegotchi diamond address
  /// @param _realmDiamond The Realm diamond address
  /// @param _gltr The $GLTR token address
  /// @param _pixelcraft Pixelcraft address
  /// @param _aavegotchiDAO The Aavegotchi DAO address
  /// @param _backendPubKey The Backend Key
  function setAddresses(
    address _aavegotchiDiamond,
    address _realmDiamond,
    address _gltr,
    address _pixelcraft,
    address _aavegotchiDAO,
    bytes calldata _backendPubKey
  ) external onlyOwner {
    s.aavegotchiDiamond = _aavegotchiDiamond;
    s.realmDiamond = _realmDiamond;
    s.gltr = _gltr;
    s.pixelcraft = _pixelcraft;
    s.aavegotchiDAO = _aavegotchiDAO;
    s.backendPubKey = _backendPubKey;
    emit AddressesUpdated(_aavegotchiDiamond, _realmDiamond, _gltr, _pixelcraft, _aavegotchiDAO, _backendPubKey);
  }

  /// @notice Allow the diamond owner to add an installation type
  /// @param _installationTypes An array of structs, each struct representing each installationType to be added
  function addInstallationTypes(InstallationType[] calldata _installationTypes) external onlyOwner {
    for (uint256 i = 0; i < _installationTypes.length; i++) {
      s.installationTypes.push(
        InstallationType(
          _installationTypes[i].width,
          _installationTypes[i].height,
          _installationTypes[i].installationType,
          _installationTypes[i].level,
          _installationTypes[i].alchemicaType,
          _installationTypes[i].spillRadius,
          _installationTypes[i].spillRate,
          _installationTypes[i].upgradeQueueBoost,
          _installationTypes[i].craftTime,
          _installationTypes[i].nextLevelId,
          _installationTypes[i].deprecated,
          _installationTypes[i].alchemicaCost,
          _installationTypes[i].harvestRate,
          _installationTypes[i].capacity,
          _installationTypes[i].prerequisites,
          _installationTypes[i].name
        )
      );
    }
  }

  /// @notice Allow the diamond owner to edit an installationType
  /// @param _typeId Identifier of the installationType to edit
  /// @param _installationType A struct containing the new properties of the installationType being edited
  function editInstallationType(uint256 _typeId, InstallationType calldata _installationType) external onlyOwner {
    s.installationTypes[_typeId] = _installationType;
  }

  /// @notice Allow anyone to finalize any existing queue upgrade
  /// @dev Only three queue upgrades can be finalized in one transaction
  function finalizeUpgrade() public {
    require(s.upgradeQueue.length > 0, "InstallationFacet: No upgrades");
    //can only process 3 upgrades per tx
    uint256 counter = 3;
    uint256 offset;
    uint256 _upgradeQueueLength = s.upgradeQueue.length;
    for (uint256 index; index < _upgradeQueueLength; index++) {
      UpgradeQueue memory queueUpgrade = s.upgradeQueue[index - offset];
      // check that upgrade is ready
      if (block.number >= queueUpgrade.readyBlock) {
        // burn old installation
        LibInstallation._unequipInstallation(queueUpgrade.parcelId, queueUpgrade.installationId);
        // mint new installation
        uint256 nextLevelId = s.installationTypes[queueUpgrade.installationId].nextLevelId;
        LibERC1155._safeMint(queueUpgrade.owner, nextLevelId, index - offset);
        // equip new installation
        LibInstallation._equipInstallation(queueUpgrade.owner, queueUpgrade.parcelId, nextLevelId);

        RealmDiamond realm = RealmDiamond(s.realmDiamond);
        realm.upgradeInstallation(
          queueUpgrade.parcelId,
          queueUpgrade.installationId,
          nextLevelId,
          queueUpgrade.coordinateX,
          queueUpgrade.coordinateY
        );

        // update updateQueueLength
        realm.subUpgradeQueueLength(queueUpgrade.parcelId);

        // clean unique hash
        bytes32 uniqueHash = keccak256(
          abi.encodePacked(queueUpgrade.parcelId, queueUpgrade.coordinateX, queueUpgrade.coordinateY, queueUpgrade.installationId)
        );
        s.upgradeHashes[uniqueHash] = 0;

        // pop upgrade from array
        s.upgradeQueue[index - offset] = s.upgradeQueue[s.upgradeQueue.length - 1];
        s.upgradeQueue.pop();
        counter--;
        offset++;
        emit UpgradeFinalized(queueUpgrade.parcelId, queueUpgrade.coordinateX, queueUpgrade.coordinateY, nextLevelId);
      }
      if (counter == 0) break;
    }
    if (counter == 3) revert("InstallationFacet: No upgrades ready");
  }
}

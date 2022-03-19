// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {InstallationType, Modifiers} from "../../libraries/AppStorageInstallation.sol";
import {LibStrings} from "../../libraries/LibStrings.sol";
import {RealmDiamond} from "../../interfaces/RealmDiamond.sol";

import "hardhat/console.sol";

contract InstallationAdminFacet is Modifiers {
  event AddressesUpdated(address _aavegotchiDiamond, address _realmDiamond, address _glmr, address _pixelCraft, address _aavegotchiDAO);

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
  /// @param _glmr The $GLMR token address
  function setAddresses(
    address _aavegotchiDiamond,
    address _realmDiamond,
    address _glmr,
    address _pixelCraft,
    address _aavegotchiDAO
  ) external onlyOwner {
    s.aavegotchiDiamond = _aavegotchiDiamond;
    s.realmDiamond = _realmDiamond;
    s.glmr = _glmr;
    s.pixelCraft = _pixelCraft;
    s.aavegotchiDAO = _aavegotchiDAO;
    emit AddressesUpdated(_aavegotchiDiamond, _realmDiamond, _glmr, _pixelCraft, _aavegotchiDAO);
  }

  /// @notice Allow the diamond owner to add an installation type
  /// @param _installationTypes An array of structs, each struct representing each installationType to be added
  function addInstallationTypes(InstallationType[] calldata _installationTypes) external onlyOwner {
    for (uint256 i = 0; i < _installationTypes.length; i++) {
      s.installationTypes.push(
        InstallationType(
          _installationTypes[i].width,
          _installationTypes[i].height,
          _installationTypes[i].deprecated,
          _installationTypes[i].installationType,
          _installationTypes[i].level,
          _installationTypes[i].alchemicaType,
          _installationTypes[i].alchemicaCost,
          _installationTypes[i].harvestRate,
          _installationTypes[i].capacity,
          _installationTypes[i].spillRadius,
          _installationTypes[i].spillRate,
          _installationTypes[i].upgradeQueueBoost,
          _installationTypes[i].craftTime,
          _installationTypes[i].nextLevelId,
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
}

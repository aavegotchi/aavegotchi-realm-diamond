// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {InstallationType, Modifiers} from "../../libraries/AppStorageInstallation.sol";

import "hardhat/console.sol";

contract InstallationAdminFacet is Modifiers {
  event AddressesUpdated(address _aavegotchiDiamond, address _realmDiamond, address _gltr, address _pixelcraft, address _aavegotchiDAO);

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
  function setAddresses(
    address _aavegotchiDiamond,
    address _realmDiamond,
    address _gltr,
    address _pixelcraft,
    address _aavegotchiDAO
  ) external onlyOwner {
    s.aavegotchiDiamond = _aavegotchiDiamond;
    s.realmDiamond = _realmDiamond;
    s.gltr = _gltr;
    s.pixelcraft = _pixelcraft;
    s.aavegotchiDAO = _aavegotchiDAO;
    emit AddressesUpdated(_aavegotchiDiamond, _realmDiamond, _gltr, _pixelcraft, _aavegotchiDAO);
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
          _installationTypes[i].name,
          _installationTypes[i].deprecateTime
        )
      );
    }
  }

  function editDeprecateTime(uint256 _typeId, uint40 _deprecateTime) external onlyOwner {
    s.installationTypes[_typeId].deprecateTime = _deprecateTime;
  }
}

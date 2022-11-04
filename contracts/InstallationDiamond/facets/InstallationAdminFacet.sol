// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {InstallationType, InstallationTypeIO, Modifiers, UpgradeQueue} from "../../libraries/AppStorageInstallation.sol";
import {RealmDiamond} from "../../interfaces/RealmDiamond.sol";
import {LibSignature} from "../../libraries/LibSignature.sol";
import {IERC721} from "../../interfaces/IERC721.sol";
import {LibItems} from "../../libraries/LibItems.sol";
import {IERC20} from "../../interfaces/IERC20.sol";
import {LibERC1155} from "../../libraries/LibERC1155.sol";
import {LibERC998} from "../../libraries/LibERC998.sol";

contract InstallationAdminFacet is Modifiers {
  event AddressesUpdated(
    address _aavegotchiDiamond,
    address _realmDiamond,
    address _gltr,
    address _pixelcraft,
    address _aavegotchiDAO,
    bytes _backendPubKey
  );

  event AddInstallationType(uint256 _installationId);
  event EditInstallationType(uint256 _installationId);
  event DeprecateInstallation(uint256 _installationId);
  event SetInstallationUnequipType(uint256 _installationId, uint256 _unequipType);
  event EditInstallationUnequipType(uint256 _installationId);
  event UpgradeCancelled(uint256 indexed _realmId, uint256 _coordinateX, uint256 _coordinateY, uint256 _installationId);
  event EditDeprecateTime(uint256 _installationId, uint256 _newDeprecatetime);

  /// @notice Allow the Diamond owner to deprecate an installation
  /// @dev Deprecated installations cannot be crafted by users
  /// @param _installationIds An array containing the identifiers of installations to deprecate
  function deprecateInstallations(uint256[] calldata _installationIds) external onlyOwner {
    for (uint256 i = 0; i < _installationIds.length; i++) {
      s.installationTypes[_installationIds[i]].deprecated = true;
      emit DeprecateInstallation(_installationIds[i]);
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

  function getAddresses()
    external
    view
    returns (
      address _aavegotchiDiamond,
      address _realmDiamond,
      address _gltr,
      address _pixelcraft,
      address _aavegotchiDAO,
      bytes memory _backendPubKey
    )
  {
    return (s.aavegotchiDiamond, s.realmDiamond, s.gltr, s.pixelcraft, s.aavegotchiDAO, s.backendPubKey);
  }

  /// @notice Allow the diamond owner to add an installation type
  /// @param _installationTypes An array of structs, each struct representing each installationType to be added
  function addInstallationTypes(InstallationTypeIO[] calldata _installationTypes) external onlyOwner {
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
      s.unequipTypes[s.installationTypes.length - 1] = _installationTypes[i].unequipType;

      emit AddInstallationType(s.installationTypes.length - 1);
      emit SetInstallationUnequipType(s.installationTypes.length - 1, _installationTypes[i].unequipType);

      if(_installationTypes[i].deprecateTime > 0){
        s.deprecateTime[s.installationTypes.length - 1] = _installationTypes[i].deprecateTime;
        emit EditDeprecateTime(s.installationTypes.length - 1, _installationTypes[i].deprecateTime);
      }
    }
  }

  function editDeprecateTime(uint256 _typeId, uint40 _deprecateTime) external onlyOwner {
    s.deprecateTime[_typeId] = _deprecateTime;
    emit EditDeprecateTime(_typeId, _deprecateTime);
  }

  function editInstallationTypes(uint256[] calldata _ids, InstallationType[] calldata _installationTypes) external onlyOwner {
    require(_ids.length == _installationTypes.length, "InstallationAdminFacet: Mismatched arrays");
    for (uint256 i = 0; i < _ids.length; i++) {
      uint256 id = _ids[i];
      s.installationTypes[id] = _installationTypes[i];
      emit EditInstallationType(id);
    }
  }

  function editInstallationUnequipTypes(uint256[] calldata _ids, uint256[] calldata _unequipTypes) external onlyOwner {
    require(_ids.length == _unequipTypes.length, "InstallationAdminFacet: Mismatched arrays");
    for (uint256 i = 0; i < _ids.length; i++) {
      uint256 id = _ids[i];
      s.unequipTypes[id] = _unequipTypes[i];
      emit EditInstallationUnequipType(id);
    }
  }

  /// @notice Allow the owner to mint installations
  /// @dev This function does not check for deprecation because otherwise the installations could be minted by players.
  /// @dev Make sure that the installation is deprecated when you add it onchain
  /// @param _installationIds An array containing the identifiers of the installationTypes to mint
  /// @param _amounts An array containing the amounts of the installationTypes to mint
  /// @param _toAddress Address to mint installations
  function mintInstallations(
    uint16[] calldata _installationIds,
    uint16[] calldata _amounts,
    address _toAddress
  ) external onlyOwner {
    require(_installationIds.length == _amounts.length, "InstallationFacet: Mismatched arrays");
    for (uint256 i = 0; i < _installationIds.length; i++) {
      uint256 installationId = _installationIds[i];
      require(installationId < s.installationTypes.length, "InstallationFacet: Installation does not exist");

      InstallationType memory installationType = s.installationTypes[installationId];
      require(installationType.deprecated, "InstallationFacet: Not deprecated");
      //level check
      require(installationType.level == 1, "InstallationFacet: Can only craft level 1");

      LibERC1155._safeMint(_toAddress, installationId, _amounts[i], false, 0);
    }
  }

  struct MissingAltars {
    uint256 _parcelId;
    uint256 _oldAltarId;
    uint256 _newAltarId;
  }

  function fixMissingAltars(MissingAltars[] memory _altars) external onlyOwner {
    for (uint256 i = 0; i < _altars.length; i++) {
      MissingAltars memory altar = _altars[i];
      uint256 parcelId = altar._parcelId;
      uint256 oldId = altar._oldAltarId;
      uint256 newId = altar._newAltarId;

      RealmDiamond realm = RealmDiamond(address(s.realmDiamond));

      if (oldId > 0) {
        //remove old id
        LibERC998.removeFromParent(s.realmDiamond, parcelId, oldId, 1);
      }

      //mint new id to owner
      LibERC1155._safeMint(realm.ownerOf(parcelId), newId, 1, false, 0);

      //remove from owner
      LibERC1155.removeFromOwner(realm.ownerOf(parcelId), newId, 1);
      LibERC998.addToParent(s.realmDiamond, parcelId, newId, 1);

      //fix
      LibERC1155.addToOwner(s.realmDiamond, newId, 1);
    }
  }

  ///@notice Used if a parcel has an upgrade that must be deleted.
  // function deleteBuggedUpgrades(
  //   uint256 _parcelId,
  //   uint16 _coordinateX,
  //   uint16 _coordinateY,
  //   uint256 _installationId
  // ) external onlyOwner {
  //   // check unique hash
  //   bytes32 uniqueHash = keccak256(abi.encodePacked(_parcelId, _coordinateX, _coordinateY, _installationId));
  //   s.upgradeHashes[uniqueHash] = 0;
  // }

  struct BuggedUpgradeInput {
    uint256 _parcelId;
    uint16 _coordinateX;
    uint16 _coordinateY;
    uint256 _installationId;
  }

  ///@notice Used if a parcel has an upgrade that must be deleted.
  function deleteBuggedUpgrades(BuggedUpgradeInput[] memory _upgrades) external onlyOwner {
    for (uint256 i = 0; i < _upgrades.length; i++) {
      BuggedUpgradeInput memory u = _upgrades[i];
      // check unique hash
      bytes32 uniqueHash = keccak256(abi.encodePacked(u._parcelId, u._coordinateX, u._coordinateY, u._installationId));
      s.upgradeHashes[uniqueHash] = 0;
    }
  }

  function getUniqueHash(
    uint256 _parcelId,
    uint16 _x,
    uint16 _y,
    uint256 _installationId
  ) external view returns (uint256) {
    return s.upgradeHashes[keccak256(abi.encodePacked(_parcelId, _x, _y, _installationId))];
  }
}

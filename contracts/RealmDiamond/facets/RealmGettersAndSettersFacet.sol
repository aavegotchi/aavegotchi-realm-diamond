// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";

import "../../libraries/LibRealm.sol";
import "../../libraries/LibAlchemica.sol";

import {InstallationDiamondInterface} from "../../interfaces/InstallationDiamondInterface.sol";
import "./ERC721Facet.sol";

contract RealmGettersAndSettersFacet is Modifiers {
  event ParcelAccessRightSet(uint256 _realmId, uint256 _actionRight, uint256 _accessRight);
  event ParcelWhitelistSet(uint256 _realmId, uint256 _actionRight, uint256 _whitelistId);
  event ResyncParcel(uint256 _realmId);
  event SetAltarId(uint256 _realmId, uint256 _altarId);

  /// @notice Return the maximum realm supply
  /// @return The max realm token supply
  function maxSupply() external pure returns (uint256) {
    return LibRealm.MAX_SUPPLY;
  }

  function setParcelsAccessRights(
    uint256[] calldata _realmIds,
    uint256[] calldata _actionRights,
    uint256[] calldata _accessRights
  ) external gameActive {
    require(_realmIds.length == _accessRights.length && _realmIds.length == _actionRights.length, "RealmGettersAndSettersFacet: Mismatched arrays");
    for (uint256 i; i < _realmIds.length; i++) {
      require(LibMeta.msgSender() == s.parcels[_realmIds[i]].owner, "RealmGettersAndSettersFacet: Only Parcel owner can call");
      require(LibRealm.isAccessRightValid(_actionRights[i], _accessRights[i]), "RealmGettersAndSettersFacet: Invalid access rights");
      s.accessRights[_realmIds[i]][_actionRights[i]] = _accessRights[i];
      emit ParcelAccessRightSet(_realmIds[i], _actionRights[i], _accessRights[i]);
    }
  }

  function setParcelsAccessRightWithWhitelists(
    uint256[] calldata _realmIds,
    uint256[] calldata _actionRights,
    uint256[] calldata _accessRights,
    uint32[] calldata _whitelistIds
  ) external gameActive {
    require(
      _realmIds.length == _actionRights.length && _whitelistIds.length == _actionRights.length && _whitelistIds.length == _actionRights.length,
      "RealmGettersAndSettersFacet: Mismatched arrays"
    );

    require(_realmIds.length == _accessRights.length && _realmIds.length == _actionRights.length, "RealmGettersAndSettersFacet: Mismatched arrays");
    for (uint256 i; i < _realmIds.length; i++) {
      require(LibMeta.msgSender() == s.parcels[_realmIds[i]].owner, "RealmGettersAndSettersFacet: Only Parcel owner can call");
      require(LibRealm.isAccessRightValid(_actionRights[i], _accessRights[i]), "RealmGettersAndSettersFacet: Invalid access rights");
      s.accessRights[_realmIds[i]][_actionRights[i]] = _accessRights[i];

      //for whitelist
      if (_accessRights[i] == 2) {
        s.whitelistIds[_realmIds[i]][_actionRights[i]] = _whitelistIds[i];
        emit ParcelWhitelistSet(_realmIds[i], _actionRights[i], _whitelistIds[i]);
      }

      emit ParcelAccessRightSet(_realmIds[i], _actionRights[i], _accessRights[i]);
    }
  }

  /**
  @dev Used to resync a parcel on the subgraph if metadata is added later 
@param _tokenIds The parcels to resync
  */
  function resyncParcel(uint256[] calldata _tokenIds) external onlyOwner {
    for (uint256 index = 0; index < _tokenIds.length; index++) {
      emit ResyncParcel(_tokenIds[index]);
    }
  }

  function setGameActive(bool _gameActive) external onlyOwner {
    s.gameActive = _gameActive;
  }

  struct ParcelOutput {
    string parcelId;
    string parcelAddress;
    address owner;
    uint256 coordinateX; //x position on the map
    uint256 coordinateY; //y position on the map
    uint256 size; //0=humble, 1=reasonable, 2=spacious vertical, 3=spacious horizontal, 4=partner
    uint256 district;
    uint256[4] boost;
    uint256 timeRemainingToClaim;
  }

  /// @notice Fetch information about a parcel
  /// @param _realmId The identifier of the parcel being queried
  /// @return output_ A struct containing details about the parcel being queried
  function getParcelInfo(uint256 _realmId) external view returns (ParcelOutput memory output_) {
    Parcel storage parcel = s.parcels[_realmId];
    output_.parcelId = parcel.parcelId;
    output_.owner = parcel.owner;
    output_.coordinateX = parcel.coordinateX;
    output_.coordinateY = parcel.coordinateY;
    output_.size = parcel.size;
    output_.parcelAddress = parcel.parcelAddress;
    output_.district = parcel.district;
    output_.boost = parcel.alchemicaBoost;
    output_.timeRemainingToClaim = s.lastClaimedAlchemica[_realmId];
  }

  function checkCoordinates(
    uint256 _realmId,
    uint256 _coordinateX,
    uint256 _coordinateY,
    uint256 _installationId
  ) public view {
    Parcel storage parcel = s.parcels[_realmId];
    require(parcel.buildGrid[_coordinateX][_coordinateY] == _installationId, "RealmGettersAndSettersFacet: wrong coordinates");
    require(parcel.startPositionBuildGrid[_coordinateX][_coordinateY] == _installationId, "RealmGettersAndSettersFacet: wrong coordinates");
  }

  function batchGetDistrictParcels(address _owner, uint256 _district) external view returns (uint256[] memory) {
    uint256 totalSupply = ERC721Facet(address(this)).totalSupply();
    uint256 balance = ERC721Facet(address(this)).balanceOf(_owner);
    uint256[] memory output_ = new uint256[](balance);
    uint256 counter;
    for (uint256 i; i < totalSupply; i++) {
      if (s.parcels[i].district == _district && s.parcels[i].owner == _owner) {
        output_[counter] = i;
        counter++;
      }
    }
    return output_;
  }

  function getParcelUpgradeQueueLength(uint256 _parcelId) external view returns (uint256) {
    return s.parcels[_parcelId].upgradeQueueLength;
  }

  function getParcelUpgradeQueueCapacity(uint256 _parcelId) external view returns (uint256) {
    return s.parcels[_parcelId].upgradeQueueCapacity;
  }

  function getParcelsAccessRights(uint256[] calldata _parcelIds, uint256[] calldata _actionRights) external view returns (uint256[] memory output_) {
    require(_parcelIds.length == _actionRights.length, "RealmGettersAndSettersFacet: Mismatched arrays");
    output_ = new uint256[](_parcelIds.length);
    for (uint256 i; i < _parcelIds.length; i++) {
      output_[i] = s.accessRights[_parcelIds[i]][_actionRights[i]];
    }
    return output_;
  }

  function getParcelsAccessRightsWhitelistIds(uint256[] calldata _parcelIds, uint256[] calldata _actionRights)
    external
    view
    returns (uint256[] memory output_)
  {
    require(_parcelIds.length == _actionRights.length, "RealmGettersAndSettersFacet: Mismatched arrays");
    output_ = new uint256[](_parcelIds.length);
    for (uint256 i; i < _parcelIds.length; i++) {
      output_[i] = s.whitelistIds[_parcelIds[i]][_actionRights[i]];
    }
    return output_;
  }

  function getAltarId(uint256 _parcelId) external view returns (uint256) {
    return s.parcels[_parcelId].altarId;
  }

  function setAltarId(uint256 _parcelId, uint256 _altarId) external onlyOwner {
    s.parcels[_parcelId].altarId = _altarId;
    emit SetAltarId(_parcelId, _altarId);
  }

  function verifyAccessRight(
    uint256 _realmId,
    uint256 _gotchiId,
    uint256 _actionRight,
    address _sender
  ) external view {
    LibRealm.verifyAccessRight(_realmId, _gotchiId, _actionRight, _sender);
  }
}

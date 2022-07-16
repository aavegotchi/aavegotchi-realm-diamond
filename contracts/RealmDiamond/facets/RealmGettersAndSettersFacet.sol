// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";

import "../../libraries/LibRealm.sol";
import "../../libraries/LibAlchemica.sol";

import {InstallationDiamondInterface} from "../../interfaces/InstallationDiamondInterface.sol";
import "./ERC721Facet.sol";

contract RealmGettersAndSettersFacet is Modifiers {
  event ParcelAccessRightSet(uint256 _realmId, uint256 _actionRight, uint256 _accessRight);
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
  }

  function getHumbleGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[8][8] memory output_) {
    require(s.parcels[_parcelId].size == 0, "RealmGettersAndSettersFacet: Not humble");
    for (uint256 i; i < 8; i++) {
      for (uint256 j; j < 8; j++) {
        if (_gridType == 0) {
          output_[i][j] = s.parcels[_parcelId].buildGrid[j][i];
        } else if (_gridType == 1) {
          output_[i][j] = s.parcels[_parcelId].tileGrid[j][i];
        }
      }
    }
  }

  function getReasonableGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[16][16] memory output_) {
    require(s.parcels[_parcelId].size == 1, "RealmGettersAndSettersFacet: Not reasonable");
    for (uint256 i; i < 16; i++) {
      for (uint256 j; j < 16; j++) {
        if (_gridType == 0) {
          output_[i][j] = s.parcels[_parcelId].buildGrid[j][i];
        } else if (_gridType == 1) {
          output_[i][j] = s.parcels[_parcelId].tileGrid[j][i];
        }
      }
    }
  }

  function getSpaciousVerticalGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[32][64] memory output_) {
    require(s.parcels[_parcelId].size == 2, "RealmGettersAndSettersFacet: Not spacious vertical");
    for (uint256 i; i < 64; i++) {
      for (uint256 j; j < 32; j++) {
        if (_gridType == 0) {
          output_[i][j] = s.parcels[_parcelId].buildGrid[j][i];
        } else if (_gridType == 1) {
          output_[i][j] = s.parcels[_parcelId].tileGrid[j][i];
        }
      }
    }
  }

  function getSpaciousHorizontalGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[64][32] memory output_) {
    require(s.parcels[_parcelId].size == 3, "RealmGettersAndSettersFacet: Not spacious horizontal");
    for (uint256 i; i < 32; i++) {
      for (uint256 j; j < 64; j++) {
        if (_gridType == 0) {
          output_[i][j] = s.parcels[_parcelId].buildGrid[j][i];
        } else if (_gridType == 1) {
          output_[i][j] = s.parcels[_parcelId].tileGrid[j][i];
        }
      }
    }
  }

  function getPaartnerGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[64][64] memory output_) {
    require(s.parcels[_parcelId].size == 4, "RealmGettersAndSettersFacet: Not paartner");
    for (uint256 i; i < 64; i++) {
      for (uint256 j; j < 64; j++) {
        if (_gridType == 0) {
          output_[i][j] = s.parcels[_parcelId].buildGrid[j][i];
        } else if (_gridType == 1) {
          output_[i][j] = s.parcels[_parcelId].tileGrid[j][i];
        }
      }
    }
  }

  struct ParcelCoordinates {
    uint256[64][64] coords;
  }

  function batchGetGrid(uint256[] calldata _parcelIds, uint256 _gridType) external view returns (ParcelCoordinates[] memory) {
    ParcelCoordinates[] memory parcels = new ParcelCoordinates[](_parcelIds.length);
    for (uint256 k; k < _parcelIds.length; k++) {
      for (uint256 i; i < 64; i++) {
        for (uint256 j; j < 64; j++) {
          if (_gridType == 0) {
            parcels[k].coords[i][j] = s.parcels[_parcelIds[k]].buildGrid[j][i];
          } else if (_gridType == 1) {
            parcels[k].coords[i][j] = s.parcels[_parcelIds[k]].tileGrid[j][i];
          }
        }
      }
    }
    return parcels;
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

  function getAltarId(uint256 _parcelId) external view returns (uint256) {
    return s.parcels[_parcelId].altarId;
  }

  function setAltarId(uint256 _parcelId, uint256 _altarId) external onlyOwner {
    s.parcels[_parcelId].altarId = _altarId;
    emit SetAltarId(_parcelId, _altarId);
  }
}

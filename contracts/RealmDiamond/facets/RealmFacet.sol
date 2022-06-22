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
import "../../libraries/LibSignature.sol";
import "./ERC721Facet.sol";

contract RealmFacet is Modifiers {
  uint256 constant MAX_SUPPLY = 420069;

  struct MintParcelInput {
    uint256 coordinateX;
    uint256 coordinateY;
    uint256 district;
    string parcelId;
    string parcelAddress;
    uint256 size; //0=humble, 1=reasonable, 2=spacious vertical, 3=spacious horizontal, 4=partner
    uint256[4] boost; //fud, fomo, alpha, kek
  }

  event ResyncParcel(uint256 _realmId);
  event EquipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y);
  event UnequipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y);
  event EquipTile(uint256 _realmId, uint256 _tileId, uint256 _x, uint256 _y);
  event UnequipTile(uint256 _realmId, uint256 _tileId, uint256 _x, uint256 _y);
  event AavegotchiDiamondUpdated(address _aavegotchiDiamond);
  event InstallationUpgraded(uint256 _realmId, uint256 _prevInstallationId, uint256 _nextInstallationId, uint256 _coordinateX, uint256 _coordinateY);
  event ParcelAccessRightSet(uint256 _realmId, uint256 _actionRight, uint256 _accessRight);

  /// @notice Return the maximum realm supply
  /// @return The max realm token supply
  function maxSupply() external pure returns (uint256) {
    return MAX_SUPPLY;
  }

  /// @notice Allow the diamond owner to mint new parcels
  /// @param _to The address to mint the parcels to
  /// @param _tokenIds The identifiers of tokens to mint
  /// @param _metadata An array of structs containing the metadata of each parcel being minted
  function mintParcels(
    address[] calldata _to,
    uint256[] calldata _tokenIds,
    MintParcelInput[] memory _metadata
  ) external onlyOwner {
    for (uint256 index = 0; index < _tokenIds.length; index++) {
      require(s.tokenIds.length < MAX_SUPPLY, "RealmFacet: Cannot mint more than 420,069 parcels");
      uint256 tokenId = _tokenIds[index];
      address toAddress = _to[index];
      MintParcelInput memory metadata = _metadata[index];
      require(_tokenIds.length == _metadata.length, "Inputs must be same length");
      require(_to.length == _tokenIds.length, "Inputs must be same length");

      Parcel storage parcel = s.parcels[tokenId];
      parcel.coordinateX = metadata.coordinateX;
      parcel.coordinateY = metadata.coordinateY;
      parcel.parcelId = metadata.parcelId;
      parcel.size = metadata.size;
      parcel.district = metadata.district;
      parcel.parcelAddress = metadata.parcelAddress;
      parcel.alchemicaBoost = metadata.boost;

      LibERC721.safeMint(toAddress, tokenId);
    }
  }

  /// @notice Allow a parcel owner to equip an installation
  /// @dev The _x and _y denote the starting coordinates of the installation and are used to make sure that slot is available on a parcel
  /// @param _realmId The identifier of the parcel which the installation is being equipped on
  /// @param _installationId The identifier of the installation being equipped
  /// @param _x The x(horizontal) coordinate of the installation
  /// @param _y The y(vertical) coordinate of the installation
  function equipInstallation(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y,
    bytes memory _signature
  ) external onlyParcelOwner(_realmId) gameActive {
    require(
      LibSignature.isValid(keccak256(abi.encodePacked(_realmId, _installationId, _x, _y)), _signature, s.backendPubKey),
      "RealmFacet: Invalid signature"
    );

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

    emit EquipInstallation(_realmId, _installationId, _x, _y);
  }

  /// @notice Allow a parcel owner to unequip an installation
  /// @dev The _x and _y denote the starting coordinates of the installation and are used to make sure that slot is available on a parcel
  /// @param _realmId The identifier of the parcel which the installation is being unequipped from
  /// @param _installationId The identifier of the installation being unequipped
  /// @param _x The x(horizontal) coordinate of the installation
  /// @param _y The y(vertical) coordinate of the installation
  function unequipInstallation(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y,
    bytes memory _signature
  ) external onlyParcelOwner(_realmId) gameActive {
    require(
      LibSignature.isValid(keccak256(abi.encodePacked(_realmId, _installationId, _x, _y)), _signature, s.backendPubKey),
      "RealmFacet: Invalid signature"
    );

    LibRealm.removeInstallation(_realmId, _installationId, _x, _y);
    InstallationDiamondInterface(s.installationsDiamond).unequipInstallation(msg.sender, _realmId, _installationId);
    LibAlchemica.reduceTraits(_realmId, _installationId, false);

    emit UnequipInstallation(_realmId, _installationId, _x, _y);
  }

  /// @notice Allow a parcel owner to equip a tile
  /// @dev The _x and _y denote the starting coordinates of the tile and are used to make sure that slot is available on a parcel
  /// @param _realmId The identifier of the parcel which the tile is being equipped on
  /// @param _tileId The identifier of the tile being equipped
  /// @param _x The x(horizontal) coordinate of the tile
  /// @param _y The y(vertical) coordinate of the tile
  function equipTile(
    uint256 _realmId,
    uint256 _tileId,
    uint256 _x,
    uint256 _y,
    bytes memory _signature
  ) external onlyParcelOwner(_realmId) gameActive {
    require(
      LibSignature.isValid(keccak256(abi.encodePacked(_realmId, _tileId, _x, _y)), _signature, s.backendPubKey),
      "RealmFacet: Invalid signature"
    );
    LibRealm.placeTile(_realmId, _tileId, _x, _y);
    TileDiamondInterface(s.tileDiamond).equipTile(msg.sender, _realmId, _tileId);

    emit EquipTile(_realmId, _tileId, _x, _y);
  }

  /// @notice Allow a parcel owner to unequip a tile
  /// @dev The _x and _y denote the starting coordinates of the tile and are used to make sure that slot is available on a parcel
  /// @param _realmId The identifier of the parcel which the tile is being unequipped from
  /// @param _tileId The identifier of the tile being unequipped
  /// @param _x The x(horizontal) coordinate of the tile
  /// @param _y The y(vertical) coordinate of the tile
  function unequipTile(
    uint256 _realmId,
    uint256 _tileId,
    uint256 _x,
    uint256 _y,
    bytes memory _signature
  ) external onlyParcelOwner(_realmId) gameActive {
    require(
      LibSignature.isValid(keccak256(abi.encodePacked(_realmId, _tileId, _x, _y)), _signature, s.backendPubKey),
      "RealmFacet: Invalid signature"
    );
    LibRealm.removeTile(_realmId, _tileId, _x, _y);

    TileDiamondInterface(s.tileDiamond).unequipTile(msg.sender, _realmId, _tileId);

    emit UnequipTile(_realmId, _tileId, _x, _y);
  }

  function setParcelsAccessRights(
    uint256[] calldata _realmIds,
    uint256[] calldata _actionRights,
    uint256[] calldata _accessRights
  ) external gameActive {
    require(_realmIds.length == _accessRights.length && _realmIds.length == _actionRights.length, "RealmFacet: Mismatched arrays");
    for (uint256 i; i < _realmIds.length; i++) {
      require(LibMeta.msgSender() == s.parcels[_realmIds[i]].owner, "RealmFacet: Only Parcel owner can call");
      require(LibRealm.isAccessRightValid(_actionRights[i], _accessRights[i]), "RealmFacet: Invalid access rights");
      s.accessRights[_realmIds[i]][_actionRights[i]] = _accessRights[i];
      emit ParcelAccessRightSet(_realmIds[i], _actionRights[i], _accessRights[i]);
    }
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
    require(parcel.buildGrid[_coordinateX][_coordinateY] == _installationId, "RealmFacet: wrong coordinates");
  }

  function upgradeInstallation(
    uint256 _realmId,
    uint256 _prevInstallationId,
    uint256 _nextInstallationId,
    uint256 _coordinateX,
    uint256 _coordinateY
  ) external onlyInstallationDiamond {
    LibRealm.removeInstallation(_realmId, _prevInstallationId, _coordinateX, _coordinateY);
    LibRealm.placeInstallation(_realmId, _nextInstallationId, _coordinateX, _coordinateY);
    LibAlchemica.reduceTraits(_realmId, _prevInstallationId, true);
    LibAlchemica.increaseTraits(_realmId, _nextInstallationId, true);
    emit InstallationUpgraded(_realmId, _prevInstallationId, _nextInstallationId, _coordinateX, _coordinateY);
  }

  function addUpgradeQueueLength(uint256 _realmId) external onlyInstallationDiamond {
    s.parcels[_realmId].upgradeQueueLength++;
  }

  function subUpgradeQueueLength(uint256 _realmId) external onlyInstallationDiamond {
    s.parcels[_realmId].upgradeQueueLength--;
  }

  function getHumbleGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[8][8] memory output_) {
    require(s.parcels[_parcelId].size == 0, "RealmFacet: Not humble");
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
    require(s.parcels[_parcelId].size == 1, "RealmFacet: Not reasonable");
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
    require(s.parcels[_parcelId].size == 2, "RealmFacet: Not spacious vertical");
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
    require(s.parcels[_parcelId].size == 3, "RealmFacet: Not spacious horizontal");
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
    require(s.parcels[_parcelId].size == 4, "RealmFacet: Not paartner");
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
    require(_parcelIds.length == _actionRights.length, "RealmFacet: Mismatched arrays");
    output_ = new uint256[](_parcelIds.length);
    for (uint256 i; i < _parcelIds.length; i++) {
      output_[i] = s.accessRights[_parcelIds[i]][_actionRights[i]];
    }
  }

  function fixAltarLevel(uint256[] memory _parcelIds) external onlyOwner {
    InstallationDiamondInterface installationsDiamond = InstallationDiamondInterface(s.installationsDiamond);
    for (uint256 i; i < _parcelIds.length; i++) {
      uint256 parcelId = _parcelIds[i];
      Parcel storage parcel = s.parcels[parcelId];
      // Check that the altar is actually supposed to be level 2
      if (installationsDiamond.balanceOfToken(address(this), parcelId, 11) >= 1 && parcel.altarId == 10) {
        parcel.altarId = 11;
      }
    }
  }
}

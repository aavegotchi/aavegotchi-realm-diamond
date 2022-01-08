// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";
import "../../libraries/LibDiamond.sol";
import "../../libraries/LibStrings.sol";
import "../../libraries/LibMeta.sol";
import "../../libraries/LibERC721.sol";
import "../../libraries/LibRealm.sol";
import "../../libraries/LibAlchemica.sol";
import {InstallationDiamondInterface} from "../../interfaces/InstallationDiamond.sol";
import "../../test/AlchemicaToken.sol";

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
    address _to,
    uint256[] calldata _tokenIds,
    MintParcelInput[] memory _metadata
  ) external onlyOwner {
    for (uint256 index = 0; index < _tokenIds.length; index++) {
      require(s.tokenIds.length < MAX_SUPPLY, "RealmFacet: Cannot mint more than 420,069 parcels");
      uint256 tokenId = _tokenIds[index];
      MintParcelInput memory metadata = _metadata[index];
      require(_tokenIds.length == _metadata.length, "Inputs must be same length");

      Parcel storage parcel = s.parcels[tokenId];
      parcel.coordinateX = metadata.coordinateX;
      parcel.coordinateY = metadata.coordinateY;
      parcel.parcelId = metadata.parcelId;
      parcel.size = metadata.size;
      parcel.district = metadata.district;
      parcel.parcelAddress = metadata.parcelAddress;

      parcel.alchemicaBoost = metadata.boost;

      LibERC721.safeMint(_to, tokenId);
    }
  }

  /// @notice Allow a parcel owner to equip an installation
  /// @dev The _x and _y denote the size of the installation and are used to make sure that slot is available on a parcel
  /// @param _realmId The identifier of the parcel which the installation is being equipped on
  /// @param _installationId The identifier of the installation being equipped
  /// @param _x The x(horizontal) coordinate of the installation
  /// @param _y The y(vertical) coordinate of the installation

  function equipInstallation(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) external onlyParcelOwner(_realmId) {
    LibRealm.placeInstallation(_realmId, _installationId, _x, _y);
    InstallationDiamondInterface(s.installationsDiamond).equipInstallation(msg.sender, _realmId, _installationId);

    LibAlchemica.increaseTraits(_realmId, _installationId);

    emit EquipInstallation(_realmId, _installationId, _x, _y);
  }

  /// @notice Allow a parcel owner to unequip an installation
  /// @dev The _x and _y denote the size of the installation and are used to make sure that slot is available on a parcel
  /// @param _realmId The identifier of the parcel which the installation is being unequipped from
  /// @param _installationId The identifier of the installation being unequipped
  /// @param _x The x(horizontal) coordinate of the installation
  /// @param _y The y(vertical) coordinate of the installation
  function unequipInstallation(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) external onlyParcelOwner(_realmId) {
    LibRealm.removeInstallation(_realmId, _installationId, _x, _y);

    InstallationDiamondInterface installationsDiamond = InstallationDiamondInterface(s.installationsDiamond);
    InstallationDiamondInterface.InstallationType memory installation = installationsDiamond.getInstallationType(_installationId);

    // todo: refund 50% alchemica from great portal
    for (uint8 i; i < installation.alchemicaCost.length; i++) {
      AlchemicaToken alchemica = AlchemicaToken(s.alchemicaAddresses[i]);

      alchemica.approve(address(this), installation.alchemicaCost[i] / 2);

      //@todo: include upgrades in refund?
      uint256 alchemicaRefund = installation.alchemicaCost[i] / 2;

      alchemica.transferFrom(address(this), msg.sender, alchemicaRefund);
    }
    InstallationDiamondInterface(s.installationsDiamond).unequipInstallation(msg.sender, _realmId, _installationId);

    LibAlchemica.reduceTraits(_realmId, _installationId);

    emit UnequipInstallation(_realmId, _installationId, _x, _y);
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

  /**
  @dev Used to set diamond address for Baazaar
  @param _diamondAddress New diamond address for the baazar
  */
  function setAavegotchiDiamond(address _diamondAddress) external onlyOwner {
    require(_diamondAddress != address(0), "RealmFacet: Cannot set diamond to zero address");
    s.aavegotchiDiamond = _diamondAddress;
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
    uint256 _nextInstallationId
  ) external onlyInstallationDiamond {
    LibAlchemica.reduceTraits(_realmId, _prevInstallationId);
    LibAlchemica.increaseTraits(_realmId, _nextInstallationId);
  }

  // used for testing atm
  function getParcelCapacity(uint256 _realmId) external view returns (uint256[4] memory) {
    return s.parcels[_realmId].reservoirCapacity;
  }

  function getHumbleGrid(uint256 _parcelId) external view returns (uint256[8][8] memory output_) {
    require(s.parcels[_parcelId].size == 0, "RealmFacet: Not humble");
    for (uint256 i; i < 8; i++) {
      for (uint256 j; j < 8; j++) {
        output_[i][j] = s.parcels[_parcelId].buildGrid[i][j];
      }
    }
  }

  function getReasonableGrid(uint256 _parcelId) external view returns (uint256[16][16] memory output_) {
    require(s.parcels[_parcelId].size == 1, "RealmFacet: Not reasonable");
    for (uint256 i; i < 16; i++) {
      for (uint256 j; j < 16; j++) {
        output_[i][j] = s.parcels[_parcelId].buildGrid[i][j];
      }
    }
  }

  function getSpaciousVerticalGrid(uint256 _parcelId) external view returns (uint256[32][64] memory output_) {
    require(s.parcels[_parcelId].size == 2, "RealmFacet: Not spacious vertical");
    for (uint256 i; i < 64; i++) {
      for (uint256 j; j < 32; j++) {
        output_[i][j] = s.parcels[_parcelId].buildGrid[i][j];
      }
    }
  }

  function getSpaciousHorizontalGrid(uint256 _parcelId) external view returns (uint256[64][32] memory output_) {
    require(s.parcels[_parcelId].size == 3, "RealmFacet: Not spacious horizontal");
    for (uint256 i; i < 32; i++) {
      for (uint256 j; j < 64; j++) {
        output_[i][j] = s.parcels[_parcelId].buildGrid[i][j];
      }
    }
  }

  function getPaartnerGrid(uint256 _parcelId) external view returns (uint256[64][64] memory) {
    return s.parcels[_parcelId].buildGrid;
  }
}

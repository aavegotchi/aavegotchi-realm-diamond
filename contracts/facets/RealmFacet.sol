// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../libraries/AppStorage.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibStrings.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibERC721.sol";
import "../libraries/LibRealm.sol";
import {InstallationDiamond} from "../interfaces/InstallationDiamond.sol";
import {IERC20} from "../interfaces/IERC20.sol";

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

  event ResyncParcel(uint256 _tokenId);
  event EquipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y);
  event UnequipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y);

  function maxSupply() external pure returns (uint256) {
    return MAX_SUPPLY;
  }

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

  function equipInstallation(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) external onlyParcelOwner(_realmId) {
    LibRealm.placeInstallation(_realmId, _installationId, _x, _y);
    InstallationDiamond(s.installationsDiamond).equipInstallation(msg.sender, _realmId, _installationId);

    LibRealm.increaseTraits(_realmId, _installationId);

    emit EquipInstallation(_realmId, _installationId, _x, _y);
  }

  function unequipInstallation(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) external onlyParcelOwner(_realmId) {
    LibRealm.removeInstallation(_realmId, _installationId, _x, _y);
    // refund 50% alchemica from great portal
    // comment it out for testing
    // InstallationDiamond installationsDiamond = InstallationDiamond(s.installationsDiamond);
    // InstallationDiamond.InstallationType memory installation = installationsDiamond.getInstallationType(_installationId);
    // IERC20 greatPortal = IERC20(s.greatPortalDiamond);
    // for (uint8 i; i < installation.alchemicaCost.length; i++) {
    //   uint256 alchemicaRefund = installation.alchemicaCost[i] / 2;
    //   greatPortal.transferFrom(s.greatPortalDiamond, msg.sender, alchemicaRefund);
    // }
    InstallationDiamond(s.installationsDiamond).unequipInstallation(_realmId, _installationId);

    LibRealm.reduceTraits(_realmId, _installationId);

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
  */
  function resyncParcel(uint256[] calldata _tokenIds) external onlyOwner {
    for (uint256 index = 0; index < _tokenIds.length; index++) {
      emit ResyncParcel(_tokenIds[index]);
    }
  }

  /**
  @dev Used to set diamond address for Baazaar
  */
  function setAavegotchiDiamond(address _diamondAddress) external onlyOwner {
    require(_diamondAddress != address(0), "RealmFacet: Cannot set diamond to zero address");
    s.aavegotchiDiamond = _diamondAddress;
  }

  function getParcelInfo(uint256 _tokenId) external view returns (ParcelOutput memory output_) {
    Parcel storage parcel = s.parcels[_tokenId];
    output_.parcelId = parcel.parcelId;
    output_.owner = parcel.owner;
    output_.coordinateX = parcel.coordinateX;
    output_.coordinateY = parcel.coordinateY;
    output_.size = parcel.size;
    output_.parcelAddress = parcel.parcelAddress;
    output_.district = parcel.district;
    output_.boost = parcel.alchemicaBoost;
  }
}

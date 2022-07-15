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
  function mockEquipInstallation(
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

  /// @dev Unequip an installation without signature or owner checks for testing
  function mockUnequipInstallation(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) external {
    InstallationDiamondInterface installationsDiamond = InstallationDiamondInterface(s.installationsDiamond);
    InstallationDiamondInterface.InstallationType memory installation = installationsDiamond.getInstallationType(_installationId);

    require(!LibRealm.installationInUpgradeQueue(_realmId, _installationId, _x, _y), "RealmFacet: Can't unequip installation in upgrade queue");

    LibRealm.removeInstallation(_realmId, _installationId, _x, _y);
    InstallationDiamondInterface(s.installationsDiamond).unequipInstallation(msg.sender, _realmId, _installationId);
    LibAlchemica.reduceTraits(_realmId, _installationId, false);
  }

  /// @notice Allow the owner of a parcel to start surveying his parcel
  /// @dev Will throw if a surveying round has not started
  /// @param _realmId Identifier of the parcel to survey
  function mockStartSurveying(uint256 _realmId) external {
    require(s.parcels[_realmId].altarId > 0, "AlchemicaFacet: Must equip Altar");
    require(!s.parcels[_realmId].surveying, "AlchemicaFacet: Parcel already surveying");
    s.parcels[_realmId].surveying = true;
  }

  function mockRawFulfillRandomWords(
    uint256 tokenId,
    uint256 surveyingRound,
    uint256 seed
  ) external {
    uint256[] memory randomWords = new uint256[](4);
    randomWords[0] = uint256(keccak256(abi.encode(seed)));
    randomWords[1] = uint256(keccak256(abi.encode(randomWords[0])));
    randomWords[2] = uint256(keccak256(abi.encode(randomWords[1])));
    randomWords[3] = uint256(keccak256(abi.encode(randomWords[2])));
    LibRealm.updateRemainingAlchemica(tokenId, randomWords, surveyingRound);
  }

  /// @notice Allow parcel owner to claim available alchemica with his parent NFT(Aavegotchi)
  /// @param _realmId Identifier of parcel to claim alchemica from
  /// @param _gotchiId Identifier of Aavegotchi to use for alchemica collecction/claiming
  function mockClaimAvailableAlchemica(uint256 _realmId, uint256 _gotchiId) external {
    //1 - Empty Reservoir Access Right
    LibRealm.verifyAccessRight(_realmId, _gotchiId, 1);
    LibAlchemica.claimAvailableAlchemica(_realmId, _gotchiId);
  }

  struct MintParcelInput {
    uint256 coordinateX;
    uint256 coordinateY;
    uint256 district;
    string parcelId;
    string parcelAddress;
    uint256 size; //0=humble, 1=reasonable, 2=spacious vertical, 3=spacious horizontal, 4=partner
    uint256[4] boost; //fud, fomo, alpha, kek
  }

  uint256 constant MAX_SUPPLY = 420069;

  /// @notice Allow the diamond owner to mint new parcels
  /// @param _to The address to mint the parcels to
  /// @param _tokenIds The identifiers of tokens to mint
  /// @param _metadata An array of structs containing the metadata of each parcel being minted
  function mockMintParcels(
    address[] calldata _to,
    uint256[] calldata _tokenIds,
    MintParcelInput[] memory _metadata
  ) external {
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
}

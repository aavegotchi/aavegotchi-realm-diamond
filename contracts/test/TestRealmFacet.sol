// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../libraries/AppStorage.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibStrings.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibERC721.sol";
import "../libraries/LibRealm.sol";
import "../libraries/LibAlchemica.sol";
import {InstallationDiamondInterface} from "../interfaces/InstallationDiamondInterface.sol";

contract TestRealmFacet is Modifiers {
  event MockEquipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y);
  event MockUnequipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y);
  event MockEquipTile(uint256 _realmId, uint256 _tileId, uint256 _x, uint256 _y);
  event MockUnequipTile(uint256 _realmId, uint256 _tileId, uint256 _x, uint256 _y);

  struct BatchEquipIO {
    uint256[] types; //0 for installation, 1 for tile
    bool[] equip; //true for equip, false for unequip
    uint256[] ids;
    uint256[] x;
    uint256[] y;
  }

  function mockBatchEquip(uint256 _realmId, BatchEquipIO memory _params) external {
    require(_params.ids.length == _params.x.length, "RealmFacet: Wrong length");
    require(_params.x.length == _params.y.length, "RealmFacet: Wrong length");

    // for (uint256 i = 0; i < _params.ids.length; i++) {
    //   if (_params.types[i] == 0 && _params.equip[i]) {
    //     mockEquipInstallation(_realmId, _params.ids[i], _params.x[i], _params.y[i]);
    //   } else if (_params.types[i] == 1 && _params.equip[i]) {
    //     mockEquipTile(_realmId, _params.ids[i], _params.x[i], _params.y[i]);
    //   } else if (_params.types[i] == 0 && !_params.equip[i]) {
    //     mockUnequipInstallation(_realmId, _params.ids[i], _params.x[i], _params.y[i]);
    //   } else if (_params.types[i] == 1 && !_params.equip[i]) {
    //     mockUnequipTile(_realmId, _params.ids[i], _params.x[i], _params.y[i]);
    //   }
    // }
  }

  /// @dev Equip installation without signature or owner checks for testing
  function mockEquipInstallation(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) public {
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
    if (installation.installationType == 6)
      require(s.parcels[_realmId].upgradeQueueCapacity == 1, "RealmFacet: Maker already equipped or altar not equipped");

    LibRealm.placeInstallation(_realmId, _installationId, _x, _y);
    InstallationDiamondInterface(s.installationsDiamond).equipInstallation(msg.sender, _realmId, _installationId);

    LibAlchemica.increaseTraits(_realmId, _installationId, false);

    emit MockEquipInstallation(_realmId, _installationId, _x, _y);
  }

  /// @dev Unequip an installation without signature or owner checks for testing
  function mockUnequipInstallation(
    uint256 _realmId,
    uint256 _gotchiId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) public {
    InstallationDiamondInterface installationsDiamond = InstallationDiamondInterface(s.installationsDiamond);
    InstallationDiamondInterface.InstallationType memory installation = installationsDiamond.getInstallationType(_installationId);

    require(!LibRealm.installationInUpgradeQueue(_realmId, _installationId, _x, _y), "RealmFacet: Can't unequip installation in upgrade queue");
    require(
      installation.installationType != 0 || s.parcels[_realmId].upgradeQueueCapacity == 1,
      "RealmFacet: Cannot unequip altar when there is a maker"
    );

    LibRealm.removeInstallation(_realmId, _installationId, _x, _y);
    InstallationDiamondInterface(s.installationsDiamond).unequipInstallation(msg.sender, _realmId, _installationId);
    LibAlchemica.reduceTraits(_realmId, _installationId, false);

    emit MockUnequipInstallation(_realmId, _installationId, _x, _y);
  }

  /// @dev Equip a tile without signature or owner checks for testing
  function mockEquipTile(
    uint256 _realmId,
    uint256 _tileId,
    uint256 _x,
    uint256 _y
  ) public {
    //3 - Equip Tile
    // LibRealm.verifyAccessRight(_realmId, _gotchiId, 3);

    LibRealm.placeTile(_realmId, _tileId, _x, _y);
    TileDiamondInterface(s.tileDiamond).equipTile(msg.sender, _realmId, _tileId);

    emit MockEquipTile(_realmId, _tileId, _x, _y);
  }

  /// @dev Unequip a tile without signature or owner checks for testing
  function mockUnequipTile(
    uint256 _realmId,
    uint256 _tileId,
    uint256 _x,
    uint256 _y
  ) public {
    LibRealm.removeTile(_realmId, _tileId, _x, _y);

    TileDiamondInterface(s.tileDiamond).unequipTile(msg.sender, _realmId, _tileId);

    emit MockUnequipTile(_realmId, _tileId, _x, _y);
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
    LibRealm.verifyAccessRight(_realmId, _gotchiId, 1, LibMeta.msgSender());
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

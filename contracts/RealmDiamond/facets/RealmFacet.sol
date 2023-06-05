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
import "../../interfaces/IERC1155Marketplace.sol";

contract RealmFacet is Modifiers {
  struct MintParcelInput {
    uint256 coordinateX;
    uint256 coordinateY;
    uint256 district;
    string parcelId;
    string parcelAddress;
    uint256 size; //0=humble, 1=reasonable, 2=spacious vertical, 3=spacious horizontal, 4=partner
    uint256[4] boost; //fud, fomo, alpha, kek
  }

  event EquipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y);
  event UnequipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y);
  event EquipTile(uint256 _realmId, uint256 _tileId, uint256 _x, uint256 _y);
  event UnequipTile(uint256 _realmId, uint256 _tileId, uint256 _x, uint256 _y);
  event AavegotchiDiamondUpdated(address _aavegotchiDiamond);
  event InstallationUpgraded(uint256 _realmId, uint256 _prevInstallationId, uint256 _nextInstallationId, uint256 _coordinateX, uint256 _coordinateY);

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
      require(s.tokenIds.length < LibRealm.MAX_SUPPLY, "RealmFacet: Cannot mint more than 420,069 parcels");
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

  struct BatchEquipIO {
    uint256[] types; //0 for installation, 1 for tile
    bool[] equip; //true for equip, false for unequip
    uint256[] ids;
    uint256[] x;
    uint256[] y;
  }

  function batchEquip(
    uint256 _realmId,
    uint256 _gotchiId,
    BatchEquipIO memory _params,
    bytes[] memory _signatures
  ) external gameActive canBuild {
    require(_params.ids.length == _params.x.length, "RealmFacet: Wrong length");
    require(_params.x.length == _params.y.length, "RealmFacet: Wrong length");

    for (uint256 i = 0; i < _params.ids.length; i++) {
      if (_params.types[i] == 0 && _params.equip[i]) {
        equipInstallation(_realmId, _gotchiId, _params.ids[i], _params.x[i], _params.y[i], _signatures[i]);
      } else if (_params.types[i] == 1 && _params.equip[i]) {
        equipTile(_realmId, _gotchiId, _params.ids[i], _params.x[i], _params.y[i], _signatures[i]);
      } else if (_params.types[i] == 0 && !_params.equip[i]) {
        unequipInstallation(_realmId, _gotchiId, _params.ids[i], _params.x[i], _params.y[i], _signatures[i]);
      } else if (_params.types[i] == 1 && !_params.equip[i]) {
        unequipTile(_realmId, _gotchiId, _params.ids[i], _params.x[i], _params.y[i], _signatures[i]);
      }
    }
  }

  /// @notice Allow a parcel owner to equip an installation
  /// @dev The _x and _y denote the starting coordinates of the installation and are used to make sure that slot is available on a parcel
  /// @param _realmId The identifier of the parcel which the installation is being equipped on
  /// @param _gotchiId The Gotchi ID of the Aavegotchi being played. Must be verified by the backend API.
  /// @param _installationId The identifier of the installation being equipped
  /// @param _x The x(horizontal) coordinate of the installation
  /// @param _y The y(vertical) coordinate of the installation

  function equipInstallation(
    uint256 _realmId,
    uint256 _gotchiId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y,
    bytes memory _signature
  ) public gameActive canBuild {
    //2 - Equip Installations
    LibRealm.verifyAccessRight(_realmId, _gotchiId, 2, LibMeta.msgSender());
    require(
      LibSignature.isValid(keccak256(abi.encodePacked(_realmId, _gotchiId, _installationId, _x, _y)), _signature, s.backendPubKey),
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
    if (installation.installationType == 6)
      require(s.parcels[_realmId].upgradeQueueCapacity == 1, "RealmFacet: Maker already equipped or altar not equipped");

    LibRealm.placeInstallation(_realmId, _installationId, _x, _y);
    InstallationDiamondInterface(s.installationsDiamond).equipInstallation(msg.sender, _realmId, _installationId);

    LibAlchemica.increaseTraits(_realmId, _installationId, false);

    IERC1155Marketplace(s.aavegotchiDiamond).updateERC1155Listing(s.installationsDiamond, _installationId, msg.sender);

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
    uint256 _gotchiId, //will be used soon
    uint256 _installationId,
    uint256 _x,
    uint256 _y,
    bytes memory _signature
  ) public onlyParcelOwner(_realmId) gameActive canBuild {
    require(
      LibSignature.isValid(keccak256(abi.encodePacked(_realmId, _gotchiId, _installationId, _x, _y)), _signature, s.backendPubKey),
      "RealmFacet: Invalid signature"
    );

    //@todo: Prevent unequipping if an upgrade is active for this installationId on the parcel

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

    //Process refund
    if (installationsDiamond.getInstallationUnequipType(_installationId) == 0) {
      //Loop through each level of the installation.
      //@todo: For now we can use the ID order to get the cost of previous upgrades. But in the future we'll need to add some data redundancy.
      uint256 currentLevel = installation.level;
      uint256[] memory alchemicaRefund = new uint256[](4);
      for (uint256 index = 0; index < currentLevel; index++) {
        InstallationDiamondInterface.InstallationType memory prevInstallation = installationsDiamond.getInstallationType(_installationId - index);

        //Loop through each Alchemica cost
        for (uint256 i; i < prevInstallation.alchemicaCost.length; i++) {
          //Only half of the cost is refunded
          alchemicaRefund[i] += prevInstallation.alchemicaCost[i] / 2;
        }
      }

      for (uint256 j = 0; j < alchemicaRefund.length; j++) {
        //don't send 0 refunds
        if (alchemicaRefund[j] > 0) {
          IERC20 alchemica = IERC20(s.alchemicaAddresses[j]);
          alchemica.transfer(msg.sender, alchemicaRefund[j]);
        }
      }
    }

    emit UnequipInstallation(_realmId, _installationId, _x, _y);
  }

  /// @notice Allow a parcel owner to move an installation
  /// @param _realmId The identifier of the parcel which the installation is being moved on
  /// @param _installationId The identifier of the installation being moved
  /// @param _x0 The x(horizontal) coordinate of the installation
  /// @param _y0 The y(vertical) coordinate of the installation
  /// @param _x1 The x(horizontal) coordinate of the installation to move to
  /// @param _y1 The y(vertical) coordinate of the installation to move to
  function moveInstallation(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x0,
    uint256 _y0,
    uint256 _x1,
    uint256 _y1
  ) external onlyParcelOwner(_realmId) gameActive canBuild {
    //Check if upgrade is in progress
    InstallationDiamondInterface installation = InstallationDiamondInterface(s.installationsDiamond);

    require(installation.parcelInstallationUpgrading(_realmId, _installationId, _x0, _y0) == false, "RealmFacet: Installation is upgrading");

    LibRealm.removeInstallation(_realmId, _installationId, _x0, _y0);
    emit UnequipInstallation(_realmId, _installationId, _x0, _y0);
    LibRealm.placeInstallation(_realmId, _installationId, _x1, _y1);
    emit EquipInstallation(_realmId, _installationId, _x1, _y1);
  }

  /// @notice Allow a parcel owner to equip a tile
  /// @dev The _x and _y denote the starting coordinates of the tile and are used to make sure that slot is available on a parcel
  /// @param _realmId The identifier of the parcel which the tile is being equipped on
  /// @param _tileId The identifier of the tile being equipped
  /// @param _x The x(horizontal) coordinate of the tile
  /// @param _y The y(vertical) coordinate of the tile
  function equipTile(
    uint256 _realmId,
    uint256 _gotchiId,
    uint256 _tileId,
    uint256 _x,
    uint256 _y,
    bytes memory _signature
  ) public gameActive canBuild {
    //3 - Equip Tile
    LibRealm.verifyAccessRight(_realmId, _gotchiId, 3, LibMeta.msgSender());
    require(
      LibSignature.isValid(keccak256(abi.encodePacked(_realmId, _gotchiId, _tileId, _x, _y)), _signature, s.backendPubKey),
      "RealmFacet: Invalid signature"
    );
    LibRealm.placeTile(_realmId, _tileId, _x, _y);
    TileDiamondInterface(s.tileDiamond).equipTile(msg.sender, _realmId, _tileId);

    IERC1155Marketplace(s.aavegotchiDiamond).updateERC1155Listing(s.tileDiamond, _tileId, msg.sender);

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
    uint256 _gotchiId,
    uint256 _tileId,
    uint256 _x,
    uint256 _y,
    bytes memory _signature
  ) public onlyParcelOwner(_realmId) gameActive canBuild {
    require(
      LibSignature.isValid(keccak256(abi.encodePacked(_realmId, _gotchiId, _tileId, _x, _y)), _signature, s.backendPubKey),
      "RealmFacet: Invalid signature"
    );
    LibRealm.removeTile(_realmId, _tileId, _x, _y);

    TileDiamondInterface(s.tileDiamond).unequipTile(msg.sender, _realmId, _tileId);

    emit UnequipTile(_realmId, _tileId, _x, _y);
  }

  /// @notice Allow a parcel owner to move a tile
  /// @param _realmId The identifier of the parcel which the tile is being moved on
  /// @param _tileId The identifier of the tile being moved
  /// @param _x0 The x(horizontal) coordinate of the tile
  /// @param _y0 The y(vertical) coordinate of the tile
  /// @param _x1 The x(horizontal) coordinate of the tile to move to
  /// @param _y1 The y(vertical) coordinate of the tile to move to
  function moveTile(
    uint256 _realmId,
    uint256 _tileId,
    uint256 _x0,
    uint256 _y0,
    uint256 _x1,
    uint256 _y1
  ) external onlyParcelOwner(_realmId) gameActive canBuild {
    LibRealm.removeTile(_realmId, _tileId, _x0, _y0);
    emit UnequipTile(_realmId, _tileId, _x0, _y0);
    LibRealm.placeTile(_realmId, _tileId, _x1, _y1);
    emit EquipTile(_realmId, _tileId, _x1, _y1);
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

  function fixGrid(
    uint256 _realmId,
    uint256 _installationId,
    uint256[] memory _x,
    uint256[] memory _y,
    bool tile
  ) external onlyOwner {
    require(_x.length == _y.length, "RealmFacet: _x and _y must be the same length");
    Parcel storage parcel = s.parcels[_realmId];
    for (uint256 i; i < _x.length; i++) {
      require(_x[i] < 64 && _y[i] < 64, "RealmFacet: _x and _y must be less than 64");
      if (!tile) {
        parcel.buildGrid[_x[i]][_y[i]] = _installationId;
      } else {
        parcel.tileGrid[_x[i]][_y[i]] = _installationId;
      }
    }
  }

  function buildingFrozen() external view returns (bool) {
    return s.freezeBuilding;
  }

  function setFreezeBuilding(bool _freezeBuilding) external onlyOwner {
    s.freezeBuilding = _freezeBuilding;
  }
}

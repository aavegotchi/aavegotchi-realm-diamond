// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";

import "../../libraries/LibRealm.sol";
import "../../libraries/LibAlchemica.sol";
import "../../libraries/LibERC721.sol";

import {InstallationDiamondInterface} from "../../interfaces/InstallationDiamondInterface.sol";
import {TileDiamondInterface} from "../../interfaces/TileDiamond.sol";

import "./ERC721Facet.sol";

contract RealmGettersAndSettersFacet is Modifiers {
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
      emit LibERC721.ParcelAccessRightSet(_realmIds[i], _actionRights[i], _accessRights[i]);
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

      emit LibERC721.ParcelAccessRightSet(_realmIds[i], _actionRights[i], _accessRights[i]);
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

  function checkCoordinates(uint256 _realmId, uint256 _coordinateX, uint256 _coordinateY, uint256 _installationId) public view {
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

  function batchGetParcelUpgradeQueueLength(uint256[] calldata _parcelIds) external view returns (uint256[] memory output_) {
    output_ = new uint256[](_parcelIds.length);
    for (uint256 i; i < _parcelIds.length; i++) {
      output_[i] = s.parcels[_parcelIds[i]].upgradeQueueLength;
    }
    return output_;
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

  function getParcelsAccessRightsWhitelistIds(
    uint256[] calldata _parcelIds,
    uint256[] calldata _actionRights
  ) external view returns (uint256[] memory output_) {
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

  function verifyAccessRight(uint256 _realmId, uint256 _gotchiId, uint256 _actionRight, address _sender) external view {
    LibRealm.verifyAccessRight(_realmId, _gotchiId, _actionRight, _sender);
  }

  struct ParcelOutTest {
    address owner;
    string parcelAddress; //looks-like-this
    string parcelId; //C-4208-3168-R
    uint256 coordinateX; //x position on the map
    uint256 coordinateY; //y position on the map
    uint256 district;
    uint256 size; //0=humble, 1=reasonable, 2=spacious vertical, 3=spacious horizontal, 4=partner
    uint256[4] alchemicaBoost; //fud, fomo, alpha, kek
    uint256[4] alchemicaRemaining; //fud, fomo, alpha, kek
    uint256 currentRound; //begins at 0 and increments after surveying has begun
    uint256[][10] roundBaseAlchemica; //round alchemica not including boosts
    uint256[][10] roundAlchemica; //round alchemica including boosts
    uint256[][4] reservoirs;
    uint256[4] alchemicaHarvestRate;
    uint256[4] lastUpdateTimestamp;
    uint256[4] unclaimedAlchemica;
    uint256 altarId;
    uint256 upgradeQueueCapacity;
    uint256 upgradeQueueLength;
    uint256 lodgeId;
    bool surveying;
    uint16 harvesterCount;
    uint256[64][64] buildGrid; //x, then y array of positions - for installations
    uint256[64][64] tileGrid; //x, then y array of positions - for tiles under the installations (floor)
    uint256[64][64] startPositionBuildGrid;
    uint256[64][64] startPositionTileGrid;
  }

  function getParcel(uint256 _parcelId) external view returns (ParcelOutTest memory parcelOut) {
    Parcel storage parcel = s.parcels[_parcelId];
    parcelOut.owner = parcel.owner;
    parcelOut.parcelAddress = parcel.parcelAddress;
    parcelOut.parcelId = parcel.parcelId;
    parcelOut.coordinateX = parcel.coordinateX;
    parcelOut.coordinateY = parcel.coordinateY;
    parcelOut.district = parcel.district;
    parcelOut.size = parcel.size;
    parcelOut.alchemicaBoost = parcel.alchemicaBoost;
    parcelOut.alchemicaRemaining = parcel.alchemicaRemaining;
    parcelOut.currentRound = parcel.currentRound;
    parcelOut.alchemicaHarvestRate = parcel.alchemicaHarvestRate;
    parcelOut.lastUpdateTimestamp = parcel.lastUpdateTimestamp;
    parcelOut.unclaimedAlchemica = parcel.unclaimedAlchemica;
    parcelOut.altarId = parcel.altarId;
    parcelOut.upgradeQueueCapacity = parcel.upgradeQueueCapacity;
    parcelOut.upgradeQueueLength = parcel.upgradeQueueLength;
    parcelOut.lodgeId = parcel.lodgeId;
    parcelOut.surveying = parcel.surveying;
    parcelOut.harvesterCount = parcel.harvesterCount;

    uint256[5] memory widths = LibRealm.getWidths();
    uint256[5] memory heights = LibRealm.getHeights();
    uint width = widths[parcel.size];
    uint height = heights[parcel.size];
    for (uint256 k; k < width; k++) {
      for (uint256 j; j < height; j++) {
        parcelOut.buildGrid[k][j] = parcel.buildGrid[k][j];
        parcelOut.tileGrid[k][j] = parcel.tileGrid[k][j];
        parcelOut.startPositionBuildGrid[k][j] = parcel.startPositionBuildGrid[k][j];
        parcelOut.startPositionTileGrid[k][j] = parcel.startPositionTileGrid[k][j];
      }
    }

    for (uint256 j; j < 10; j++) {
      parcelOut.roundBaseAlchemica[j] = parcel.roundBaseAlchemica[j];
      parcelOut.roundAlchemica[j] = parcel.roundAlchemica[j];
    }
    for (uint256 j; j < 4; j++) {
      parcelOut.reservoirs[j] = parcel.reservoirs[j];
    }
  }

  struct ParcelIO {
    address owner;
    string parcelAddress; //looks-like-this
    string parcelId; //C-4208-3168-R
    uint256 coordinateX; //x position on the map
    uint256 coordinateY; //y position on the map
    uint256 district;
    uint256 size; //0=humble, 1=reasonable, 2=spacious vertical, 3=spacious horizontal, 4=partner
    // uint256[64][64] buildGrid; //x, then y array of positions - for installations
    // uint256[64][64] tileGrid; //x, then y array of positions - for tiles under the installations (floor)
    uint256[4] alchemicaBoost; //fud, fomo, alpha, kek
    uint256[4] alchemicaRemaining; //fud, fomo, alpha, kek
    uint256 currentRound; //begins at 0 and increments after surveying has begun
    // mapping(uint256 => uint256[]) roundBaseAlchemica; //round alchemica not including boosts
    uint256[][] roundBaseAlchemica; //round alchemica not including boosts
    // mapping(uint256 => uint256[]) roundAlchemica; //round alchemica including boosts
    uint256[][] roundAlchemica; //round alchemica including boosts
    // // alchemicaType => array of reservoir id
    uint256[][4] reservoirs;
    uint256[4] alchemicaHarvestRate;
    uint256[4] lastUpdateTimestamp;
    uint256[4] unclaimedAlchemica;
    uint256 altarId;
    uint256 upgradeQueueCapacity;
    uint256 upgradeQueueLength;
    uint256 lodgeId;
    bool surveying;
    uint16 harvesterCount;
    uint256 lastChanneledAlchemica;
    uint256 lastClaimedAlchemica;
    //bouncegate data
    BounceGate gate;
  }

  function getParcelData(uint256 _parcelId) public view returns (ParcelIO memory parcel) {
    (uint256[][] memory roundBaseAlchemica_, uint256[][] memory roundAlchemica_, uint256[][4] memory reservoirs_) = _toStaticTypes(
      s.parcels[_parcelId].roundBaseAlchemica,
      s.parcels[_parcelId].roundAlchemica,
      s.parcels[_parcelId].reservoirs,
      s.parcels[_parcelId].currentRound
    );

    parcel.owner = s.parcels[_parcelId].owner;
    parcel.parcelAddress = s.parcels[_parcelId].parcelAddress;
    parcel.parcelId = s.parcels[_parcelId].parcelId;
    parcel.coordinateX = s.parcels[_parcelId].coordinateX;
    parcel.coordinateY = s.parcels[_parcelId].coordinateY;
    parcel.district = s.parcels[_parcelId].district;
    parcel.size = s.parcels[_parcelId].size;
    parcel.alchemicaBoost = s.parcels[_parcelId].alchemicaBoost;
    parcel.alchemicaRemaining = s.parcels[_parcelId].alchemicaRemaining;
    parcel.currentRound = s.parcels[_parcelId].currentRound;
    parcel.roundBaseAlchemica = roundBaseAlchemica_;
    parcel.roundAlchemica = roundAlchemica_;
    parcel.reservoirs = reservoirs_;
    parcel.alchemicaHarvestRate = s.parcels[_parcelId].alchemicaHarvestRate;
    parcel.lastUpdateTimestamp = s.parcels[_parcelId].lastUpdateTimestamp;
    parcel.unclaimedAlchemica = s.parcels[_parcelId].unclaimedAlchemica;
    parcel.altarId = s.parcels[_parcelId].altarId;
    parcel.upgradeQueueCapacity = s.parcels[_parcelId].upgradeQueueCapacity;
    parcel.upgradeQueueLength = s.parcels[_parcelId].upgradeQueueLength;
    parcel.lodgeId = s.parcels[_parcelId].lodgeId;
    parcel.surveying = s.parcels[_parcelId].surveying;
    parcel.harvesterCount = s.parcels[_parcelId].harvesterCount;
    parcel.lastChanneledAlchemica = s.parcelChannelings[_parcelId];
    parcel.lastClaimedAlchemica = s.lastClaimedAlchemica[_parcelId];
    parcel.gate = s.bounceGates[_parcelId];
  }

  function getInstallationAndTileBalances(
    uint256 _parcelId
  ) internal view returns (InstallationDiamondInterface.InstallationIdIO[] memory installations_, TileDiamondInterface.TileIdIO[] memory tiles_) {
    installations_ = InstallationDiamondInterface(s.installationsDiamond).installationBalancesOfToken(address(this), _parcelId);
    tiles_ = TileDiamondInterface(s.tileDiamond).tileBalancesOfToken(address(this), _parcelId);
  }

  function getParcelGrids(
    uint256 _parcelId
  )
    external
    view
    returns (
      uint256[64][64] memory buildGrid_,
      uint256[64][64] memory startPositionBuildGrid_,
      uint256[64][64] memory tileGrid_,
      uint256[64][64] memory startPositionTileGrid_
    )
  {
    (
      InstallationDiamondInterface.InstallationIdIO[] memory installations,
      TileDiamondInterface.TileIdIO[] memory tiles
    ) = getInstallationAndTileBalances(_parcelId);
    if (installations.length > 0) {
      buildGrid_ = s.parcels[_parcelId].buildGrid;
      startPositionBuildGrid_ = s.parcels[_parcelId].startPositionBuildGrid;
    }
    if (tiles.length > 0) {
      tileGrid_ = s.parcels[_parcelId].tileGrid;
      startPositionTileGrid_ = s.parcels[_parcelId].startPositionTileGrid;
    }
  }

  function _toStaticTypes(
    mapping(uint256 => uint256[]) storage roundBaseAlchemica,
    mapping(uint256 => uint256[]) storage roundAlchemica,
    mapping(uint256 => uint256[]) storage reservoirs,
    uint256 currentRound
  ) internal view returns (uint256[][] memory roundBaseAlchemica_, uint256[][] memory roundAlchemica_, uint256[][4] memory reservoirs_) {
    //if no surveys
    if (currentRound == 0) {
      assembly {
        mstore(roundBaseAlchemica_, 0)
      }
    } else {
      roundBaseAlchemica_ = new uint256[][](currentRound);
      roundAlchemica_ = new uint256[][](currentRound);

      //handle base and boosts alch
      for (uint256 i = 0; i < roundBaseAlchemica_.length; i++) {
        roundBaseAlchemica_[i] = roundBaseAlchemica[i];
        roundAlchemica_[i] = roundAlchemica[i];
      }

      ///handle reservoirs
      //we only have 4 reservoir types e.g 0,1,2,3==> fud,fomo,alpha,kek
      for (uint256 i = 0; i < 4; i++) {
        reservoirs_[i] = reservoirs[i];
      }
    }
  }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {InstallationType, Modifiers, UpgradeQueue} from "../../libraries/AppStorageInstallation.sol";
import {RealmDiamond} from "../../interfaces/RealmDiamond.sol";
import {LibInstallation} from "../../libraries/LibInstallation.sol";
import {LibERC1155} from "../../libraries/LibERC1155.sol";
import {LibSignature} from "../../libraries/LibSignature.sol";
import {IERC721} from "../../interfaces/IERC721.sol";
import {LibItems} from "../../libraries/LibItems.sol";
import {IERC20} from "../../interfaces/IERC20.sol";

contract InstallationAdminFacet is Modifiers {
  event AddressesUpdated(
    address _aavegotchiDiamond,
    address _realmDiamond,
    address _gltr,
    address _pixelcraft,
    address _aavegotchiDAO,
    bytes _backendPubKey
  );

  event UpgradeInitiated(
    uint256 indexed _realmId,
    uint256 _coordinateX,
    uint256 _coordinateY,
    uint256 blockInitiated,
    uint256 readyBlock,
    uint256 installationId
  );

  event UpgradeFinalized(uint256 indexed _realmId, uint256 _coordinateX, uint256 _coordinateY, uint256 _newInstallationId);

  event UpgradeQueued(address indexed _owner, uint256 indexed _realmId, uint256 indexed _queueIndex);
  event UpgradeQueueFinalized(address indexed _owner, uint256 indexed _realmId, uint256 indexed _queueIndex);

  /// @notice Allow the Diamond owner to deprecate an installation
  /// @dev Deprecated installations cannot be crafted by users
  /// @param _installationIds An array containing the identifiers of installations to deprecate
  function deprecateInstallations(uint256[] calldata _installationIds) external onlyOwner {
    for (uint256 i = 0; i < _installationIds.length; i++) {
      s.installationTypes[_installationIds[i]].deprecated = true;
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
  function addInstallationTypes(InstallationType[] calldata _installationTypes) external onlyOwner {
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
    }
  }

  function editDeprecateTime(uint256 _typeId, uint40 _deprecateTime) external onlyOwner {
    s.deprecateTime[_typeId] = _deprecateTime;
  }

  function editInstallationTypes(uint256[] calldata _ids, InstallationType[] calldata _installationTypes) external onlyOwner {
    require(_ids.length == _installationTypes.length, "InstallationAdminFacet: Mismatched arrays");
    for (uint256 i = 0; i < _ids.length; i++) {
      uint256 id = _ids[i];
      s.installationTypes[id] = _installationTypes[i];
    }
  }

  /// @notice Allow anyone to finalize any existing queue upgrade
  function finalizeUpgrades(uint256[] memory _upgradeIndexes) public {
    for (uint256 i; i < _upgradeIndexes.length; i++) {
      UpgradeQueue storage upgradeQueue = s.upgradeQueue[_upgradeIndexes[i]];
      _finalizeUpgrade(upgradeQueue.owner, _upgradeIndexes[i]);
    }
  }

  function _finalizeUpgrade(address _owner, uint256 index) internal returns (bool) {
    if (s.upgradeComplete[index]) return true;
    uint40 readyBlock = s.upgradeQueue[index].readyBlock;
    uint256 parcelId = s.upgradeQueue[index].parcelId;
    uint256 installationId = s.upgradeQueue[index].installationId;
    uint256 coordinateX = s.upgradeQueue[index].coordinateX;
    uint256 coordinateY = s.upgradeQueue[index].coordinateY;

    // check that upgrade is ready
    if (block.number >= readyBlock) {
      // burn old installation
      LibInstallation._unequipInstallation(parcelId, installationId);
      // mint new installation
      uint256 nextLevelId = s.installationTypes[installationId].nextLevelId;
      LibERC1155._safeMint(_owner, nextLevelId, index);
      // equip new installation
      LibInstallation._equipInstallation(_owner, parcelId, nextLevelId);

      RealmDiamond realm = RealmDiamond(s.realmDiamond);
      realm.upgradeInstallation(parcelId, installationId, nextLevelId, coordinateX, coordinateY);

      // update updateQueueLength
      realm.subUpgradeQueueLength(parcelId);

      // clean unique hash
      bytes32 uniqueHash = keccak256(abi.encodePacked(parcelId, coordinateX, coordinateY, installationId));
      s.upgradeHashes[uniqueHash] = 0;

      // // pop upgrade from array
      // if (_user) {
      //   s.userUpgradeQueue[_owner][index] = s.userUpgradeQueue[_owner][s.userUpgradeQueue[_owner].length - 1];
      //   s.userUpgradeQueue[_owner].pop();
      // } else {
      //   s.upgradeQueue[index] = s.upgradeQueue[s.upgradeQueue.length - 1];
      //   s.upgradeQueue.pop();
      // }
      s.upgradeComplete[index] = true;

      emit UpgradeFinalized(parcelId, coordinateX, coordinateY, nextLevelId);
      emit UpgradeQueueFinalized(_owner, parcelId, index);
      return true;
    }
    return false;
  }

  function upgradeInstallation(
    UpgradeQueue calldata _upgradeQueue,
    bytes memory _signature,
    uint40 _gltr
  ) external {
    require(
      LibSignature.isValid(
        keccak256(abi.encodePacked(_upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _upgradeQueue.installationId)),
        _signature,
        s.backendPubKey
      ),
      "InstallationAdminFacet: Invalid signature"
    );
    // check owner
    require(IERC721(s.realmDiamond).ownerOf(_upgradeQueue.parcelId) == _upgradeQueue.owner, "InstallationFacet: Not owner");
    // check coordinates
    RealmDiamond realm = RealmDiamond(s.realmDiamond);

    //check upgradeQueueCapacity
    require(
      realm.getParcelUpgradeQueueCapacity(_upgradeQueue.parcelId) > realm.getParcelUpgradeQueueLength(_upgradeQueue.parcelId),
      "InstallationFacet: UpgradeQueue full"
    );

    realm.checkCoordinates(_upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _upgradeQueue.installationId);

    // check unique hash
    bytes32 uniqueHash = keccak256(
      abi.encodePacked(_upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _upgradeQueue.installationId)
    );

    //The same upgrade cannot be queued twice
    require(s.upgradeHashes[uniqueHash] == 0, "InstallationFacet: Upgrade hash not unique");

    s.upgradeHashes[uniqueHash] = _upgradeQueue.parcelId;

    //current installation
    InstallationType memory prevInstallation = s.installationTypes[_upgradeQueue.installationId];

    //next level
    InstallationType memory nextInstallation = s.installationTypes[prevInstallation.nextLevelId];

    //take the required alchemica
    address[4] memory alchemicaAddresses = realm.getAlchemicaAddresses();
    LibItems._splitAlchemica(nextInstallation.alchemicaCost, alchemicaAddresses);

    require(prevInstallation.nextLevelId > 0, "InstallationFacet: Maximum upgrade reached");
    require(prevInstallation.installationType == nextInstallation.installationType, "InstallationFacet: Wrong installation type");
    require(prevInstallation.alchemicaType == nextInstallation.alchemicaType, "InstallationFacet: Wrong alchemicaType");
    require(prevInstallation.level == nextInstallation.level - 1, "InstallationFacet: Wrong installation level");

    IERC20(s.gltr).transferFrom(msg.sender, 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, _gltr * 10**18); //should revert if user doesnt have enough GLTR

    //prevent underflow if user sends too much GLTR
    if (_gltr > nextInstallation.craftTime) revert("InstallationFacet: Too much GLTR");

    //Confirm upgrade immediately
    if (nextInstallation.craftTime - _gltr == 0) {
      realm.upgradeInstallation(
        _upgradeQueue.parcelId,
        _upgradeQueue.installationId,
        prevInstallation.nextLevelId,
        _upgradeQueue.coordinateX,
        _upgradeQueue.coordinateY
      );
    } else {
      UpgradeQueue memory upgrade = UpgradeQueue(
        _upgradeQueue.owner,
        _upgradeQueue.coordinateX,
        _upgradeQueue.coordinateY,
        uint40(block.number) + nextInstallation.craftTime - _gltr,
        false,
        _upgradeQueue.parcelId,
        _upgradeQueue.installationId
      );
      s.upgradeQueue.push(upgrade);

      // update upgradeQueueLength
      realm.addUpgradeQueueLength(_upgradeQueue.parcelId);

      emit UpgradeInitiated(
        _upgradeQueue.parcelId,
        _upgradeQueue.coordinateX,
        _upgradeQueue.coordinateY,
        block.number,
        uint40(block.number) + nextInstallation.craftTime - _gltr,
        _upgradeQueue.installationId
      );
      emit UpgradeQueued(_upgradeQueue.owner, _upgradeQueue.parcelId, s.upgradeQueue.length - 1);
    }
  }
}

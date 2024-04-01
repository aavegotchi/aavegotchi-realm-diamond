// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {RealmDiamond} from "../interfaces/RealmDiamond.sol";
import {IERC721} from "../interfaces/IERC721.sol";

import {LibERC998} from "../libraries/LibERC998.sol";
import {LibERC1155} from "../libraries/LibERC1155.sol";
import {LibEvents} from "../libraries/LibEvents.sol";
import {LibMeta} from "../libraries/LibMeta.sol";

import {LibAppStorageInstallation, InstallationAppStorage, UpgradeQueue, InstallationType} from "../libraries/AppStorageInstallation.sol";

library LibInstallation {
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

  function _equipInstallation(
    address _owner,
    uint256 _realmId,
    uint256 _installationId
  ) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    LibERC1155.removeFromOwner(_owner, _installationId, 1);
    LibERC1155.addToOwner(s.realmDiamond, _installationId, 1);
    emit LibEvents.TransferSingle(address(this), _owner, s.realmDiamond, _installationId, 1);
    LibERC998.addToParent(s.realmDiamond, _realmId, _installationId, 1);
    emit LibEvents.TransferToParent(s.realmDiamond, _realmId, _installationId, 1);
  }

  function _unequipInstallation(
    address _owner,
    uint256 _realmId,
    uint256 _installationId
  ) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    LibERC998.removeFromParent(s.realmDiamond, _realmId, _installationId, 1);
    emit LibEvents.TransferFromParent(s.realmDiamond, _realmId, _installationId, 1);

    //add to owner for unequipType 1
    if (s.unequipTypes[_installationId] == 1) {
      LibERC1155.addToOwner(_owner, _installationId, 1);
      emit LibEvents.TransferSingle(address(this), s.realmDiamond, _owner, _installationId, 1);
    } else {
      //default case: burn
      LibERC1155._burn(s.realmDiamond, _installationId, 1);
    }
  }

  /// @dev It is not expected for any of these dynamic arrays to have more than a small number of elements, so we use a naive removal approach
  function _removeFromParcelIdToUpgradeIds(uint256 _parcel, uint256 _upgradeId) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    uint256[] storage upgradeIds = s.parcelIdToUpgradeIds[_parcel];
    uint256 index = containsId(_upgradeId, upgradeIds);

    if (index != type(uint256).max) {
      uint256 last = upgradeIds[upgradeIds.length - 1];
      upgradeIds[index] = last;
      upgradeIds.pop();
    }
  }

  /// @return index The index of the id in the array
  function containsId(uint256 _id, uint256[] memory _ids) internal pure returns (uint256 index) {
    for (uint256 i; i < _ids.length; ) {
      if (_ids[i] == _id) {
        return i;
      }
      unchecked {
        ++i;
      }
    }
    return type(uint256).max;
  }

  function checkUpgrade(
    UpgradeQueue memory _upgradeQueue,
    uint256 _gotchiId,
    RealmDiamond _realmDiamond
  ) internal view {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();

    // // check owner
    // require(IERC721(address(_realmDiamond)).ownerOf(_upgradeQueue.parcelId) == _upgradeQueue.owner, "LibInstallation: Not owner");
    // // check coordinates

    // verify access right
    _realmDiamond.verifyAccessRight(_upgradeQueue.parcelId, _gotchiId, 6, LibMeta.msgSender());

    _realmDiamond.checkCoordinates(_upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _upgradeQueue.installationId);

    //current installation
    InstallationType memory prevInstallation = s.installationTypes[_upgradeQueue.installationId];

    //next level
    InstallationType memory nextInstallation = s.installationTypes[prevInstallation.nextLevelId];

    // check altar requirement
    // altar prereq is 0
    if (nextInstallation.prerequisites[0] > 0) {
      uint256 equippedAltarId = _realmDiamond.getAltarId(_upgradeQueue.parcelId);
      uint256 equippedAltarLevel = s.installationTypes[equippedAltarId].level;
      require(equippedAltarLevel >= nextInstallation.prerequisites[0], "LibInstallation: Altar Tech Tree Reqs not met");
    }

    require(prevInstallation.nextLevelId > 0, "LibInstallation: Maximum upgrade reached");
    require(prevInstallation.installationType == nextInstallation.installationType, "LibInstallation: Wrong installation type");
    require(prevInstallation.alchemicaType == nextInstallation.alchemicaType, "LibInstallation: Wrong alchemicaType");
    require(prevInstallation.level == nextInstallation.level - 1, "LibInstallation: Wrong installation level");

    //@todo: check for lodge prereq once lodges are implemented
  }

  function upgradeInstallation(
    UpgradeQueue memory _upgradeQueue,
    uint256 _nextLevelId,
    RealmDiamond _realmDiamond
  ) internal {
    LibInstallation._unequipInstallation(_upgradeQueue.owner, _upgradeQueue.parcelId, _upgradeQueue.installationId);
    // mint new installation
    //mint without queue
    LibERC1155._safeMint(_upgradeQueue.owner, _nextLevelId, 1, false, 0);
    // equip new installation
    LibInstallation._equipInstallation(_upgradeQueue.owner, _upgradeQueue.parcelId, _nextLevelId);

    _realmDiamond.upgradeInstallation(
      _upgradeQueue.parcelId,
      _upgradeQueue.installationId,
      _nextLevelId,
      _upgradeQueue.coordinateX,
      _upgradeQueue.coordinateY
    );

    emit UpgradeFinalized(_upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _nextLevelId);
  }

  function addToUpgradeQueue(UpgradeQueue memory _upgradeQueue, RealmDiamond _realmDiamond) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    //check upgradeQueueCapacity
    require(
      _realmDiamond.getParcelUpgradeQueueCapacity(_upgradeQueue.parcelId) > _realmDiamond.getParcelUpgradeQueueLength(_upgradeQueue.parcelId),
      "LibInstallation: UpgradeQueue full"
    );
    s.upgradeQueue.push(_upgradeQueue);

    // update upgradeQueueLength
    _realmDiamond.addUpgradeQueueLength(_upgradeQueue.parcelId);

    // Add to indexing helper to help for efficient getter
    uint256 upgradeIdIndex = s.upgradeQueue.length - 1;
    s.parcelIdToUpgradeIds[_upgradeQueue.parcelId].push(upgradeIdIndex);

    emit UpgradeInitiated(
      _upgradeQueue.parcelId,
      _upgradeQueue.coordinateX,
      _upgradeQueue.coordinateY,
      block.number,
      _upgradeQueue.readyBlock,
      _upgradeQueue.installationId
    );
    emit UpgradeQueued(_upgradeQueue.owner, _upgradeQueue.parcelId, upgradeIdIndex);
  }

  function finalizeUpgrade(address _owner, uint256 index) internal returns (bool) {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();

    if (s.upgradeComplete[index]) return true;
    uint40 readyBlock = s.upgradeQueue[index].readyBlock;
    uint256 parcelId = s.upgradeQueue[index].parcelId;
    uint256 installationId = s.upgradeQueue[index].installationId;
    uint16 coordinateX = s.upgradeQueue[index].coordinateX;
    uint16 coordinateY = s.upgradeQueue[index].coordinateY;

    // check that upgrade is ready
    if (block.number >= readyBlock) {
      // burn old installation
      LibInstallation._unequipInstallation(_owner, parcelId, installationId);
      // mint new installation
      uint256 nextLevelId = s.installationTypes[installationId].nextLevelId;
      LibERC1155._safeMint(_owner, nextLevelId, 1, true, index);
      // equip new installation
      LibInstallation._equipInstallation(_owner, parcelId, nextLevelId);

      RealmDiamond realm = RealmDiamond(s.realmDiamond);
      realm.upgradeInstallation(parcelId, installationId, nextLevelId, coordinateX, coordinateY);

      // update updateQueueLength
      realm.subUpgradeQueueLength(parcelId);

      // clean unique hash
      bytes32 uniqueHash = keccak256(abi.encodePacked(parcelId, coordinateX, coordinateY, installationId));
      s.upgradeHashes[uniqueHash] = 0;

      s.upgradeComplete[index] = true;

      LibInstallation._removeFromParcelIdToUpgradeIds(parcelId, index);

      emit UpgradeFinalized(parcelId, coordinateX, coordinateY, nextLevelId);
      emit UpgradeQueueFinalized(_owner, parcelId, index);
      return true;
    }
    return false;
  }
}

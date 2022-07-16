// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {LibAppStorageInstallation, InstallationType, QueueItem, UpgradeQueue, Modifiers} from "../../libraries/AppStorageInstallation.sol";
import {LibSignature} from "../../libraries/LibSignature.sol";
import {RealmDiamond} from "../../interfaces/RealmDiamond.sol";
import {IERC721} from "../../interfaces/IERC721.sol";
import {IERC20} from "../../interfaces/IERC20.sol";
import {LibItems} from "../../libraries/LibItems.sol";
import {InstallationAdminFacet} from "./InstallationAdminFacet.sol";
import {LibInstallation} from "../../libraries/LibInstallation.sol";
import {LibERC1155} from "../../libraries/LibERC1155.sol";
import {LibERC998} from "../../libraries/LibERC998.sol";

contract InstallationUpgradeFacet is Modifiers {
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

  event UpgradeTimeReduced(uint256 indexed _queueId, uint256 indexed _realmId, uint256 _coordinateX, uint256 _coordinateY, uint40 _blocksReduced);

  /// @notice Allow a user to upgrade an installation in a parcel
  /// @dev Will throw if the caller is not the owner of the parcel in which the installation is installed
  /// @param _upgradeQueue A struct containing details about the queue which contains the installation to upgrade
  ///@param _signature API signature
  ///@param _gltr Amount of GLTR to use, can be 0
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

    // check altar requirement
    //altar prereq is 0
    if (nextInstallation.prerequisites[0] > 0) {
      uint256 equippedAltarId = RealmDiamond(s.realmDiamond).getAltarId(_upgradeQueue.parcelId);
      uint256 equippedAltarLevel = s.installationTypes[equippedAltarId].level;
      require(equippedAltarLevel >= nextInstallation.prerequisites[0], "LibAlchemica: Altar Tech Tree Reqs not met");
    }

    //@todo: check for lodge prereq once lodges are implemented

    //take the required alchemica
    address[4] memory alchemicaAddresses = realm.getAlchemicaAddresses();
    LibItems._splitAlchemica(nextInstallation.alchemicaCost, alchemicaAddresses);

    require(prevInstallation.nextLevelId > 0, "InstallationFacet: Maximum upgrade reached");
    require(prevInstallation.installationType == nextInstallation.installationType, "InstallationFacet: Wrong installation type");
    require(prevInstallation.alchemicaType == nextInstallation.alchemicaType, "InstallationFacet: Wrong alchemicaType");
    require(prevInstallation.level == nextInstallation.level - 1, "InstallationFacet: Wrong installation level");

    uint256 gltrAmount = uint256(_gltr) * 1e18;
    IERC20(s.gltr).transferFrom(msg.sender, 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, gltrAmount); //should revert if user doesnt have enough GLTR

    //prevent underflow if user sends too much GLTR
    if (_gltr > nextInstallation.craftTime) revert("InstallationFacet: Too much GLTR");

    //Confirm upgrade immediately
    if (nextInstallation.craftTime - _gltr == 0) {
      LibInstallation._unequipInstallation(_upgradeQueue.owner, _upgradeQueue.parcelId, _upgradeQueue.installationId);
      // mint new installation
      uint256 nextLevelId = s.installationTypes[_upgradeQueue.installationId].nextLevelId;
      //mint without queue
      LibERC1155._safeMint(_upgradeQueue.owner, nextLevelId, 1, false, 0);
      // equip new installation
      LibInstallation._equipInstallation(_upgradeQueue.owner, _upgradeQueue.parcelId, nextLevelId);

      realm.upgradeInstallation(
        _upgradeQueue.parcelId,
        _upgradeQueue.installationId,
        prevInstallation.nextLevelId,
        _upgradeQueue.coordinateX,
        _upgradeQueue.coordinateY
      );

      emit UpgradeTimeReduced(0, _upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _gltr);
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

      // Add to indexing helper to help for efficient getter
      s.parcelIdToUpgradeIds[_upgradeQueue.parcelId].push(s.upgradeQueue.length - 1);

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

  function reduceUpgradeTime(
    uint256 _upgradeIndex,
    uint40 _blocks,
    bytes memory _signature
  ) external {
    UpgradeQueue storage queue = s.upgradeQueue[_upgradeIndex];

    require(
      LibSignature.isValid(keccak256(abi.encodePacked(_upgradeIndex)), _signature, s.backendPubKey),
      "InstallationAdminFacet: Invalid signature"
    );

    //todo: check access rights
    require(msg.sender == queue.owner, "InstallationUpgradeFacet: Not owner");

    //handle underflow / overspend
    uint256 nextLevelId = s.installationTypes[queue.installationId].nextLevelId;
    require(_blocks <= s.installationTypes[nextLevelId].craftTime, "InstallationUpgradeFacet: Too much GLTR");

    //burn GLTR
    uint256 gltrAmount = uint256(_blocks) * 1e18;
    IERC20(s.gltr).transferFrom(msg.sender, 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, gltrAmount);

    //reduce the blocks
    queue.readyBlock -= _blocks;

    //if upgrade should be finalized, call finalizeUpgrade
    if (queue.readyBlock <= block.number) {
      _finalizeUpgrade(queue.owner, _upgradeIndex);
    }
  }

  /// @dev TO BE DEPRECATED
  /// @notice Query details about all ongoing upgrade queues
  /// @return output_ An array of structs, each representing an ongoing upgrade queue
  function getAllUpgradeQueue() external view returns (UpgradeQueue[] memory) {
    return s.upgradeQueue;
  }

  /// @dev TO BE REPLACED BY getUserUpgradeQueueNew after the old queue is cleared out
  /// @notice Query details about all pending craft queues
  /// @param _owner Address to query queue
  /// @return output_ An array of structs, each representing a pending craft queue
  /// @return indexes_ An array of IDs, to be used in the new finalizeUpgrades() function
  function getUserUpgradeQueue(address _owner) external view returns (UpgradeQueue[] memory output_, uint256[] memory indexes_) {
    uint256 length = s.upgradeQueue.length;
    output_ = new UpgradeQueue[](length);
    indexes_ = new uint256[](length);

    uint256 counter;
    for (uint256 i; i < length; i++) {
      if (s.upgradeQueue[i].owner == _owner && !s.upgradeComplete[i]) {
        output_[counter] = s.upgradeQueue[i];
        indexes_[counter] = i;
        counter++;
      }
    }
    assembly {
      mstore(output_, counter)
      mstore(indexes_, counter)
    }
  }

  /// @notice Query details about all pending craft queues
  /// @param _owner Address to query queue
  /// @return output_ An array of structs, each representing a pending craft queue
  /// @return indexes_ An array of IDs, to be used in the new finalizeUpgrades() function
  function getUserUpgradeQueueNew(address _owner) external view returns (UpgradeQueue[] memory output_, uint256[] memory indexes_) {
    RealmDiamond realm = RealmDiamond(s.realmDiamond);
    uint256[] memory tokenIds = realm.tokenIdsOfOwner(_owner);

    // Only return up to the first 500 upgrades.
    output_ = new UpgradeQueue[](500);
    indexes_ = new uint256[](500);

    uint256 counter;
    for (uint256 i; i < tokenIds.length; i++) {
      uint256[] memory parcelUpgradeIds = s.parcelIdToUpgradeIds[tokenIds[i]];
      for (uint256 j; j < parcelUpgradeIds.length; j++) {
        output_[counter] = s.upgradeQueue[parcelUpgradeIds[j]];
        indexes_[counter] = parcelUpgradeIds[j];
        counter++;
        if (counter >= 500) {
          break;
        }
      }
      if (counter >= 500) {
        break;
      }
    }
    assembly {
      mstore(output_, counter)
      mstore(indexes_, counter)
    }
  }

  function getUpgradeQueueId(uint256 _queueId) external view returns (UpgradeQueue memory) {
    return s.upgradeQueue[_queueId];
  }

  function getParcelUpgradeQueue(uint256 _parcelId) external view returns (UpgradeQueue[] memory output_, uint256[] memory indexes_) {
    indexes_ = s.parcelIdToUpgradeIds[_parcelId];
    output_ = new UpgradeQueue[](indexes_.length);
    for (uint256 i; i < indexes_.length; i++) {
      output_[i] = s.upgradeQueue[indexes_[i]];
    }
  }

  function getUpgradeQueueLength() external view returns (uint256) {
    return s.upgradeQueue.length;
  }
}

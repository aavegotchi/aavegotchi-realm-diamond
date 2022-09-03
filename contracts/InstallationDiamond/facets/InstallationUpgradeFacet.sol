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
import {LibMeta} from "../../libraries/LibMeta.sol";

contract InstallationUpgradeFacet is Modifiers {
  event UpgradeTimeReduced(uint256 indexed _queueId, uint256 indexed _realmId, uint256 _coordinateX, uint256 _coordinateY, uint40 _blocksReduced);

  /// @notice Allow a user to upgrade an installation in a parcel
  /// @dev Will throw if the caller is not the owner of the parcel in which the installation is installed
  /// @param _upgradeQueue A struct containing details about the queue which contains the installation to upgrade
  /// @param _gotchiId The id of the gotchi which is upgrading the installation
  ///@param _signature API signature
  ///@param _gltr Amount of GLTR to use, can be 0
  function upgradeInstallation(
    UpgradeQueue memory _upgradeQueue,
    uint256 _gotchiId,
    bytes memory _signature,
    uint40 _gltr
  ) external {
    // Check signature
    require(
      LibSignature.isValid(
        keccak256(
          abi.encodePacked(_upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _upgradeQueue.installationId, _gotchiId)
        ),
        _signature,
        s.backendPubKey
      ),
      "InstallationUpgradeFacet: Invalid signature"
    );

    // Storing variables in memory needed for validation and execution
    uint256 nextLevelId = s.installationTypes[_upgradeQueue.installationId].nextLevelId;
    InstallationType memory nextInstallation = s.installationTypes[nextLevelId];
    RealmDiamond realm = RealmDiamond(s.realmDiamond);

    // Validation checks
    bytes32 uniqueHash = keccak256(
      abi.encodePacked(_upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _upgradeQueue.installationId)
    );
    require(s.upgradeHashes[uniqueHash] == 0, "InstallationUpgradeFacet: Upgrade hash not unique");

    LibInstallation.checkUpgrade(_upgradeQueue, _gotchiId, realm);

    // Take the required alchemica and GLTR
    LibItems._splitAlchemica(nextInstallation.alchemicaCost, realm.getAlchemicaAddresses());
    //prevent underflow if user sends too much GLTR
    require(_gltr <= nextInstallation.craftTime, "InstallationUpgradeFacet: Too much GLTR");

    require(
      IERC20(s.gltr).transferFrom(LibMeta.msgSender(), 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, (uint256(_gltr) * 1e18)),
      "InstallationUpgradeFacet: Failed GLTR transfer"
    ); //should revert if user doesnt have enough GLTR

    if (nextInstallation.craftTime - _gltr == 0) {
      //Confirm upgrade immediately
      emit UpgradeTimeReduced(0, _upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _gltr);
      LibInstallation.upgradeInstallation(_upgradeQueue, nextLevelId, realm);
    } else {
      // Add upgrade hash to maintain uniqueness in upgrades
      s.upgradeHashes[uniqueHash] = _upgradeQueue.parcelId;
      // Set the ready block and claimed flag before adding to the queue
      _upgradeQueue.readyBlock = uint40(block.number) + nextInstallation.craftTime - _gltr;
      _upgradeQueue.claimed = false;
      LibInstallation.addToUpgradeQueue(_upgradeQueue, realm);
    }
  }

  /// @notice Allow anyone to finalize any existing queue upgrade
  function finalizeUpgrades(uint256[] memory _upgradeIndexes) external {
    for (uint256 i; i < _upgradeIndexes.length; i++) {
      UpgradeQueue storage upgradeQueue = s.upgradeQueue[_upgradeIndexes[i]];
      LibInstallation.finalizeUpgrade(upgradeQueue.owner, _upgradeIndexes[i]);
    }
  }

  function reduceUpgradeTime(
    uint256 _upgradeIndex,
    uint256 _gotchiId,
    uint40 _blocks,
    bytes memory _signature
  ) external {
    UpgradeQueue storage queue = s.upgradeQueue[_upgradeIndex];

    require(
      LibSignature.isValid(keccak256(abi.encodePacked(_upgradeIndex)), _signature, s.backendPubKey),
      "InstallationUpgradeFacet: Invalid signature"
    );

    RealmDiamond realm = RealmDiamond(s.realmDiamond);
    realm.verifyAccessRight(queue.parcelId, _gotchiId, 6, LibMeta.msgSender());

    require(LibMeta.msgSender() == queue.owner, "InstallationUpgradeFacet: Not owner");

    //handle underflow / overspend
    uint256 nextLevelId = s.installationTypes[queue.installationId].nextLevelId;
    require(_blocks <= s.installationTypes[nextLevelId].craftTime, "InstallationUpgradeFacet: Too much GLTR");

    //burn GLTR
    uint256 gltrAmount = uint256(_blocks) * 1e18;
    IERC20(s.gltr).transferFrom(LibMeta.msgSender(), 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, gltrAmount);

    //reduce the blocks
    queue.readyBlock -= _blocks;

    //if upgrade should be finalized, call finalizeUpgrade
    if (queue.readyBlock <= block.number) {
      LibInstallation.finalizeUpgrade(queue.owner, _upgradeIndex);
    }

    emit UpgradeTimeReduced(_upgradeIndex, queue.parcelId, queue.coordinateX, queue.coordinateY, _blocks);
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

  /// @notice For realm to validate whether a parcel has an upgrade queueing before removing an installation
  function parcelQueueEmpty(uint256 _parcelId) external view returns (bool) {
    return s.parcelIdToUpgradeIds[_parcelId].length == 0;
  }

  function parcelInstallationUpgrading(
    uint256 _parcelId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) external view returns (bool) {
    uint256[] memory parcelQueue = s.parcelIdToUpgradeIds[_parcelId];

    for (uint256 i; i < parcelQueue.length; i++) {
      UpgradeQueue memory queue = s.upgradeQueue[parcelQueue[i]];

      if (queue.installationId == _installationId && queue.coordinateX == _x && queue.coordinateY == _y) {
        return true;
      }
    }
    return false;
  }

  function getUpgradeQueueLength() external view returns (uint256) {
    return s.upgradeQueue.length;
  }
}

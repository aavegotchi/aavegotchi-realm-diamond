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

contract TestInstallationFacet is Modifiers {
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

  function mockUpgradeInstallation(
    UpgradeQueue memory _upgradeQueue,
    uint256 _gotchiId,
    uint40 _gltr
  ) external {
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

    // For easier testing, we min gltr instead of reverting
    _gltr = nextInstallation.craftTime < _gltr ? nextInstallation.craftTime : _gltr;

    if (nextInstallation.craftTime - _gltr == 0) {
      //Confirm upgrade immediately
      emit UpgradeTimeReduced(0, _upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _gltr);
      LibInstallation.upgradeInstallation(_upgradeQueue, nextLevelId, realm);
    } else {
      s.upgradeHashes[uniqueHash] = _upgradeQueue.parcelId;

      // Set the ready block and claimed flag before adding to the queue
      _upgradeQueue.readyBlock = uint40(block.number) + nextInstallation.craftTime - _gltr;
      _upgradeQueue.claimed = false;
      LibInstallation.addToUpgradeQueue(_upgradeQueue, realm);
    }
  }

  /// @notice Craft installations without checks
  function mockCraftInstallation(uint16 installationId) external {
    LibERC1155._safeMint(msg.sender, installationId, 1, false, 0);
  }

  function mockGetInstallationsLength() external view returns (uint256) {
    return s.installationTypes.length;
  }
}

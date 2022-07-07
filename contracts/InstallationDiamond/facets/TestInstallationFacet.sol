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

  function mockUpgradeInstallation(UpgradeQueue calldata _upgradeQueue, uint40 _gltr) external {
    // check owner
    require(IERC721(s.realmDiamond).ownerOf(_upgradeQueue.parcelId) == _upgradeQueue.owner, "TestInstallationFacet: Not owner");
    // check coordinates
    RealmDiamond realm = RealmDiamond(s.realmDiamond);

    //check upgradeQueueCapacity
    require(
      realm.getParcelUpgradeQueueCapacity(_upgradeQueue.parcelId) > realm.getParcelUpgradeQueueLength(_upgradeQueue.parcelId),
      "TestInstallationFacet: UpgradeQueue full"
    );

    realm.checkCoordinates(_upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _upgradeQueue.installationId);

    // check unique hash
    bytes32 uniqueHash = keccak256(
      abi.encodePacked(_upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _upgradeQueue.installationId)
    );

    //The same upgrade cannot be queued twice
    require(s.upgradeHashes[uniqueHash] == 0, "TestInstallationFacet: Upgrade hash not unique");

    s.upgradeHashes[uniqueHash] = _upgradeQueue.parcelId;

    //current installation
    InstallationType memory prevInstallation = s.installationTypes[_upgradeQueue.installationId];

    //next level
    InstallationType memory nextInstallation = s.installationTypes[prevInstallation.nextLevelId];

    require(prevInstallation.nextLevelId > 0, "TestInstallationFacet: Maximum upgrade reached");
    require(prevInstallation.installationType == nextInstallation.installationType, "TestInstallationFacet: Wrong installation type");
    require(prevInstallation.alchemicaType == nextInstallation.alchemicaType, "TestInstallationFacet: Wrong alchemicaType");
    require(prevInstallation.level == nextInstallation.level - 1, "TestInstallationFacet: Wrong installation level");

    //prevent underflow if user sends too much GLTR
    if (_gltr > nextInstallation.craftTime) revert("TestInstallationFacet: Too much GLTR");

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

  /// @notice Craft installations without checks
  function mockCraftInstallation(uint16 installationId) external {
    LibERC1155._safeMint(msg.sender, installationId, 1, false, 0);
  }

  function mockGetInstallationsLength() external view returns (uint256) {
    return s.installationTypes.length;
  }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {LibERC998} from "../libraries/LibERC998.sol";
import {LibERC1155} from "../libraries/LibERC1155.sol";
import {LibERC20} from "../libraries/LibERC20.sol";
import {LibAppStorageInstallation, InstallationAppStorage, UpgradeQueue, UserUpgradeQueue, InstallationType} from "../libraries/AppStorageInstallation.sol";
import {LibSignature} from "../libraries/LibSignature.sol";
import {RealmDiamond} from "../interfaces/RealmDiamond.sol";
import {IERC721} from "../interfaces/IERC721.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import {LibItems} from "../libraries/LibItems.sol";

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

  function _equipInstallation(
    address _owner,
    uint256 _realmId,
    uint256 _installationId
  ) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    LibERC1155.removeFromOwner(_owner, _installationId, 1);
    LibERC1155.addToOwner(s.realmDiamond, _installationId, 1);
    emit LibERC1155.TransferSingle(address(this), _owner, s.realmDiamond, _installationId, 1);
    LibERC998.addToParent(s.realmDiamond, _realmId, _installationId, 1);
    emit LibERC1155.TransferToParent(s.realmDiamond, _realmId, _installationId, 1);
  }

  function _unequipInstallation(uint256 _realmId, uint256 _installationId) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    LibERC998.removeFromParent(s.realmDiamond, _realmId, _installationId, 1);
    emit LibERC1155.TransferFromParent(s.realmDiamond, _realmId, _installationId, 1);
    LibERC1155._burn(s.realmDiamond, _installationId, 1);
  }

  function _upgradeInstallation(
    UpgradeQueue calldata _upgradeQueue,
    uint40 _gltr,
    bytes memory _signature
  ) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    require(
      LibSignature.isValid(
        keccak256(abi.encodePacked(_upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _upgradeQueue.installationId)),
        _signature,
        s.backendPubKey
      ),
      "InstallationFacet: Invalid signature"
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
      //Use the userUpgradeQueue instead of the global queue
      UserUpgradeQueue memory upgrade = UserUpgradeQueue(
        _upgradeQueue.coordinateX,
        _upgradeQueue.coordinateY,
        uint40(block.number) + nextInstallation.craftTime - _gltr,
        false,
        _upgradeQueue.parcelId,
        _upgradeQueue.installationId
      );
      s.userUpgradeQueue[_upgradeQueue.owner].push(upgrade);

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
    }
    finalizeUpgrade();
  }

  /// @notice Allow anyone to finalize any existing queue upgrade
  /// @dev Only three queue upgrades can be finalized in one transaction
  function finalizeUpgrade() public {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    if (s.upgradeQueue.length > 0) {
      //can only process 3 upgrades per tx
      uint256 counter = 3;
      uint256 offset;
      uint256 _upgradeQueueLength = s.upgradeQueue.length;
      for (uint256 index; index < _upgradeQueueLength; index++) {
        UpgradeQueue memory queueUpgrade = s.upgradeQueue[index - offset];
        // check that upgrade is ready
        if (block.number >= queueUpgrade.readyBlock) {
          // burn old installation
          LibInstallation._unequipInstallation(queueUpgrade.parcelId, queueUpgrade.installationId);
          // mint new installation
          uint256 nextLevelId = s.installationTypes[queueUpgrade.installationId].nextLevelId;
          LibERC1155._safeMint(queueUpgrade.owner, nextLevelId, index - offset);
          // equip new installation
          LibInstallation._equipInstallation(queueUpgrade.owner, queueUpgrade.parcelId, nextLevelId);

          RealmDiamond realm = RealmDiamond(s.realmDiamond);
          realm.upgradeInstallation(
            queueUpgrade.parcelId,
            queueUpgrade.installationId,
            nextLevelId,
            queueUpgrade.coordinateX,
            queueUpgrade.coordinateY
          );

          // update updateQueueLength
          realm.subUpgradeQueueLength(queueUpgrade.parcelId);

          // clean unique hash
          bytes32 uniqueHash = keccak256(
            abi.encodePacked(queueUpgrade.parcelId, queueUpgrade.coordinateX, queueUpgrade.coordinateY, queueUpgrade.installationId)
          );
          s.upgradeHashes[uniqueHash] = 0;

          // pop upgrade from array
          s.upgradeQueue[index - offset] = s.upgradeQueue[s.upgradeQueue.length - 1];
          s.upgradeQueue.pop();
          counter--;
          offset++;
          emit UpgradeFinalized(queueUpgrade.parcelId, queueUpgrade.coordinateX, queueUpgrade.coordinateY, nextLevelId);
        }
        if (counter == 0) break;
      }
    }
  }

  function finalizeUserUpgrades(address _owner) external {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    if (s.userUpgradeQueue[_owner].length > 0) {
      uint256 _upgradeQueueLength = s.userUpgradeQueue[_owner].length;
      for (uint256 index; index < _upgradeQueueLength; index++) {
        UserUpgradeQueue memory queueUpgrade = s.userUpgradeQueue[_owner][index];
        // check that upgrade is ready
        if (block.number >= queueUpgrade.readyBlock) {
          // burn old installation
          LibInstallation._unequipInstallation(queueUpgrade.parcelId, queueUpgrade.installationId);
          // mint new installation
          uint256 nextLevelId = s.installationTypes[queueUpgrade.installationId].nextLevelId;
          LibERC1155._safeMint(_owner, nextLevelId, index);
          // equip new installation
          LibInstallation._equipInstallation(_owner, queueUpgrade.parcelId, nextLevelId);

          RealmDiamond realm = RealmDiamond(s.realmDiamond);
          realm.upgradeInstallation(
            queueUpgrade.parcelId,
            queueUpgrade.installationId,
            nextLevelId,
            queueUpgrade.coordinateX,
            queueUpgrade.coordinateY
          );

          // update updateQueueLength
          realm.subUpgradeQueueLength(queueUpgrade.parcelId);

          // clean unique hash
          bytes32 uniqueHash = keccak256(
            abi.encodePacked(queueUpgrade.parcelId, queueUpgrade.coordinateX, queueUpgrade.coordinateY, queueUpgrade.installationId)
          );
          s.upgradeHashes[uniqueHash] = 0;

          // pop upgrade from array
          s.upgradeQueue[index] = s.upgradeQueue[s.upgradeQueue.length - 1];
          s.upgradeQueue.pop();

          emit UpgradeFinalized(queueUpgrade.parcelId, queueUpgrade.coordinateX, queueUpgrade.coordinateY, nextLevelId);
        }
      }
    }
  }
}

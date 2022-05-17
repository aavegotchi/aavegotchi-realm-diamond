// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {LibAppStorageInstallation, InstallationType, QueueItem, UpgradeQueue, Modifiers} from "../../libraries/AppStorageInstallation.sol";
import {LibERC1155} from "../../libraries/LibERC1155.sol";
import {RealmDiamond} from "../../interfaces/RealmDiamond.sol";
import {LibItems} from "../../libraries/LibItems.sol";
import {LibERC998, ItemTypeIO} from "../../libraries/LibERC998.sol";
import {LibStrings} from "../../libraries/LibStrings.sol";
import {LibERC1155} from "../../libraries/LibERC1155.sol";
import {LibERC20} from "../../libraries/LibERC20.sol";
import {LibInstallation} from "../../libraries/LibInstallation.sol";
import {LibItems} from "../../libraries/LibItems.sol";
import {IERC721} from "../../interfaces/IERC721.sol";
import {RealmDiamond} from "../../interfaces/RealmDiamond.sol";
import {IERC20} from "../../interfaces/IERC20.sol";
import {LibSignature} from "../../libraries/LibSignature.sol";

import "hardhat/console.sol";

contract InstallationFacet is Modifiers {
  event AddedToQueue(uint256 indexed _queueId, uint256 indexed _installationId, uint256 _readyBlock, address _sender);

  event QueueClaimed(uint256 indexed _queueId);

  event CraftTimeReduced(uint256 indexed _queueId, uint256 _blocksReduced);

  event UpgradeTimeReduced(uint256 indexed _queueId, uint256 indexed _realmId, uint256 _coordinateX, uint256 _coordinateY, uint256 _blocksReduced);

  event UpgradeInitiated(
    uint256 indexed _realmId,
    uint256 _coordinateX,
    uint256 _coordinateY,
    uint256 blockInitiated,
    uint256 readyBlock,
    uint256 installationId
  );

  event UpgradeFinalized(uint256 indexed _realmId, uint256 _coordinateX, uint256 _coordinateY, uint256 _newInstallationId);

  /***********************************|
   |             Read Functions         |
   |__________________________________*/

  struct InstallationIdIO {
    uint256 installationId;
    uint256 balance;
  }

  struct ReservoirStats {
    uint256 spillRate;
    uint256 spillRadius;
    uint256 capacity;
  }

  /// @notice Returns balance for each installation that exists for an account
  /// @param _account Address of the account to query
  /// @return bals_ An array of structs, each struct containing details about each installation owned
  function installationsBalances(address _account) external view returns (InstallationIdIO[] memory bals_) {
    uint256 count = s.ownerInstallations[_account].length;
    bals_ = new InstallationIdIO[](count);
    for (uint256 i; i < count; i++) {
      uint256 installationId = s.ownerInstallations[_account][i];
      bals_[i].balance = s.ownerInstallationBalances[_account][installationId];
      bals_[i].installationId = installationId;
    }
  }

  /// @notice Returns balance for each installation(and their types) that exists for an account
  /// @param _owner Address of the account to query
  /// @return output_ An array of structs containing details about each installation owned(including the installation types)
  function installationsBalancesWithTypes(address _owner) external view returns (ItemTypeIO[] memory output_) {
    uint256 count = s.ownerInstallations[_owner].length;
    output_ = new ItemTypeIO[](count);
    for (uint256 i; i < count; i++) {
      uint256 installationId = s.ownerInstallations[_owner][i];
      output_[i].balance = s.ownerInstallationBalances[_owner][installationId];
      output_[i].itemId = installationId;
      output_[i].installationType = s.installationTypes[installationId];
    }
  }

  /// @notice Get the balance of a non-fungible parent token
  /// @param _tokenContract The contract tracking the parent token
  /// @param _tokenId The ID of the parent token
  /// @param _id     ID of the token
  /// @return value The balance of the token
  function balanceOfToken(
    address _tokenContract,
    uint256 _tokenId,
    uint256 _id
  ) public view returns (uint256 value) {
    value = s.nftInstallationBalances[_tokenContract][_tokenId][_id];
  }

  /// @notice Returns the balances for all ERC1155 items for a ERC721 token
  /// @param _tokenContract Contract address for the token to query
  /// @param _tokenId Identifier of the token to query
  /// @return bals_ An array of structs containing details about each item owned
  function installationBalancesOfToken(address _tokenContract, uint256 _tokenId) public view returns (InstallationIdIO[] memory bals_) {
    uint256 count = s.nftInstallations[_tokenContract][_tokenId].length;
    bals_ = new InstallationIdIO[](count);
    for (uint256 i; i < count; i++) {
      uint256 installationId = s.nftInstallations[_tokenContract][_tokenId][i];
      bals_[i].installationId = installationId;
      bals_[i].balance = s.nftInstallationBalances[_tokenContract][_tokenId][installationId];
    }
  }

  /// @notice Returns the balances for all ERC1155 items for a ERC721 token
  /// @param _tokenContract Contract address for the token to query
  /// @param _tokenId Identifier of the token to query
  /// @return installationBalancesOfTokenWithTypes_ An array of structs containing details about each installation owned(including installation types)
  function installationBalancesOfTokenWithTypes(address _tokenContract, uint256 _tokenId)
    external
    view
    returns (ItemTypeIO[] memory installationBalancesOfTokenWithTypes_)
  {
    installationBalancesOfTokenWithTypes_ = LibERC998.itemBalancesOfTokenWithTypes(_tokenContract, _tokenId);
  }

  /// @notice Check the spillover radius of an installation type
  /// @param _id id of the installationType to query
  /// @return the spillover rate and radius the installation type with identifier _id
  function spilloverRateAndRadiusOfId(uint256 _id) external view returns (uint256, uint256) {
    return (s.installationTypes[_id].spillRate, s.installationTypes[_id].spillRadius);
  }

  /// @notice Query the installation balances of an ERC721 parent token
  /// @param _tokenContract The token contract of the ERC721 parent token
  /// @param _tokenId The identifier of the ERC721 parent token
  /// @param _ids An array containing the ids of the installationTypes to query
  /// @return An array containing the corresponding balances of the installation types queried
  function installationBalancesOfTokenByIds(
    address _tokenContract,
    uint256 _tokenId,
    uint256[] calldata _ids
  ) external view returns (uint256[] memory) {
    uint256[] memory balances = new uint256[](_ids.length);
    for (uint256 i = 0; i < _ids.length; i++) {
      balances[i] = balanceOfToken(_tokenContract, _tokenId, _ids[i]);
    }
    return balances;
  }

  /// @notice Query the item type of a particular installation
  /// @param _installationTypeId Item to query
  /// @return installationType A struct containing details about the item type of an item with identifier `_itemId`
  function getInstallationType(uint256 _installationTypeId) external view returns (InstallationType memory installationType) {
    require(_installationTypeId < s.installationTypes.length, "InstallationFacet: Item type doesn't exist");

    //If a deprecate time has been set, refer to that. Otherwise, use the manual deprecate.
    bool deprecated = s.deprecateTime[_installationTypeId] > 0 ? block.timestamp > s.deprecateTime[_installationTypeId] : installationType.deprecated;

    installationType = s.installationTypes[_installationTypeId];
    installationType.deprecated = deprecated;
  }

  /// @notice Query the item type of multiple installation types
  /// @param _installationTypeIds An array containing the identifiers of items to query
  /// @return installationTypes_ An array of structs,each struct containing details about the item type of the corresponding item
  function getInstallationTypes(uint256[] calldata _installationTypeIds) external view returns (InstallationType[] memory installationTypes_) {
    if (_installationTypeIds.length == 0) {
      installationTypes_ = s.installationTypes;

      for (uint256 i = 0; i < s.installationTypes.length; i++) {
        installationTypes_[i].deprecated = s.deprecateTime[i] == 0 ? s.installationTypes[i].deprecated : block.timestamp > s.deprecateTime[i];
      }
    } else {
      installationTypes_ = new InstallationType[](_installationTypeIds.length);
      for (uint256 i; i < _installationTypeIds.length; i++) {
        //If a deprecate time has been set, refer to that. Otherwise, use the manual deprecate.
        bool deprecated = s.deprecateTime[_installationTypeIds[i]] > 0
          ? block.timestamp > s.deprecateTime[_installationTypeIds[i]]
          : s.installationTypes[_installationTypeIds[i]].deprecated;
        installationTypes_[i] = s.installationTypes[_installationTypeIds[i]];
        installationTypes_[i].deprecated = deprecated;
      }
    }
  }

  /// @notice Query details about all ongoing craft queues
  /// @param _owner Address to query queue
  /// @return output_ An array of structs, each representing an ongoing craft queue
  function getCraftQueue(address _owner) external view returns (QueueItem[] memory output_) {
    uint256 length = s.craftQueue.length;
    output_ = new QueueItem[](length);
    uint256 counter;
    for (uint256 i; i < length; i++) {
      if (s.craftQueue[i].owner == _owner) {
        output_[counter] = s.craftQueue[i];
        counter++;
      }
    }
    assembly {
      mstore(output_, counter)
    }
  }

  /// @notice Query details about a specific user ongoing upgrade queues
  /// @return output_ An array of structs, each representing an ongoing upgrade queue
  function getUserUpgradeQueue(address _owner) external view returns (UpgradeQueue[] memory output_) {
    uint256 length = s.upgradeQueue.length;
    output_ = new UpgradeQueue[](length);
    uint256 counter;
    for (uint256 i; i < length; i++) {
      if (s.upgradeQueue[i].owner == _owner) {
        output_[counter] = s.upgradeQueue[i];
        counter++;
      }
    }
    assembly {
      mstore(output_, counter)
    }
  }

  /// @notice Query details about all ongoing upgrade queues
  /// @return output_ An array of structs, each representing an ongoing upgrade queue
  function getAllUpgradeQueue() external view returns (UpgradeQueue[] memory) {
    return s.upgradeQueue;
  }

  function getUpgradeQueueId(uint256 _queueId) external view returns (UpgradeQueue memory) {
    return s.upgradeQueue[_queueId];
  }

  function getAltarLevel(uint256 _altarId) external view returns (uint256 altarLevel_) {
    require(_altarId < s.installationTypes.length, "InstallationFacet: Item type doesn't exist");
    require(s.installationTypes[_altarId].installationType == 0, "InstallationFacet: Not Altar");
    altarLevel_ = s.installationTypes[_altarId].level;
  }

  function getLodgeLevel(uint256 _installationId) external view returns (uint256 lodgeLevel_) {
    require(_installationId < s.installationTypes.length, "InstallationFacet: Item type doesn't exist");
    require(s.installationTypes[_installationId].installationType == 3, "InstallationFacet: Not Lodge");
    lodgeLevel_ = s.installationTypes[_installationId].level;
  }

  function getReservoirCapacity(uint256 _installationId) external view returns (uint256 capacity_) {
    require(_installationId < s.installationTypes.length, "InstallationFacet: Item type doesn't exist");
    require(s.installationTypes[_installationId].installationType == 2, "InstallationFacet: Not Reservoir");
    capacity_ = s.installationTypes[_installationId].capacity;
  }

  function getReservoirStats(uint256 _installationId) external view returns (ReservoirStats memory reservoirStats_) {
    require(_installationId < s.installationTypes.length, "InstallationFacet: Item type doesn't exist");
    require(s.installationTypes[_installationId].installationType == 2, "InstallationFacet: Not Reservoir");
    reservoirStats_ = ReservoirStats(
      s.installationTypes[_installationId].spillRate,
      s.installationTypes[_installationId].spillRadius,
      s.installationTypes[_installationId].capacity
    );
  }

  /***********************************|
   |             Write Functions        |
   |__________________________________*/

  /// @notice Allow a user to craft installations
  /// @dev Will throw even if one of the installationTypes is deprecated
  /// @dev Puts the installation into a queue
  /// @param _installationTypes An array containing the identifiers of the installationTypes to craft
  /// @param _gltr Array of GLTR to spend on each crafting
  function craftInstallations(uint16[] calldata _installationTypes, uint40[] calldata _gltr) external {
    address[4] memory alchemicaAddresses = RealmDiamond(s.realmDiamond).getAlchemicaAddresses();

    uint256 _installationTypesLength = s.installationTypes.length;
    uint256 _nextCraftId = s.nextCraftId;
    for (uint256 i = 0; i < _installationTypes.length; i++) {
      require(_installationTypes[i] < _installationTypesLength, "InstallationFacet: Installation does not exist");

      InstallationType memory installationType = s.installationTypes[_installationTypes[i]];
      //level check
      require(installationType.level == 1, "InstallationFacet: can only craft level 1");
      //The preset deprecation time has elapsed
      if (s.deprecateTime[_installationTypes[i]] > 0) {
        require(block.timestamp < s.deprecateTime[_installationTypes[i]], "InstallationFacet: Installation has been deprecated");
      }
      require(!installationType.deprecated, "InstallationFacet: Installation has been deprecated");

      //take the required alchemica
      LibItems._splitAlchemica(installationType.alchemicaCost, alchemicaAddresses);

      uint40 gltr = _gltr[i];

      if (gltr > installationType.craftTime) revert("InstallationFacet: Too much GLTR");

      if (installationType.craftTime - gltr == 0) {
        LibERC1155._safeMint(msg.sender, _installationTypes[i], 0);
      } else {
        uint40 readyBlock = uint40(block.number) + installationType.craftTime;

        //put the installation into a queue
        //each wearable needs a unique queue id
        s.craftQueue.push(QueueItem(msg.sender, _installationTypes[i], false, readyBlock, _nextCraftId));

        emit AddedToQueue(_nextCraftId, _installationTypes[i], readyBlock, msg.sender);
        _nextCraftId++;
      }
    }
    s.nextCraftId = _nextCraftId;
    //after queue is over, user can claim installation
  }

  /// @notice Allow a user to claim installations from ready queues
  /// @dev Will throw if the caller is not the queue owner
  /// @dev Will throw if one of the queues is not ready
  /// @param _queueIds An array containing the identifiers of queues to claim
  function claimInstallations(uint256[] calldata _queueIds) external {
    for (uint256 i; i < _queueIds.length; i++) {
      uint256 queueId = _queueIds[i];

      QueueItem memory queueItem = s.craftQueue[queueId];

      require(msg.sender == queueItem.owner, "InstallationFacet: Not owner");
      require(!queueItem.claimed, "InstallationFacet: already claimed");

      require(block.number >= queueItem.readyBlock, "InstallationFacet: Installation not ready");

      // mint installation
      LibERC1155._safeMint(msg.sender, queueItem.installationType, queueItem.id);
      s.craftQueue[queueId].claimed = true;
      emit QueueClaimed(queueId);
    }

    finalizeUpgrade();
  }

  /// @notice Allow a user to speed up multiple queues(installation craft time) by paying the correct amount of $GLTR tokens
  /// @dev Will throw if the caller is not the queue owner
  /// @dev $GLTR tokens are burnt upon usage
  /// @dev amount expressed in block numbers
  /// @param _queueIds An array containing the identifiers of queues to speed up
  /// @param _amounts An array containing the corresponding amounts of $GLTR tokens to pay for each queue speedup
  function reduceCraftTime(uint256[] calldata _queueIds, uint40[] calldata _amounts) external {
    require(_queueIds.length == _amounts.length, "InstallationFacet: Mismatched arrays");
    for (uint256 i; i < _queueIds.length; i++) {
      uint256 queueId = _queueIds[i];
      QueueItem storage queueItem = s.craftQueue[queueId];
      require(msg.sender == queueItem.owner, "InstallationFacet: Not owner");

      require(block.number <= queueItem.readyBlock, "InstallationFacet: installation already done");

      IERC20 gltr = IERC20(s.gltr);

      uint40 blockLeft = queueItem.readyBlock - uint40(block.number);
      uint40 removeBlocks = _amounts[i] <= blockLeft ? _amounts[i] : blockLeft;
      uint256 burnAmount = uint256(removeBlocks) * 10**18;
      gltr.burnFrom(msg.sender, burnAmount);
      queueItem.readyBlock -= removeBlocks;
      emit CraftTimeReduced(queueId, removeBlocks);

      finalizeUpgrade();
    }
  }

  // /// @notice Allow a user to claim installations from ready queues
  // /// @dev Will throw if the caller is not the queue owner
  // /// @dev Will throw if one of the queues is not ready
  // /// @param _queueIds An array containing the identifiers of queues to claim
  // function claimInstallations(uint256[] calldata _queueIds) external {
  //   for (uint256 i; i < _queueIds.length; i++) {
  //     uint256 queueId = _queueIds[i];

  //     QueueItem memory queueItem = s.craftQueue[queueId];

  //     require(msg.sender == queueItem.owner, "InstallationFacet: Not owner");
  //     require(!queueItem.claimed, "InstallationFacet: already claimed");

  //     require(block.number >= queueItem.readyBlock, "InstallationFacet: Installation not ready");

  //     // mint installation
  //     LibERC1155._safeMint(msg.sender, queueItem.installationType, queueItem.id);
  //     s.craftQueue[queueId].claimed = true;
  //     emit QueueClaimed(queueId);
  //   }
  // }

  /// @notice Allow a user to equip an installation to a parcel
  /// @dev Will throw if the caller is not the parcel diamond contract
  /// @dev Will also throw if various prerequisites for the installation are not met
  /// @param _owner Owner of the installation to equip
  /// @param _realmId The identifier of the parcel to equip the installation to
  /// @param _installationId Identifier of the installation to equip
  function equipInstallation(
    address _owner,
    uint256 _realmId,
    uint256 _installationId
  ) external onlyRealmDiamond {
    LibInstallation._equipInstallation(_owner, _realmId, _installationId);

    finalizeUpgrade();
  }

  /// @notice Allow a user to unequip an installation from a parcel
  /// @dev Will throw if the caller is not the parcel diamond contract
  /// @param _realmId The identifier of the parcel to unequip the installation from
  /// @param _installationId Identifier of the installation to unequip
  function unequipInstallation(uint256 _realmId, uint256 _installationId) external onlyRealmDiamond {
    LibInstallation._unequipInstallation(_realmId, _installationId);

    finalizeUpgrade();
  }

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

    IERC20(s.gltr).burnFrom(msg.sender, _gltr * 10**18); //should revert if user doesnt have enough GLTR

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
    }
    finalizeUpgrade();
  }

  /// @notice Allow a user to reduce the upgrade time of an ongoing queue
  /// @dev Will throw if the caller is not the owner of the queue
  /// @param _queueId The identifier of the queue whose upgrade time is to be reduced
  /// @param _amount The number of $GLTR token to be paid, in blocks
  function reduceUpgradeTime(uint256 _queueId, uint40 _amount) external {
    UpgradeQueue storage upgradeQueue = s.upgradeQueue[_queueId];
    require(msg.sender == upgradeQueue.owner, "InstallationFacet: Not owner");

    require(block.number <= upgradeQueue.readyBlock, "InstallationFacet: Upgrade already done");

    IERC20 gltr = IERC20(s.gltr);

    uint40 blockLeft = upgradeQueue.readyBlock - uint40(block.number);
    uint40 removeBlocks = _amount <= blockLeft ? _amount : blockLeft;
    gltr.burnFrom(msg.sender, removeBlocks * 10**18);
    upgradeQueue.readyBlock -= removeBlocks;
    emit UpgradeTimeReduced(_queueId, upgradeQueue.parcelId, upgradeQueue.coordinateX, upgradeQueue.coordinateY, removeBlocks);

    finalizeUpgrade();
  }

  /// @notice Allow anyone to finalize any existing queue upgrade
  /// @dev Only three queue upgrades can be finalized in one transaction
  function finalizeUpgrade() public {
    require(s.upgradeQueue.length > 0, "InstallationFacet: No upgrades");
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
    if (counter == 3) revert("InstallationFacet: No upgrades ready");
  }
}

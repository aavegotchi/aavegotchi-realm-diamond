// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {LibERC998, ItemTypeIO} from "../../libraries/LibERC998.sol";
import {LibAppStorageInstallation, InstallationType, QueueItem, UpgradeQueue, Modifiers} from "../../libraries/AppStorageInstallation.sol";
import {LibStrings} from "../../libraries/LibStrings.sol";
import {LibERC1155} from "../../libraries/LibERC1155.sol";
import {LibERC20} from "../../libraries/LibERC20.sol";
import {LibInstallation} from "../../libraries/LibInstallation.sol";
import {LibItems} from "../../libraries/LibItems.sol";
import {IERC721} from "../../interfaces/IERC721.sol";
import {RealmDiamond} from "../../interfaces/RealmDiamond.sol";
import {IERC20} from "../../interfaces/IERC20.sol";

import "hardhat/console.sol";

contract InstallationFacet is Modifiers {
  event AddedToQueue(uint256 indexed _queueId, uint256 indexed _installationId, uint256 _readyBlock, address _sender);

  event QueueClaimed(uint256 indexed _queueId);

  event CraftTimeReduced(uint256 indexed _queueId, uint256 _blocksReduced);

  event UpgradeTimeReduced(uint256 indexed _queueId, uint256 indexed _realmId, uint256 _coordinateX, uint256 _coordinateY, uint256 _blocksReduced);

  event UpgradeInitiated(uint256 indexed _realmId, uint256 _coordinateX, uint256 _coordinateY, uint256 blockInitiated, uint256 readyBlock);

  event UpgradeFinalized(uint256 indexed _realmId, uint256 _coordinateX, uint256 _coordinateY);

  /***********************************|
   |             Read Functions         |
   |__________________________________*/

  struct InstallationIdIO {
    uint256 installationId;
    uint256 balance;
  }

  /// @notice Returns balance for each installation that exists for an account
  /// @param _account Address of the account to query
  /// @return bals_ An array of structs,each struct containing details about each installation owned
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

  /// @notice Check the spillover rate of an installation type
  /// @param _id id of the installationType to query
  /// @return the spillover rate the installation type with identifier _id
  function spilloverRateOfId(uint256 _id) external view returns (uint256) {
    return s.installationTypes[_id].spillRate;
  }

  /// @notice Check the spillover radius of an installation type
  /// @param _id id of the installationType to query
  /// @return the spillover radius rate the installation type with identifier _id
  function spilloverRadiusOfId(uint256 _id) external view returns (uint256) {
    return s.installationTypes[_id].spillRadius;
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
    installationType = s.installationTypes[_installationTypeId];
  }

  /// @notice Query the item type of multiple installation types
  /// @param _installationTypeIds An array containing the identifiers of items to query
  /// @return installationTypes_ An array of structs,each struct containing details about the item type of the corresponding item
  function getInstallationTypes(uint256[] calldata _installationTypeIds) external view returns (InstallationType[] memory installationTypes_) {
    if (_installationTypeIds.length == 0) {
      installationTypes_ = s.installationTypes;
    } else {
      installationTypes_ = new InstallationType[](_installationTypeIds.length);
      for (uint256 i; i < _installationTypeIds.length; i++) {
        installationTypes_[i] = s.installationTypes[_installationTypeIds[i]];
      }
    }
  }

  /// @notice Get the URI for a voucher type
  /// @return URI for token type
  function uri(uint256 _id) external view returns (string memory) {
    require(_id < s.installationTypes.length, "InstallationFacet: Item _id not found");
    return LibStrings.strWithUint(s.baseUri, _id);
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

  /// @notice Query details about all ongoing upgrade queues
  /// @return output_ An array of structs, each representing an ongoing upgrade queue
  function getUpgradeQueue(address _owner) external view returns (UpgradeQueue[] memory output_) {
    uint256 length = s.upgradeQueue.length;
    output_ = new UpgradeQueue[](length);
    uint256 counter;
    for (uint256 i; i < length; i++) {
      if (s.craftQueue[i].owner == _owner) {
        output_[counter] = s.upgradeQueue[i];
        counter++;
      }
    }
    assembly {
      mstore(output_, counter)
    }
  }

  function getAltarLevel(uint256 _altarId) external view returns (uint256 altarLevel_) {
    require(_altarId < s.installationTypes.length, "InstallationFacet: Item type doesn't exist");
    require(s.installationTypes[_altarId].installationType == 2, "InstallationFacet: Not Altar");
    altarLevel_ = s.installationTypes[_altarId].level;
  }

  function getLodgeLevel(uint256 _installationId) external view returns (uint256 lodgeLevel_) {
    require(_installationId < s.installationTypes.length, "InstallationFacet: Item type doesn't exist");
    require(s.installationTypes[_installationId].installationType == 3, "InstallationFacet: Not Lodge");
    lodgeLevel_ = s.installationTypes[_installationId].level;
  }

  /***********************************|
   |             Write Functions        |
   |__________________________________*/

  /// @notice Allow a user to craft installations
  /// @dev Will throw even if one of the installationTypes is deprecated
  /// @dev Puts the installation into a queue
  /// @param _installationTypes An array containing the identifiers of the installationTypes to craft
  function craftInstallations(uint256[] calldata _installationTypes) external {
    address[4] memory alchemicaAddresses = RealmDiamond(s.realmDiamond).getAlchemicaAddresses();

    uint256 _installationTypesLength = s.installationTypes.length;
    uint256 _nextCraftId = s.nextCraftId;
    for (uint256 i = 0; i < _installationTypes.length; i++) {
      require(_installationTypes[i] < _installationTypesLength, "InstallationFacet: Installation does not exist");

      InstallationType memory installationType = s.installationTypes[_installationTypes[i]];
      //level check
      require(installationType.level == 1, "InstallationFacet: can only craft level 1");
      require(!installationType.deprecated, "InstallationFacet: Installation has been deprecated");

      //take the required alchemica
      LibItems._splitAlchemica(installationType.alchemicaCost, alchemicaAddresses);

      if (installationType.craftTime == 0) {
        LibERC1155._safeMint(msg.sender, _installationTypes[i], 0);
      } else {
        uint256 readyBlock = block.number + installationType.craftTime;

        //put the installation into a queue
        //each wearable needs a unique queue id
        s.craftQueue.push(QueueItem(_nextCraftId, readyBlock, _installationTypes[i], false, msg.sender));

        emit AddedToQueue(_nextCraftId, _installationTypes[i], readyBlock, msg.sender);
        _nextCraftId++;
      }
    }
    s.nextCraftId = _nextCraftId;
    //after queue is over, user can claim installation
  }

  /// @notice Allow a user to speed up multiple queues(installation craft time) by paying the correct amount of $GLMR tokens
  /// @dev Will throw if the caller is not the queue owner
  /// @dev $GLMR tokens are burnt upon usage
  /// @dev amount expressed in block numbers
  /// @param _queueIds An array containing the identifiers of queues to speed up
  /// @param _amounts An array containing the corresponding amounts of $GLMR tokens to pay for each queue speedup
  function reduceCraftTime(uint256[] calldata _queueIds, uint256[] calldata _amounts) external {
    require(_queueIds.length == _amounts.length, "InstallationFacet: Mismatched arrays");
    for (uint256 i; i < _queueIds.length; i++) {
      uint256 queueId = _queueIds[i];
      QueueItem storage queueItem = s.craftQueue[queueId];
      require(msg.sender == queueItem.owner, "InstallationFacet: not owner");

      require(block.number <= queueItem.readyBlock, "InstallationFacet: installation already done");

      IERC20 glmr = IERC20(s.glmr);

      uint256 blockLeft = queueItem.readyBlock - block.number;
      uint256 removeBlocks = _amounts[i] <= blockLeft ? _amounts[i] : blockLeft;
      glmr.burnFrom(msg.sender, removeBlocks * 10**18);
      queueItem.readyBlock -= removeBlocks;
      emit CraftTimeReduced(queueId, removeBlocks);
    }
  }

  /// @notice Allow a user to claim installations from ready queues
  /// @dev Will throw if the caller is not the queue owner
  /// @dev Will throw if one of the queues is not ready
  /// @param _queueIds An array containing the identifiers of queues to claim
  function claimInstallations(uint256[] calldata _queueIds) external {
    for (uint256 i; i < _queueIds.length; i++) {
      uint256 queueId = _queueIds[i];

      QueueItem memory queueItem = s.craftQueue[queueId];

      require(msg.sender == queueItem.owner, "InstallationFacet: not owner");
      require(!queueItem.claimed, "InstallationFacet: already claimed");

      require(block.number >= queueItem.readyBlock, "InstallationFacet: installation not ready");

      // mint installation
      LibERC1155._safeMint(msg.sender, queueItem.installationType, queueItem.id);
      s.craftQueue[queueId].claimed = true;
      emit QueueClaimed(queueId);
    }
  }

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
    uint256[] memory prerequisites = s.installationTypes[_installationId].prerequisites;

    bool techTreePasses = true;
    for (uint256 i = 0; i < prerequisites.length; i++) {
      //ensure that this installation already has at least one required installation on it before adding
      uint256 prerequisiteId = prerequisites[i];
      uint256 equippedBalance = balanceOfToken(s.realmDiamond, _realmId, prerequisiteId);
      if (equippedBalance == 0) {
        techTreePasses = false;
        break;
      }
    }

    if (techTreePasses) {
      LibInstallation._equipInstallation(_owner, _realmId, _installationId);
    } else revert("InstallationFacet: Tech Tree reqs not met");
  }

  /// @notice Allow a user to unequip an installation from a parcel
  /// @dev Will throw if the caller is not the parcel diamond contract
  /// @param _realmId The identifier of the parcel to unequip the installation from
  /// @param _installationId Identifier of the installation to unequip
  function unequipInstallation(uint256 _realmId, uint256 _installationId) external onlyRealmDiamond {
    InstallationIdIO[] memory installationBalances = installationBalancesOfToken(s.realmDiamond, _realmId);

    uint256 removeInstallationBalance = balanceOfToken(s.realmDiamond, _realmId, _installationId);

    //Iterate through all equipped installationTypes to check if installation to be unequipped is a prerequisite of any
    for (uint256 i = 0; i < installationBalances.length; i++) {
      uint256 installationId = installationBalances[i].installationId;

      uint256[] memory prerequisites = s.installationTypes[installationId].prerequisites;

      for (uint256 j = 0; j < prerequisites.length; j++) {
        //Check that this installation is not the prequisite for any other currently equipped installations
        uint256 prerequisiteId = prerequisites[j];

        if (prerequisiteId == installationId && removeInstallationBalance < 2) {
          revert("InstallationFacet: Tech Tree Reqs not met");
        }
      }
    }

    LibInstallation._unequipInstallation(_realmId, _installationId);
  }

  /// @notice Allow a user to upgrade an installation in a parcel
  /// @dev Will throw if the caller is not the owner of the parcel in which the installation is installed
  /// @param _upgradeQueue A struct containing details about the queue which contains the installation to upgrade
  function upgradeInstallation(UpgradeQueue calldata _upgradeQueue) external {
    // check owner
    address parcelOwner = IERC721(s.realmDiamond).ownerOf(_upgradeQueue.parcelId);
    require(parcelOwner == _upgradeQueue.owner, "InstallationFacet: not owner");
    // check coordinates
    RealmDiamond realm = RealmDiamond(s.realmDiamond);

    //check upgradeQueueCapacity
    uint256 upgradeQueueCapacity = realm.getParcelUpgradeQueueCapacity(_upgradeQueue.parcelId);
    uint256 upgradeQueueLength = realm.getParcelUpgradeQueueLength(_upgradeQueue.parcelId);
    require(upgradeQueueCapacity + 1 > upgradeQueueLength, "InstallationFacet: UpgradeQueue full");

    realm.checkCoordinates(_upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _upgradeQueue.installationId);

    // check unique hash
    bytes32 uniqueHash = keccak256(
      abi.encodePacked(_upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _upgradeQueue.installationId)
    );

    //The same upgrade cannot be queued twice
    require(s.upgradeHashes[uniqueHash] == 0, "InstallationFacet: upgrade hash not unique");

    s.upgradeHashes[uniqueHash] = _upgradeQueue.parcelId;

    //take the required alchemica
    address[4] memory alchemicaAddresses = realm.getAlchemicaAddresses();
    InstallationType memory installationType = s.installationTypes[_upgradeQueue.installationId];
    LibItems._splitAlchemica(installationType.alchemicaCost, alchemicaAddresses);

    //current installation
    InstallationType memory prevInstallation = s.installationTypes[_upgradeQueue.installationId];

    require(prevInstallation.nextLevelId > 0, "InstallationFacet: Maximum upgrade reached");

    //next level
    InstallationType memory nextInstallation = s.installationTypes[prevInstallation.nextLevelId];
    require(prevInstallation.installationType == nextInstallation.installationType, "InstallationFacet: wrong installation type");
    require(prevInstallation.alchemicaType == nextInstallation.alchemicaType, "InstallationFacet: wrong alchemicaType");
    require(prevInstallation.level == nextInstallation.level - 1, "InstallationFacet: Wrong installation level");

    uint256 readyBlock = block.number + nextInstallation.craftTime;
    UpgradeQueue memory upgrade = UpgradeQueue(
      _upgradeQueue.parcelId,
      _upgradeQueue.coordinateX,
      _upgradeQueue.coordinateY,
      _upgradeQueue.installationId,
      readyBlock,
      false,
      _upgradeQueue.owner
    );
    s.upgradeQueue.push(upgrade);

    // update upgradeQueueLength
    realm.addUpgradeQueueLength(_upgradeQueue.parcelId);

    emit UpgradeInitiated(_upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, block.number, readyBlock);
  }

  /// @notice Allow a user to reduce the upgrade time of an ongoing queue
  /// @dev Will throw if the caller is not the owner of the queue
  /// @param _queueId The identifier of the queue whose upgrade time is to be reduced
  /// @param _amount The correct amount of $GLMR token to be paid
  function reduceUpgradeTime(uint256 _queueId, uint256 _amount) external {
    UpgradeQueue storage upgradeQueue = s.upgradeQueue[_queueId];
    require(msg.sender == upgradeQueue.owner, "InstallationFacet: Not owner");

    require(block.number <= upgradeQueue.readyBlock, "InstallationFacet: Upgrade already done");

    IERC20 glmr = IERC20(s.glmr);

    uint256 blockLeft = upgradeQueue.readyBlock - block.number;
    uint256 removeBlocks = _amount <= blockLeft ? _amount : blockLeft;
    glmr.burnFrom(msg.sender, removeBlocks * 10**18);
    upgradeQueue.readyBlock -= removeBlocks;
    emit UpgradeTimeReduced(_queueId, upgradeQueue.parcelId, upgradeQueue.coordinateX, upgradeQueue.coordinateY, removeBlocks);
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
        LibERC1155._safeMint(queueUpgrade.owner, nextLevelId, index);
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
        s.upgradeQueue[index] = s.upgradeQueue[s.upgradeQueue.length - 1];
        s.upgradeQueue.pop();
        counter--;
        offset++;
        emit UpgradeFinalized(queueUpgrade.parcelId, queueUpgrade.coordinateX, queueUpgrade.coordinateY);
      }
      if (counter == 0) break;
      if (counter == 3) revert("InstallationFacet: No upgrades ready");
    }
  }
}

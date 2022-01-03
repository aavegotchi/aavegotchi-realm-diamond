// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {ERC998, ItemTypeIO} from "../../libraries/LibERC998.sol";
import {LibAppStorageInstallation, InstallationType, QueueItem, UpgradeQueue, Modifiers} from "../../libraries/AppStorageInstallation.sol";
import {LibStrings} from "../../libraries/LibStrings.sol";
import {LibMeta} from "../../libraries/LibMeta.sol";
import {LibERC1155} from "../../libraries/LibERC1155.sol";
import {ERC998} from "../../libraries/LibERC998.sol";
import {LibERC20} from "../../libraries/LibERC20.sol";
import {LibInstallation} from "../../libraries/LibInstallation.sol";
import {IERC721} from "../../interfaces/IERC721.sol";
import {RealmDiamond} from "../../interfaces/RealmDiamond.sol";
import {IERC20} from "../../interfaces/IERC20.sol";

import "hardhat/console.sol";

contract InstallationFacet is Modifiers {
  event AddedToQueue(uint256 indexed _queueId, uint256 indexed _installationId, uint256 _readyBlock, address _sender);

  event QueueClaimed(uint256 indexed _queueId);

  event CraftTimeReduced(uint256 indexed _queueId, uint256 _blocksReduced);

  event UpgradeTimeReduced(uint256 indexed _queueId, uint256 indexed _parcelId, uint256 _coordinateX, uint256 _coordinateY, uint256 _blocksReduced);

  event UpgradeInitiated(uint256 indexed _parcelId, uint256 _coordinateX, uint256 _coordinateY, uint256 blockInitiated, uint256 readyBlock);

  event UpgradeFinalized(uint256 indexed _parcelId, uint256 _coordinateX, uint256 _coordinateY);

  /***********************************|
   |             Read Functions         |
   |__________________________________*/

  struct InstallationIdIO {
    uint256 installationId;
    uint256 balance;
  }

  ///@notice Returns balance for each installation that exists for an account
  ///@param _account Address of the account to query
  ///@return bals_ An array of structs,each struct containing details about each installation owned
  function installationsBalances(address _account) external view returns (InstallationIdIO[] memory bals_) {
    uint256 count = s.ownerInstallations[_account].length;
    bals_ = new InstallationIdIO[](count);
    for (uint256 i; i < count; i++) {
      uint256 installationId = s.ownerInstallations[_account][i];
      bals_[i].balance = s.ownerInstallationBalances[_account][installationId];
      bals_[i].installationId = installationId;
    }
  }

  ///@notice Returns balance for each installation(and their types) that exists for an account
  ///@param _owner Address of the account to query
  ///@return output_ An array of structs containing details about each installation owned(including the installation types)
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

  ///@notice Returns the balances for all ERC1155 items for a ERC721 token
  ///@param _tokenContract Contract address for the token to query
  ///@param _tokenId Identifier of the token to query
  ///@return bals_ An array of structs containing details about each item owned
  function installationBalancesOfToken(address _tokenContract, uint256 _tokenId) public view returns (InstallationIdIO[] memory bals_) {
    uint256 count = s.nftInstallations[_tokenContract][_tokenId].length;
    bals_ = new InstallationIdIO[](count);
    for (uint256 i; i < count; i++) {
      uint256 installationId = s.nftInstallations[_tokenContract][_tokenId][i];
      bals_[i].installationId = installationId;
      bals_[i].balance = s.nftInstallationBalances[_tokenContract][_tokenId][installationId];
    }
  }

  ///@notice Returns the balances for all ERC1155 items for a ERC721 token
  ///@param _tokenContract Contract address for the token to query
  ///@param _tokenId Identifier of the token to query
  ///@return installationBalancesOfTokenWithTypes_ An array of structs containing details about each installation owned(including installation types)
  function installationBalancesOfTokenWithTypes(address _tokenContract, uint256 _tokenId)
    external
    view
    returns (ItemTypeIO[] memory installationBalancesOfTokenWithTypes_)
  {
    installationBalancesOfTokenWithTypes_ = ERC998.itemBalancesOfTokenWithTypes(_tokenContract, _tokenId);
  }

  function getAltarIds() external pure returns (uint256[] memory) {
    uint8[9] memory altarIds = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    return castToUint256Array(altarIds);
  }

  function castToUint256Array(uint8[9] memory _ids) internal pure returns (uint256[] memory) {
    uint256[] memory array = new uint256[](_ids.length);
    for (uint256 index = 0; index < _ids.length; index++) {
      uint8 id = _ids[index];
      array[index] = id;
    }
    return array;
  }

  function spilloverRateOfId(uint256 _id) external view returns (uint256) {
    return s.installationTypes[_id].spillRate;
  }

  function spilloverRadiusOfId(uint256 _id) external view returns (uint256) {
    return s.installationTypes[_id].spillRadius;
  }

  function spilloverRatesOfIds(uint256[] calldata _ids) external view returns (uint256[] memory) {
    uint256[] memory rates = new uint256[](_ids.length);
    for (uint256 i = 0; i < _ids.length; i++) {
      rates[i] = s.installationTypes[i].spillRate;
    }
    return rates;
  }

  function spilloverRadiusOfIds(uint256[] calldata _ids) external view returns (uint256[] memory) {
    uint256[] memory rates = new uint256[](_ids.length);
    for (uint256 i = 0; i < _ids.length; i++) {
      rates[i] = s.installationTypes[i].spillRadius;
    }
    return rates;
  }

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

  ///@notice Query the item type of a particular installation
  ///@param _installationTypeId Item to query
  ///@return installationType A struct containing details about the item type of an item with identifier `_itemId`
  function getInstallationType(uint256 _installationTypeId) external view returns (InstallationType memory installationType) {
    require(_installationTypeId < s.installationTypes.length, "InstallationFacet: Item type doesn't exist");
    installationType = s.installationTypes[_installationTypeId];
  }

  ///@notice Query the item type of multiple installation types
  ///@param _installationTypeIds An array containing the identifiers of items to query
  ///@return installationTypes_ An array of structs,each struct containing details about the item type of the corresponding item
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

  /**
        @notice Get the URI for a voucher type
        @return URI for token type
    */
  function uri(uint256 _id) external view returns (string memory) {
    require(_id < s.installationTypes.length, "InstallationFacet: Item _id not found");
    return LibStrings.strWithUint(s.baseUri, _id);
  }

  function getAlchemicaAddresses() external view returns (address[] memory) {
    return s.alchemicaAddresses;
  }

  /***********************************|
   |             Write Functions        |
   |__________________________________*/

  function deprecateInstallations(uint256[] calldata _installationIds) external onlyOwner {
    for (uint8 i = 0; i < _installationIds.length; i++) {
      s.installationTypes[_installationIds[i]].deprecated = true;
    }
  }

  function craftInstallations(uint256[] calldata _installationTypes) external {
    for (uint8 i = 0; i < _installationTypes.length; i++) {
      //level check
      require(s.installationTypes[_installationTypes[i]].level == 1, "InstallationFacet: can only craft level 1");

      require(!s.installationTypes[_installationTypes[i]].deprecated, "InstallationFacet: Installation has been deprecated");
      //take the required alchemica
      InstallationType memory installationType = s.installationTypes[_installationTypes[i]];
      for (uint8 j = 0; j < installationType.alchemicaCost.length; j++) {
        //@todo: ensure this reverts if funds are insufficient
        LibERC20.transferFrom(s.alchemicaAddresses[j], msg.sender, address(this), s.installationTypes[_installationTypes[i]].alchemicaCost[j]);
      }

      if (installationType.craftTime == 0) {
        LibERC1155._safeMint(msg.sender, _installationTypes[i], 0);
      } else {
        uint256 readyBlock = block.number + installationType.craftTime;

        //put the installation into a queue
        //each wearable needs a unique queue id
        s.craftQueue.push(QueueItem(s.nextCraftId, readyBlock, _installationTypes[i], false, msg.sender));

        // console.log("craft queue length:", s.craftQueue.length);

        emit AddedToQueue(s.nextCraftId, _installationTypes[i], readyBlock, msg.sender);
        s.nextCraftId++;
      }
    }
    //after queue is over, user can claim installation
  }

  function reduceCraftTime(uint256[] calldata _queueIds, uint256[] calldata _amounts) external {
    require(_queueIds.length == _amounts.length, "InstallationFacet: Mismatched arrays");
    for (uint8 i; i < _queueIds.length; i++) {
      uint256 queueId = _queueIds[i];
      QueueItem storage queueItem = s.craftQueue[queueId];
      require(msg.sender == queueItem.owner, "InstallationFacet: not owner");

      require(block.number <= queueItem.readyBlock, "InstallationFacet: installation already done");

      IERC20 glmr = IERC20(s.glmr);
      require(glmr.balanceOf(msg.sender) >= _amounts[i], "InstallationFacet: not enough GLMR");
      glmr.burnFrom(msg.sender, _amounts[i]);

      queueItem.readyBlock -= _amounts[i];
      emit CraftTimeReduced(queueId, _amounts[i]);
    }
  }

  function claimInstallations(uint256[] calldata _queueIds) external {
    for (uint8 i; i < _queueIds.length; i++) {
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

  function unequipInstallation(
    address _owner,
    uint256 _realmId,
    uint256 _installationId
  ) external onlyRealmDiamond {
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

    LibInstallation._unequipInstallation(_owner, _realmId, _installationId);
  }

  function upgradeInstallation(UpgradeQueue calldata _upgradeQueue) external {
    // check owner
    address parcelOwner = IERC721(s.realmDiamond).ownerOf(_upgradeQueue.parcelId);
    require(parcelOwner == _upgradeQueue.owner, "InstallationFacet: not owner");
    // check coordinates
    RealmDiamond realm = RealmDiamond(s.realmDiamond);

    //todo: remove only for testing
    // realm.checkCoordinates(_upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, _upgradeQueue.installationId);
    // check tech tree

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

    emit UpgradeInitiated(_upgradeQueue.parcelId, _upgradeQueue.coordinateX, _upgradeQueue.coordinateY, block.number, readyBlock);
  }

  function reduceUpgradeTime(uint256 _queueId, uint256 _amount) external {
    UpgradeQueue storage upgradeQueue = s.upgradeQueue[_queueId];
    require(msg.sender == upgradeQueue.owner, "InstallationFacet: Not owner");

    require(block.number <= upgradeQueue.readyBlock, "InstallationFacet: Upgrade already done");

    IERC20 glmr = IERC20(s.glmr);
    require(glmr.balanceOf(msg.sender) >= _amount, "InstallationFacet: Not enough GLMR");
    glmr.burnFrom(msg.sender, _amount);

    upgradeQueue.readyBlock -= _amount;
    emit UpgradeTimeReduced(_queueId, upgradeQueue.parcelId, upgradeQueue.coordinateX, upgradeQueue.coordinateY, _amount);
  }

  function finalizeUpgrade() public {
    require(s.upgradeQueue.length > 0, "InstallationFacet: No upgrades");
    //can only process 3 upgrades per tx
    uint8 counter = 3;
    for (uint256 index; index < s.upgradeQueue.length; index++) {
      UpgradeQueue memory queueUpgrade = s.upgradeQueue[index];
      // check that upgrade is ready
      if (block.number >= queueUpgrade.readyBlock) {
        // burn old installation
        LibInstallation._unequipInstallation(queueUpgrade.owner, queueUpgrade.parcelId, queueUpgrade.installationId);
        // mint new installation

        uint256 nextLevelId = s.installationTypes[queueUpgrade.installationId].nextLevelId;
        LibERC1155._safeMint(queueUpgrade.owner, nextLevelId, index);
        // equip new installation
        LibInstallation._equipInstallation(queueUpgrade.owner, queueUpgrade.parcelId, nextLevelId);

        //@todo: comment out only during local testing
        // RealmDiamond realm = RealmDiamond(s.realmDiamond);
        // realm.upgradeInstallation(queueUpgrade.parcelId, queueUpgrade.installationId, nextLevelId);
        // pop upgrade from array
        s.upgradeQueue[index] = s.upgradeQueue[s.upgradeQueue.length - 1];
        s.upgradeQueue.pop();
        counter--;

        emit UpgradeFinalized(queueUpgrade.parcelId, queueUpgrade.coordinateX, queueUpgrade.coordinateY);
      }
      if (counter == 0) break;
      if (counter == 3) revert("InstallationFacet: No upgrades ready");
    }
  }

  function getCraftQueue() external view returns (QueueItem[] memory output_) {
    uint256 counter;
    for (uint256 i; i < s.craftQueue.length; i++) {
      if (s.craftQueue[i].owner == msg.sender) {
        output_[counter] = s.craftQueue[i];
        counter++;
      }
    }
  }

  function getUpgradeQueue() external view returns (UpgradeQueue[] memory output_) {
    return s.upgradeQueue;
  }

  /***********************************|
   |             Owner Functions        |
   |__________________________________*/

  function setAlchemicaAddresses(address[] memory _addresses) external onlyOwner {
    s.alchemicaAddresses = _addresses;
  }

  function setAddresses(
    address _aavegotchiDiamond,
    address _realmDiamond,
    address _glmr
  ) external onlyOwner {
    s.aavegotchiDiamond = _aavegotchiDiamond;
    s.realmDiamond = _realmDiamond;
    s.glmr = _glmr;
  }

  function addInstallationTypes(InstallationType[] calldata _installationTypes) external onlyOwner {
    for (uint16 i = 0; i < _installationTypes.length; i++) {
      s.installationTypes.push(
        InstallationType(
          _installationTypes[i].deprecated,
          _installationTypes[i].installationType,
          _installationTypes[i].level,
          _installationTypes[i].width,
          _installationTypes[i].height,
          _installationTypes[i].alchemicaType,
          _installationTypes[i].alchemicaCost,
          _installationTypes[i].harvestRate,
          _installationTypes[i].capacity,
          _installationTypes[i].spillRadius,
          _installationTypes[i].spillRate,
          _installationTypes[i].craftTime,
          _installationTypes[i].nextLevelId,
          _installationTypes[i].prerequisites
        )
      );
    }
  }

  function eraseInstallationTypes() external onlyOwner {
    for (uint256 i; i < s.installationTypes.length; i++) {
      delete s.installationTypes[i];
    }
  }

  function editInstallationType(uint256 _typeId, InstallationType calldata _installationType) external onlyOwner {
    s.installationTypes[_typeId] = _installationType;
  }
}

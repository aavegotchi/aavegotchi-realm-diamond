// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {TileType, QueueItem, Modifiers} from "../../libraries/AppStorageTile.sol";
import {LibERC1155Tile} from "../../libraries/LibERC1155Tile.sol";
import {LibItems} from "../../libraries/LibItems.sol";
import {RealmDiamond} from "../../interfaces/RealmDiamond.sol";

contract TileFacet is Modifiers {
  event AddedToQueue(uint256 indexed _queueId, uint256 indexed _tileId, uint256 _readyBlock, address _sender);

  event QueueClaimed(uint256 indexed _queueId);

  event AddressesUpdated(address _aavegotchiDiamond, address _realmDiamond, address _gltr);

  /***********************************|
   |             Read Functions         |
   |__________________________________*/

  struct TileIdIO {
    uint256 tileId;
    uint256 balance;
  }

  struct ItemTypeIO {
    uint256 balance;
    uint256 itemId;
    TileType tileType;
  }

  /// @notice Returns balance for each tile that exists for an account
  /// @param _account Address of the account to query
  /// @return bals_ An array of structs,each struct containing details about each tile owned
  function tilesBalances(address _account) external view returns (TileIdIO[] memory bals_) {
    uint256 count = s.ownerTiles[_account].length;
    bals_ = new TileIdIO[](count);
    for (uint256 i; i < count; i++) {
      uint256 tileId = s.ownerTiles[_account][i];
      bals_[i].balance = s.ownerTileBalances[_account][tileId];
      bals_[i].tileId = tileId;
    }
  }

  /// @notice Returns balance for each tile(and their types) that exists for an account
  /// @param _owner Address of the account to query
  /// @return output_ An array of structs containing details about each tile owned(including the tile types)
  function tilesBalancesWithTypes(address _owner) external view returns (ItemTypeIO[] memory output_) {
    uint256 count = s.ownerTiles[_owner].length;
    output_ = new ItemTypeIO[](count);
    for (uint256 i; i < count; i++) {
      uint256 tileId = s.ownerTiles[_owner][i];
      output_[i].balance = s.ownerTileBalances[_owner][tileId];
      output_[i].itemId = tileId;
      output_[i].tileType = s.tileTypes[tileId];
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
    value = s.nftTileBalances[_tokenContract][_tokenId][_id];
  }

  /// @notice Query the item type of a particular tile
  /// @param _tileTypeId Item to query
  /// @return tileType A struct containing details about the item type of an item with identifier `_itemId`
  function getTileType(uint256 _tileTypeId) external view returns (TileType memory tileType) {
    require(_tileTypeId < s.tileTypes.length, "TileFacet: Item type doesn't exist");
    tileType = s.tileTypes[_tileTypeId];
    tileType.deprecated = s.deprecateTime[_tileTypeId] > 0 ? block.timestamp > s.deprecateTime[_tileTypeId] : s.tileTypes[_tileTypeId].deprecated;
  }

  /// @notice Query the item type of multiple tile types
  /// @param _tileTypeIds An array containing the identifiers of items to query
  /// @return tileTypes_ An array of structs,each struct containing details about the item type of the corresponding item
  function getTileTypes(uint256[] calldata _tileTypeIds) external view returns (TileType[] memory tileTypes_) {
    if (_tileTypeIds.length == 0) {
      tileTypes_ = s.tileTypes;
      for (uint256 i = 0; i < s.tileTypes.length; i++) {
        tileTypes_[i].deprecated = s.deprecateTime[i] == 0 ? s.tileTypes[i].deprecated : block.timestamp > s.deprecateTime[i];
      }
    } else {
      tileTypes_ = new TileType[](_tileTypeIds.length);
      for (uint256 i; i < _tileTypeIds.length; i++) {
        uint256 tileId = _tileTypeIds[i];
        tileTypes_[i] = s.tileTypes[_tileTypeIds[i]];
        tileTypes_[i].deprecated = s.deprecateTime[tileId] > 0 ? block.timestamp > s.deprecateTime[tileId] : s.tileTypes[tileId].deprecated;
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

  /***********************************|
   |             Write Functions        |
   |__________________________________*/

  /// @notice Allow a user to craft tiles
  /// @dev Puts the tile into a queue
  /// @param _tileTypes An array containing the identifiers of the tileTypes to craft
  function craftTiles(uint16[] calldata _tileTypes) external {
    address[4] memory alchemicaAddresses = RealmDiamond(s.realmDiamond).getAlchemicaAddresses();

    uint256 _tileTypesLength = s.tileTypes.length;
    uint256 _nextCraftId = s.nextCraftId;
    for (uint256 i = 0; i < _tileTypes.length; i++) {
      require(_tileTypes[i] < _tileTypesLength, "TileFacet: Tile does not exist");

      TileType memory tileType = s.tileTypes[_tileTypes[i]];

      //The preset deprecation time has elapsed
      if (s.deprecateTime[_tileTypes[i]] > 0) {
        require(block.timestamp < s.deprecateTime[_tileTypes[i]], "TileFacet: Tile has been deprecated");
      }
      require(!tileType.deprecated, "TileFacet: Tile has been deprecated");

      //take the required alchemica
      LibItems._splitAlchemica(tileType.alchemicaCost, alchemicaAddresses);

      if (tileType.craftTime == 0) {
        LibERC1155Tile._safeMint(msg.sender, _tileTypes[i], 0);
      } else {
        uint40 readyBlock = uint40(block.number) + tileType.craftTime;

        //put the tile into a queue
        //each tile needs a unique queue id
        s.craftQueue.push(QueueItem(_nextCraftId, readyBlock, _tileTypes[i], false, msg.sender));

        emit AddedToQueue(_nextCraftId, _tileTypes[i], readyBlock, msg.sender);
        _nextCraftId++;
      }
    }
    s.nextCraftId = _nextCraftId;
    //after queue is over, user can claim tile
  }

  /// @notice Allow a user to claim tiles from ready queues
  /// @dev Will throw if the caller is not the queue owner
  /// @dev Will throw if one of the queues is not ready
  /// @param _queueIds An array containing the identifiers of queues to claim
  function claimTiles(uint256[] calldata _queueIds) external {
    for (uint256 i; i < _queueIds.length; i++) {
      uint256 queueId = _queueIds[i];

      QueueItem memory queueItem = s.craftQueue[queueId];

      require(!queueItem.claimed, "TileFacet: already claimed");

      require(block.number >= queueItem.readyBlock, "TileFacet: tile not ready");

      // mint tile
      LibERC1155Tile._safeMint(queueItem.owner, queueItem.tileType, queueItem.id);
      s.craftQueue[queueId].claimed = true;
      emit QueueClaimed(queueId);
    }
  }

  /***********************************|
   |             Owner Functions        |
   |__________________________________*/

  /// @notice Allow the Diamond owner to deprecate a tile
  /// @dev Deprecated tiles cannot be crafted by users
  /// @param _tileIds An array containing the identifiers of tiles to deprecate
  function deprecateTiles(uint256[] calldata _tileIds) external onlyOwner {
    for (uint256 i = 0; i < _tileIds.length; i++) {
      s.tileTypes[_tileIds[i]].deprecated = true;
    }
  }

  /// @notice Allow the diamond owner to set some important contract addresses
  /// @param _aavegotchiDiamond The aavegotchi diamond address
  /// @param _realmDiamond The Realm diamond address
  /// @param _gltr The $GLTR token address
  function setAddresses(
    address _aavegotchiDiamond,
    address _realmDiamond,
    address _gltr,
    address _pixelcraft,
    address _aavegotchiDAO
  ) external onlyOwner {
    s.aavegotchiDiamond = _aavegotchiDiamond;
    s.realmDiamond = _realmDiamond;
    s.gltr = _gltr;
    s.pixelcraft = _pixelcraft;
    s.aavegotchiDAO = _aavegotchiDAO;
    emit AddressesUpdated(_aavegotchiDiamond, _realmDiamond, _gltr);
  }

  /// @notice Allow the diamond owner to add a tile type
  /// @param _tileTypes An array of structs, each struct representing each tileType to be added
  function addTileTypes(TileType[] calldata _tileTypes) external onlyOwner {
    for (uint256 i = 0; i < _tileTypes.length; i++) {
      s.tileTypes.push(
        TileType(
          _tileTypes[i].width,
          _tileTypes[i].height,
          _tileTypes[i].deprecated,
          _tileTypes[i].tileType,
          _tileTypes[i].craftTime,
          _tileTypes[i].alchemicaCost,
          _tileTypes[i].name
        )
      );
    }
  }

  function editDeprecateTime(uint256 _typeId, uint40 _deprecateTime) external onlyOwner {
    s.deprecateTime[_typeId] = _deprecateTime;
  }
}

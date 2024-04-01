// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {LibAppStorageTile, TileAppStorage} from "./AppStorageTile.sol";
import {IERC1155TokenReceiver} from "../interfaces/IERC1155TokenReceiver.sol";
import "./LibEvents.sol";

library LibERC1155Tile {
  bytes4 internal constant ERC1155_ACCEPTED = 0xf23a6e61; // Return value from `onERC1155Received` call if a contract accepts receipt (i.e `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`).
  bytes4 internal constant ERC1155_BATCH_ACCEPTED = 0xbc197c81; // Return value from `onERC1155BatchReceived` call if a contract accepts receipt (i.e `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`).

  /// @dev Should actually be _owner, _tileId, _queueId
  event MintTile(address indexed _owner, uint256 indexed _tileType, uint256 _tileId);
  event MintTiles(address indexed _owner, uint256 indexed _tileId, uint16 _amount);

  function _safeMint(
    address _to,
    uint256 _tileId,
    uint16 _amount,
    uint256 _queueId
  ) internal {
    TileAppStorage storage s = LibAppStorageTile.diamondStorage();
    if (s.tileTypes[_tileId].craftTime > 0) {
      require(!s.craftQueue[_queueId].claimed, "LibERC1155: tokenId already minted");
      require(s.craftQueue[_queueId].owner == _to, "LibERC1155: wrong owner");
      s.craftQueue[_queueId].claimed = true;
    }

    addToOwner(_to, _tileId, _amount);

    if (_amount == 1) emit MintTile(_to, _tileId, _queueId);
    else emit MintTiles(_to, _tileId, _amount);

    emit LibEvents.TransferSingle(address(this), address(0), _to, _tileId, _amount);
  }

  function addToOwner(
    address _to,
    uint256 _id,
    uint256 _value
  ) internal {
    TileAppStorage storage s = LibAppStorageTile.diamondStorage();
    s.ownerTileBalances[_to][_id] += _value;
    if (s.ownerTileIndexes[_to][_id] == 0) {
      s.ownerTiles[_to].push(_id);
      s.ownerTileIndexes[_to][_id] = s.ownerTiles[_to].length;
    }
  }

  function removeFromOwner(
    address _from,
    uint256 _id,
    uint256 _value
  ) internal {
    TileAppStorage storage s = LibAppStorageTile.diamondStorage();
    uint256 bal = s.ownerTileBalances[_from][_id];
    require(_value <= bal, "LibERC1155: Doesn't have that many to transfer");
    bal -= _value;
    s.ownerTileBalances[_from][_id] = bal;
    if (bal == 0) {
      uint256 index = s.ownerTileIndexes[_from][_id] - 1;
      uint256 lastIndex = s.ownerTiles[_from].length - 1;
      if (index != lastIndex) {
        uint256 lastId = s.ownerTiles[_from][lastIndex];
        s.ownerTiles[_from][index] = lastId;
        s.ownerTileIndexes[_from][lastId] = index + 1;
      }
      s.ownerTiles[_from].pop();
      delete s.ownerTileIndexes[_from][_id];
    }
  }

  function _burn(
    address _from,
    uint256 _tileType,
    uint256 _amount
  ) internal {
    removeFromOwner(_from, _tileType, _amount);
    emit LibEvents.TransferSingle(address(this), _from, address(0), _tileType, _amount);
  }

  function onERC1155Received(
    address _operator,
    address _from,
    address _to,
    uint256 _id,
    uint256 _value,
    bytes memory _data
  ) internal {
    uint256 size;
    assembly {
      size := extcodesize(_to)
    }
    if (size > 0) {
      require(
        ERC1155_ACCEPTED == IERC1155TokenReceiver(_to).onERC1155Received(_operator, _from, _id, _value, _data),
        "Wearables: Transfer rejected/failed by _to"
      );
    }
  }

  function onERC1155BatchReceived(
    address _operator,
    address _from,
    address _to,
    uint256[] calldata _ids,
    uint256[] calldata _values,
    bytes memory _data
  ) internal {
    uint256 size;
    assembly {
      size := extcodesize(_to)
    }
    if (size > 0) {
      require(
        ERC1155_BATCH_ACCEPTED == IERC1155TokenReceiver(_to).onERC1155BatchReceived(_operator, _from, _ids, _values, _data),
        "Wearables: Transfer rejected/failed by _to"
      );
    }
  }
}

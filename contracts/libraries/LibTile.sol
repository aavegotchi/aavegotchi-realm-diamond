// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {LibERC998Tile} from "../libraries/LibERC998Tile.sol";
import {LibERC1155Tile} from "../libraries/LibERC1155Tile.sol";
import {LibAppStorageTile, TileAppStorage} from "../libraries/AppStorageTile.sol";

library LibTile {
  function _equipTile(
    address _owner,
    uint256 _realmId,
    uint256 _tileId
  ) internal {
    TileAppStorage storage s = LibAppStorageTile.diamondStorage();
    LibERC1155Tile.removeFromOwner(_owner, _tileId, 1);
    LibERC1155Tile.addToOwner(s.realmDiamond, _tileId, 1);
    emit LibERC1155Tile.TransferSingle(address(this), _owner, s.realmDiamond, _tileId, 1);
    LibERC998Tile.addToParent(s.realmDiamond, _realmId, _tileId, 1);
    emit LibERC1155Tile.TransferToParent(s.realmDiamond, _realmId, _tileId, 1);
  }

  function _unequipTile(
    address _owner,
    uint256 _realmId,
    uint256 _tileId
  ) internal {
    TileAppStorage storage s = LibAppStorageTile.diamondStorage();
    LibERC998Tile.removeFromParent(s.realmDiamond, _realmId, _tileId, 1);
    emit LibERC1155Tile.TransferFromParent(s.realmDiamond, _realmId, _tileId, 1);
    LibERC1155Tile.addToOwner(_owner, _tileId, 1);
    emit LibERC1155Tile.TransferSingle(address(this), s.realmDiamond, _owner, _tileId, 1);
  }
}

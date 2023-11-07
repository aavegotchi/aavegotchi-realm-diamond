// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {LibAppStorageTile, TileType, QueueItem, Modifiers} from "../libraries/AppStorageTile.sol";
import {LibERC1155Tile} from "../libraries/LibERC1155Tile.sol";

contract TestTileFacet is Modifiers {
  // Craft tiles without deprecation, alchemica cost, craft time
  function testCraftTiles(uint16[] calldata _tileTypes) external {
    for (uint256 i = 0; i < _tileTypes.length; i++) {
      LibERC1155Tile._safeMint(msg.sender, _tileTypes[i], 1, 0);
    }
  }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {LibAppStorageTile, TileAppStorage, TileType} from "./AppStorageTile.sol";
import {LibERC1155} from "./LibERC1155.sol";

struct ItemTypeIO {
  uint256 balance;
  uint256 itemId;
  TileType tileType;
}

library LibERC998Tile {
  function itemBalancesOfTokenWithTypes(address _tokenContract, uint256 _tokenId)
    internal
    view
    returns (ItemTypeIO[] memory itemBalancesOfTokenWithTypes_)
  {
    TileAppStorage storage s = LibAppStorageTile.diamondStorage();
    uint256 count = s.nftTiles[_tokenContract][_tokenId].length;
    itemBalancesOfTokenWithTypes_ = new ItemTypeIO[](count);
    for (uint256 i; i < count; i++) {
      uint256 itemId = s.nftTiles[_tokenContract][_tokenId][i];
      uint256 bal = s.nftTileBalances[_tokenContract][_tokenId][itemId];
      itemBalancesOfTokenWithTypes_[i].itemId = itemId;
      itemBalancesOfTokenWithTypes_[i].balance = bal;
      itemBalancesOfTokenWithTypes_[i].tileType = s.tileTypes[itemId];
    }
  }

  function addToParent(
    address _toContract,
    uint256 _toTokenId,
    uint256 _id,
    uint256 _value
  ) internal {
    TileAppStorage storage s = LibAppStorageTile.diamondStorage();
    s.nftTileBalances[_toContract][_toTokenId][_id] += _value;
    if (s.nftTileIndexes[_toContract][_toTokenId][_id] == 0) {
      s.nftTiles[_toContract][_toTokenId].push(_id);
      s.nftTileIndexes[_toContract][_toTokenId][_id] = s.nftTiles[_toContract][_toTokenId].length;
    }
  }

  function removeFromParent(
    address _fromContract,
    uint256 _fromTokenId,
    uint256 _id,
    uint256 _value
  ) internal {
    TileAppStorage storage s = LibAppStorageTile.diamondStorage();
    uint256 bal = s.nftTileBalances[_fromContract][_fromTokenId][_id];
    require(_value <= bal, "Items: Doesn't have that many to transfer");
    bal -= _value;
    s.nftTileBalances[_fromContract][_fromTokenId][_id] = bal;
    if (bal == 0) {
      uint256 index = s.nftTileIndexes[_fromContract][_fromTokenId][_id] - 1;
      uint256 lastIndex = s.nftTiles[_fromContract][_fromTokenId].length - 1;
      if (index != lastIndex) {
        uint256 lastId = s.nftTiles[_fromContract][_fromTokenId][lastIndex];
        s.nftTiles[_fromContract][_fromTokenId][index] = lastId;
        s.nftTileIndexes[_fromContract][_fromTokenId][lastId] = index + 1;
      }
      s.nftTiles[_fromContract][_fromTokenId].pop();
      delete s.nftTileIndexes[_fromContract][_fromTokenId][_id];
    }
  }
}

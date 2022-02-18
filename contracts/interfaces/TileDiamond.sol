// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
/******************************************************************************/

interface TileDiamondInterface {
  struct TileType {
    uint256 width;
    uint256 height;
    bool deprecated;
    uint16 tileType;
    uint256[] alchemicaCost; // [fud, fomo, alpha, kek]
    uint256 craftTime; // in blocks
  }

  struct TileIdIO {
    uint256 tileId;
    uint256 balance;
  }

  function craftTiles(uint256[] calldata _tileTypes) external;

  function claimTiles(uint256[] calldata _queueIds) external;

  function equipTile(
    address _owner,
    uint256 _realmTokenId,
    uint256 _tileId
  ) external;

  function unequipTile(uint256 _realmId, uint256 _tileId) external;

  function addTileTypes(TileType[] calldata _tileTypes) external;

  function getTileType(uint256 _itemId) external view returns (TileType memory tileType);

  function getTileTypes(uint256[] calldata _itemIds) external view returns (TileType[] memory itemTypes_);

  function getAlchemicaAddresses() external view returns (address[] memory);

  function balanceOf(address _owner, uint256 _id) external view returns (uint256 bal_);

  function tileBalancesOfTokenByIds(
    address _tokenContract,
    uint256 _tokenId,
    uint256[] calldata _ids
  ) external view returns (uint256[] memory);

  function tilesBalances(address _account) external view returns (TileIdIO[] memory bals_);
}

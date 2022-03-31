// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.1;

interface AavegotchiDiamond {
  function ownerOf(uint256 _tokenId) external view returns (address owner_);

  function gotchiEscrow(uint256 _tokenId) external view returns (address);

  function isAavegotchiLent(uint32 _erc721TokenId) external view returns (bool);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ERC721Marketplace {
  function updateERC721Listing(
    address _erc721TokenAddress,
    uint256 _erc721TokenId,
    address _owner
  ) external;
}

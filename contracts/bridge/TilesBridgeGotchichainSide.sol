// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "./ProxyONFT1155.sol";
import "../TileDiamond/facets/PolygonXGotchichainBridgeFacet.sol";

contract TilesBridgeGotchichainSide is ProxyONFT1155 {
  constructor(address _lzEndpoint, address _proxyToken) ProxyONFT1155(_lzEndpoint, _proxyToken) {}

  function _debitFrom(address _from, uint16, bytes memory, uint[] memory _tokenIds, uint[] memory _amounts) internal override {
    revert("TilesBridgeGotchichainSide: not able to bridge it back");
  }

  function _creditTo(uint16, address _toAddress, uint[] memory _tokenIds, uint[] memory _amounts) internal override {
    TilesPolygonXGotchichainBridgeFacet(address(token)).addItemsToOwner(_toAddress, _tokenIds, _amounts);
  }
}

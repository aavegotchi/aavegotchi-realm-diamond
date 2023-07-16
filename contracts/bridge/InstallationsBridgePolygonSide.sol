// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "./ProxyONFT1155.sol";
import "../InstallationDiamond/facets/InstallationsPolygonXGotchichainBridgeFacet.sol";

contract InstallationsBridgePolygonSide is ProxyONFT1155 {
  constructor(address _lzEndpoint, address _proxyToken) ProxyONFT1155(_lzEndpoint, _proxyToken) {}

  function _debitFrom(address _from, uint16, bytes memory, uint[] memory _tokenIds, uint[] memory _amounts) internal override {
    require(_from == _msgSender(), "ItemsBridgePolygonSide: owner is not send caller");
    InstallationsPolygonXGotchichainBridgeFacet(address(token)).removeItemsFromOwner(_from, _tokenIds, _amounts);
  }

  function _creditTo(uint16, address _toAddress, uint[] memory _tokenIds, uint[] memory _amounts) internal override {
    revert("InstallationsBridgePolygonSide: not able to bridge it back");
  }
}

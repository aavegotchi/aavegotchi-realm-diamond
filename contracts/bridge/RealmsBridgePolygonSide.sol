// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "../libraries/AppStorage.sol";
import "./ProxyONFT721.sol";

contract RealmsBridgePolygonSide is ProxyONFT721 {
  constructor(uint256 _minGasToTransfer, address _lzEndpoint, address _proxyToken) ProxyONFT721(_minGasToTransfer, _lzEndpoint, _proxyToken) {}

  function _nonblockingLzReceive(uint16 _srcChainId, bytes memory _srcAddress, uint64 /*_nonce*/, bytes memory _payload) internal virtual override {
    revert("Realms cannot be bridged back to Polygon");
  }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "../libraries/AppStorage.sol";
import "./ProxyONFT721.sol";
import "../InstallationDiamond/facets/RealmsPolygonXGotchichainBridgeFacet.sol";
import {ParcelData, RoundBaseAlchemica, RoundAlchemica} from "../InstallationDiamond/facets/RealmsPolygonXGotchichainBridgeFacet.sol";

import "hardhat/console.sol";

contract RealmsBridgePolygonSide is ProxyONFT721 {
  constructor(uint256 _minGasToTransfer, address _lzEndpoint, address _proxyToken) ProxyONFT721(_minGasToTransfer, _lzEndpoint, _proxyToken) {}


  function estimateSendBatchFee(uint16 _dstChainId, bytes memory _toAddress, uint[] memory _tokenIds, bool _useZro, bytes memory _adapterParams) public view override returns (uint nativeFee, uint zroFee) {
      ParcelData memory parcelData = RealmsPolygonXGotchichainBridgeFacet(address(token)).getParcelData(_tokenIds[0]);
      bytes memory payload = abi.encode(_toAddress, _tokenIds, parcelData);
      return lzEndpoint.estimateFees(_dstChainId, address(this), payload, _useZro, _adapterParams);
  }

  function _send(
    address _from,
    uint16 _dstChainId,
    bytes memory _toAddress,
    uint[] memory _tokenIds,
    address payable _refundAddress,
    address _zroPaymentAddress,
    bytes memory _adapterParams
  ) internal override {
    require(_tokenIds.length > 0, "LzApp: tokenIds[] is empty");
    require(_tokenIds.length == 1, "ONFT721: batch size exceeds dst batch limit");

    uint256 tokenId = _tokenIds[0];
    ParcelData memory parcelData = RealmsPolygonXGotchichainBridgeFacet(address(token)).getParcelData(tokenId);
    _debitFrom(_from, _dstChainId, _toAddress, tokenId);

    bytes memory payload = abi.encode(_toAddress, _tokenIds, parcelData);
    _checkGasLimit(_dstChainId, FUNCTION_TYPE_SEND, _adapterParams, dstChainIdToTransferGas[_dstChainId]);
    _lzSend(_dstChainId, payload, _refundAddress, _zroPaymentAddress, _adapterParams, msg.value);
    emit SendToChain(_dstChainId, _from, _toAddress, _tokenIds);
  }

  function _nonblockingLzReceive(uint16 _srcChainId, bytes memory _srcAddress, uint64 /*_nonce*/, bytes memory _payload) internal virtual override {
    revert("Realms cannot be bridged back to Polygon");
  }
}

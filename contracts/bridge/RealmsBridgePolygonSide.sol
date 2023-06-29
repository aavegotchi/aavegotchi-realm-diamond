// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "../libraries/AppStorage.sol";
import "./ProxyONFT721.sol";

contract RealmsBridgePolygonSide is ProxyONFT721 {
    constructor(
        uint256 _minGasToTransfer,
        address _lzEndpoint,
        address _proxyToken
    ) ProxyONFT721(_minGasToTransfer, _lzEndpoint, _proxyToken) {} 

    function estimateSendBatchFee(uint16 _dstChainId, bytes memory _toAddress, uint[] memory _tokenIds, bool _useZro, bytes memory _adapterParams) public view override returns (uint nativeFee, uint zroFee) {
        Parcel[] memory parcels = new Parcel[](_tokenIds.length);
        for (uint i = 0; i < _tokenIds.length; i++) {
            // parcels[i] = PolygonXGotchichainBridgeFacet(address(token)).getParcelData(_tokenIds[i]);
        }
        bytes memory payload = abi.encode(_toAddress, _tokenIds, parcels);
        return lzEndpoint.estimateFees(_dstChainId, address(this), payload, _useZro, _adapterParams);
    }

    function _send(address _from, uint16 _dstChainId, bytes memory _toAddress, uint[] memory _tokenIds, address payable _refundAddress, address _zroPaymentAddress, bytes memory _adapterParams) internal override {
        // allow 1 by default
        require(_tokenIds.length > 0, "LzApp: tokenIds[] is empty");
        require(_tokenIds.length == 1 || _tokenIds.length <= dstChainIdToBatchLimit[_dstChainId], "ONFT721: batch size exceeds dst batch limit");

        Parcel[] memory parcels = new Parcel[](_tokenIds.length);
        for (uint i = 0; i < _tokenIds.length; i++) {
            _debitFrom(_from, _dstChainId, _toAddress, _tokenIds[i]);
            // parcels[i] = PolygonXGotchichainBridgeFacet(address(token)).getParcelData(_tokenIds[i]);
        }

        bytes memory payload = abi.encode(_toAddress, _tokenIds, parcels);

        _checkGasLimit(_dstChainId, FUNCTION_TYPE_SEND, _adapterParams, dstChainIdToTransferGas[_dstChainId] * _tokenIds.length);
        _lzSend(_dstChainId, payload, _refundAddress, _zroPaymentAddress, _adapterParams, msg.value);
        emit SendToChain(_dstChainId, _from, _toAddress, _tokenIds);
    }

    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 /*_nonce*/,
        bytes memory _payload
    ) internal virtual override {
        revert("Realms cannot be bridged back to Polygon");
    }
}

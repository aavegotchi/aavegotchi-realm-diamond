// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "./ProxyONFT1155.sol";
import "../InstallationDiamond/facets/PolygonXGotchichainBridgeFacet.sol";

contract InstallationsBridgePolygonSide is ProxyONFT1155 {
    constructor(address _lzEndpoint, address _proxyToken) ProxyONFT1155(_lzEndpoint, _proxyToken) {}

    function estimateSendBatchFee(
        uint16 _dstChainId,
        bytes memory _toAddress,
        uint[] memory _tokenIds,
        uint[] memory _amounts,
        bool _useZro,
        bytes memory _adapterParams
    ) public view override returns (uint nativeFee, uint zroFee) {
        bytes memory payload = abi.encode(_toAddress, _tokenIds, _amounts);
        return lzEndpoint.estimateFees(_dstChainId, address(this), payload, _useZro, _adapterParams);
    }

    function _debitFrom(address _from, uint16, bytes memory, uint[] memory _tokenIds, uint[] memory _amounts) internal override {
        require(_from == _msgSender(), "ItemsBridgePolygonSide: owner is not send caller");
        InstallationsPolygonXGotchichainBridgeFacet(address(token)).removeItemsFromOwner(_from, _tokenIds, _amounts);
    }

    function _creditTo(uint16, address _toAddress, uint[] memory _tokenIds, uint[] memory _amounts) internal override {
        InstallationsPolygonXGotchichainBridgeFacet(address(token)).addItemsToOwner(_toAddress, _tokenIds, _amounts);
    }
}

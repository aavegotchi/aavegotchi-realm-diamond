// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {Parcel} from "../libraries/AppStorage.sol";
import "./ProxyONFT721.sol";
import {ParcelData} from "../InstallationDiamond/facets/RealmsPolygonXGotchichainBridgeFacet.sol";
import {RealmsPolygonXGotchichainBridgeFacet} from "../InstallationDiamond/facets/RealmsPolygonXGotchichainBridgeFacet.sol";
import "hardhat/console.sol";

contract RealmsBridgeGotchichainSide is ProxyONFT721 {
    constructor(
        uint256 _minGasToTransfer,
        address _lzEndpoint,
        address _proxyToken
    ) ProxyONFT721(_minGasToTransfer, _lzEndpoint, _proxyToken) {} 

    function estimateSendBatchFee(uint16 _dstChainId, bytes memory _toAddress, uint[] memory _tokenIds, bool _useZro, bytes memory _adapterParams) public view override returns (uint nativeFee, uint zroFee) {
        revert("Realms cannot be bridged back to Polygon");
    }

    function _send(address _from, uint16 _dstChainId, bytes memory _toAddress, uint[] memory _tokenIds, address payable _refundAddress, address _zroPaymentAddress, bytes memory _adapterParams) internal override {
        revert("Realms cannot be bridged back to Polygon");
    }
}

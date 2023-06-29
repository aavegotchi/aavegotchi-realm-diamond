// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import {Parcel} from "../libraries/AppStorage.sol";
import "./ProxyONFT721.sol";

contract RealmsBridgeGotchichainSide is ProxyONFT721 {
    constructor(
        uint256 _minGasToTransfer,
        address _lzEndpoint,
        address _proxyToken
    ) ProxyONFT721(_minGasToTransfer, _lzEndpoint, _proxyToken) {} 

    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 /*_nonce*/,
        bytes memory _payload
    ) internal virtual override {
        // decode and load the toAddress
        (bytes memory toAddressBytes, uint[] memory tokenIds, Parcel[] memory parcels) = abi.decode(_payload, (bytes, uint[], Parcel[]));
        address toAddress;
        assembly {
            toAddress := mload(add(toAddressBytes, 20))
        }
        uint nextIndex = _creditTill(_srcChainId, toAddress, 0, tokenIds);
        if (nextIndex < tokenIds.length) {
            // not enough gas to complete transfers, store to be cleared in another tx
            bytes32 hashedPayload = keccak256(_payload);
            storedCredits[hashedPayload] = StoredCredit(_srcChainId, toAddress, nextIndex, true);
            emit CreditStored(hashedPayload, _payload);
        }

        // _setParcelsMetadata(toAddress, tokenIds, aavegotchis);

        emit ReceiveFromChain(_srcChainId, _srcAddress, toAddress, tokenIds);
    }

    // function _setParcelsMetadata(address newOwner, uint[] memory tokenIds, Parcel[] memory parcels) internal {
    //     for (uint i = 0; i < tokenIds.length; i++) {
    //         parcels[i].owner = newOwner;
    //         // PolygonXGotchichainBridgeFacet(address(token)).setParcelMetadata(tokenIds[i], parcels[i]);
    //     }
    // }

    function estimateSendBatchFee(uint16 _dstChainId, bytes memory _toAddress, uint[] memory _tokenIds, bool _useZro, bytes memory _adapterParams) public view override returns (uint nativeFee, uint zroFee) {
        revert("Realms cannot be bridged back to Polygon");
    }

    function _send(address _from, uint16 _dstChainId, bytes memory _toAddress, uint[] memory _tokenIds, address payable _refundAddress, address _zroPaymentAddress, bytes memory _adapterParams) internal override {
        revert("Realms cannot be bridged back to Polygon");
    }
}

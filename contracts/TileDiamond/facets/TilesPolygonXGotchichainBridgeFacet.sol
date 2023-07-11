// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {Modifiers} from "../../libraries/AppStorageTile.sol";
import {LibERC1155} from "../../libraries/LibERC1155.sol";

contract TilesPolygonXGotchichainBridgeFacet is Modifiers {
    function removeItemsFromOwner(address _owner, uint256[] calldata _tokenIds, uint256[] calldata _tokenAmounts) external onlyLayerZeroBridge() {
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            uint256 tokenAmount = _tokenAmounts[i];
            LibERC1155.removeFromOwner(_owner, tokenId, tokenAmount);
        }
    }


    function addItemsToOwner(address _owner, uint256[] calldata _tokenIds, uint256[] calldata _tokenAmounts) external onlyLayerZeroBridge() {
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            uint256 tokenAmount = _tokenAmounts[i];
            LibERC1155.addToOwner(_owner, tokenId, tokenAmount);
        }
    }
}

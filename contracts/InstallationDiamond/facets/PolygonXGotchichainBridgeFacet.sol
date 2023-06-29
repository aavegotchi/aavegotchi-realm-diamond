// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import * as AppStorageInstallation from "../../libraries/AppStorageInstallation.sol";
// import {Modifiers} from "../../libraries/AppStorage.sol";
import {LibERC1155} from "../../libraries/LibERC1155.sol";

contract InstallationsPolygonXGotchichainBridgeFacet is AppStorageInstallation.Modifiers {

    address public layerZeroBridge;

    modifier onlyLayerZeroBridge() {
        require(msg.sender == layerZeroBridge, "InstallationsPolygonXGotchichainBridgeFacet: Only layerzero bridge");
        _;
    }

    function setLayerZeroBridge(address _newLayerZeroBridge) external onlyOwner(){ // todo check only dao or owner
        layerZeroBridge = _newLayerZeroBridge;
    }

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
    
    // function setParcelMetadata(uint _id, Parcel memory _parcel) external onlyLayerZeroBridge {
    //     s.parcels[_id] = _aavegotchi;
    //     for (uint i; i < _aavegotchi.equippedWearables.length; i++) {
    //         if (_aavegotchi.equippedWearables[i] != 0) {
    //             uint wearableId = _aavegotchi.equippedWearables[i];
    //             LibItems.addToParent(address(this), _id, wearableId, 1);
    //         }
    //     }
    // }

    // function getParcelData(uint256 _tokenId) external view returns (Aavegotchi memory aavegotchi_) {
    //     parcel_ = s.parcel[_tokenId];
    // }
    
}

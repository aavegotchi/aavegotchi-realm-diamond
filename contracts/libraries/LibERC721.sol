// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../interfaces/IERC721TokenReceiver.sol";
import {LibAppStorage, AppStorage} from "./AppStorage.sol";

library LibERC721 {
    /// @dev This emits when ownership of any NFT changes by any mechanism.
    ///  This event emits when NFTs are created (`from` == 0) and destroyed
    ///  (`to` == 0). Exception: during contract creation, any number of NFTs
    ///  may be created and assigned without emitting Transfer. At the time of
    ///  any transfer, the approved address for that NFT (if any) is reset to none.
    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);

    /// @dev This emits when the approved address for an NFT is changed or
    ///  reaffirmed. The zero address indicates there is no approved address.
    ///  When a Transfer event emits, this also indicates that the approved
    ///  address for that NFT (if any) is reset to none.
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);

    /// @dev This emits when an operator is enabled or disabled for an owner.
    ///  The operator can manage all NFTs of the owner.
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

    bytes4 internal constant ERC721_RECEIVED = 0x150b7a02;

    function checkOnERC721Received(
        address _operator,
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) internal {
        uint256 size;
        assembly {
            size := extcodesize(_to)
        }
        if (size > 0) {
            require(
                ERC721_RECEIVED == IERC721TokenReceiver(_to).onERC721Received(_operator, _from, _tokenId, _data),
                "AavegotchiFacet: Transfer rejected/failed by _to"
            );
        }
    }

    // This function is used by transfer functions
    function _transferFrom(
        address _sender,
        address _from,
        address _to,
        uint256 _tokenId
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();
        require(_to != address(0), "ER721: Can't transfer to 0 address");
        address owner = s.parcels[_tokenId].owner;
        require(owner != address(0), "ERC721: Invalid tokenId or can't be transferred");
        require(
            _sender == owner || s.operators[owner][_sender] || s.approved[_tokenId] == _sender,
            "AavegotchiFacet: Not owner or approved to transfer"
        );
        require(_from == owner, "ERC721: _from is not owner, transfer failed");
        s.parcels[_tokenId].owner = _to;
        s.parcelBalance[_from]--;
        s.parcelBalance[_to]++;
        if (s.approved[_tokenId] != address(0)) {
            delete s.approved[_tokenId];
            emit LibERC721.Approval(owner, address(0), _tokenId);
        }
        emit LibERC721.Transfer(_from, _to, _tokenId);
    }

    function _tokenIdsOfOwner(address _owner) internal view returns (uint256[] memory tokenIds_) {
        AppStorage storage s = LibAppStorage.diamondStorage();
        uint256 len = s.tokenIds.length;
        tokenIds_ = new uint256[](len);
        uint256 count;
        for (uint256 i; i < len; ) {
            uint256 tokenId = s.tokenIds[i];
            if (s.parcels[tokenId].owner == _owner) {
                tokenIds_[count] = tokenId;
                unchecked {
                    count++;
                }
            }
            unchecked {
                i++;
            }
        }
        assembly {
            mstore(tokenIds_, count)
        }
    }
}

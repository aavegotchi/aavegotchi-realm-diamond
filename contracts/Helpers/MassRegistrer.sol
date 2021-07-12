// SPDX-License-Identifier: UNLICENSED
// © Copyright 2021. Patent pending. All rights reserved. Perpetual Altruism Ltd.
pragma solidity 0.8.5;

import "../tokens/IERC721.sol";
import "../tokens/IERC1155.sol";
import "../GBM/GBM.sol";

/// @title MassRegistrer
/// @dev Allow to batch transfer and auction many ERC721/ERC1155 tokens trough a GBM
/// @author Guillaume Gonnaud
contract MassRegistrer {
    //Prerequisite : msg.sender must own the tokenID from _tokenIDStart to _tokenIDEnd and this contract need to be an operator of msg.sender
    function massRegistrerERC721Default(
        address _GBM,
        address _initiator,
        address _ERC721Contract,
        uint256 _tokenIDStart,
        uint256 _tokenIDEnd
    ) external {
        GBM(_GBM).registerAnAuctionContract(_ERC721Contract, _initiator);
        while (_tokenIDStart < _tokenIDEnd) {
            IERC721(_ERC721Contract).safeTransferFrom(msg.sender, _GBM, _tokenIDStart, "");
            GBM(_GBM).registerAnAuctionToken(_ERC721Contract, _tokenIDStart, bytes4(keccak256("ERC721")), address(0));
            _tokenIDStart++;
        }
    }

    //Prerequisite : msg.sender must own the tokenID from _tokenIDStart to _tokenIDEnd and this contract need to be an operator of msg.sender
    function massRegistrerERC721Each(
        address _GBM,
        address _initiator,
        address _ERC721Contract,
        uint256 _tokenIDStart,
        uint256 _tokenIDEnd
    ) external {
        while (_tokenIDStart < _tokenIDEnd) {
            IERC721(_ERC721Contract).safeTransferFrom(msg.sender, _GBM, _tokenIDStart, "");
            GBM(_GBM).registerAnAuctionToken(_ERC721Contract, _tokenIDStart, bytes4(keccak256("ERC721")), _initiator);
            _tokenIDStart++;
        }
    }

    function massRegistrerERC1155Default(
        address _GBM,
        address _initiator,
        address _ERC1155Contract,
        uint256 _tokenID,
        uint256 _indexStart,
        uint256 _indexEnd
    ) external {
        GBM(_GBM).registerAnAuctionContract(_ERC1155Contract, _initiator);

        IERC1155(_ERC1155Contract).safeTransferFrom(msg.sender, _GBM, _tokenID, _indexEnd - _indexStart, "");

        while (_indexStart < _indexEnd) {
            GBM(_GBM).registerAnAuctionToken(_ERC1155Contract, _tokenID, bytes4(keccak256("ERC1155")), address(0));
            _indexStart++;
        }
    }

    function massRegistrerERC1155Each(
        address _GBM,
        address _initiator,
        address _ERC1155Contract,
        uint256 _tokenID,
        uint256 _indexStart,
        uint256 _indexEnd
    ) external {
        GBM(_GBM).registerAnAuctionContract(_ERC1155Contract, _initiator);

        IERC1155(_ERC1155Contract).safeTransferFrom(msg.sender, _GBM, _tokenID, _indexEnd - _indexStart, "");

        while (_indexStart < _indexEnd) {
            GBM(_GBM).registerAnAuctionToken(_ERC1155Contract, _tokenID, bytes4(keccak256("ERC1155")), _initiator);
            _indexStart++;
        }
    }
}

// SPDX-License-Identifier: UNLICENSED
// © Copyright 2021. Patent pending. All rights reserved. Perpetual Altruism Ltd.
pragma solidity 0.8.5;

import "../interfaces/IERC721.sol";
import "../interfaces/IERC1155.sol";
import "../facets/GBMFacet.sol";

/// @title MassRegistrer
/// @dev Allow to batch transfer and auction many ERC721/ERC1155 tokens trough a GBMFacet
/// @author Guillaume Gonnaud
contract MassRegistrer {
    //Prerequisite : msg.sender must own the tokenID from _tokenIDStart to _tokenIDEnd and this contract need to be an operator of msg.sender
    function registerMassERC721Default(
        address _GBM,
        address _ERC721Contract,
        uint256 _tokenIDStart,
        uint256 _tokenIDEnd
    ) external {
        GBMFacet(_GBM).registerAnAuctionContract(_ERC721Contract);
        while (_tokenIDStart < _tokenIDEnd) {
            IERC721(_ERC721Contract).safeTransferFrom(msg.sender, _GBM, _tokenIDStart, "");
            GBMFacet(_GBM).registerAnAuctionToken(_ERC721Contract, _tokenIDStart, bytes4(keccak256("ERC721")), false);
            _tokenIDStart++;
        }
    }

    //Prerequisite : msg.sender must own the tokenID from _tokenIDStart to _tokenIDEnd and this contract need to be an operator of msg.sender
    function registerMassERC721Each(
        address _GBM,
        address _ERC721Contract,
        uint256 _tokenIDStart,
        uint256 _tokenIDEnd
    ) external {
        while (_tokenIDStart < _tokenIDEnd) {
            IERC721(_ERC721Contract).safeTransferFrom(msg.sender, _GBM, _tokenIDStart, "");
            GBMFacet(_GBM).registerAnAuctionToken(_ERC721Contract, _tokenIDStart, bytes4(keccak256("ERC721")), true);
            _tokenIDStart++;
        }
    }

    function registerMassERC1155Default(
        address _GBM,
        address _ERC1155Contract,
        uint256 _tokenID,
        uint256 _indexStart,
        uint256 _indexEnd
    ) external {
        GBMFacet(_GBM).registerAnAuctionContract(_ERC1155Contract);

        IERC1155(_ERC1155Contract).safeTransferFrom(msg.sender, _GBM, _tokenID, _indexEnd - _indexStart, "");

        while (_indexStart < _indexEnd) {
            GBMFacet(_GBM).registerAnAuctionToken(_ERC1155Contract, _tokenID, bytes4(keccak256("ERC1155")), false);
            _indexStart++;
        }
    }

    function registerMassERC1155Each(
        address _GBM,
        address _ERC1155Contract,
        uint256 _tokenID,
        uint256 _indexStart,
        uint256 _indexEnd
    ) external {
        GBMFacet(_GBM).registerAnAuctionContract(_ERC1155Contract);

        IERC1155(_ERC1155Contract).safeTransferFrom(msg.sender, _GBM, _tokenID, _indexEnd - _indexStart, "");

        while (_indexStart < _indexEnd) {
            GBMFacet(_GBM).registerAnAuctionToken(_ERC1155Contract, _tokenID, bytes4(keccak256("ERC1155")), true);
            _indexStart++;
        }
    }
}

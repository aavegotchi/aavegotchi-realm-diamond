// SPDX-License-Identifier: UNLICENSED
// © Copyright 2021. Patent pending. All rights reserved. Perpetual Altruism Ltd.
pragma solidity ^0.8.0;

import "../interfaces/IGBM.sol";
import "../interfaces/IGBMInitiator.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IERC721.sol";
import "../interfaces/IERC721TokenReceiver.sol";
import "../interfaces/IERC1155.sol";
import "../interfaces/IERC1155TokenReceiver.sol";
import "../interfaces/Ownable.sol";
import "../libraries/AppStorage.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibSignature.sol";

/// @title GBM auction contract
/// @dev See GBM.auction on how to use this contract
/// @author Guillaume Gonnaud
contract GBMFacet is IGBM, IERC1155TokenReceiver, IERC721TokenReceiver, Modifiers {
    function erc20Currency() external view override returns (address) {
        return s.erc20Currency;
    }

    /// @notice Place a GBM bid for a GBM auction
    /// @param _auctionId The auction you want to bid on
    /// @param _bidAmount The amount of the ERC20 token the bid is made of. They should be withdrawable by this contract.
    /// @param _highestBid The current higest bid. Throw if incorrect.
    /// @param _signature Signature
    function commitBid(
        uint256 _auctionId,
        uint256 _bidAmount,
        uint256 _highestBid,
        bytes memory _signature
    ) external {
        bytes32 messageHash = keccak256(abi.encodePacked(_auctionId, _bidAmount, _highestBid));
        require(LibSignature.isValid(messageHash, _signature, s.backendPubKey), "bid: Invalid signature");

        bid(_auctionId, _bidAmount, _highestBid);
    }

    /// @notice Place a GBM bid for a GBM auction
    /// @param _auctionId The auction you want to bid on
    /// @param _bidAmount The amount of the ERC20 token the bid is made of. They should be withdrawable by this contract.
    /// @param _highestBid The current higest bid. Throw if incorrect.
    function bid(
        uint256 _auctionId,
        uint256 _bidAmount,
        uint256 _highestBid
    ) internal {
        require(s.collections[s.tokenMapping[_auctionId].contractAddress].biddingAllowed, "bid: bidding is currently not allowed");

        require(_bidAmount > 1, "bid: _bidAmount cannot be 0");
        require(_bidAmount > s.auctions[_auctionId].floorPrice, "bid: must be higher than floor price");
        require(_highestBid == s.auctions[_auctionId].highestBid, "bid: current highest bid does not match the submitted transaction _highestBid");

        //An auction start time of 0 also indicate the auction has not been created at all

        require(getAuctionStartTime(_auctionId) <= block.timestamp && getAuctionStartTime(_auctionId) != 0, "bid: Auction has not started yet");
        require(getAuctionEndTime(_auctionId) >= block.timestamp, "bid: Auction has already ended");

        require(_bidAmount > _highestBid, "bid: _bidAmount must be higher than _highestBid");

        require(
            // (_highestBid * (getAuctionBidDecimals(_auctionId)) + (getAuctionStepMin(_auctionId) / getAuctionBidDecimals(_auctionId))) >= _highestBid,
            // "bid: _bidAmount must meet the minimum bid"

            (_highestBid * (getAuctionBidDecimals(_auctionId) + getAuctionStepMin(_auctionId))) <= (_bidAmount * getAuctionBidDecimals(_auctionId)),
            "bid: _bidAmount must meet the minimum bid"
        );

        //Transfer the money of the bidder to the GBM smart contract
        IERC20(s.erc20Currency).transferFrom(msg.sender, address(this), _bidAmount);

        //Extend the duration time of the auction if we are close to the end
        if (getAuctionEndTime(_auctionId) < block.timestamp + getAuctionHammerTimeDuration(_auctionId)) {
            s.auctions[_auctionId].endTime = block.timestamp + getAuctionHammerTimeDuration(_auctionId);
            emit AuctionEndTimeUpdated(_auctionId, s.auctions[_auctionId].endTime);
        }

        // Saving incentives for later sending
        uint256 duePay = s.auctions[_auctionId].dueIncentives;
        address previousHighestBidder = s.auctions[_auctionId].highestBidder;
        uint256 previousHighestBid = s.auctions[_auctionId].highestBid;

        // Emitting the event sequence
        if (previousHighestBidder != address(0)) {
            emit AuctionBidRemoved(_auctionId, previousHighestBidder, previousHighestBid);
        }

        if (duePay != 0) {
            s.auctions[_auctionId].debt = s.auctions[_auctionId].debt + duePay;
            emit AuctionIncentivePaid(_auctionId, previousHighestBidder, duePay);
        }

        emit AuctionBidPlaced(_auctionId, msg.sender, _bidAmount);

        // Calculating incentives for the new bidder
        s.auctions[_auctionId].dueIncentives = calculateIncentives(_auctionId, _bidAmount);

        //Setting the new bid/bidder as the highest bid/bidder
        s.auctions[_auctionId].highestBidder = msg.sender;
        s.auctions[_auctionId].highestBid = _bidAmount;

        if ((previousHighestBid + duePay) != 0) {
            //Refunding the previous bid as well as sending the incentives

            //Added to prevent revert
            IERC20(s.erc20Currency).approve(address(this), (previousHighestBid + duePay));

            IERC20(s.erc20Currency).transferFrom(address(this), previousHighestBidder, (previousHighestBid + duePay));
        }
    }

    /// @notice Attribute a token to the winner of the auction and distribute the proceeds to the owner of this contract.
    /// throw if bidding is disabled or if the auction is not finished.
    /// @param _auctionId The auctionId of the auction to complete
    function claim(uint256 _auctionId) external override {
        address _ca = s.tokenMapping[_auctionId].contractAddress;
        uint256 _tid = s.tokenMapping[_auctionId].tokenId;

        require(s.collections[_ca].biddingAllowed, "claim: Claiming is currently not allowed");
        require(getAuctionEndTime(_auctionId) < block.timestamp, "claim: Auction has not yet ended");
        require(s.auctionItemClaimed[_auctionId] == false, "claim: Item has already been claimed");

        //Prevents re-entrancy
        s.auctionItemClaimed[_auctionId] = true;

        //Todo: Add in the various Aavegotchi addresses
        uint256 _proceeds = s.auctions[_auctionId].highestBid - s.auctions[_auctionId].debt;

        //Added to prevent revert
        IERC20(s.erc20Currency).approve(address(this), _proceeds);

        //Transfer the proceeds to the various recipients

        //5% to burn address
        uint256 burnShare = (_proceeds * 5) / 100;

        //40% to Pixelcraft wallet
        uint256 companyShare = (_proceeds * 40) / 100;

        //40% to player rewards
        uint256 playerRewardsShare = (_proceeds * 2) / 5;

        //15% to DAO
        uint256 daoShare = (_proceeds - burnShare - companyShare - playerRewardsShare);

        IERC20(s.erc20Currency).transferFrom(address(this), address(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF), burnShare);
        IERC20(s.erc20Currency).transferFrom(address(this), s.pixelcraft, companyShare);
        IERC20(s.erc20Currency).transferFrom(address(this), s.playerRewards, playerRewardsShare);
        IERC20(s.erc20Currency).transferFrom(address(this), s.daoTreasury, daoShare);

        //todo: test
        if (s.auctions[_auctionId].highestBid == 0) {
            s.auctions[_auctionId].highestBidder = LibDiamond.contractOwner();
        }

        if (s.tokenMapping[_auctionId].tokenKind == bytes4(keccak256("ERC721"))) {
            //0x73ad2146
            IERC721(_ca).safeTransferFrom(address(this), s.auctions[_auctionId].highestBidder, _tid);
        } else if (s.tokenMapping[_auctionId].tokenKind == bytes4(keccak256("ERC1155"))) {
            //0x973bb640
            IERC1155(_ca).safeTransferFrom(address(this), s.auctions[_auctionId].highestBidder, _tid, 1, "");
            s.erc1155TokensUnderAuction[_ca][_tid] = s.erc1155TokensUnderAuction[_ca][_tid] - 1;
        }

        emit AuctionItemClaimed(_auctionId);
    }

    /// @notice Register an auction contract default parameters for a GBM auction. To use to save gas
    /// @param _contract The token contract the auctionned token belong to
    function registerAnAuctionContract(address _contract) public onlyOwner {
        s.collections[_contract].startTime = s.initiatorInfo.startTime;
        s.collections[_contract].endTime = s.initiatorInfo.endTime;
        s.collections[_contract].hammerTimeDuration = s.initiatorInfo.hammerTimeDuration;
        s.collections[_contract].bidDecimals = s.initiatorInfo.bidDecimals;
        s.collections[_contract].stepMin = s.initiatorInfo.stepMin;
        s.collections[_contract].incMin = s.initiatorInfo.incMin;
        s.collections[_contract].incMax = s.initiatorInfo.incMax;
        s.collections[_contract].bidMultiplier = s.initiatorInfo.bidMultiplier;
    }

    /// @notice Allow/disallow bidding and claiming for a whole token contract address.
    /// @param _contract The token contract the auctionned token belong to
    /// @param _value True if bidding/claiming should be allowed.
    function setBiddingAllowed(address _contract, bool _value) external onlyOwner {
        s.collections[_contract].biddingAllowed = _value;
        emit Contract_BiddingAllowed(_contract, _value);
    }

    /// @notice Register an auction token and emit the relevant AuctionInitialized & AuctionStartTimeUpdated events
    /// Throw if the token owner is not the GBM smart contract/supply of auctionned 1155 token is insufficient
    /// @param _tokenContract The token contract the auctionned token belong to
    /// @param _tokenId The token ID of the token being auctionned
    /// @param _tokenKind either bytes4(keccak256("ERC721")) or bytes4(keccak256("ERC1155"))
    /// @param _useInitiator Set to `false` if you want to use the default value registered for the token contract (if wanting to reset to default,
    /// use `true`)
    function registerAnAuctionToken(
        address _tokenContract,
        uint256 _tokenId,
        bytes4 _tokenKind,
        bool _useInitiator
    ) public onlyOwner {
        modifyAnAuctionToken(_tokenContract, _tokenId, _tokenKind, _useInitiator, 0, false);
    }

    /// @notice Register an auction token and emit the relevant AuctionInitialized & AuctionStartTimeUpdated events
    /// Throw if the token owner is not the GBM smart contract/supply of auctionned 1155 token is insufficient
    /// @param _tokenContract The token contract the auctionned token belong to
    /// @param _tokenId The token ID of the token being auctionned
    /// @param _tokenKind either bytes4(keccak256("ERC721")) or bytes4(keccak256("ERC1155"))
    /// @param _useInitiator Set to `false` if you want to use the default value registered for the token contract (if wanting to reset to default,
    /// use `true`)
    /// @param _1155Index Set to 0 if dealing with an ERC-721 or registering new 1155 test. otherwise, set to relevant index you want to reinitialize
    /// @param _rewrite Set to true if you want to rewrite the data of an existing auction, false otherwise
    function modifyAnAuctionToken(
        address _tokenContract,
        uint256 _tokenId,
        bytes4 _tokenKind,
        bool _useInitiator,
        uint256 _1155Index,
        bool _rewrite
    ) internal {
        if (!_rewrite) {
            _1155Index = s.erc1155TokensIndex[_tokenContract][_tokenId]; //_1155Index was 0 if creating new auctions
            require(s.auctionMapping[_tokenContract][_tokenId][_1155Index] == 0, "The auction aleady exist for the specified token");
        } else {
            require(s.auctionMapping[_tokenContract][_tokenId][_1155Index] != 0, "The auction doesn't exist yet for the specified token");
        }

        //Checking the kind of token being registered
        require(
            _tokenKind == bytes4(keccak256("ERC721")) || _tokenKind == bytes4(keccak256("ERC1155")),
            "registerAnAuctionToken: Only ERC1155 and ERC721 tokens are supported"
        );

        //Building the auction object
        TokenRepresentation memory newAuction;
        newAuction.contractAddress = _tokenContract;
        newAuction.tokenId = _tokenId;
        newAuction.tokenKind = _tokenKind;

        uint256 _auctionId;

        if (_tokenKind == bytes4(keccak256("ERC721"))) {
            require(
                msg.sender == Ownable(_tokenContract).owner() || address(this) == IERC721(_tokenContract).ownerOf(_tokenId),
                "registerAnAuctionToken: the specified ERC-721 token cannot be auctioned"
            );

            _auctionId = uint256(keccak256(abi.encodePacked(_tokenContract, _tokenId, _tokenKind)));
            s.auctionMapping[_tokenContract][_tokenId][0] = _auctionId;
        } else {
            require(
                msg.sender == Ownable(_tokenContract).owner() ||
                    s.erc1155TokensUnderAuction[_tokenContract][_tokenId] < IERC1155(_tokenContract).balanceOf(address(this), _tokenId),
                "registerAnAuctionToken:  the specified ERC-1155 token cannot be auctionned"
            );

            require(
                _1155Index <= s.erc1155TokensIndex[_tokenContract][_tokenId],
                "The specified _1155Index have not been reached yet for this token"
            );

            _auctionId = uint256(keccak256(abi.encodePacked(_tokenContract, _tokenId, _tokenKind, _1155Index)));

            if (!_rewrite) {
                s.erc1155TokensIndex[_tokenContract][_tokenId] = s.erc1155TokensIndex[_tokenContract][_tokenId] + 1;
                s.erc1155TokensUnderAuction[_tokenContract][_tokenId] = s.erc1155TokensUnderAuction[_tokenContract][_tokenId] + 1;
            }

            s.auctionMapping[_tokenContract][_tokenId][_1155Index] = _auctionId;
        }

        s.tokenMapping[_auctionId] = newAuction; //_auctionId => token_primaryKey

        if (_useInitiator) {
            s.auctions[_auctionId].startTime = s.initiatorInfo.startTime;
            s.auctions[_auctionId].endTime = s.initiatorInfo.endTime;
            s.auctions[_auctionId].hammerTimeDuration = s.initiatorInfo.hammerTimeDuration;
            s.auctions[_auctionId].bidDecimals = s.initiatorInfo.bidDecimals;
            s.auctions[_auctionId].stepMin = s.initiatorInfo.stepMin;
            s.auctions[_auctionId].incMin = s.initiatorInfo.incMin;
            s.auctions[_auctionId].incMax = s.initiatorInfo.incMax;
            s.auctions[_auctionId].bidMultiplier = s.initiatorInfo.bidMultiplier;
            s.auctions[_auctionId].floorPrice = s.initiatorInfo.floorPrice;
        }

        //Event emitted when an auction is being setup
        emit AuctionInitialized(_auctionId, _tokenId, _1155Index, _tokenContract, _tokenKind);

        //Event emitted when the start time of an auction changes (due to admin interaction )
        emit AuctionStartTimeUpdated(_auctionId, getAuctionStartTime(_auctionId));
    }

    function getAuctionInfo(uint256 _auctionId) external view returns (Auction memory auctionInfo_) {
        auctionInfo_ = s.auctions[_auctionId];
        auctionInfo_.contractAddress = s.tokenMapping[_auctionId].contractAddress;
        auctionInfo_.biddingAllowed = s.collections[s.tokenMapping[_auctionId].contractAddress].biddingAllowed;
    }

    function getAuctionHighestBidder(uint256 _auctionId) external view override returns (address) {
        return s.auctions[_auctionId].highestBidder;
    }

    function getAuctionHighestBid(uint256 _auctionId) external view override returns (uint256) {
        return s.auctions[_auctionId].highestBid;
    }

    function getAuctionDebt(uint256 _auctionId) external view override returns (uint256) {
        return s.auctions[_auctionId].debt;
    }

    function getAuctionDueIncentives(uint256 _auctionId) external view override returns (uint256) {
        return s.auctions[_auctionId].dueIncentives;
    }

    function getAuctionID(address _contract, uint256 _tokenID) external view override returns (uint256) {
        return s.auctionMapping[_contract][_tokenID][0];
    }

    function getAuctionID(
        address _contract,
        uint256 _tokenID,
        uint256 _tokenIndex
    ) external view override returns (uint256) {
        return s.auctionMapping[_contract][_tokenID][_tokenIndex];
    }

    function getTokenKind(uint256 _auctionId) external view override returns (bytes4) {
        return s.tokenMapping[_auctionId].tokenKind;
    }

    function getTokenId(uint256 _auctionId) external view override returns (uint256) {
        return s.tokenMapping[_auctionId].tokenId;
    }

    function getContractAddress(uint256 _auctionId) external view override returns (address) {
        return s.tokenMapping[_auctionId].contractAddress;
    }

    function getAuctionStartTime(uint256 _auctionId) public view override returns (uint256) {
        if (s.auctions[_auctionId].startTime != 0) {
            return s.auctions[_auctionId].startTime;
        } else {
            return s.collections[s.tokenMapping[_auctionId].contractAddress].startTime;
        }
    }

    function getAuctionEndTime(uint256 _auctionId) public view override returns (uint256) {
        if (s.auctions[_auctionId].endTime != 0) {
            return s.auctions[_auctionId].endTime;
        } else {
            return s.collections[s.tokenMapping[_auctionId].contractAddress].endTime;
        }
    }

    function getAuctionHammerTimeDuration(uint256 _auctionId) public view override returns (uint256) {
        if (s.auctions[_auctionId].hammerTimeDuration != 0) {
            return s.auctions[_auctionId].hammerTimeDuration;
        } else {
            return s.collections[s.tokenMapping[_auctionId].contractAddress].hammerTimeDuration;
        }
    }

    function getAuctionBidDecimals(uint256 _auctionId) public view override returns (uint256) {
        if (s.auctions[_auctionId].bidDecimals != 0) {
            return s.auctions[_auctionId].bidDecimals;
        } else {
            return s.collections[s.tokenMapping[_auctionId].contractAddress].bidDecimals;
        }
    }

    function getAuctionStepMin(uint256 _auctionId) public view override returns (uint256) {
        if (s.auctions[_auctionId].stepMin != 0) {
            return s.auctions[_auctionId].stepMin;
        } else {
            return s.collections[s.tokenMapping[_auctionId].contractAddress].stepMin;
        }
    }

    function getAuctionIncMin(uint256 _auctionId) public view override returns (uint256) {
        if (s.auctions[_auctionId].incMin != 0) {
            return s.auctions[_auctionId].incMin;
        } else {
            return s.collections[s.tokenMapping[_auctionId].contractAddress].incMin;
        }
    }

    function getAuctionIncMax(uint256 _auctionId) public view override returns (uint256) {
        if (s.auctions[_auctionId].incMax != 0) {
            return s.auctions[_auctionId].incMax;
        } else {
            return s.collections[s.tokenMapping[_auctionId].contractAddress].incMax;
        }
    }

    function getAuctionBidMultiplier(uint256 _auctionId) public view override returns (uint256) {
        if (s.auctions[_auctionId].bidMultiplier != 0) {
            return s.auctions[_auctionId].bidMultiplier;
        } else {
            return s.collections[s.tokenMapping[_auctionId].contractAddress].bidMultiplier;
        }
    }

    function onERC721Received(
        address, /* _operator */
        address, /*  _from */
        uint256, /*  _tokenId */
        bytes calldata /* _data */
    ) external pure override returns (bytes4) {
        return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
    }

    function onERC1155Received(
        address, /* _operator */
        address, /* _from */
        uint256, /* _id */
        uint256, /* _value */
        bytes calldata /* _data */
    ) external pure override returns (bytes4) {
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }

    function onERC1155BatchReceived(
        address, /* _operator */
        address, /* _from */
        uint256[] calldata, /* _ids */
        uint256[] calldata, /* _values */
        bytes calldata /* _data */
    ) external pure override returns (bytes4) {
        return bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"));
    }

    /// @notice Calculating and setting how much payout a bidder will receive if outbid
    /// @dev Only callable internally
    function calculateIncentives(uint256 _auctionId, uint256 _newBidValue) internal view returns (uint256) {
        uint256 bidDecimals = getAuctionBidDecimals(_auctionId);
        uint256 bidIncMax = getAuctionIncMax(_auctionId);

        //Init the baseline bid we need to perform against
        uint256 baseBid = (s.auctions[_auctionId].highestBid * (bidDecimals + getAuctionStepMin(_auctionId))) / bidDecimals;

        //If no bids are present, set a basebid value of 1 to prevent divide by 0 errors
        if (baseBid == 0) {
            baseBid = 1;
        }

        //Ratio of newBid compared to expected minBid
        uint256 decimaledRatio = ((bidDecimals * getAuctionBidMultiplier(_auctionId) * (_newBidValue - baseBid)) / baseBid) +
            getAuctionIncMin(_auctionId) *
            bidDecimals;

        if (decimaledRatio > (bidDecimals * bidIncMax)) {
            decimaledRatio = bidDecimals * bidIncMax;
        }

        return (_newBidValue * decimaledRatio) / (bidDecimals * bidDecimals);
    }

    function registerMassERC721Each(
        address _GBM,
        bool _useInitiator,
        address _ERC721Contract,
        uint256 _tokenIDStart,
        uint256 _tokenIDEnd
    ) external onlyOwner {
        while (_tokenIDStart < _tokenIDEnd) {
            IERC721(_ERC721Contract).safeTransferFrom(msg.sender, _GBM, _tokenIDStart, "");
            registerAnAuctionToken(_ERC721Contract, _tokenIDStart, bytes4(keccak256("ERC721")), _useInitiator);

            _tokenIDStart++;
        }
    }

    function registerMassERC1155Each(
        address _GBM,
        bool _useInitiator,
        address _ERC1155Contract,
        uint256 _tokenID,
        uint256 _indexStart,
        uint256 _indexEnd
    ) external onlyOwner {
        registerAnAuctionContract(_ERC1155Contract);
        IERC1155(_ERC1155Contract).safeTransferFrom(msg.sender, _GBM, _tokenID, _indexEnd - _indexStart, "");
        while (_indexStart < _indexEnd) {
            registerAnAuctionToken(_ERC1155Contract, _tokenID, bytes4(keccak256("ERC1155")), _useInitiator);
            _indexStart++;
        }
    }
}

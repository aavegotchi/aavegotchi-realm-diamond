// SPDX-License-Identifier: UNLICENSED
// © Copyright 2021. Patent pending. All rights reserved. Perpetual Altruism Ltd.
pragma solidity 0.8.5;

import "./IGBM.sol";
import "./IGBMInitiator.sol";
import "../tokens/IERC20.sol";
import "../tokens/IERC721.sol";
import "../tokens/IERC721TokenReceiver.sol";
import "../tokens/IERC1155.sol";
import "../tokens/IERC1155TokenReceiver.sol";
import "../tokens/Ownable.sol";

import "hardhat/console.sol";

/// @title GBM auction contract
/// @dev See GBM.auction on how to use this contract
/// @author Guillaume Gonnaud
contract GBM is IGBM, IERC1155TokenReceiver, IERC721TokenReceiver {
    //Struct used to store the representation of an NFT being auctionned
    struct token_representation {
        address contractAddress; // The contract address
        uint256 tokenId; // The ID of the token on the contract
        bytes4 tokenKind; // The ERC name of the token implementation bytes4(keccak256("ERC721")) or bytes4(keccak256("ERC1155"))
    }

    //The address of the auctionner to whom all profits will be sent
    address public override owner;

    //Contract address storing the ERC20 currency used in auctions
    address public override ERC20Currency;

    mapping(uint256 => token_representation) internal tokenMapping; //_auctionID => token_primaryKey
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) internal auctionMapping; // contractAddress => tokenId => TokenIndex => _auctionID

    mapping(uint256 => uint256) internal auction_dueIncentives; // _auctionID => dueIncentives
    mapping(uint256 => uint256) internal auction_debt; // _auctionID => unsettled debt
    mapping(uint256 => address) internal auction_highestBidder; // _auctionID => bidder
    mapping(uint256 => uint256) internal auction_highestBid; // _auctionID => bid

    mapping(address => bool) internal collection_biddingAllowed; // tokencontract => Allow to start/pause ongoing auctions

    //var storing individual auction settings. if != null, they take priority over collection settings
    mapping(uint256 => uint256) internal auction_startTime; // _auctionID => timestamp
    mapping(uint256 => uint256) internal auction_endTime; // _auctionID => timestamp
    mapping(uint256 => uint256) internal auction_hammerTimeDuration; // _auctionID => duration in seconds
    mapping(uint256 => uint256) internal auction_bidDecimals; // _auctionID => bidDecimals
    mapping(uint256 => uint256) internal auction_stepMin; // _auctionID => stepMin
    mapping(uint256 => uint256) internal auction_incMin; // _auctionID => minimal earned incentives
    mapping(uint256 => uint256) internal auction_incMax; // _auctionID => maximal earned incentives
    mapping(uint256 => uint256) internal auction_bidMultiplier; // _auctionID => bid incentive growth multiplier
    mapping(uint256 => bool) internal auction_itemClaimed;

    //var storing contract wide settings. Those are used if no auctionId specific parameters is initialized
    mapping(address => uint256) internal collection_startTime; // tokencontract => timestamp
    mapping(address => uint256) internal collection_endTime; // tokencontract => timestamp
    mapping(address => uint256) internal collection_hammerTimeDuration; // tokencontract => duration in seconds
    mapping(address => uint256) internal collection_bidDecimals; // tokencontract => bidDecimals
    mapping(address => uint256) internal collection_stepMin; // tokencontract => stepMin
    mapping(address => uint256) internal collection_incMin; // tokencontract => minimal earned incentives
    mapping(address => uint256) internal collection_incMax; // tokencontract => maximal earned incentives
    mapping(address => uint256) internal collection_bidMultiplier; // tokencontract => bid incentive growth multiplier

    mapping(address => mapping(uint256 => uint256)) internal eRC1155_tokensIndex; //Contract => TokenID => Amount being auctionned
    mapping(address => mapping(uint256 => uint256)) internal eRC1155_tokensUnderAuction; //Contract => TokenID => Amount being auctionned

    constructor(address _ERC20Currency) {
        owner = msg.sender;
        ERC20Currency = _ERC20Currency;
    }

    /// @notice Place a GBM bid for a GBM auction
    /// @param _auctionID The auction you want to bid on
    /// @param _bidAmount The amount of the ERC20 token the bid is made of. They should be withdrawable by this contract.
    /// @param _highestBid The current higest bid. Throw if incorrect.
    function bid(
        uint256 _auctionID,
        uint256 _bidAmount,
        uint256 _highestBid
    ) external override {
        require(collection_biddingAllowed[tokenMapping[_auctionID].contractAddress], "bid: bidding is currently not allowed");

        require(_bidAmount > 1, "bid: _bidAmount cannot be 0");
        require(_highestBid == auction_highestBid[_auctionID], "bid: current highest bid do not match the submitted transaction _highestBid");

        //An auction start time of 0 also indicate the auction has not been created at all

        require(getAuctionStartTime(_auctionID) <= block.timestamp && getAuctionStartTime(_auctionID) != 0, "bid: Auction has not started yet");
        require(getAuctionEndTime(_auctionID) >= block.timestamp, "bid: Auction has already ended");

        require(_bidAmount > _highestBid, "bid: _bidAmount must be higgher than _highestBid");
        require(
            (_highestBid * (getAuctionBidDecimals(_auctionID)) + (getAuctionStepMin(_auctionID) / getAuctionBidDecimals(_auctionID))) >= _highestBid,
            "bid: _bidAmount must meet the minimum bid"
        );

        //Transfer the money of the bidder to the GBM smart contract
        IERC20(ERC20Currency).transferFrom(msg.sender, address(this), _bidAmount);

        //Extend the duration time of the auction if we are close to the end
        if (getAuctionEndTime(_auctionID) < block.timestamp + getHammerTimeDuration(_auctionID)) {
            auction_endTime[_auctionID] = block.timestamp + getHammerTimeDuration(_auctionID);
            emit Auction_EndTimeUpdated(_auctionID, auction_endTime[_auctionID]);
        }

        // Saving incentives for later sending
        uint256 duePay = auction_dueIncentives[_auctionID];
        address previousHighestBidder = auction_highestBidder[_auctionID];
        uint256 previousHighestBid = auction_highestBid[_auctionID];

        // Emitting the event sequence
        if (previousHighestBidder != address(0)) {
            emit Auction_BidRemoved(_auctionID, previousHighestBidder, previousHighestBid);
        }

        if (duePay != 0) {
            auction_debt[_auctionID] = auction_debt[_auctionID] + duePay;
            emit Auction_IncentivePaid(_auctionID, previousHighestBidder, duePay);
        }

        emit Auction_BidPlaced(_auctionID, msg.sender, _bidAmount);

        // Calculating incentives for the new bidder
        auction_dueIncentives[_auctionID] = calculateIncentives(_auctionID, _bidAmount);

        //Setting the new bid/bidder as the highest bid/bidder
        auction_highestBidder[_auctionID] = msg.sender;
        auction_highestBid[_auctionID] = _bidAmount;

        if ((previousHighestBid + duePay) != 0) {
            //Refunding the previous bid as well as sending the incentives

            //Added to prevent revert
            IERC20(ERC20Currency).approve(address(this), (previousHighestBid + duePay));

            IERC20(ERC20Currency).transferFrom(address(this), previousHighestBidder, (previousHighestBid + duePay));
        }
    }

    /// @notice Attribute a token to the winner of the auction and distribute the proceeds to the owner of this contract.
    /// throw if bidding is disabled or if the auction is not finished.
    /// @param _auctionID The auctionID of the auction to complete
    function claim(uint256 _auctionID) external override {
        address _ca = tokenMapping[_auctionID].contractAddress;
        uint256 _tid = tokenMapping[_auctionID].tokenId;

        require(collection_biddingAllowed[_ca], "claim: Claiming is currently not allowed");
        require(getAuctionEndTime(_auctionID) < block.timestamp, "claim: Auction has not yet ended");
        require(auction_itemClaimed[_auctionID] == false, "claim: Item has already been claimed");

        //Prevents re-entrancy
        auction_itemClaimed[_auctionID] = true;

        //Added to prevent revert
        IERC20(ERC20Currency).approve(address(this), (auction_highestBid[_auctionID] - auction_debt[_auctionID]));

        //Transfer the proceeds to this smart contract owner

        //Todo: Add in the various Aavegotchi addresses
        IERC20(ERC20Currency).transferFrom(address(this), owner, (auction_highestBid[_auctionID] - auction_debt[_auctionID]));

        if (tokenMapping[_auctionID].tokenKind == bytes4(keccak256("ERC721"))) {
            //0x73ad2146
            IERC721(_ca).safeTransferFrom(address(this), auction_highestBidder[_auctionID], _tid);
        } else if (tokenMapping[_auctionID].tokenKind == bytes4(keccak256("ERC1155"))) {
            //0x973bb640
            IERC1155(_ca).safeTransferFrom(address(this), auction_highestBidder[_auctionID], _tid, 1, "");
            eRC1155_tokensUnderAuction[_ca][_tid] = eRC1155_tokensUnderAuction[_ca][_tid] - 1;
        }

        emit Auction_ItemClaimed(_auctionID);
    }

    /// @notice Register an auction contract default parameters for a GBM auction. To use to save gas
    /// @param _contract The token contract the auctionned token belong to
    /// @param _initiator Set to 0 if you want to use the default value registered for the token contract
    function registerAnAuctionContract(address _contract, address _initiator) public {
        require(msg.sender == owner, "Only the owner of a contract can register default values for the tokens");

        collection_startTime[_contract] = IGBMInitiator(_initiator).getStartTime(uint256(uint160(_contract)));
        collection_endTime[_contract] = IGBMInitiator(_initiator).getEndTime(uint256(uint160(_contract)));
        collection_hammerTimeDuration[_contract] = IGBMInitiator(_initiator).getHammerTimeDuration(uint256(uint160(_contract)));
        collection_bidDecimals[_contract] = IGBMInitiator(_initiator).getBidDecimals(uint256(uint160(_contract)));
        collection_stepMin[_contract] = IGBMInitiator(_initiator).getStepMin(uint256(uint160(_contract)));
        collection_incMin[_contract] = IGBMInitiator(_initiator).getIncMin(uint256(uint160(_contract)));
        collection_incMax[_contract] = IGBMInitiator(_initiator).getIncMax(uint256(uint160(_contract)));
        collection_bidMultiplier[_contract] = IGBMInitiator(_initiator).getBidMultiplier(uint256(uint160(_contract)));
    }

    /// @notice Allow/disallow bidding and claiming for a whole token contract address.
    /// @param _contract The token contract the auctionned token belong to
    /// @param _value True if bidding/claiming should be allowed.
    function setBiddingAllowed(address _contract, bool _value) external {
        require(msg.sender == owner, "Only the owner of GBM contract can allow/disallow bidding");
        collection_biddingAllowed[_contract] = _value;
        emit Contract_BiddingAllowed(_contract, _value);
    }

    /// @notice Register an auction token and emit the relevant Auction_Initialized & Auction_StartTimeUpdated events
    /// Throw if the token owner is not the GBM smart contract/supply of auctionned 1155 token is insufficient
    /// @param _tokenContract The token contract the auctionned token belong to
    /// @param _tokenId The token ID of the token being auctionned
    /// @param _tokenKind either bytes4(keccak256("ERC721")) or bytes4(keccak256("ERC1155"))
    /// @param _initiator Set to 0 if you want to use the default value registered for the token contract (if wanting to reset to default,
    /// use an initiator sending back 0 on it's getters)
    function registerAnAuctionToken(
        address _tokenContract,
        uint256 _tokenId,
        bytes4 _tokenKind,
        address _initiator
    ) public {
        modifyAnAuctionToken(_tokenContract, _tokenId, _tokenKind, _initiator, 0, false);
    }

    /// @notice Register an auction token and emit the relevant Auction_Initialized & Auction_StartTimeUpdated events
    /// Throw if the token owner is not the GBM smart contract/supply of auctionned 1155 token is insufficient
    /// @param _tokenContract The token contract the auctionned token belong to
    /// @param _tokenId The token ID of the token being auctionned
    /// @param _tokenKind either bytes4(keccak256("ERC721")) or bytes4(keccak256("ERC1155"))
    /// @param _initiator Set to 0 if you want to use the default value registered for the token contract (if wanting to reset to default,
    /// use an initiator sending back 0 on it's getters)
    /// @param _1155Index Set to 0 if dealing with an ERC-721 or registering new 1155 tokens. otherwise, set to relevant index you want to reinitialize
    /// @param _rewrite Set to true if you want to rewrite the data of an existing auction, false otherwise
    function modifyAnAuctionToken(
        address _tokenContract,
        uint256 _tokenId,
        bytes4 _tokenKind,
        address _initiator,
        uint256 _1155Index,
        bool _rewrite
    ) public {
        require(msg.sender == owner, "Only the owner of a contract can allow/disallow bidding");

        if (!_rewrite) {
            _1155Index = eRC1155_tokensIndex[_tokenContract][_tokenId]; //_1155Index was 0 if creating new auctions
            require(auctionMapping[_tokenContract][_tokenId][_1155Index] == 0, "The auction aleady exist for the specified token");
        } else {
            require(auctionMapping[_tokenContract][_tokenId][_1155Index] != 0, "The auction doesn't exist yet for the specified token");
        }

        //Checking the kind of token being registered
        require(
            _tokenKind == bytes4(keccak256("ERC721")) || _tokenKind == bytes4(keccak256("ERC1155")),
            "registerAnAuctionToken: Only ERC1155 and ERC721 tokens are supported"
        );

        //Building the auction object
        token_representation memory newAuction;
        newAuction.contractAddress = _tokenContract;
        newAuction.tokenId = _tokenId;
        newAuction.tokenKind = _tokenKind;

        uint256 auctionId;

        if (_tokenKind == bytes4(keccak256("ERC721"))) {
            require(
                msg.sender == Ownable(_tokenContract).owner() || address(this) == IERC721(_tokenContract).ownerOf(_tokenId),
                "registerAnAuctionToken: the specified ERC-721 token cannot be auctioned"
            );

            auctionId = uint256(keccak256(abi.encodePacked(_tokenContract, _tokenId, _tokenKind)));
            auctionMapping[_tokenContract][_tokenId][0] = auctionId;
        } else {
            require(
                msg.sender == Ownable(_tokenContract).owner() ||
                    eRC1155_tokensUnderAuction[_tokenContract][_tokenId] < IERC1155(_tokenContract).balanceOf(address(this), _tokenId),
                "registerAnAuctionToken:  the specified ERC-1155 token cannot be auctionned"
            );

            require(_1155Index <= eRC1155_tokensIndex[_tokenContract][_tokenId], "The specified _1155Index have not been reached yet for this token");

            auctionId = uint256(keccak256(abi.encodePacked(_tokenContract, _tokenId, _tokenKind, _1155Index)));

            if (!_rewrite) {
                eRC1155_tokensIndex[_tokenContract][_tokenId] = eRC1155_tokensIndex[_tokenContract][_tokenId] + 1;
                eRC1155_tokensUnderAuction[_tokenContract][_tokenId] = eRC1155_tokensUnderAuction[_tokenContract][_tokenId] + 1;
            }

            auctionMapping[_tokenContract][_tokenId][_1155Index] = auctionId;
        }

        tokenMapping[auctionId] = newAuction; //_auctionID => token_primaryKey

        if (_initiator != address(0x0)) {
            auction_startTime[auctionId] = IGBMInitiator(_initiator).getStartTime(auctionId);
            auction_endTime[auctionId] = IGBMInitiator(_initiator).getEndTime(auctionId);
            auction_hammerTimeDuration[auctionId] = IGBMInitiator(_initiator).getHammerTimeDuration(auctionId);
            auction_bidDecimals[auctionId] = IGBMInitiator(_initiator).getBidDecimals(auctionId);
            auction_stepMin[auctionId] = IGBMInitiator(_initiator).getStepMin(auctionId);
            auction_incMin[auctionId] = IGBMInitiator(_initiator).getIncMin(auctionId);
            auction_incMax[auctionId] = IGBMInitiator(_initiator).getIncMax(auctionId);
            auction_bidMultiplier[auctionId] = IGBMInitiator(_initiator).getBidMultiplier(auctionId);
        }

        //Event emitted when an auction is being setup
        emit Auction_Initialized(auctionId, _tokenId, _1155Index, _tokenContract, _tokenKind);

        //Event emitted when the start time of an auction changes (due to admin interaction )
        emit Auction_StartTimeUpdated(auctionId, getAuctionStartTime(auctionId));
    }

    struct AuctionInfo {
        address owner;
        address highestBidder;
        uint256 highestBid;
        uint256 auctionDebt;
        uint256 dueIncentives;
        address contractAddress;
        uint256 startTime;
        uint256 endTime;
        uint256 hammerTimeDuration;
        uint256 bidDecimals;
        uint256 stepMin;
        uint256 incMin;
        uint256 incMax;
        uint256 bidMultiplier;
        bool biddingAllowed;
    }

    function getAuctionInfo(uint256 _auctionId) external view returns (AuctionInfo memory auctionInfo_) {
        auctionInfo_.owner = owner;
        auctionInfo_.highestBidder = auction_highestBidder[_auctionId];
        auctionInfo_.highestBid = auction_highestBid[_auctionId];
        auctionInfo_.auctionDebt = auction_debt[_auctionId];
        auctionInfo_.dueIncentives = auction_dueIncentives[_auctionId];
        auctionInfo_.contractAddress = tokenMapping[_auctionId].contractAddress;
        auctionInfo_.startTime = auction_startTime[_auctionId];
        auctionInfo_.endTime = auction_endTime[_auctionId];
        auctionInfo_.hammerTimeDuration = auction_hammerTimeDuration[_auctionId];
        auctionInfo_.bidDecimals = auction_bidDecimals[_auctionId];
        auctionInfo_.stepMin = auction_stepMin[_auctionId];
        auctionInfo_.incMin = auction_incMin[_auctionId];
        auctionInfo_.incMax = auction_incMax[_auctionId];
        auctionInfo_.bidMultiplier = auction_bidMultiplier[_auctionId];
        auctionInfo_.biddingAllowed = collection_biddingAllowed[tokenMapping[_auctionId].contractAddress];
    }

    function getAuctionHighestBidder(uint256 _auctionID) external view override returns (address) {
        return auction_highestBidder[_auctionID];
    }

    function getAuctionHighestBid(uint256 _auctionID) external view override returns (uint256) {
        return auction_highestBid[_auctionID];
    }

    function getAuctionDebt(uint256 _auctionID) external view override returns (uint256) {
        return auction_debt[_auctionID];
    }

    function getAuctionDueIncentives(uint256 _auctionID) external view override returns (uint256) {
        return auction_dueIncentives[_auctionID];
    }

    function getAuctionID(address _contract, uint256 _tokenID) external view override returns (uint256) {
        return auctionMapping[_contract][_tokenID][0];
    }

    function getAuctionID(
        address _contract,
        uint256 _tokenID,
        uint256 _tokenIndex
    ) external view override returns (uint256) {
        return auctionMapping[_contract][_tokenID][_tokenIndex];
    }

    function getTokenKind(uint256 _auctionID) external view override returns (bytes4) {
        return tokenMapping[_auctionID].tokenKind;
    }

    function getTokenId(uint256 _auctionID) external view override returns (uint256) {
        return tokenMapping[_auctionID].tokenId;
    }

    function getContractAddress(uint256 _auctionID) external view override returns (address) {
        return tokenMapping[_auctionID].contractAddress;
    }

    function getAuctionStartTime(uint256 _auctionID) public view override returns (uint256) {
        if (auction_startTime[_auctionID] != 0) {
            return auction_startTime[_auctionID];
        } else {
            return collection_startTime[tokenMapping[_auctionID].contractAddress];
        }
    }

    function getAuctionEndTime(uint256 _auctionID) public view override returns (uint256) {
        if (auction_endTime[_auctionID] != 0) {
            return auction_endTime[_auctionID];
        } else {
            return collection_endTime[tokenMapping[_auctionID].contractAddress];
        }
    }

    function getHammerTimeDuration(uint256 _auctionID) public view override returns (uint256) {
        if (auction_hammerTimeDuration[_auctionID] != 0) {
            return auction_hammerTimeDuration[_auctionID];
        } else {
            return collection_hammerTimeDuration[tokenMapping[_auctionID].contractAddress];
        }
    }

    function getAuctionBidDecimals(uint256 _auctionID) public view override returns (uint256) {
        if (auction_bidDecimals[_auctionID] != 0) {
            return auction_bidDecimals[_auctionID];
        } else {
            return collection_bidDecimals[tokenMapping[_auctionID].contractAddress];
        }
    }

    function getAuctionStepMin(uint256 _auctionID) public view override returns (uint256) {
        if (auction_stepMin[_auctionID] != 0) {
            return auction_stepMin[_auctionID];
        } else {
            return collection_stepMin[tokenMapping[_auctionID].contractAddress];
        }
    }

    function getAuctionIncMin(uint256 _auctionID) public view override returns (uint256) {
        if (auction_incMin[_auctionID] != 0) {
            return auction_incMin[_auctionID];
        } else {
            return collection_incMin[tokenMapping[_auctionID].contractAddress];
        }
    }

    function getAuctionIncMax(uint256 _auctionID) public view override returns (uint256) {
        if (auction_incMax[_auctionID] != 0) {
            return auction_incMax[_auctionID];
        } else {
            return collection_incMin[tokenMapping[_auctionID].contractAddress];
        }
    }

    function getAuctionBidMultiplier(uint256 _auctionID) public view override returns (uint256) {
        if (auction_bidMultiplier[_auctionID] != 0) {
            return auction_bidMultiplier[_auctionID];
        } else {
            return collection_bidMultiplier[tokenMapping[_auctionID].contractAddress];
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
    function calculateIncentives(uint256 _auctionID, uint256 _newBidValue) internal view returns (uint256) {
        uint256 bidDecimals = getAuctionBidDecimals(_auctionID);
        uint256 bidIncMax = getAuctionIncMax(_auctionID);

        //Init the baseline bid we need to perform against
        uint256 baseBid = (auction_highestBid[_auctionID] * (bidDecimals + getAuctionStepMin(_auctionID))) / bidDecimals;

        //If no bids are present, set a basebid value of 1 to prevent divide by 0 errors
        if (baseBid == 0) {
            baseBid = 1;
        }

        //Ratio of newBid compared to expected minBid
        uint256 decimaledRatio = ((bidDecimals * getAuctionBidMultiplier(_auctionID) * (_newBidValue - baseBid)) / baseBid) +
            getAuctionIncMin(_auctionID) *
            bidDecimals;

        if (decimaledRatio > (bidDecimals * bidIncMax)) {
            decimaledRatio = bidDecimals * bidIncMax;
        }

        return (_newBidValue * decimaledRatio) / (bidDecimals * bidDecimals);
    }

    function massRegistrerERC721Each(
        address _GBM,
        address _initiator,
        address _ERC721Contract,
        uint256 _tokenIDStart,
        uint256 _tokenIDEnd
    ) external {
        while (_tokenIDStart < _tokenIDEnd) {
            require(msg.sender == owner, "Must be contract owner");
            IERC721(_ERC721Contract).safeTransferFrom(msg.sender, _GBM, _tokenIDStart, "");
            registerAnAuctionToken(_ERC721Contract, _tokenIDStart, bytes4(keccak256("ERC721")), _initiator);

            _tokenIDStart++;
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
        require(msg.sender == owner, "Must be contract owner");
        registerAnAuctionContract(_ERC1155Contract, _initiator);

        IERC1155(_ERC1155Contract).safeTransferFrom(msg.sender, _GBM, _tokenID, _indexEnd - _indexStart, "");

        while (_indexStart < _indexEnd) {
            registerAnAuctionToken(_ERC1155Contract, _tokenID, bytes4(keccak256("ERC1155")), _initiator);
            _indexStart++;
        }
    }
}

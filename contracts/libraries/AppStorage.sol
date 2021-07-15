// SPDX-License-Identifier: MIT
pragma solidity 0.8.5;

//Struct used to store the representation of an NFT being auctionned
struct TokenRepresentation {
    address contractAddress; // The contract address
    uint256 tokenId; // The ID of the token on the contract
    bytes4 tokenKind; // The ERC name of the token implementation bytes4(keccak256("ERC721")) or bytes4(keccak256("ERC1155"))
}

struct AuctionInfo {
//    address owner; // TODO: Check to remove
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
    uint256 floorPrice;
}

struct AppStorage {
    //The address of the auctionner to whom all profits will be sent
//    address owner; // TODO: Check to remove
    address pixelcraft;
    address playerRewards;
    address daoTreasury;

    //Contract address storing the ERC20 currency used in auctions
    address ERC20Currency;

    mapping(uint256 => TokenRepresentation) tokenMapping; //_auctionID => token_primaryKey
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) auctionMapping; // contractAddress => tokenId => TokenIndex => _auctionID

    mapping(uint256 => AuctionInfo) auctions; //_auctionID => actions

    mapping(uint256 => uint256) auction_dueIncentives; // _auctionID => dueIncentives
    mapping(uint256 => uint256) auction_debt; // _auctionID => unsettled debt
    mapping(uint256 => address) auction_highestBidder; // _auctionID => bidder
    mapping(uint256 => uint256) auction_highestBid; // _auctionID => bid

    mapping(address => bool) collection_biddingAllowed; // tokencontract => Allow to start/pause ongoing auctions

    //var storing individual auction settings. if != null, they take priority over collection settings
    mapping(uint256 => uint256) auction_startTime; // _auctionID => timestamp
    mapping(uint256 => uint256) auction_endTime; // _auctionID => timestamp
    mapping(uint256 => uint256) auction_hammerTimeDuration; // _auctionID => duration in seconds
    mapping(uint256 => uint256) auction_bidDecimals; // _auctionID => bidDecimals
    mapping(uint256 => uint256) auction_stepMin; // _auctionID => stepMin
    mapping(uint256 => uint256) auction_incMin; // _auctionID => minimal earned incentives
    mapping(uint256 => uint256) auction_incMax; // _auctionID => maximal earned incentives
    mapping(uint256 => uint256) auction_bidMultiplier; // _auctionID => bid incentive growth multiplier

    mapping(uint256 => uint256) auction_floorPrice; //floor price of the auction

    mapping(uint256 => bool) auction_itemClaimed;

    //var storing contract wide settings. Those are used if no auctionId specific parameters is initialized
    mapping(address => uint256) collection_startTime; // tokencontract => timestamp
    mapping(address => uint256) collection_endTime; // tokencontract => timestamp
    mapping(address => uint256) collection_hammerTimeDuration; // tokencontract => duration in seconds
    mapping(address => uint256) collection_bidDecimals; // tokencontract => bidDecimals
    mapping(address => uint256) collection_stepMin; // tokencontract => stepMin
    mapping(address => uint256) collection_incMin; // tokencontract => minimal earned incentives
    mapping(address => uint256) collection_incMax; // tokencontract => maximal earned incentives
    mapping(address => uint256) collection_bidMultiplier; // tokencontract => bid incentive growth multiplier

    mapping(address => mapping(uint256 => uint256)) eRC1155_tokensIndex; //Contract => TokenID => Amount being auctionned
    mapping(address => mapping(uint256 => uint256)) eRC1155_tokensUnderAuction; //Contract => TokenID => Amount being auctionned

    }

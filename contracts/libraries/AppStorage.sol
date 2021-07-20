// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//Struct used to store the representation of an NFT being auctionned
struct TokenRepresentation {
    address contractAddress; // The contract address
    uint256 tokenId; // The ID of the token on the contract
    bytes4 tokenKind; // The ERC name of the token implementation bytes4(keccak256("ERC721")) or bytes4(keccak256("ERC1155"))
}

struct InitiatorInfo {
    uint256 startTime;
    uint256 endTime;
    uint256 hammerTimeDuration;
    uint256 bidDecimals;
    uint256 stepMin;
    uint256 incMin;
    uint256 incMax;
    uint256 bidMultiplier;
    uint256 floorPrice;
}

struct Auction {
    address highestBidder;
    uint256 highestBid;
    uint256 debt;
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

struct Collection {
    uint256 startTime;
    uint256 endTime;
    uint256 hammerTimeDuration;
    uint256 bidDecimals;
    uint256 stepMin;
    uint256 incMin; // minimal earned incentives
    uint256 incMax; // maximal earned incentives
    uint256 bidMultiplier; // bid incentive growth multiplier
    bool biddingAllowed; // Allow to start/pause ongoing auctions
}

struct AppStorage {
    address pixelcraft;
    address playerRewards;
    address daoTreasury;


    InitiatorInfo initiatorInfo;

    //Contract address storing the ERC20 currency used in auctions
    address erc20Currency;

    mapping(uint256 => TokenRepresentation) tokenMapping; //_auctionId => token_primaryKey
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) auctionMapping; // contractAddress => tokenId => TokenIndex => _auctionId

    //var storing individual auction settings. if != null, they take priority over collection settings
    mapping(uint256 => Auction) auctions; //_auctionId => auctions

    mapping(uint256 => bool) auctionItemClaimed;

    //var storing contract wide settings. Those are used if no auctionId specific parameters is initialized
    mapping(address => Collection) collections; //tokencontract => collections

    mapping(address => mapping(uint256 => uint256)) erc1155TokensIndex; //Contract => TokenID => Amount being auctionned
    mapping(address => mapping(uint256 => uint256)) erc1155TokensUnderAuction; //Contract => TokenID => Amount being auctionned
}

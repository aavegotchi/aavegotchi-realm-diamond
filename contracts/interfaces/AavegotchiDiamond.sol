// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.1;

interface AavegotchiDiamond {
  struct GotchiLending {
    // storage slot 1
    address lender;
    uint96 initialCost; // GHST in wei, can be zero
    // storage slot 2
    address borrower;
    uint32 listingId;
    uint32 erc721TokenId;
    uint32 whitelistId; // can be zero
    // storage slot 3
    address originalOwner; // if original owner is lender, same as lender
    uint40 timeCreated;
    uint40 timeAgreed;
    bool canceled;
    bool completed;
    // storage slot 4
    address thirdParty; // can be address(0)
    uint8[3] revenueSplit; // lender/original owner, borrower, thirdParty
    uint40 lastClaimed; //timestamp
    uint32 period; //in seconds
    // storage slot 5
    address[] revenueTokens;
  }

  function ownerOf(uint256 _tokenId) external view returns (address owner_);

  function gotchiEscrow(uint256 _tokenId) external view returns (address);

  function isAavegotchiLent(uint256 _erc721TokenId) external view returns (bool);

  function getGotchiLendingFromToken(uint32 _erc721TokenId) external view returns (GotchiLending memory listing_);

  function addGotchiLending(
    uint32 _erc721TokenId,
    uint96 _initialCost,
    uint32 _period,
    uint8[3] calldata _revenueSplit,
    address _originalOwner,
    address _thirdParty,
    uint32 _whitelistId,
    address[] calldata _revenueTokens
  ) external;

  function agreeGotchiLending(
    uint32 _listingId,
    uint32 _erc721TokenId,
    uint96 _initialCost,
    uint32 _period,
    uint8[3] calldata _revenueSplit
  ) external;
}

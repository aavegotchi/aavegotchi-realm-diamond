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
    // storage slot 6
    uint256 channellingStatus;
  }

  struct AddGotchiListing {
    uint32 tokenId;
    uint96 initialCost;
    uint32 period;
    uint8[3] revenueSplit;
    address originalOwner;
    address thirdParty;
    uint32 whitelistId;
    address[] revenueTokens;
    uint256 permissions;
  }

  function ownerOf(uint256 _tokenId) external view returns (address owner_);

  function gotchiEscrow(uint256 _tokenId) external view returns (address);

  function isAavegotchiLent(uint32 _erc721TokenId) external view returns (bool);

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

  function kinship(uint256 _tokenId) external view returns (uint256 score_);

  // whitelist functions
  function createWhitelist(string calldata _name, address[] calldata _whitelistAddresses) external;

  function whitelistOwner(uint32 _whitelistId) external view returns (address);

  function isWhitelisted(uint32 _whitelistId, address _whitelistAddress) external view returns (uint256);

  function getWhitelistsLength() external view returns (uint256);

  function isAavegotchiListed(uint32 _erc721TokenId) external view returns (bool);

  function getGotchiLendingsLength() external view returns (uint256);

  function reduceKinshipViaChanneling(uint32 _gotchiId) external;

  // function setLendingChannelingStatus(uint32 _listingId, uint256 _newChannelStatus) external;

  function claimAndEndGotchiLending(uint32 _tokenId) external;

  function addGotchiLending(
    uint32 _erc721TokenId,
    uint96 _initialCost,
    uint32 _period,
    uint8[3] calldata _revenueSplit,
    address _originalOwner,
    address _thirdParty,
    uint32 _whitelistId,
    address[] calldata _revenueTokens,
    uint256 _channellingStatus
  ) external;
}

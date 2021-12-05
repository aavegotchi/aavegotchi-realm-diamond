// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../libraries/AppStorage.sol";
import "./RealmFacet.sol";
import "../libraries/LibRealm.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "../libraries/LibAlchemica.sol";
import "../interfaces/AavegotchiDiamond.sol";
import "../test/AlchemicaToken.sol";

contract AlchemicaFacet is Modifiers {
  event AlchemicaClaimed(
    uint256 indexed _parcelId,
    uint256 indexed _gotchiId,
    uint256 indexed _alchemicaType,
    uint256 _amount,
    uint256 _spilloverRate,
    uint256 _spilloverRadius
  );

  event ChannelAlchemica(
    uint256 indexed _parcelId,
    uint256 indexed _gotchiId,
    uint256[4] _alchemica,
    uint256 _spilloverRate,
    uint256 _spilloverRadius
  );

  function setAlchemicaAddresses(address[4] calldata _addresses) external onlyOwner {
    s.alchemicaAddresses = _addresses;
  }

  function startSurveying(uint256 _tokenId, uint256 _surveyingRound) external {
    require(s.parcels[_tokenId].owner == msg.sender, "RealmFacet: Not owner");
    require(_surveyingRound <= s.surveyingRound, "RealmFacet: Round not released");
    require(_surveyingRound == s.parcels[_tokenId].roundsClaimed, "RealmFacet: Wrong round");
    s.parcels[_tokenId].roundsClaimed++;
    drawRandomNumbers(_tokenId, _surveyingRound);
  }

  function drawRandomNumbers(uint256 _tokenId, uint256 _surveyingRound) internal {
    // Will revert if subscription is not set and funded.
    uint256 requestId = VRFCoordinatorV2Interface(s.vrfCoordinator).requestRandomWords(
      s.requestConfig.keyHash,
      s.requestConfig.subId,
      s.requestConfig.requestConfirmations,
      s.requestConfig.callbackGasLimit,
      s.requestConfig.numWords
    );
    s.vrfRequestIdToTokenId[requestId] = _tokenId;
    s.vrfRequestIdToSurveyingRound[requestId] = _surveyingRound;
  }

  function getTotalAlchemicas() external view returns (uint256[4][5] memory) {
    return s.totalAlchemicas;
  }

  function getRealmAlchemica(uint256 _tokenId) external view returns (uint256[4] memory) {
    return s.parcels[_tokenId].alchemicaRemaining;
  }

  function progressSurveyingRound() external onlyOwner {
    s.surveyingRound++;
  }

  function setVars(
    uint256[4][5] calldata _alchemicas,
    address _installationsDiamond,
    address _greatPortalDiamond,
    address _vrfCoordinator,
    address _linkAddress,
    address[4] calldata _alchemicaAddresses
  ) external onlyOwner {
    for (uint8 i; i < _alchemicas.length; i++) {
      for (uint256 j; j < _alchemicas[i].length; j++) {
        s.totalAlchemicas[i][j] = _alchemicas[i][j];
      }
    }
    s.installationsDiamond = _installationsDiamond;
    s.greatPortalDiamond = _greatPortalDiamond;
    s.vrfCoordinator = _vrfCoordinator;
    s.linkAddress = _linkAddress;
    s.alchemicaAddresses = _alchemicaAddresses;
  }

  // testing funcs
  function testingStartSurveying(uint256 _tokenId, uint256 _surveyingRound) external {
    require(s.parcels[_tokenId].owner == msg.sender, "RealmFacet: Not owner");
    require(_surveyingRound <= s.surveyingRound, "RealmFacet: Round not released");
    require(_surveyingRound == s.parcels[_tokenId].roundsClaimed, "RealmFacet: Wrong round");
    s.parcels[_tokenId].roundsClaimed++;
    uint256[] memory alchemicas = new uint256[](4);
    for (uint256 i; i < 4; i++) {
      alchemicas[i] = uint256(keccak256(abi.encodePacked(block.number, msg.sender, i)));
    }
    LibRealm.updateRemainingAlchemicaFirstRound(_tokenId, alchemicas);
  }

  function testingMintParcel(
    address _to,
    uint256[] calldata _tokenIds,
    RealmFacet.MintParcelInput[] memory _metadata
  ) external {
    for (uint256 index = 0; index < _tokenIds.length; index++) {
      require(s.tokenIds.length < 420069, "RealmFacet: Cannot mint more than 420,069 parcels");
      uint256 tokenId = _tokenIds[index];
      RealmFacet.MintParcelInput memory metadata = _metadata[index];
      require(_tokenIds.length == _metadata.length, "Inputs must be same length");

      Parcel storage parcel = s.parcels[tokenId];
      parcel.coordinateX = metadata.coordinateX;
      parcel.coordinateY = metadata.coordinateY;
      parcel.parcelId = metadata.parcelId;
      parcel.size = metadata.size;
      parcel.district = metadata.district;
      parcel.parcelAddress = metadata.parcelAddress;

      parcel.alchemicaBoost = metadata.boost;

      LibERC721.safeMint(_to, tokenId);
    }
  }

  function testingAlchemicaFaucet(uint256 _alchemicaType, uint256 _amount) external {
    AlchemicaToken alchemica = AlchemicaToken(s.alchemicaAddresses[_alchemicaType]);
    alchemica.mint(msg.sender, _amount);
  }

  function getAvailableAlchemica(uint256 _tokenId) public view returns (uint256[4] memory _availableAlchemica) {
    //Calculate the # of blocks elapsed since the last

    for (uint256 index = 0; index < 4; index++) {
      //First get the onchain amount
      uint256 available = s.parcels[_tokenId].unclaimedAlchemica[index];

      //Then get the floating amount
      available += LibAlchemica.alchemicaSinceLastUpdate(_tokenId, index);

      uint256 capacity = s.parcels[_tokenId].reservoirCapacity[index];

      //ensure that available alchemica is not higher than available reservoir capacity
      if (available > capacity) _availableAlchemica[index] = capacity;
      else _availableAlchemica[index] = available;
    }
  }

  function claimAvailableAlchemica(
    uint256 _tokenId,
    uint256 _alchemicaType,
    uint256 _gotchiId
  ) external onlyParcelOwner(_tokenId) {
    //@todo: enforce the gotchiId via a positional hash
    //@todo: allow claimOperator

    AavegotchiDiamond diamond = AavegotchiDiamond(s.aavegotchiDiamond);
    require(diamond.ownerOf(_gotchiId) == msg.sender, "AlchemicaFacet: No permission to claim");

    uint256 available = getAvailableAlchemica(_tokenId)[_alchemicaType];

    uint256 remaining = s.parcels[_tokenId].alchemicaRemaining[_alchemicaType];

    require(remaining >= available, "AlchemicaFacet: Not enough alchemica available");

    s.parcels[_tokenId].alchemicaRemaining[_alchemicaType] -= available;

    s.parcels[_tokenId].lastUpdateTimestamp[_alchemicaType] = block.timestamp;

    //@todo: mint new tokens
    //@todo: transfer tokens based on reservoir level:
    //@todo: get the spillover rate + spillover radius for the reservoir on this parcel
    //@question: if player has multiple reservoirs equipped, how should we handle the spillover?

    AlchemicaToken alchemica = AlchemicaToken(s.alchemicaAddresses[_alchemicaType]);

    //@todo: add in spillover percentages

    //@todo: add in escrow() function in AavegotchiDiamond to prevent calling expensive aavegotchiInfo function

    uint256 bp = 100000;

    uint256 dummySpilloverRate = 80000; //80%
    uint256 dummySpilloverRadius = 1000; //1000 gotchis

    uint256 ownerAmount = (available * (bp - dummySpilloverRate)) / bp;
    uint256 spillAmount = (available * dummySpilloverRate) / bp;

    alchemica.mint(s.greatPortalDiamond, spillAmount);
    alchemica.mint(msg.sender, ownerAmount);

    emit AlchemicaClaimed(_tokenId, _gotchiId, _alchemicaType, available, dummySpilloverRate, dummySpilloverRadius);
  }

  function channelAlchemica(uint256 _realmId, uint256 _gotchiId) external {
    //@todo: Channel alchemica

    //spillover rate and radius depends on altar level

    uint256 dummySpilloverRate = 80000; //80%
    uint256 dummySpilloverRadius = 1000;

    //@todo: check Great Portal balance to see if tokens should be transferred or minted

    emit ChannelAlchemica(_realmId, _gotchiId, [uint256(0), uint256(0), uint256(0), uint256(0)], dummySpilloverRate, dummySpilloverRadius);
  }
}

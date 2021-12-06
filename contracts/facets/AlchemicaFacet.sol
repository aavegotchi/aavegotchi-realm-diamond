// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../libraries/AppStorage.sol";
import "./RealmFacet.sol";
import "../libraries/LibRealm.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "../libraries/LibAlchemica.sol";
import "../interfaces/AavegotchiDiamond.sol";
import "../test/AlchemicaToken.sol";

uint256 constant bp = 100000;

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

  struct SpilloverIO {
    uint256 rate;
    uint256 radius;
  }

  function calculateSpilloverForReservoir(uint256 _tokenId, uint256 _alchemicaType) internal view returns (SpilloverIO memory spillover) {
    uint256[] memory reservoirIds = InstallationDiamond(s.installationsDiamond).getReservoirIds(_alchemicaType);

    //getting balances and spillover rates
    uint256[] memory spilloverRates = InstallationDiamond(s.installationsDiamond).spilloverRatesOfIds(reservoirIds);

    uint256[] memory spilloverRadii = InstallationDiamond(s.installationsDiamond).spilloverRadiusOfIds(reservoirIds);

    uint256[] memory reservoirBalances = InstallationDiamond(s.installationsDiamond).installationBalancesOfTokenByIds(
      address(this),
      _tokenId,
      reservoirIds
    );

    uint256 totalReservoirs = 0;
    uint256 totalRate;
    uint256 totalRadius;

    //@todo: get the spillover rate + spillover radius for all reservoirs on this parcel
    for (uint256 i = 0; i < reservoirBalances.length; i++) {
      uint256 installationId = reservoirIds[i];
      uint256 balance = reservoirBalances[i];

      if (balance > 0) {
        totalReservoirs += balance;
        totalRate += (spilloverRates[installationId] * balance);
        totalRadius += (spilloverRadii[installationId] * balance);
      }
    }

    //@todo: add in spillover percentages
    // uint256 dummySpilloverRate = 80000; //80%
    // uint256 dummySpilloverRadius = 1000; //1000 gotchis

    return SpilloverIO(totalRate / totalReservoirs, totalRadius / totalReservoirs);
  }

  function calculateSpilloverForAltar(uint256 _tokenId) internal view returns (SpilloverIO memory spillover) {
    uint256[] memory altarIds = InstallationDiamond(s.installationsDiamond).getAltarIds();

    uint256[] memory altarBalances = InstallationDiamond(s.installationsDiamond).installationBalancesOfTokenByIds(address(this), _tokenId, altarIds);

    uint256 altarId = 0;

    for (uint256 i = 0; i < altarBalances.length; i++) {
      if (altarBalances[i] > 0) {
        altarId = altarIds[i];
        break;
      }
    }

    //getting balances and spillover rates
    uint256 rate = InstallationDiamond(s.installationsDiamond).spilloverRateOfId(altarId); // uint256 dummySpilloverRate = 80000; //80%

    uint256 radius = InstallationDiamond(s.installationsDiamond).spilloverRadiusOfId(altarId);
    // uint256 dummySpilloverRadius = 1000; //1000 gotchis

    return SpilloverIO(rate, radius);
  }

  struct TransferAmounts {
    uint256 owner;
    uint256 spill;
  }

  function calculateTransferAmounts(uint256 _amount, uint256 _spilloverRate) internal pure returns (TransferAmounts memory) {
    uint256 owner = (_amount * (bp - _spilloverRate)) / bp;
    uint256 spill = (_amount * _spilloverRate) / bp;
    return TransferAmounts(owner, spill);
  }

  function alchemicaRecipient(uint256 _gotchiId) internal view returns (address) {
    //Check if Aavegotchi is being lent.

    //if aavegotchi is being lent, return gotchi escrow address.
    //else return msg.sender

    //@todo: If gotchi is being lent, transfer funds to Gotchi escrow. Otherwise, transfer directly to owner account.
    //@todo: use gotchiEscrow() function from aavegotchi diamond
    address gotchiEscrowAddress = address(0);

    return msg.sender;
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

    AlchemicaToken alchemica = AlchemicaToken(s.alchemicaAddresses[_alchemicaType]);

    //@todo: write tests to check spillover is accurate
    SpilloverIO memory spillover = calculateSpilloverForReservoir(_tokenId, _alchemicaType);

    TransferAmounts memory amounts = calculateTransferAmounts(available, spillover.rate);

    //Mint new tokens
    alchemica.mint(alchemicaRecipient(_gotchiId), amounts.owner);
    alchemica.mint(s.greatPortalDiamond, amounts.spill);

    emit AlchemicaClaimed(_tokenId, _gotchiId, _alchemicaType, available, spillover.rate, spillover.radius);
  }

  function channelAlchemica(uint256 _realmId, uint256 _gotchiId) external {
    //@todo: write tests to check spillover is accurate
    SpilloverIO memory spillover = calculateSpilloverForAltar(_realmId);

    //@todo: use random number generation to determine final amounts
    uint256[4] memory channelAmounts = [uint256(100e18), uint256(50e18), uint256(25e18), uint256(10e18)];
    //fud, fomo, alpha, kek

    bool shouldMintNew = true; //@todo: change to check great portal balance is greater than the hardcoded upper limits

    //@todo: handle gotchi lending case
    if (shouldMintNew) {
      for (uint256 i = 0; i < channelAmounts.length; i++) {
        TransferAmounts memory amounts = calculateTransferAmounts(channelAmounts[i], spillover.rate);

        AlchemicaToken(s.alchemicaAddresses[i]).mint(alchemicaRecipient(_gotchiId), amounts.owner);
        AlchemicaToken(s.alchemicaAddresses[i]).mint(s.greatPortalDiamond, amounts.spill);
      }
    } else {
      //@todo: transfer from great portal
    }

    emit ChannelAlchemica(_realmId, _gotchiId, channelAmounts, spillover.rate, spillover.radius);
  }
}

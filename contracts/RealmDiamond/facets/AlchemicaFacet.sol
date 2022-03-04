// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";
import "./RealmFacet.sol";
import "../../libraries/LibRealm.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "../../libraries/LibAlchemica.sol";
import "../../libraries/LibSignature.sol";
import "../../interfaces/AavegotchiDiamond.sol";
import "../../test/AlchemicaToken.sol";
import "hardhat/console.sol";

uint256 constant bp = 100 ether;

contract AlchemicaFacet is Modifiers {
  event AlchemicaClaimed(
    uint256 indexed _realmId,
    uint256 indexed _gotchiId,
    uint256 indexed _alchemicaType,
    uint256 _amount,
    uint256 _spilloverRate,
    uint256 _spilloverRadius
  );

  event ChannelAlchemica(
    uint256 indexed _realmId,
    uint256 indexed _gotchiId,
    uint256[4] _alchemica,
    uint256 _spilloverRate,
    uint256 _spilloverRadius
  );

  event ExitAlchemica(uint256 indexed _gotchiId, uint256[] _alchemica);

  event SurveyingRoundProgressed(uint256 indexed _newRound);

  /// @notice Allow the owner of a parcel to start surveying his parcel
  /// @dev Will throw if a surveying round has not started
  /// @param _realmId Identifier of the parcel to survey
  function startSurveying(uint256 _realmId) external onlyParcelOwner(_realmId) {
    require(s.parcels[_realmId].currentRound <= s.surveyingRound, "RealmFacet: Round not released");
    s.parcels[_realmId].currentRound++;
    drawRandomNumbers(_realmId, s.parcels[_realmId].currentRound - 1);
  }

  function drawRandomNumbers(uint256 _realmId, uint256 _surveyingRound) internal {
    // Will revert if subscription is not set and funded.
    uint256 requestId = VRFCoordinatorV2Interface(s.vrfCoordinator).requestRandomWords(
      s.requestConfig.keyHash,
      s.requestConfig.subId,
      s.requestConfig.requestConfirmations,
      s.requestConfig.callbackGasLimit,
      s.requestConfig.numWords
    );
    s.vrfRequestIdToTokenId[requestId] = _realmId;
    s.vrfRequestIdToSurveyingRound[requestId] = _surveyingRound;
  }

  function getAlchemicaAddresses() external view returns (address[4] memory) {
    return s.alchemicaAddresses;
  }

  /// @notice Query details about all total alchemicas present
  /// @return output_ A two dimensional array, each representing an alchemica value
  function getTotalAlchemicas() external view returns (uint256[4][5] memory) {
    return s.totalAlchemicas;
  }

  /// @notice Query details about the remaining alchemica in a parcel
  /// @param _realmId The identifier of the parcel to query
  /// @return output_ An array containing details about each remaining alchemica in the parcel
  function getRealmAlchemica(uint256 _realmId) external view returns (uint256[4] memory) {
    return s.parcels[_realmId].alchemicaRemaining;
  }

  /// @notice Allow the diamond owner to increment the surveying round
  function progressSurveyingRound() external onlyOwner {
    s.surveyingRound++;
    emit SurveyingRoundProgressed(s.surveyingRound);
  }

  /// @notice Query details about all alchemica gathered in a surveying round in a parcel
  /// @param _realmId Identifier of the parcel to query
  /// @param _roundId Identifier of the surveying round to query
  /// @return output_ An array representing the numbers of alchemica gathered in a round
  function getRoundAlchemica(uint256 _realmId, uint256 _roundId) external view returns (uint256[] memory) {
    return s.parcels[_realmId].roundAlchemica[_roundId];
  }

  /// @notice Query details about the base alchemica gathered in a surveying round in a parcel
  /// @param _realmId Identifier of the parcel to query
  /// @param _roundId Identifier of the surveying round to query
  /// @return output_ An array representing the numbers of base alchemica gathered in a round
  function getRoundBaseAlchemica(uint256 _realmId, uint256 _roundId) external view returns (uint256[] memory) {
    return s.parcels[_realmId].roundBaseAlchemica[_roundId];
  }

  /// @notice Allow the diamond owner to set some important diamond state variables
  /// @param _alchemicas A nested array containing the amount of alchemicas available
  /// @param _boostMultipliers The boost multiplers applied to each parcel
  /// @param _greatPortalCapacity The individual alchemica capacity of the great portal
  /// @param _installationsDiamond The installations diamond address
  /// @param _vrfCoordinator The chainlink vrfCoordinator address
  /// @param _linkAddress The link token address
  /// @param _alchemicaAddresses The four alchemica token addresses
  /// @param _backendPubKey The Realm(gotchiverse) backend public key
  /// @param _gameManager The address of the game manager

  function setVars(
    uint256[4][5] calldata _alchemicas,
    uint256[4] calldata _boostMultipliers,
    uint256[4] calldata _greatPortalCapacity,
    address _installationsDiamond,
    address _vrfCoordinator,
    address _linkAddress,
    address[4] calldata _alchemicaAddresses,
    address _glmrAddress,
    bytes memory _backendPubKey,
    address _gameManager
  ) external onlyOwner {
    for (uint i; i < _alchemicas.length; i++) {
      for (uint256 j; j < _alchemicas[i].length; j++) {
        s.totalAlchemicas[i][j] = _alchemicas[i][j];
      }
    }
    s.boostMultipliers = _boostMultipliers;
    s.greatPortalCapacity = _greatPortalCapacity;
    s.installationsDiamond = _installationsDiamond;
    s.vrfCoordinator = _vrfCoordinator;
    s.linkAddress = _linkAddress;
    s.alchemicaAddresses = _alchemicaAddresses;
    s.backendPubKey = _backendPubKey;
    s.gameManager = _gameManager;
    s.glmrAddress = _glmrAddress;
  }

  /// @dev This function will be removed in production.
  function testingStartSurveying(uint256 _realmId) external onlyParcelOwner(_realmId) {
    require(s.parcels[_realmId].currentRound <= s.surveyingRound, "RealmFacet: Round not released");

    s.parcels[_realmId].currentRound++;
    uint256[] memory alchemicas = new uint256[](4);
    for (uint256 i; i < 4; i++) {
      alchemicas[i] = uint256(keccak256(abi.encodePacked(msg.sender, uint256(1))));
    }

    LibRealm.updateRemainingAlchemica(_realmId, alchemicas, s.parcels[_realmId].currentRound - 1);
  }

  /// @dev This function will be removed in production.
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

  /// @dev This function will be removed in production.
  function testingAlchemicaFaucet(uint256 _alchemicaType, uint256 _amount) external {
    AlchemicaToken alchemica = AlchemicaToken(s.alchemicaAddresses[_alchemicaType]);
    alchemica.mint(msg.sender, _amount);
  }

  /// @notice Query the available alchemica in a parcel
  /// @param _realmId identifier of parcel to query
  /// @return _availableAlchemica An array representing the available quantity of alchemicas
  function getAvailableAlchemica(uint256 _realmId) public view returns (uint256[4] memory _availableAlchemica) {
    //Calculate the # of blocks elapsed since the last

    for (uint256 index = 0; index < 4; index++) {
      //First get the onchain amount
      uint256 available = s.parcels[_realmId].unclaimedAlchemica[index];
      //Then get the floating amount
      available += LibAlchemica.alchemicaSinceLastUpdate(_realmId, index);

      uint256 capacity = s.parcels[_realmId].reservoirCapacity[index];

      //ensure that available alchemica is not higher than available reservoir capacity
      if (available > capacity) {
        _availableAlchemica[index] = capacity;
      } else {
        _availableAlchemica[index] = available;
      }
    }
  }

  struct SpilloverIO {
    uint256 rate;
    uint256 radius;
  }

  function calculateSpilloverForReservoir(uint256 _realmId, uint256 _alchemicaType) internal view returns (SpilloverIO memory spillover) {
    uint256 spilloverRate = s.parcels[_realmId].spilloverRate[_alchemicaType] / s.parcels[_realmId].reservoirCount[_alchemicaType];
    uint256 spilloverRadius = s.parcels[_realmId].spilloverRadius[_alchemicaType] / s.parcels[_realmId].reservoirCount[_alchemicaType];

    return SpilloverIO(spilloverRate, spilloverRadius);
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
    //@note: isAavegotchiLent() function does not yet exist in Aavegotchi Diamond
    AavegotchiDiamond diamond = AavegotchiDiamond(s.aavegotchiDiamond);
    // if (diamond.isAavegotchiLent(_gotchiId)) {
    //   return diamond.gotchiEscrow(_gotchiId);
    // } else {
    //   return diamond.ownerOf(_gotchiId);
    // }
    return diamond.ownerOf(_gotchiId);
  }

  /// @notice Allow parcel owner to claim available alchemica with his parent NFT(Aavegotchi)
  /// @param _realmId Identifier of parcel to claim alchemica from
  /// @param _alchemicaTypes Alchemica types to claim
  /// @param _gotchiId Identifier of Aavegotchi to use for alchemica collecction/claiming
  /// @param _signature Message signature used for backend validation

  function claimAvailableAlchemica(
    uint256 _realmId,
    uint256[] calldata _alchemicaTypes,
    uint256 _gotchiId,
    bytes memory _signature
  ) external onlyParcelOwner(_realmId) onlyGotchiOwner(_gotchiId) {
    uint256[4] memory _availableAlchemica = getAvailableAlchemica(_realmId);

    for (uint256 i = 0; i < _alchemicaTypes.length; i++) {
      uint256 remaining = s.parcels[_realmId].alchemicaRemaining[_alchemicaTypes[i]];

      require(
        LibSignature.isValid(keccak256(abi.encodePacked(_alchemicaTypes[i], _realmId, _gotchiId, remaining)), _signature, s.backendPubKey),
        "AlchemicaFacet: Invalid signature"
      );

      //@todo (future release): allow claimOperator

      uint256 available = _availableAlchemica[_alchemicaTypes[i]];
      require(remaining >= available, "AlchemicaFacet: Not enough alchemica available");

      s.parcels[_realmId].alchemicaRemaining[_alchemicaTypes[i]] -= available;
      s.parcels[_realmId].unclaimedAlchemica[_alchemicaTypes[i]] = 0;
      s.parcels[_realmId].lastUpdateTimestamp[_alchemicaTypes[i]] = block.timestamp;

      SpilloverIO memory spillover = calculateSpilloverForReservoir(_realmId, _alchemicaTypes[i]);
      TransferAmounts memory amounts = calculateTransferAmounts(available, spillover.rate);

      //Mint new tokens
      _mintAvailableAlchemica(_alchemicaTypes[i], _gotchiId, amounts.owner, amounts.spill);

      emit AlchemicaClaimed(_realmId, _gotchiId, _alchemicaTypes[i], available, spillover.rate, spillover.radius);
    }
  }

  function _mintAvailableAlchemica(
    uint256 _alchemicaType,
    uint256 _gotchiId,
    uint256 _owner,
    uint256 _spill
  ) internal {
      AlchemicaToken alchemica = AlchemicaToken(s.alchemicaAddresses[_alchemicaType]);
      alchemica.mint(alchemicaRecipient(_gotchiId), _owner);
      alchemica.mint(address(this), _spill);
  }

  /// @notice Allow a parcel owner to channel alchemica
  /// @dev This transfers alchemica to the parent ERC721 token with id _gotchiId and also to the great portal
  /// @param _realmId Identifier of parcel where alchemica is being channeled from
  /// @param _gotchiId Identifier of parent ERC721 aavegotchi which alchemica is channeled to
  /// @param _lastChanneled The last time alchemica was channeled in this _realmId
  /// @param _signature Message signature used for backend validation
  function channelAlchemica(
    uint256 _realmId,
    uint256 _gotchiId,
    uint256 _lastChanneled,
    bytes memory _signature
  ) external onlyParcelOwner(_realmId) onlyGotchiOwner(_gotchiId) {
    require(_lastChanneled == s.gotchiChannelings[_gotchiId], "AlchemicaFacet: Incorrect last duration");

    require(block.timestamp - _lastChanneled >= 1 days, "AlchemicaFacet: Can't channel yet");

    //Use _lastChanneled to ensure that each signature hash is unique
    require(
      LibSignature.isValid(keccak256(abi.encodePacked(_realmId, _gotchiId, _lastChanneled)), _signature, s.backendPubKey),
      "AlchemicaFacet: Invalid signature"
    );

    (uint256 rate, uint radius) = InstallationDiamondInterface(s.installationsDiamond).spilloverRateAndRadiusOfId(s.parcels[_realmId].altarId);

    uint256[4] memory channelAmounts = [uint256(100e18), uint256(50e18), uint256(25e18), uint256(10e18)];

    for (uint256 i; i < channelAmounts.length; i++) {
      AlchemicaToken alchemica = AlchemicaToken(s.alchemicaAddresses[i]);

      //Mint new tokens if the Great Portal Balance is less than capacity

      if (alchemica.balanceOf(address(this)) < s.greatPortalCapacity[i]) {
        TransferAmounts memory amounts = calculateTransferAmounts(channelAmounts[i], rate);

        alchemica.mint(alchemicaRecipient(_gotchiId), amounts.owner);
        alchemica.mint(address(this), amounts.spill);
      } else {
        TransferAmounts memory amounts = calculateTransferAmounts(channelAmounts[i], rate);

        alchemica.transfer(alchemicaRecipient(_gotchiId), amounts.owner);
      }
    }

    //update latest channeling
    s.gotchiChannelings[_gotchiId] = block.timestamp;

    emit ChannelAlchemica(_realmId, _gotchiId, channelAmounts, rate, radius);
  }

  /// @notice Return the last timestamp of a channeling
  /// @dev used as a parameter in channelAlchemica
  /// @param _gotchiId Identifier of parent ERC721 aavegotchi
  /// @return last channeling timestamp
  function getLastChanneled(uint256 _gotchiId) public view returns (uint256) {
    return s.gotchiChannelings[_gotchiId];
  }

  /// @notice Allow the game manager to transfer alchemica to a certain ERC721 parent aavegotchi
  /// @param _alchemica Identifiers of alchemica tokens to transfer
  /// @param _gotchiId Identifier of parent ERC721 aavegotchi which alchemica is transferred to
  /// @param _lastExitTime The last time alchemica was exited/transferred to _gotchiId
  /// @param _signature Message signature used for backend validation
  function exitAlchemica(
    uint256[] calldata _alchemica,
    uint256 _gotchiId,
    uint256 _lastExitTime,
    bytes memory _signature
  ) external onlyGameManager {
    require(_alchemica.length == 4, "AlchemicaFacet: Incorrect length");

    require(_lastExitTime == s.lastExitTime[_gotchiId], "AlchemicsFacet: Wrong last exit");

    //lastExitTime ensures hash is unique every time
    bytes32 messageHash = keccak256(abi.encodePacked(_alchemica[0], _alchemica[1], _alchemica[2], _alchemica[3], _lastExitTime, _gotchiId));
    require(LibSignature.isValid(messageHash, _signature, s.backendPubKey), "AlchemicaFacet: Invalid signature");

    for (uint256 i = 0; i < _alchemica.length; i++) {
      AlchemicaToken alchemica = AlchemicaToken(s.alchemicaAddresses[i]);
      alchemica.transfer(alchemicaRecipient(_gotchiId), _alchemica[i]);
    }

    emit ExitAlchemica(_gotchiId, _alchemica);
  }

  /// @notice Helper function to batch transfer alchemica
  /// @param _targets Array of target addresses
  /// @param _amounts Nested array of amounts to transfer. 
  /// @dev The inner array element order for _amounts is FUD, FOMO, ALPHA, KEK
  function batchTransferAlchemica(address[] calldata _targets, uint256[4][] calldata _amounts) external {
    require(_targets.length == _amounts.length, "AlchemicaFacet: Mismatched array lengths");
    for(uint i = 0; i < _targets.length; i++) {
      for(uint j = 0; j < _amounts[i].length; j++) {
        AlchemicaToken alchemica = AlchemicaToken(s.alchemicaAddresses[j]);
        alchemica.transferFrom(msg.sender, _targets[i], _amounts[i][j]);
      }
    }
  }
}

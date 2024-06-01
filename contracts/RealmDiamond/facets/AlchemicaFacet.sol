// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";
import "./RealmFacet.sol";
import "../../libraries/LibRealm.sol";
import "../../libraries/LibMeta.sol";
import "@api3/airnode-protocol/contracts/rrp/interfaces/IAirnodeRrpV0.sol";
//import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "../../libraries/LibAlchemica.sol";
import "../../libraries/LibSignature.sol";
import {IERC20Extended} from "../../interfaces/IERC20Extended.sol";

uint256 constant bp = 100 ether;

contract AlchemicaFacet is Modifiers {
  event StartSurveying(uint256 _realmId, uint256 _round);

  event ChannelAlchemica(
    uint256 indexed _realmId,
    uint256 indexed _gotchiId,
    uint256[4] _alchemica,
    uint256 _spilloverRate,
    uint256 _spilloverRadius
  );

  event ExitAlchemica(uint256 indexed _gotchiId, uint256[] _alchemica);

  event SurveyingRoundProgressed(uint256 indexed _newRound);

  event TransferTokensToGotchi(address indexed _sender, uint256 indexed _gotchiId, address _tokenAddresses, uint256 _amount);

  error ERC20TransferFailed(string _tokenName);

  function isSurveying(uint256 _realmId) external view returns (bool) {
    return s.parcels[_realmId].surveying;
  }

  // /// @notice Allow the owner of a parcel to start surveying his parcel
  // /// @dev Will throw if a surveying round has not started
  // /// @param _realmId Identifier of the parcel to survey
  function startSurveying(uint256 _realmId) external onlyParcelOwner(_realmId) gameActive {
    //current round and surveying round both begin at 0.
    //after calling VRF, currentRound increases
    require(s.parcels[_realmId].currentRound <= s.surveyingRound, "AlchemicaFacet: Round not released");
    require(s.parcels[_realmId].altarId > 0, "AlchemicaFacet: Must equip Altar");
    require(!s.parcels[_realmId].surveying, "AlchemicaFacet: Parcel already surveying");
    s.parcels[_realmId].surveying = true;
    // do we need to cancel the listing?
    drawRandomNumbers(_realmId, s.parcels[_realmId].currentRound);

    emit StartSurveying(_realmId, s.parcels[_realmId].currentRound);
  }

//  function testApi3Qrng() external {
//    bytes32 requestId = IAirnodeRrpV0(s.api3AirnodeRrp).makeFullRequest(
//      s.api3QrngConfig.airnode,
//      s.api3QrngConfig.endpointId,
//      s.api3QrngConfig.sponsor,
//      s.api3QrngConfig.sponsorWallet,
//      address(this),
//      bytes4(keccak256("testApi3FulfillRandomWords(bytes32,bytes)")),
//      abi.encode(bytes32("1u"), bytes32("size"), s.api3QrngConfig.numWords)
//    );
//  }
//
//  function testChainlink() external {
//    uint256 requestId = VRFCoordinatorV2Interface(s.vrfCoordinator).requestRandomWords(
//      s.requestConfig.keyHash,
//      s.requestConfig.subId,
//      s.requestConfig.requestConfirmations,
//      s.requestConfig.callbackGasLimit,
//      s.requestConfig.numWords
//    );
//  }

  function drawRandomNumbers(uint256 _realmId, uint256 _surveyingRound) internal {
    bytes32 requestId = IAirnodeRrpV0(s.api3AirnodeRrp).makeFullRequest(
      s.api3QrngConfig.airnode,
      s.api3QrngConfig.endpointId,
      s.api3QrngConfig.sponsor,
      s.api3QrngConfig.sponsorWallet,
      address(this),
      bytes4(keccak256("api3FulfillRandomWords(bytes32,bytes)")),
      abi.encode(bytes32("1u"), bytes32("size"), s.api3QrngConfig.numWords)
    );
    s.api3QrngRequestIdToTokenId[requestId] = _realmId;
    s.api3QrngRequestIdToSurveyingRound[requestId] = _surveyingRound;
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

  /// @notice Query details about the remaining alchemica in a parcel
  /// @param _realmId The identifier of the parcel to query
  /// @return output_ An array containing details about each remaining alchemica in the parcel
  function getParcelCurrentRound(uint256 _realmId) external view returns (uint256) {
    return s.parcels[_realmId].currentRound;
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
    address _gltrAddress,
    bytes memory _backendPubKey,
    address _gameManager,
    address _tileDiamond,
    address _aavegotchiDiamond
  ) external onlyOwner {
    for (uint256 i; i < _alchemicas.length; i++) {
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
    s.gltrAddress = _gltrAddress;
    s.tileDiamond = _tileDiamond;
    s.aavegotchiDiamond = _aavegotchiDiamond;
  }

  function setTotalAlchemicas(uint256[4][5] calldata _totalAlchemicas) external onlyOwner {
    for (uint256 i; i < _totalAlchemicas.length; i++) {
      for (uint256 j; j < _totalAlchemicas[i].length; j++) {
        s.totalAlchemicas[i][j] = _totalAlchemicas[i][j];
      }
    }
  }

  /// @notice Query the available alchemica in a parcel
  /// @param _realmId identifier of parcel to query
  /// @return _availableAlchemica An array representing the available quantity of alchemicas
  function getAvailableAlchemica(uint256 _realmId) public view returns (uint256[4] memory _availableAlchemica) {
    for (uint256 i; i < 4; i++) {
      _availableAlchemica[i] = LibAlchemica.getAvailableAlchemica(_realmId, i);
    }
  }

  struct TransferAmounts {
    uint256 owner;
    uint256 spill;
  }

  function calculateTransferAmounts(uint256 _amount, uint256 _spilloverRate) internal pure returns (TransferAmounts memory) {
    uint256 owner = (_amount * (bp - (_spilloverRate * 10 ** 16))) / bp;
    uint256 spill = (_amount * (_spilloverRate * 10 ** 16)) / bp;
    return TransferAmounts(owner, spill);
  }

  function lastClaimedAlchemica(uint256 _realmId) external view returns (uint256) {
    return s.lastClaimedAlchemica[_realmId];
  }

  /// @notice Allow parcel owner to claim available alchemica with his parent NFT(Aavegotchi)
  /// @param _realmId Identifier of parcel to claim alchemica from
  /// @param _gotchiId Identifier of Aavegotchi to use for alchemica collecction/claiming
  /// @param _signature Message signature used for backend validation
  function claimAvailableAlchemica(uint256 _realmId, uint256 _gotchiId, bytes memory _signature) external gameActive {
    //Check signature
    require(
      LibSignature.isValid(keccak256(abi.encode(_realmId, _gotchiId, s.lastClaimedAlchemica[_realmId])), _signature, s.backendPubKey),
      "AlchemicaFacet: Invalid signature"
    );

    //1 - Empty Reservoir Access Right
    LibRealm.verifyAccessRight(_realmId, _gotchiId, 1, LibMeta.msgSender());
    LibAlchemica.claimAvailableAlchemica(_realmId, _gotchiId);
  }

  function getHarvestRates(uint256 _realmId) external view returns (uint256[] memory harvestRates) {
    harvestRates = new uint256[](4);
    for (uint256 i; i < 4; i++) {
      harvestRates[i] = s.parcels[_realmId].alchemicaHarvestRate[i];
    }
  }

  function getCapacities(uint256 _realmId) external view returns (uint256[] memory capacities) {
    capacities = new uint256[](4);
    for (uint256 i; i < 4; i++) {
      capacities[i] = LibAlchemica.calculateTotalCapacity(_realmId, i);
    }
  }

  function getTotalClaimed(uint256 _realmId) external view returns (uint256[] memory totalClaimed) {
    totalClaimed = new uint256[](4);
    for (uint256 i; i < 4; i++) {
      totalClaimed[i] = LibAlchemica.getTotalClaimed(_realmId, i);
    }
  }

  /// @notice Allow a parcel owner to channel alchemica
  /// @dev This transfers alchemica to the parent ERC721 token with id _gotchiId and also to the great portal
  /// @param _realmId Identifier of parcel where alchemica is being channeled from
  /// @param _gotchiId Identifier of parent ERC721 aavegotchi which alchemica is channeled to
  /// @param _lastChanneled The last time alchemica was channeled in this _realmId
  /// @param _signature Message signature used for backend validation
  function channelAlchemica(uint256 _realmId, uint256 _gotchiId, uint256 _lastChanneled, bytes memory _signature) external gameActive {
    AavegotchiDiamond diamond = AavegotchiDiamond(s.aavegotchiDiamond);

    //gotchi CANNOT have active listing for lending
    require(
      !diamond.isAavegotchiListed(uint32(_gotchiId)) || diamond.isAavegotchiLent(uint32(_gotchiId)),
      "AavegotchiDiamond: Gotchi CANNOT have active listing for lending"
    );

    //finally interact while reducing kinship
    diamond.reduceKinshipViaChanneling(uint32(_gotchiId));

    //0 - alchemical channeling
    LibRealm.verifyAccessRight(_realmId, _gotchiId, 0, LibMeta.msgSender());

    require(_lastChanneled == s.gotchiChannelings[_gotchiId], "AlchemicaFacet: Incorrect last duration");

    //Gotchis can only channel every 24 hrs
    if (s.lastChanneledDay[_gotchiId] == block.timestamp / (60 * 60 * 24)) revert("AlchemicaFacet: Gotchi can't channel yet");
    s.lastChanneledDay[_gotchiId] = block.timestamp / (60 * 60 * 24);

    uint256 altarLevel = InstallationDiamondInterface(s.installationsDiamond).getAltarLevel(s.parcels[_realmId].altarId);

    require(altarLevel > 0, "AlchemicaFacet: Must equip Altar");

    //How often Altars can channel depends on their level
    require(block.timestamp >= s.parcelChannelings[_realmId] + s.channelingLimits[altarLevel], "AlchemicaFacet: Parcel can't channel yet");

    //Use _lastChanneled to ensure that each signature hash is unique
    require(
      LibSignature.isValid(keccak256(abi.encodePacked(_realmId, _gotchiId, _lastChanneled)), _signature, s.backendPubKey),
      "AlchemicaFacet: Invalid signature"
    );

    (uint256 rate, uint256 radius) = InstallationDiamondInterface(s.installationsDiamond).spilloverRateAndRadiusOfId(s.parcels[_realmId].altarId);

    require(rate > 0, "InstallationFacet: Spillover Rate cannot be 0");

    uint256[4] memory channelAmounts = [uint256(20e18), uint256(10e18), uint256(5e18), uint256(2e18)];
    // apply kinship modifier
    uint256 kinship = diamond.kinship(_gotchiId) * 10000;
    for (uint256 i; i < 4; i++) {
      uint256 kinshipModifier = floorSqrt(kinship / 50);
      channelAmounts[i] = (channelAmounts[i] * kinshipModifier) / 100;
    }

    for (uint256 i; i < channelAmounts.length; i++) {
      IERC20Mintable alchemica = IERC20Mintable(s.alchemicaAddresses[i]);

      //Mint new tokens if the Great Portal Balance is less than capacity

      if (alchemica.balanceOf(address(this)) < s.greatPortalCapacity[i]) {
        TransferAmounts memory amounts = calculateTransferAmounts(channelAmounts[i], rate);

        alchemica.mint(LibAlchemica.alchemicaRecipient(_gotchiId), amounts.owner);
        alchemica.mint(address(this), amounts.spill);
      } else {
        TransferAmounts memory amounts = calculateTransferAmounts(channelAmounts[i], rate);

        alchemica.transfer(LibAlchemica.alchemicaRecipient(_gotchiId), amounts.owner);
      }
    }

    //update latest channeling
    s.gotchiChannelings[_gotchiId] = block.timestamp;
    s.parcelChannelings[_realmId] = block.timestamp;

    emit ChannelAlchemica(_realmId, _gotchiId, channelAmounts, rate, radius);
  }

  /// @notice Return the last timestamp of a channeling
  /// @dev used as a parameter in channelAlchemica
  /// @param _gotchiId Identifier of parent ERC721 aavegotchi
  /// @return last channeling timestamp
  function getLastChanneled(uint256 _gotchiId) public view returns (uint256) {
    return s.gotchiChannelings[_gotchiId];
  }

  /// @notice Return the last timestamp of an altar channeling
  /// @dev used as a parameter in channelAlchemica
  /// @param _parcelId Identifier of ERC721 parcel
  /// @return last channeling timestamp
  function getParcelLastChanneled(uint256 _parcelId) public view returns (uint256) {
    return s.parcelChannelings[_parcelId];
  }

  /// @notice Helper function to batch transfer alchemica
  /// @param _targets Array of target addresses
  /// @param _amounts Nested array of amounts to transfer.
  /// @dev The inner array element order for _amounts is FUD, FOMO, ALPHA, KEK
  function batchTransferAlchemica(address[] calldata _targets, uint256[4][] calldata _amounts) external {
    require(_targets.length == _amounts.length, "AlchemicaFacet: Mismatched array lengths");

    IERC20Mintable[4] memory alchemicas = [
      IERC20Mintable(s.alchemicaAddresses[0]),
      IERC20Mintable(s.alchemicaAddresses[1]),
      IERC20Mintable(s.alchemicaAddresses[2]),
      IERC20Mintable(s.alchemicaAddresses[3])
    ];

    for (uint256 i = 0; i < _targets.length; i++) {
      for (uint256 j = 0; j < _amounts[i].length; j++) {
        if (_amounts[i][j] > 0) {
          alchemicas[j].transferFrom(msg.sender, _targets[i], _amounts[i][j]);
        }
      }
    }
  }

  /// @notice Helper function to batch transfer alchemica to Aavegotchis
  /// @param _gotchiIds Array of Gotchi IDs
  /// @param _tokenAddresses Array of tokens to transfer
  /// @param _amounts Nested array of amounts to transfer.
  function batchTransferTokensToGotchis(uint256[] calldata _gotchiIds, address[] calldata _tokenAddresses, uint256[][] calldata _amounts) external {
    require(_gotchiIds.length == _amounts.length, "AlchemicaFacet: Mismatched array lengths");

    for (uint256 i = 0; i < _gotchiIds.length; i++) {
      for (uint256 j = 0; j < _amounts[i].length; j++) {
        require(_tokenAddresses.length == _amounts[i].length, "RealmFacet: Mismatched array lengths");
        uint256 amount = _amounts[i][j];
        if (amount > 0) {
          IERC20(_tokenAddresses[j]).transferFrom(msg.sender, LibAlchemica.alchemicaRecipient(_gotchiIds[i]), amount);
          emit TransferTokensToGotchi(msg.sender, _gotchiIds[i], _tokenAddresses[j], amount);
        }
      }
    }
  }

  /// @notice Owner function to change the altars channeling limits
  /// @param _altarLevel Array of altars level
  /// @param _limits Array of time limits
  function setChannelingLimits(uint256[] calldata _altarLevel, uint256[] calldata _limits) external onlyOwner {
    require(_altarLevel.length == _limits.length, "AlchemicaFacet: array mismatch");
    for (uint256 i; i < _limits.length; i++) {
      s.channelingLimits[_altarLevel[i]] = _limits[i];
    }
  }

  /// @notice Calculate the floor square root of a number
  /// @param n Input number
  function floorSqrt(uint256 n) internal pure returns (uint256) {
    unchecked {
      if (n > 0) {
        uint256 x = n / 2 + 1;
        uint256 y = (x + n / x) / 2;
        while (x > y) {
          x = y;
          y = (x + n / x) / 2;
        }
        return x;
      }
      return 0;
    }
  }

  function _batchTransferTokens(address[] memory _tokens, uint256[] memory _amounts, address _to) internal {
    require(_tokens.length == _amounts.length, "Array legth mismatch");
    require(_to != address(0), "Address Zero Transfer");
    for (uint256 i; i < _tokens.length; i++) {
      address token = _tokens[i];
      uint256 amount = _amounts[i];
      bool success;
      try IERC20(token).transferFrom(msg.sender, _to, amount) {
        success;
      } catch {
        if (!success) {
          revert ERC20TransferFailed(IERC20Extended(token).name());
        }
      }
    }
  }

  function batchTransferTokens(address[][] calldata _tokens, uint256[][] calldata _amounts, address[] calldata _to) external {
    require(_tokens.length == _amounts.length, "Array length mismatch");
    require(_to.length == _amounts.length, "Array length mismatch");
    for (uint256 i; i < _to.length; i++) {
      _batchTransferTokens(_tokens[i], _amounts[i], _to[i]);
    }
  }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../libraries/AppStorage.sol";
import "./RealmFacet.sol";
import "../libraries/LibRealm.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

contract AlchemicaFacet is Modifiers {
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
    address _linkAddress
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

  //Parcel starts out with 0 harvest rate
  //Player equips harvester, harvest rate begins increasing
  //Available alchemica will always be 0 if reservoir has not been added
  //Once player has equipped a reservoir, the harvested amount will increase until it has reached the capacity.
  //When a player claims the alchemica, the timeSinceLastUpdate is reset to 0, which means the harvested amount is also set back to zero. This prevents the reservoir from immediately refilling after a claim.

  function alchemicaSinceLastUpdate(uint256 _tokenId, uint256 _alchemicaType) internal view returns (uint256) {
    return s.parcels[_tokenId].alchemicaHarvestRate[_alchemicaType] * s.parcels[_tokenId].timeSinceLastUpdate[_alchemicaType];
  }

  function settleUnclaimedAlchemica(uint256 _tokenId, uint256 _alchemicaType) internal {
    //todo: check capacity
    uint256 capacity = s.parcels[_tokenId].reservoirCapacity[_alchemicaType];

    if (alchemicaSinceLastUpdate > capacity) {
      s.parcels[_tokenId].unclaimedAlchemica[_alchemicaType] = capacity;
    } else {
      s.parcels[_tokenId].unclaimedAlchemica[_alchemicaType] += alchemicaSinceLastUpdate(_tokenId, _alchemicaType);
    }

    s.parcels[_tokenId].timeSinceLastUpdate[_alchemicaType] = 0;
  }

  function getAvailableAlchemica(uint256 _tokenId) public view returns (uint256[4] memory _availableAlchemica) {
    //Calculate the # of blocks elapsed since the last

    for (uint256 index = 0; index < 4; index++) {
      //First get the onchain amount
      uint256 available = s.parcels[_tokenId].unclaimedAlchemica[index];

      //Then get the floating amount
      available += alchemicaSinceLastUpdate(_tokenId, index);

      uint256 capacity = s.parcels[_tokenId].reservoirCapacity[index];

      //@todo: ensure that available alchemica is not higher than available reservoir capacity
      if (available > capacity) _availableAlchemica[index] = capacity;
      else _availableAlchemica[index] = available;
    }
  }

  function claimAvailableAlchemica(uint256 _tokenId, uint256 _alchemicaType) external {
    uint256 available = getAvailableAlchemica(_tokenId)[_alchemicaType];

    uint256 remaining = s.parcels[_tokenId].alchemicaRemaining[_alchemicaType];

    require(remaining >= available, "AlchemicaFacet: Not enough alchemica available");

    s.parcels[_tokenId].alchemicaRemaining[_alchemicaType] -= available;

    s.parcels[_tokenId].timeSinceLastUpdate[_alchemicaType] = 0;
  }

  function increaseTraits(uint256 _realmId, uint256 _installationId) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();

    //todo: First save the current harvested amount

    InstallationDiamond.InstallationType memory installationType = InstallationDiamond(s.installationsDiamond).getInstallationType(_installationId);

    uint256 alchemicaType = installationType.alchemicaType;

    //unclaimed alchemica must be settled before mutating harvestRate and capacity
    settleUnclaimedAlchemica(_realmId, alchemicaType);

    //handle harvester
    if (installationType.harvestRate > 0) {
      s.parcels[_realmId].alchemicaHarvestRate[installationType.alchemicaType] += installationType.harvestRate;
    }

    //reservoir
    if (installationType.capacity > 0) {
      s.parcels[_realmId].reservoirCapacity[installationType.alchemicaType] += installationType.capacity;
    }
  }

  function reduceTraits(uint256 _realmId, uint256 _installationId) internal {
    AppStorage storage s = LibAppStorage.diamondStorage();

    InstallationDiamond.InstallationType memory installationType = InstallationDiamond(s.installationsDiamond).getInstallationType(_installationId);

    uint256 alchemicaType = installationType.alchemicaType;

    //unclaimed alchemica must be settled before mutating harvestRate and capacity
    settleUnclaimedAlchemica(_realmId, alchemicaType);

    if (installationType.harvestRate > 0) {
      s.parcels[_realmId].alchemicaHarvestRate[installationType.alchemicaType] -= installationType.harvestRate;
    }

    if (installationType.capacity > 0) {
      //@todo: handle the case where a user has more harvested than reservoir capacity after the update

      //todo: solution 1: revert until user has claimed
      //todo: solution 2: claim for user and then unequip

      s.parcels[_realmId].reservoirCapacity[installationType.alchemicaType] -= installationType.capacity;
    }
  }
}

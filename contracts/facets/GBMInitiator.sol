// SPDX-License-Identifier: UNLICENSED
// © Copyright 2021. Patent pending. All rights reserved. Perpetual Altruism Ltd.
pragma solidity 0.8.5;

import "../interfaces/IGBMInitiator.sol";
import "../libraries/AppStorage.sol";
import "../libraries/LibDiamond.sol";

/// @title GBM auction contract Initiator
/// @dev Implementation of IGBM. Feel free to cook up your own implementation for more complex patterns.
/// @author Guillaume Gonnaud
contract GBMInitiator is IGBMInitiator {
    AppStorage internal s;

    // To future developpers: All the getters are called AFTER the auction ID has been generated and hence you can lookup
    // token_ID/Token contract/token kind using the main GBM contract getters(auctionId) if you want to return determinstic values

    uint256 internal startTime; // _auctionId => timestamp
    uint256 internal endTime; // _auctionId => timestamp
    uint256 internal hammerTimeDuration; // _auctionId => duration in seconds
    uint256 internal bidDecimals; // _auctionId => bidDecimals
    uint256 internal stepMin; // _auctionId => stepMin
    uint256 internal incMin; // _auctionId => minimal earned incentives
    uint256 internal incMax; // _auctionId => maximal earned incentives
    uint256 internal bidMultiplier; // _auctionId => bid incentive growth multiplier

    uint256 internal floorPrice;

    constructor(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _hammerTimeDuration,
        uint256 _bidDecimals,
        uint256 _stepMin,
        uint256 _incMin,
        uint256 _incMax,
        uint256 _bidMultiplier,
        uint256 _floorPrice
    ) {
        s.initiatorInfo.startTime = _startTime;
        s.initiatorInfo.endTime = _endTime;
        s.initiatorInfo.hammerTimeDuration = _hammerTimeDuration;
        s.initiatorInfo.bidDecimals = _bidDecimals;
        s.initiatorInfo.stepMin = _stepMin;
        s.initiatorInfo.incMin = _incMin;
        s.initiatorInfo.incMax = _incMax;
        s.initiatorInfo.bidMultiplier = _bidMultiplier;
        s.initiatorInfo.floorPrice = _floorPrice;
    }

    function getInitiatorInfo() external view returns (InitiatorInfo memory) {
        return s.initiatorInfo;
    }

    function getStartTime(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return s.initiatorInfo.startTime;
    }

    function getEndTime(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return s.initiatorInfo.endTime;
    }

    function getHammerTimeDuration(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return s.initiatorInfo.hammerTimeDuration;
    }

    function getBidDecimals(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return s.initiatorInfo.bidDecimals;
    }

    function getStepMin(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return s.initiatorInfo.stepMin;
    }

    function getIncMin(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return s.initiatorInfo.incMin;
    }

    function getIncMax(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return s.initiatorInfo.incMax;
    }

    function getBidMultiplier(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return s.initiatorInfo.bidMultiplier;
    }

    function getFloorPrice(uint256) external view override returns (uint256) {
        return s.initiatorInfo.floorPrice;
    }

    function setStartTime(uint256 _startTime) external {
        LibDiamond.enforceIsContractOwner();
        s.initiatorInfo.startTime = _startTime;
    }

    function setEndTime(uint256 _endTime) external {
        LibDiamond.enforceIsContractOwner();
        s.initiatorInfo.endTime = _endTime;
    }

    function setHammerTimeDuration(uint256 _hammerTimeDuration) external {
        LibDiamond.enforceIsContractOwner();
        s.initiatorInfo.hammerTimeDuration = _hammerTimeDuration;
    }

    function setBidDecimals(uint256 _bidDecimals) external {
        LibDiamond.enforceIsContractOwner();
        s.initiatorInfo.bidDecimals = _bidDecimals;
    }

    function setStepMin(uint256 _stepMin) external {
        LibDiamond.enforceIsContractOwner();
        s.initiatorInfo.stepMin = _stepMin;
    }

    function setIncMin(uint256 _incMin) external {
        LibDiamond.enforceIsContractOwner();
        s.initiatorInfo.incMin = _incMin;
    }

    function setIncMax(uint256 _incMax) external {
        LibDiamond.enforceIsContractOwner();
        s.initiatorInfo.incMax = _incMax;
    }

    function setBidMultiplier(uint256 _bidMultiplier) external {
        LibDiamond.enforceIsContractOwner();
        s.initiatorInfo.bidMultiplier = _bidMultiplier;
    }

    function setFloorPrice(uint256 _floorPrice) external {
        LibDiamond.enforceIsContractOwner();
        s.initiatorInfo.floorPrice = _floorPrice;
    }
}

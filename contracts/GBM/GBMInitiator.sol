// SPDX-License-Identifier: UNLICENSED
// © Copyright 2021. Patent pending. All rights reserved. Perpetual Altruism Ltd.
pragma solidity 0.8.5;

import "../interfaces/IGBMInitiator.sol";

/// @title GBM auction contract Initiator
/// @dev Implementation of IGBM. Feel free to cook up your own implementation for more complex patterns.
/// @author Guillaume Gonnaud
contract GBMInitiator is IGBMInitiator {
    // To future developpers: All the getters are called AFTER the auction ID has been generated and hence you can lookup
    // token_ID/Token contract/token kind using the main GBM contract getters(auctionId) if you want to return determinstic values

    address public owner;

    uint256 internal startTime; // _auctionId => timestamp
    uint256 internal endTime; // _auctionId => timestamp
    uint256 internal hammerTimeDuration; // _auctionId => duration in seconds
    uint256 internal bidDecimals; // _auctionId => bidDecimals
    uint256 internal stepMin; // _auctionId => stepMin
    uint256 internal incMin; // _auctionId => minimal earned incentives
    uint256 internal incMax; // _auctionId => maximal earned incentives
    uint256 internal bidMultiplier; // _auctionId => bid incentive growth multiplier

    uint256 internal priceFloor;

    /* event InitiatorCreated(address _owner);
    event StartTimeSet(uint256 _startTime);
    event EndTimeSet(uint256 _endTime);
    event HammerTimeSet(uint256 _hammerTimeDuration);
    event BidDecimalsSet(uint256 _bidDecimals);
    event StepMinSet(uint256 _stepMin);
    event IncMinSet(uint256 _incMin);
    event IncMaxSet(uint256 _incMax);
    event BidMultiplierSet(uint256 _bidMultiplier);
    */

    modifier onlyOwner() {
        require(owner == msg.sender, "Initiator: Must be owner");
        _;
    }

    constructor(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _hammerTimeDuration,
        uint256 _bidDecimals,
        uint256 _stepMin,
        uint256 _incMin,
        uint256 _incMax,
        uint256 _bidMultiplier,
        uint256 _priceFloor
    ) {
        owner = msg.sender;
        startTime = _startTime;
        endTime = _endTime;
        hammerTimeDuration = _hammerTimeDuration;
        bidDecimals = _bidDecimals;
        stepMin = _stepMin;
        incMin = _incMin;
        incMax = _incMax;
        bidMultiplier = _bidMultiplier;
        priceFloor = _priceFloor;
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
        uint256 priceFloor;
    }

    function getInitiatorInfo() external view returns (InitiatorInfo memory info_) {
        info_.startTime = startTime;
        info_.endTime = endTime;
        info_.hammerTimeDuration = hammerTimeDuration;
        info_.bidDecimals = bidDecimals;
        info_.stepMin = stepMin;
        info_.incMin = incMin;
        info_.incMax = incMax;
        info_.bidMultiplier = bidMultiplier;
        info_.priceFloor = priceFloor;
    }

    function getOwner() external view returns (address) {
        return owner;
    }

    function getStartTime(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return (startTime);
    }

    function getEndTime(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return (endTime);
    }

    function getHammerTimeDuration(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return (hammerTimeDuration);
    }

    function getBidDecimals(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return (bidDecimals);
    }

    function getStepMin(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return (stepMin);
    }

    function getIncMin(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return (incMin);
    }

    function getIncMax(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return (incMax);
    }

    function getBidMultiplier(
        uint256 /* _auctionId */
    ) external view override returns (uint256) {
        return (bidMultiplier);
    }

    function getPriceFloor(uint256) external view override returns (uint256) {
        return (priceFloor);
    }

    function setStartTime(uint256 _startTime) external onlyOwner {
        startTime = _startTime;
    }

    function setEndTime(uint256 _endTime) external onlyOwner {
        endTime = _endTime;
    }

    function setHammerTimeDuration(uint256 _hammerTimeDuration) external onlyOwner {
        hammerTimeDuration = _hammerTimeDuration;
    }

    function setBidDecimals(uint256 _bidDecimals) external onlyOwner {
        bidDecimals = _bidDecimals;
    }

    function setStepMin(uint256 _stepMin) external onlyOwner {
        stepMin = _stepMin;
    }

    function setIncMin(uint256 _incMin) external onlyOwner {
        incMin = _incMin;
    }

    function setIncMax(uint256 _incMax) external onlyOwner {
        incMax = _incMax;
    }

    function setBidMultiplier(uint256 _bidMultiplier) external onlyOwner {
        bidMultiplier = _bidMultiplier;
    }

    function setPriceFloor(uint256 _priceFloor) external onlyOwner {
        priceFloor = _priceFloor;
    }
}

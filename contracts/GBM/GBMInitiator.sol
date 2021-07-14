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

    uint256 internal auction_startTime; // _auctionID => timestamp
    uint256 internal auction_endTime; // _auctionID => timestamp
    uint256 internal auction_hammerTimeDuration; // _auctionID => duration in seconds
    uint256 internal auction_bidDecimals; // _auctionID => bidDecimals
    uint256 internal auction_stepMin; // _auctionID => stepMin
    uint256 internal auction_incMin; // _auctionID => minimal earned incentives
    uint256 internal auction_incMax; // _auctionID => maximal earned incentives
    uint256 internal auction_bidMultiplier; // _auctionID => bid incentive growth multiplier

    uint256 internal auction_priceFloor;

    /* event InitiatorCreated(address _owner);
    event StartTimeSet(uint256 _auction_startTime);
    event EndTimeSet(uint256 _auction_endTime);
    event HammerTimeSet(uint256 _auction_hammerTimeDuration);
    event BidDecimalsSet(uint256 _auction_bidDecimals);
    event StepMinSet(uint256 _auction_stepMin);
    event IncMinSet(uint256 _auction_incMin);
    event IncMaxSet(uint256 _auction_incMax);
    event BidMultiplierSet(uint256 _auction_bidMultiplier);
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
        auction_startTime = _startTime;
        auction_endTime = _endTime;
        auction_hammerTimeDuration = _hammerTimeDuration;
        auction_bidDecimals = _bidDecimals;
        auction_stepMin = _stepMin;
        auction_incMin = _incMin;
        auction_incMax = _incMax;
        auction_bidMultiplier = _bidMultiplier;
        auction_priceFloor = _priceFloor;
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
        info_.startTime = auction_startTime;
        info_.endTime = auction_endTime;
        info_.hammerTimeDuration = auction_hammerTimeDuration;
        info_.bidDecimals = auction_bidDecimals;
        info_.stepMin = auction_stepMin;
        info_.incMin = auction_incMin;
        info_.incMax = auction_incMax;
        info_.bidMultiplier = auction_bidMultiplier;
        info_.priceFloor = auction_priceFloor;
    }

    function getOwner() external view returns (address) {
        return owner;
    }

    function getStartTime(
        uint256 /* _auctionID */
    ) external view override returns (uint256) {
        return (auction_startTime);
    }

    function getEndTime(
        uint256 /* _auctionID */
    ) external view override returns (uint256) {
        return (auction_endTime);
    }

    function getHammerTimeDuration(
        uint256 /* _auctionID */
    ) external view override returns (uint256) {
        return (auction_hammerTimeDuration);
    }

    function getBidDecimals(
        uint256 /* _auctionID */
    ) external view override returns (uint256) {
        return (auction_bidDecimals);
    }

    function getStepMin(
        uint256 /* _auctionID */
    ) external view override returns (uint256) {
        return (auction_stepMin);
    }

    function getIncMin(
        uint256 /* _auctionID */
    ) external view override returns (uint256) {
        return (auction_incMin);
    }

    function getIncMax(
        uint256 /* _auctionID */
    ) external view override returns (uint256) {
        return (auction_incMax);
    }

    function getBidMultiplier(
        uint256 /* _auctionID */
    ) external view override returns (uint256) {
        return (auction_bidMultiplier);
    }

    function getPriceFloor(uint256) external view override returns (uint256) {
        return (auction_priceFloor);
    }

    function setStartTime(uint256 _auction_startTime) external onlyOwner {
        auction_startTime = _auction_startTime;
    }

    function setEndTime(uint256 _auction_endTime) external onlyOwner {
        auction_endTime = _auction_endTime;
    }

    function setHammerTimeDuration(uint256 _auction_hammerTimeDuration) external onlyOwner {
        auction_hammerTimeDuration = _auction_hammerTimeDuration;
    }

    function setBidDecimals(uint256 _auction_bidDecimals) external onlyOwner {
        auction_bidDecimals = _auction_bidDecimals;
    }

    function setStepMin(uint256 _auction_stepMin) external onlyOwner {
        auction_stepMin = _auction_stepMin;
    }

    function setIncMin(uint256 _auction_incMin) external onlyOwner {
        auction_incMin = _auction_incMin;
    }

    function setIncMax(uint256 _auction_incMax) external onlyOwner {
        auction_incMax = _auction_incMax;
    }

    function setBidMultiplier(uint256 _auction_bidMultiplier) external onlyOwner {
        auction_bidMultiplier = _auction_bidMultiplier;
    }

    function setPriceFloor(uint256 _auction_priceFloor) external onlyOwner {
        auction_priceFloor = _auction_priceFloor;
    }
}

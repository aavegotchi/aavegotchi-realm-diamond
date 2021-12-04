// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
/******************************************************************************/

interface InstallationDiamond {
  struct InstallationType {
    uint16 installationType; //0 = harvester, 1 = reservoir, 2 = altar, 3 = gotchi lodge
    uint16 level;
    uint256 width;
    uint256 height;
    uint16 alchemicaType; //0 = none 1 = fud, 2 = fomo, 3 = alpha, 4 = kek
    uint256[] alchemicaCost; // [fud, fomo, alpha, kek]
    uint256 harvestRate;
    uint256 capacity;
    uint256 spillRadius;
    uint256 spillPercentage;
    uint256 craftTime; // in blocks
    // glam token to reduce craftTime
  }

  function setAlchemicaAddresses(address[] memory _addresses) external;

  function craftInstallations(uint256[] calldata _installationTypes) external;

  function claimInstallations(uint256[] calldata _queueIds) external;

  function equipInstallation(
    address _owner,
    uint256 _realmTokenId,
    uint256 _installationId
  ) external;

  function unequipInstallation(uint256 _realmTokenId, uint256 _installationId) external;

  function addInstallationTypes(InstallationType[] calldata _installationTypes) external;

  function getInstallationType(uint256 _itemId) external view returns (InstallationType memory installationType);

  function getInstallationTypes(uint256[] calldata _itemIds) external view returns (InstallationType[] memory itemTypes_);

  function getAlchemicaAddresses() external view returns (address[] memory);

  function balanceOf(address _owner, uint256 _id) external view returns (uint256 bal_);
}

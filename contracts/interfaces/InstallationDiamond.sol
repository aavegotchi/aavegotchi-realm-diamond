// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
/******************************************************************************/

interface InstallationDiamond {
  struct Installation {
    uint64 installationId;
    uint16 installationType; //0 = harvester, 1 = reservoir, 2 = altar, 3 = gotchi lodge
    uint16 level;
    uint256 width;
    uint256 height;
    uint16 alchemicaType;
    uint256 fudCost;
    uint256 fomoCost;
    uint256 alphaCost;
    uint256 kekCost;
    uint256 craftTime;
  }

  struct Harvester {
    uint16 alchemicaType; //0 = none 1 = fud, 2 = fomo, 3 = alpha, 4 = kek
    uint256 harvestRate;
  }

  struct Reservoir {
    uint16 alchemicaType;
    uint256 capacity;
    uint256 spillRadius;
    uint256 spillPercentage;
  }

  function getInstallationType(uint256 _itemId) external view returns (Installation memory installationType);

  function getInstallationTypes(uint256[] calldata _itemIds) external view returns (Installation[] memory itemTypes_);
}

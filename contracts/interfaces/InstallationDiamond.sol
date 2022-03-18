// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
/******************************************************************************/

interface InstallationDiamondInterface {
  struct InstallationType {
    uint256 width;
    uint256 height;
    bool deprecated;
    uint16 installationType; //0 = harvester, 1 = reservoir, 2 = altar, 3 = gotchi lodge, 4 = wall, 5 = NFT display
    uint16 level;
    uint16 alchemicaType; //0 = none 1 = fud, 2 = fomo, 3 = alpha, 4 = kek
    uint256[] alchemicaCost; // [fud, fomo, alpha, kek]
    uint256 harvestRate;
    uint256 capacity;
    uint256 spillRadius;
    uint256 spillRate;
    uint256 upgradeQueueBoost;
    uint256 craftTime; // in blocks
    uint256 nextLevelId; //the ID of the next level of this installation. Used for upgrades.
    uint256[] prerequisites; //IDs of installations that must be present before this installation can be added
  }

  struct UpgradeQueue {
    uint256 parcelId;
    uint256 coordinateX;
    uint256 coordinateY;
    uint256 installationId;
    uint256 readyBlock;
    bool claimed;
    address owner;
  }

  struct InstallationIdIO {
    uint256 installationId;
    uint256 balance;
  }

  function craftInstallations(uint256[] calldata _installationTypes) external;

  function claimInstallations(uint256[] calldata _queueIds) external;

  function equipInstallation(
    address _owner,
    uint256 _realmTokenId,
    uint256 _installationId
  ) external;

  function unequipInstallation(uint256 _realmId, uint256 _installationId) external;

  function addInstallationTypes(InstallationType[] calldata _installationTypes) external;

  function getInstallationType(uint256 _itemId) external view returns (InstallationType memory installationType);

  function getInstallationTypes(uint256[] calldata _itemIds) external view returns (InstallationType[] memory itemTypes_);

  function getAlchemicaAddresses() external view returns (address[] memory);

  function balanceOf(address _owner, uint256 _id) external view returns (uint256 bal_);

  function installationBalancesOfTokenByIds(
    address _tokenContract,
    uint256 _tokenId,
    uint256[] calldata _ids
  ) external view returns (uint256[] memory);

  function spilloverRatesOfIds(uint256[] calldata _ids) external view returns (uint256[] memory);

  function spilloverRadiusOfIds(uint256[] calldata _ids) external view returns (uint256[] memory);

  function upgradeInstallation(UpgradeQueue calldata _upgradeQueue) external;

  function finalizeUpgrade() external;

  function installationsBalances(address _account) external view returns (InstallationIdIO[] memory bals_);

  function spilloverRateOfId(uint256 _id) external view returns (uint256);

  function spilloverRadiusOfId(uint256 _id) external view returns (uint256);

  function spilloverRateAndRadiusOfId(uint256 _id) external view returns (uint256, uint256);

  function getAltarLevel(uint256 _altarId) external view returns (uint256 altarLevel_);

  function getLodgeLevel(uint256 _installationId) external view returns (uint256 lodgeLevel_);
}

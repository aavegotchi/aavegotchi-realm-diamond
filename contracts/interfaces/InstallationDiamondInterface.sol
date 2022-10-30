// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
/******************************************************************************/

interface InstallationDiamondInterface {
  struct InstallationType {
    //slot 1
    uint8 width;
    uint8 height;
    uint16 installationType; //0 = altar, 1 = harvester, 2 = reservoir, 3 = gotchi lodge, 4 = wall, 5 = NFT display, 6 = buildqueue booster
    uint8 level; //max level 9
    uint8 alchemicaType; //0 = none 1 = fud, 2 = fomo, 3 = alpha, 4 = kek
    uint32 spillRadius;
    uint16 spillRate;
    uint8 upgradeQueueBoost;
    uint32 craftTime; // in blocks
    uint32 nextLevelId; //the ID of the next level of this installation. Used for upgrades.
    bool deprecated; //bool
    //slot 2
    uint256[4] alchemicaCost; // [fud, fomo, alpha, kek]
    //slot 3
    uint256 harvestRate;
    //slot 4
    uint256 capacity;
    //slot 5
    uint256[] prerequisites; //IDs of installations that must be present before this installation can be added
    //slot 6
    string name;
  }

  struct UpgradeQueue {
    address owner;
    uint16 coordinateX;
    uint16 coordinateY;
    uint40 readyBlock;
    bool claimed;
    uint256 parcelId;
    uint256 installationId;
  }

  struct InstallationIdIO {
    uint256 installationId;
    uint256 balance;
  }

  struct ReservoirStats {
    uint256 spillRate;
    uint256 spillRadius;
    uint256 capacity;
  }

  function craftInstallations(uint256[] calldata _installationTypes) external;

  function claimInstallations(uint256[] calldata _queueIds) external;

  function equipInstallation(
    address _owner,
    uint256 _realmTokenId,
    uint256 _installationId
  ) external;

  function unequipInstallation(
    address _owner,
    uint256 _realmId,
    uint256 _installationId
  ) external;

  function addInstallationTypes(InstallationType[] calldata _installationTypes) external;

  function getInstallationType(uint256 _itemId) external view returns (InstallationType memory installationType);

  function getInstallationUnequipType(uint256 _installationId) external view returns (uint256);

  function getInstallationTypes(uint256[] calldata _itemIds) external view returns (InstallationType[] memory itemTypes_);

  function getAlchemicaAddresses() external view returns (address[] memory);

  function balanceOf(address _owner, uint256 _id) external view returns (uint256 bal_);

  function balanceOfToken(
    address _tokenContract,
    uint256 _tokenId,
    uint256 _id
  ) external view returns (uint256 value);

  function installationBalancesOfTokenByIds(
    address _tokenContract,
    uint256 _tokenId,
    uint256[] calldata _ids
  ) external view returns (uint256[] memory);

  function installationBalancesOfToken(address _tokenContract, uint256 _tokenId) external view returns (InstallationIdIO[] memory bals_);

  function spilloverRatesOfIds(uint256[] calldata _ids) external view returns (uint256[] memory);

  function upgradeInstallation(UpgradeQueue calldata _upgradeQueue, bytes memory _signature) external;

  function finalizeUpgrade() external;

  function installationsBalances(address _account) external view returns (InstallationIdIO[] memory bals_);

  function spilloverRateAndRadiusOfId(uint256 _id) external view returns (uint256, uint256);

  function getAltarLevel(uint256 _altarId) external view returns (uint256 altarLevel_);

  function getLodgeLevel(uint256 _installationId) external view returns (uint256 lodgeLevel_);

  function getReservoirCapacity(uint256 _installationId) external view returns (uint256 capacity_);

  function getReservoirStats(uint256 _installationId) external view returns (ReservoirStats memory reservoirStats_);

  function parcelQueueEmpty(uint256 _parcelId) external view returns (bool);

  function getParcelUpgradeQueue(uint256 _parcelId) external view returns (UpgradeQueue[] memory output_, uint256[] memory indexes_);

  function parcelInstallationUpgrading(
    uint256 _parcelId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) external view returns (bool);

  function getConsoleDiamond() external view returns (address);

  function getCaartridgeDiamond() external view returns (address);
}

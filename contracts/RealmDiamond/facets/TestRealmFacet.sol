// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../libraries/AppStorage.sol";
import "../../libraries/LibDiamond.sol";
import "../../libraries/LibStrings.sol";
import "../../libraries/LibMeta.sol";
import "../../libraries/LibERC721.sol";
import "../../libraries/LibRealm.sol";
import "../../libraries/LibAlchemica.sol";
import {InstallationDiamondInterface} from "../../interfaces/InstallationDiamondInterface.sol";

contract TestRealmFacet is Modifiers {
  /// @dev Equip installation without signature or owner checks for testing
  function equipInstallationTest(
    uint256 _realmId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y
  ) external {
    InstallationDiamondInterface.InstallationType memory installation = InstallationDiamondInterface(s.installationsDiamond).getInstallationType(
      _installationId
    );

    require(installation.level == 1, "RealmFacet: Can only equip lvl 1");

    if (installation.installationType == 1 || installation.installationType == 2) {
      require(s.parcels[_realmId].currentRound >= 1, "RealmFacet: Must survey before equipping");
    }
    if (installation.installationType == 3) {
      require(s.parcels[_realmId].lodgeId == 0, "RealmFacet: Lodge already equipped");
      s.parcels[_realmId].lodgeId = _installationId;
    }

    LibRealm.placeInstallation(_realmId, _installationId, _x, _y);
    InstallationDiamondInterface(s.installationsDiamond).equipInstallation(msg.sender, _realmId, _installationId);

    LibAlchemica.increaseTraits(_realmId, _installationId, false);
  }

  /// @notice Allow the owner of a parcel to start surveying his parcel
  /// @dev Will throw if a surveying round has not started
  /// @param _realmId Identifier of the parcel to survey
  function startSurveyingTest(uint256 _realmId) external {
    require(s.parcels[_realmId].altarId > 0, "AlchemicaFacet: Must equip Altar");
    require(!s.parcels[_realmId].surveying, "AlchemicaFacet: Parcel already surveying");
    s.parcels[_realmId].surveying = true;
  }

  function rawFulfillRandomWordsTest(
    uint256 tokenId,
    uint256 surveyingRound,
    uint256 seed
  ) external {
    uint256[] memory randomWords = new uint256[](4);
    randomWords[0] = uint256(keccak256(abi.encode(seed)));
    randomWords[1] = uint256(keccak256(abi.encode(randomWords[0])));
    randomWords[2] = uint256(keccak256(abi.encode(randomWords[1])));
    randomWords[3] = uint256(keccak256(abi.encode(randomWords[2])));
    LibRealm.updateRemainingAlchemica(tokenId, randomWords, surveyingRound);
  }

  /// @notice Allow parcel owner to claim available alchemica with his parent NFT(Aavegotchi)
  /// @param _realmId Identifier of parcel to claim alchemica from
  /// @param _gotchiId Identifier of Aavegotchi to use for alchemica collecction/claiming
  function claimAvailableAlchemicaTest(uint256 _realmId, uint256 _gotchiId) external {
    //1 - Empty Reservoir Access Right
    LibRealm.verifyAccessRight(_realmId, _gotchiId, 1);
    LibAlchemica.claimAvailableAlchemica(_realmId, _gotchiId);
  }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../libraries/AppStorage.sol";
import "../libraries/LibRealm.sol";
import "../libraries/LibMeta.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "../libraries/LibAlchemica.sol";
import "../libraries/LibSignature.sol";

uint256 constant bp = 100 ether;

contract TestAlchemicaFacet is Modifiers {
  event ChannelAlchemica(
    uint256 indexed _realmId,
    uint256 indexed _gotchiId,
    uint256[4] _alchemica,
    uint256 _spilloverRate,
    uint256 _spilloverRadius
  );

  struct TransferAmounts {
    uint256 owner;
    uint256 spill;
  }

  /// @notice Allow a parcel owner to channel alchemica
  /// @dev This transfers alchemica to the parent ERC721 token with id _gotchiId and also to the great portal
  /// @param _realmId Identifier of parcel where alchemica is being channeled from
  /// @param _gotchiId Identifier of parent ERC721 aavegotchi which alchemica is channeled to
  /// @param _lastChanneled The last time alchemica was channeled in this _realmId

  function mockChannelAlchemica(uint256 _realmId, uint256 _gotchiId, uint256 _lastChanneled) external gameActive {
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

  function calculateTransferAmounts(uint256 _amount, uint256 _spilloverRate) internal pure returns (TransferAmounts memory) {
    uint256 owner = (_amount * (bp - (_spilloverRate * 10 ** 16))) / bp;
    uint256 spill = (_amount * (_spilloverRate * 10 ** 16)) / bp;
    return TransferAmounts(owner, spill);
  }
}

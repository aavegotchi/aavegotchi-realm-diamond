// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {LibERC20} from "../libraries/LibERC20.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import {LibAppStorageInstallation, InstallationAppStorage} from "../libraries/AppStorageInstallation.sol";

library LibItems {
  function _splitAlchemica(uint256[] memory _alchemicaCost, address[4] memory _alchemicaAddresses) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    //take the required alchemica and split it
    for (uint256 i = 0; i < _alchemicaCost.length; i++) {
      uint256 greatPortal = (_alchemicaCost[i] * 35) / 100;
      uint256 pixelcraftPart = (_alchemicaCost[i] * 30) / 100;
      uint256 aavegotchiDAO = (_alchemicaCost[i] * 30) / 100;
      uint256 burn = (_alchemicaCost[i] * 5) / 100;
      LibERC20.transferFrom(_alchemicaAddresses[i], msg.sender, s.realmDiamond, greatPortal);
      LibERC20.transferFrom(_alchemicaAddresses[i], msg.sender, s.pixelcraft, pixelcraftPart);
      LibERC20.transferFrom(_alchemicaAddresses[i], msg.sender, s.aavegotchiDAO, aavegotchiDAO);
      IERC20(_alchemicaAddresses[i]).burnFrom(msg.sender, burn);
    }
  }
}

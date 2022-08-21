// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

// import {LibERC20} from "../libraries/LibERC20.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import {LibAppStorageInstallation, InstallationAppStorage} from "../libraries/AppStorageInstallation.sol";

library LibItems {
  function _splitAlchemica(uint256[4] memory _alchemicaCost, address[4] memory _alchemicaAddresses) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    //take the required alchemica and split it
    for (uint256 i = 0; i < _alchemicaCost.length; i++) {
      //only send onchain when amount > 0
      if (_alchemicaCost[i] > 0) {
        uint256 greatPortal = (_alchemicaCost[i] * 35) / 100;
        uint256 pixelcraftPart = (_alchemicaCost[i] * 30) / 100;
        uint256 aavegotchiDAO = (_alchemicaCost[i] * 30) / 100;
        uint256 burn = (_alchemicaCost[i] * 5) / 100;
        IERC20(_alchemicaAddresses[i]).transferFrom(msg.sender, s.realmDiamond, greatPortal);
        IERC20(_alchemicaAddresses[i]).transferFrom(msg.sender, s.pixelcraft, pixelcraftPart);
        IERC20(_alchemicaAddresses[i]).transferFrom(msg.sender, s.aavegotchiDAO, aavegotchiDAO);
        IERC20(_alchemicaAddresses[i]).transferFrom(msg.sender, 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, burn);
      }
    }
  }
}

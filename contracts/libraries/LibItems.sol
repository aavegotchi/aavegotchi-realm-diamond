// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

// import {LibERC20} from "../libraries/LibERC20.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import {LibAppStorageInstallation, InstallationAppStorage} from "../libraries/AppStorageInstallation.sol";

import "../interfaces/InstallationDiamondInterface.sol";

// import "../interfaces/TileDiamond.sol";
import "../interfaces/ICaartridgeFacet.sol";
import "../interfaces/IConsoleFacet.sol";

//starts at 5%
uint256 constant REFUND_PERC = 5;

struct ConsoleAndCaartridgeData {
  bool share;
  bool discount;
  uint32 level;
  address parentConsoleOwner;
  uint256 consoleId;
  uint256 caartridgeId;
}

library LibItems {
  function _splitAlchemica(uint256[4] memory _alchemicaCost, address[4] memory _alchemicaAddresses) internal {
    InstallationAppStorage storage s = LibAppStorageInstallation.diamondStorage();
    address consoleDiamond = InstallationDiamondInterface(address(this)).getConsoleDiamond();
    address caartridgeDiamond = InstallationDiamondInterface(address(this)).getCaartridgeDiamond();
    //cache to reduce external reads
    ConsoleAndCaartridgeData memory cData = _getConsoleAndCaartridgeData(consoleDiamond, caartridgeDiamond);
    //take the required alchemica and split it
    for (uint256 i = 0; i < _alchemicaCost.length; i++) {
      //only send onchain when amount > 0
      if (_alchemicaCost[i] > 0) {
        uint256 greatPortal = (_alchemicaCost[i] * 35) / 100;
        uint256 pixelcraftPart = (_alchemicaCost[i] * 30) / 100;
        uint256 aavegotchiDAO = (_alchemicaCost[i] * 30) / 100;
        uint256 burn = (_alchemicaCost[i] * 5) / 100;

        //if user is using a caartridge
        if (cData.share) {
          uint256 toConsole = _getShareAmount(pixelcraftPart);
          IERC20(_alchemicaAddresses[i]).transferFrom(msg.sender, cData.parentConsoleOwner, toConsole);
          //reduce Pixelcraft share
          pixelcraftPart -= toConsole;
          //to-do
          //emit an appropriate console-caartridge alchemica sharing event here
        }

        //if user is using a console
        if (cData.discount) {
          //get the discounts and update all amounts
          greatPortal -= _getDiscountAmount(cData.level, greatPortal);
          pixelcraftPart -= _getDiscountAmount(cData.level, pixelcraftPart);
          aavegotchiDAO -= _getDiscountAmount(cData.level, aavegotchiDAO);
          burn -= _getDiscountAmount(cData.level, burn);
        }

        IERC20(_alchemicaAddresses[i]).transferFrom(msg.sender, s.realmDiamond, greatPortal);
        IERC20(_alchemicaAddresses[i]).transferFrom(msg.sender, s.pixelcraft, pixelcraftPart);
        IERC20(_alchemicaAddresses[i]).transferFrom(msg.sender, s.aavegotchiDAO, aavegotchiDAO);
        IERC20(_alchemicaAddresses[i]).transferFrom(msg.sender, 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, burn);
      }
    }

    //finally export alchemica receipts
    //console
    if (cData.discount) {
      IConsoleFacet(consoleDiamond).assignPoints(_alchemicaCost, cData.consoleId);
    }
    //caartridge
    if (cData.share) {
      ICaartridgeFacet(caartridgeDiamond).assignCartridgePoints(_alchemicaCost, cData.caartridgeId);
    }
  }

  function _getConsoleAndCaartridgeData(address _consoleDiamond, address _caartridgeDiamond)
    internal
    view
    returns (ConsoleAndCaartridgeData memory cData_)
  {
    //check if sender is using a console
    if (IConsoleFacet(_consoleDiamond).balanceOf(msg.sender) > 0) {
      //get consoleId
      uint256 consoleId = IConsoleFacet(_consoleDiamond).getConsoleId(msg.sender);
      cData_.level = IConsoleFacet(_consoleDiamond).consoleLevel(consoleId);
      cData_.discount = true;
      cData_.consoleId = consoleId;
    }
    //check if sender is using a caartridge
    else {
      if (ICaartridgeFacet(_caartridgeDiamond).balanceOf(msg.sender) > 0) {
        //get caartridgeId
        uint256 caartridgeId = ICaartridgeFacet(_caartridgeDiamond).getCartridgeId(msg.sender);
        //get parent ConsoleId
        uint256 consoleId = ICaartridgeFacet(_caartridgeDiamond).getPatronId(caartridgeId);
        cData_.share = true;
        cData_.caartridgeId = caartridgeId;
        //get parentConsole owner
        cData_.parentConsoleOwner = IConsoleFacet(_consoleDiamond).ownerOf(consoleId);
      }
    }
  }

  function _getDiscountAmount(uint32 _consoleLevel, uint256 _alchemicaTotal) private pure returns (uint256 discount_) {
    //only perform calculations if console is > 0 and alchemica is being spent
    if (_consoleLevel > 0) {
      if (_consoleLevel == 1) {
        discount_ = (_alchemicaTotal * REFUND_PERC) / 100;
      }
      //15% max
      if (_consoleLevel > 1) {
        uint256 percent = REFUND_PERC + _consoleLevel;
        if (percent > 15) {
          percent = 15;
        }
        discount_ = (_alchemicaTotal * percent) / 100;
      }
    }
  }

  function _getShareAmount(uint256 _pixelCraftShare) private pure returns (uint256 share_) {
    share_ = (REFUND_PERC * _pixelCraftShare) / 100;
  }
}

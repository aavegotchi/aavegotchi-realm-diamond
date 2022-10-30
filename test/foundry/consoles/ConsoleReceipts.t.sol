// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import {TestConstants} from "@test/constants.t.sol";
import "../../../contracts/InstallationDiamond/facets/InstallationFacet.sol";
import "../../../contracts/InstallationDiamond/facets/InstallationUpgradeFacet.sol";
import {TileFacet} from "../../../contracts/TileDiamond/facets/TileFacet.sol";
import "../../../contracts/interfaces/IDiamondCut.sol";
import "../../../contracts/shared/OwnershipFacet.sol";
import "../../../contracts/interfaces/IDiamondLoupe.sol";
import {RealmDiamond} from "../../../contracts/interfaces/RealmDiamond.sol";

contract ConsoleReceiptTests is Test {
  InstallationFacet installationFacet;
  InstallationUpgradeFacet iUpgradeFacet;
  TileFacet tileFacet;
  IDiamondCut dCutInstallation = IDiamondCut(TestConstants.INSTALLATION_DIAMOND_ADDRESS_MATIC);
  IDiamondLoupe dLoupeInstallation = IDiamondLoupe(TestConstants.INSTALLATION_DIAMOND_ADDRESS_MATIC);
  IDiamondCut dCutTile = IDiamondCut(TestConstants.TILE_DIAMOND_ADDRESS_MATIC);
  IDiamondLoupe dLoupeTile = IDiamondLoupe(TestConstants.TILE_DIAMOND_ADDRESS_MATIC);
  address caartridgeOwner = 0xe1A077b679F206073d85c3a62258F0E7ce3C9630;
  address consoleOwner = 0x3a79bF3555F33f2adCac02da1c4a0A0163F666ce;
  address CONSOLEDIAMOND = 0x6c6Ef1Ce88eD6D7Ec9AB5Fe647EC7Bd338ac5eDF;
  address CAARTRIDGEDIAMOND = 0x3bB1490Ad830a59A7cFEe00Bf1ac65074Cc91f02;
  address PIXELCRAFT = 0xcfD39603A5059F966cA490bEB3002a7a57A63233;
  uint256 pixelCraft = 30; //30%

  function setUp() public {
    address diamondOwner = OwnershipFacet(TestConstants.INSTALLATION_DIAMOND_ADDRESS_MATIC).owner();
    vm.startPrank(diamondOwner);
    //deploy facets
    installationFacet = new InstallationFacet();
    iUpgradeFacet = new InstallationUpgradeFacet();
    tileFacet = new TileFacet();
    //upgrade both diamonds

    //upgrade installationDiamond
    IDiamondCut.FacetCut[] memory iCut = new IDiamondCut.FacetCut[](3);
    iCut[0] = IDiamondCut.FacetCut({
      facetAddress: address(installationFacet),
      action: IDiamondCut.FacetCutAction.Replace,
      functionSelectors: dLoupeInstallation.facetFunctionSelectors(0x2186d85D9F369442038DE7ba9066D0574B193f05)
    });

    iCut[1] = IDiamondCut.FacetCut({
      facetAddress: address(installationFacet),
      action: IDiamondCut.FacetCutAction.Add,
      functionSelectors: populateBytes4Array(
        installationFacet.getCaartridgeDiamond.selector,
        installationFacet.getConsoleDiamond.selector,
        installationFacet.setAddresses.selector
      )
    });

    iCut[2] = IDiamondCut.FacetCut({
      facetAddress: address(iUpgradeFacet),
      action: IDiamondCut.FacetCutAction.Replace,
      functionSelectors: generateSelectors("InstallationUpgradeFacet")
    });

    //upgrade tileDiamond
    IDiamondCut.FacetCut[] memory tCut = new IDiamondCut.FacetCut[](1);
    tCut[0] = IDiamondCut.FacetCut({
      facetAddress: address(tileFacet),
      action: IDiamondCut.FacetCutAction.Add,
      functionSelectors: populateBytes4Array(
        tileFacet.getCaartridgeDiamond.selector,
        tileFacet.getConsoleDiamond.selector,
        installationFacet.setAddresses.selector
      )
    });

    bytes memory payload = abi.encodeWithSelector(installationFacet.setAddresses.selector, CONSOLEDIAMOND, CAARTRIDGEDIAMOND);
    dCutInstallation.diamondCut(iCut, TestConstants.INSTALLATION_DIAMOND_ADDRESS_MATIC, payload);
    dCutTile.diamondCut(tCut, TestConstants.TILE_DIAMOND_ADDRESS_MATIC, payload);
    vm.stopPrank();
  }

  function testCaartridgeMintReceipts() public {
    //assume a caartridge owner mints an installation
    vm.startPrank(caartridgeOwner);
    //get pixelcraft ALCH balances
    uint256[4] memory pcBalancesBefore = getBalances(PIXELCRAFT);
    uint256[4] memory consoleOwnerBalanceBefore = getBalances(consoleOwner);
    InstallationFacet(TestConstants.INSTALLATION_DIAMOND_ADDRESS_MATIC).craftInstallations(populateUINT16(110), populateUINT40(0));

    //get the installation price
    InstallationType memory iType = InstallationFacet(TestConstants.INSTALLATION_DIAMOND_ADDRESS_MATIC).getInstallationType(110);
    uint256[4] memory cost = iType.alchemicaCost;
    //make sure console shares from pixelcraft's allocation
    uint256[4] memory pcBalancesAfter = getBalances(PIXELCRAFT);
    uint256[4] memory consoleOwnerBalanceAfter = getBalances(consoleOwner);
    for (uint256 i = 0; i < 4; i++) {
      if (cost[i] > 0) {
        uint256 pcOriginalShare = (cost[i] * pixelCraft) / 100;
        uint256 consoleOwnerShare = _getShareAmount(pcOriginalShare);
        pcOriginalShare -= consoleOwnerShare;
        assertEq(pcBalancesAfter[i], pcBalancesBefore[i] + pcOriginalShare);
        assertEq(consoleOwnerBalanceAfter[i], consoleOwnerBalanceBefore[i] + consoleOwnerShare);
      }
    }
  }

  function testCosoleMintReceipts() public {
    //assume a console owner mints an installation
    vm.startPrank(consoleOwner);
    //get owner ALCH balances
    uint256[4] memory consoleOwnerBalanceBefore = getBalances(consoleOwner);
    InstallationFacet(TestConstants.INSTALLATION_DIAMOND_ADDRESS_MATIC).craftInstallations(populateUINT16(110), populateUINT40(0));

    //get the installation price
    InstallationType memory iType = InstallationFacet(TestConstants.INSTALLATION_DIAMOND_ADDRESS_MATIC).getInstallationType(110);
    uint256[4] memory cost = iType.alchemicaCost;
    //make sure console owner gets a discount based on level
    uint256[4] memory consoleOwnerBalanceAfter = getBalances(consoleOwner);

    for (uint256 i = 0; i < 4; i++) {
      if (cost[i] > 0) {
        uint256 discount = _getDiscountAmount(1, cost[i]);
        uint256 consoleOwnerDebit = cost[i] - discount;
        assertEq(consoleOwnerBalanceAfter[i], consoleOwnerBalanceBefore[i] - consoleOwnerDebit);
      }
    }
  }

  function generateSelectors(string memory _facetName) internal returns (bytes4[] memory selectors) {
    string[] memory cmd = new string[](3);
    cmd[0] = "node";
    cmd[1] = "scripts/genSelectors.js";
    cmd[2] = _facetName;
    bytes memory res = vm.ffi(cmd);
    selectors = abi.decode(res, (bytes4[]));
  }

  function mkaddr(string memory name) internal returns (address) {
    address addr = address(uint160(uint256(keccak256(abi.encodePacked(name)))));
    vm.label(addr, name);
    return addr;
  }

  function getBalances(address user) public view returns (uint256[4] memory balances) {
    address[4] memory alchemicaAddresses = RealmDiamond(TestConstants.REALM_DIAMOND_ADDRESS_MATIC).getAlchemicaAddresses();
    for (uint256 i = 0; i < 4; i++) {
      balances[i] = BALANCE(alchemicaAddresses[i]).balanceOf(user);
    }
  }
}

function populateBytes4Array(
  bytes4 a,
  bytes4 c,
  bytes4 d
) view returns (bytes4[] memory b) {
  b = new bytes4[](3);
  b[0] = a;
  b[1] = c;
  b[2] = d;
}

function populateUINT16(uint16 a) view returns (uint16[] memory b) {
  b = new uint16[](1);
  b[0] = a;
}

function populateUINT40(uint40 a) view returns (uint40[] memory b) {
  b = new uint40[](1);
  b[0] = a;
}

function _getDiscountAmount(uint32 _consoleLevel, uint256 _alchemicaTotal) pure returns (uint256 discount_) {
  //only perform calculations if console is > 0 and alchemica is being spent
  if (_consoleLevel > 0) {
    if (_consoleLevel == 1) {
      discount_ = (_alchemicaTotal * 5) / 100;
    }
    //15% max
    if (_consoleLevel > 1) {
      uint256 percent = 5 + _consoleLevel;
      if (percent > 15) {
        percent = 15;
      }
      discount_ = (_alchemicaTotal * percent) / 100;
    }
  }
}

function _getShareAmount(uint256 _pixelCraftShare) pure returns (uint256 share_) {
  share_ = (5 * _pixelCraftShare) / 100;
}

interface BALANCE {
  function balanceOf(address) external view returns (uint256);
}

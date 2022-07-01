// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Ownable} from "@interfaces/Ownable.sol";

contract TestUtils {
  error AddressNotSet();

  uint256 public constant maticChainId = 137;
  uint256 public constant mumbaiChainId = 80001;

  function realmDiamondAddress() public view returns (address) {
    if (block.chainid == maticChainId) {
      return 0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11;
    } else if (block.chainid == mumbaiChainId) {
      return 0x726F201A9aB38cD56D60ee392165F1434C4F193D;
    } else {
      revert AddressNotSet();
    }
  }

  function installationDiamondAddress() public view returns (address) {
    if (block.chainid == maticChainId) {
      return 0x19f870bD94A34b3adAa9CaA439d333DA18d6812A;
    } else if (block.chainid == mumbaiChainId) {
      return 0x663aeA831087487d2944ce44836F419A35Ee005A;
    } else {
      revert AddressNotSet();
    }
  }

  function tileDiamondAddress() public view returns (address) {
    if (block.chainid == maticChainId) {
      return 0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355;
    } else if (block.chainid == mumbaiChainId) {
      return 0xDd8947D7F6705136e5A12971231D134E80DFC15d;
    } else {
      revert AddressNotSet();
    }
  }

  function fud() public view returns (address) {
    if (block.chainid == maticChainId) {
      return 0x403E967b044d4Be25170310157cB1A4Bf10bdD0f;
    } else if (block.chainid == mumbaiChainId) {
      return 0x8898BEA7EBC534263d891aCE9fdf8B18F0205ddb;
    } else {
      revert AddressNotSet();
    }
  }

  function fomo() public view returns (address) {
    if (block.chainid == maticChainId) {
      return 0x44A6e0BE76e1D9620A7F76588e4509fE4fa8E8C8;
    } else if (block.chainid == mumbaiChainId) {
      return 0x18c2F784B51b04ba6E85bF62D74898Fac5BCC59b;
    } else {
      revert AddressNotSet();
    }
  }

  function alpha() public view returns (address) {
    if (block.chainid == maticChainId) {
      return 0x6a3E7C3c6EF65Ee26975b12293cA1AAD7e1dAeD2;
    } else if (block.chainid == mumbaiChainId) {
      return 0x066F7B9172DE92945dF4e7fB29a0815dc225d45F;
    } else {
      revert AddressNotSet();
    }
  }

  function kek() public view returns (address) {
    if (block.chainid == maticChainId) {
      return 0x42E5E06EF5b90Fe15F853F59299Fc96259209c5C;
    } else if (block.chainid == mumbaiChainId) {
      return 0x1C5714F00cc2e795Cf4F4F7e2A9F3AA04149d423;
    } else {
      revert AddressNotSet();
    }
  }

  function gltr() public view returns (address) {
    if (block.chainid == maticChainId) {
      return 0x3801C3B3B5c98F88a9c9005966AA96aa440B9Afc;
    } else if (block.chainid == mumbaiChainId) {
      return 0x3FF9E39009bfFe903C262f6d63161B1f4414d3c8;
    } else {
      revert AddressNotSet();
    }
  }

  function realmDiamondOwner() public view returns (address) {
    return Ownable(realmDiamondAddress()).owner();
  }

  function installationDiamondOwner() public view returns (address) {
    return Ownable(installationDiamondAddress()).owner();
  }

  function tileDiamondOwner() public view returns (address) {
    return Ownable(tileDiamondAddress()).owner();
  }
}

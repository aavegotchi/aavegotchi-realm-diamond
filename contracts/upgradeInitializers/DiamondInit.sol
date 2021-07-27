// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
*
* Implementation of a diamond.
/******************************************************************************/

import {LibDiamond} from "../libraries/LibDiamond.sol";
import { IDiamondLoupe } from "../interfaces/IDiamondLoupe.sol";
import { IDiamondCut } from "../interfaces/IDiamondCut.sol";
import { IERC173 } from "../interfaces/IERC173.sol";
import { IERC165 } from "../interfaces/IERC165.sol";
import { AppStorage, ContractAddresses, InitiatorInfo } from "../libraries/AppStorage.sol";

contract DiamondInit {
    AppStorage internal s;

    function init(ContractAddresses memory contracts, InitiatorInfo memory initInfo) external {
        s.pixelcraft = contracts.pixelcraft;
        s.playerRewards = contracts.playerRewards;
        s.daoTreasury = contracts.daoTreasury;
        s.erc20Currency = contracts.erc20Currency;
        s.initiatorInfo = initInfo;

        // adding ERC165 data
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;
    }
}

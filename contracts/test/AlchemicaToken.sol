// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

contract AlchemicaToken is ERC20Capped, Ownable {
  //@todo: auto-approve installationDiamond to spend

  constructor(
    string memory name,
    string memory symbol,
    uint256 _maxSupply,
    address _realmDiamond
  ) ERC20(name, symbol) ERC20Capped(_maxSupply) {
    transferOwnership(_realmDiamond);
  }

  /// @notice Mint _value tokens for msg.sender
  /// @param _value Amount of tokens to mint
  function mint(address _to, uint256 _value) public onlyOwner {
    _mint(_to, _value);
  }
}

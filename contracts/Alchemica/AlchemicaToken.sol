// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20CappedUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";

contract AlchemicaToken is OwnableUpgradeable, ERC20CappedUpgradeable, ERC20PermitUpgradeable {
  address public realmDiamond;

  function initialize(
    string calldata _name,
    string calldata _symbol,
    uint256 _maxSupply,
    address _realmDiamond,
    address _gameplayVestingContract,
    address _ecosystemVestingContract
  ) public initializer {
    __Context_init_unchained();
    __Ownable_init_unchained();
    __ERC20_init_unchained(_name, _symbol);
    __ERC20Capped_init_unchained(_maxSupply);
    __ERC20Permit_init(_name);
    transferOwnership(_realmDiamond);
    realmDiamond = _realmDiamond;
    _mint(_gameplayVestingContract, _maxSupply / 10);
    _mint(_ecosystemVestingContract, _maxSupply / 10);
  }

  modifier onlyRealmDiamond() {
    require(msg.sender == realmDiamond, "Only RealmDiamond");
    _;
  }

  /// @notice Mint _value tokens for msg.sender
  /// @param _value Amount of tokens to mint
  function mint(address _to, uint256 _value) public onlyRealmDiamond {
    _mint(_to, _value);
  }

  function updateRealmDiamond(address _newRealmDiamond) external onlyOwner {
    realmDiamond = _newRealmDiamond;
  }

  /// @notice Sends tokens mistakenly sent to this contract to the Aavegotchi DAO treasury
  function recoverERC20(address _token, uint256 _value) external virtual {
    IERC20Upgradeable(_token).transfer(0x6fb7e0AAFBa16396Ad6c1046027717bcA25F821f, _value);
  }

  function _mint(address _to, uint256 _value) internal virtual override(ERC20CappedUpgradeable, ERC20Upgradeable) {
    ERC20CappedUpgradeable._mint(_to, _value);
  }
}

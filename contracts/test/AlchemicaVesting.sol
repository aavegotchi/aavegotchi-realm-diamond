// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.0;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract AlchemicaVesting is Ownable {
  using SafeERC20 for IERC20;

  event TokensReleased(address token, uint256 amount);
  event TokenVestingRevoked(address token);

  uint256 private constant DECAY_PERIOD = 60 * 60 * 24 * 365; // 1 year
  // Tokens will vest with this amount of precision.
  uint256 private constant PRECISION = 1e18;

  // Beneficiary of tokens after they are released
  address private _beneficiary;

  // Durations and timestamps are expressed in UNIX time, the same units as block.timestamp.
  uint256 private _cliff;
  uint256 private _start;
  uint256 private _duration;
  uint256 private _decayFactor;

  bool private _revocable;

  mapping (address => uint256) private _released;
  mapping (address => bool) private _revoked;
  
  function replaceBeneficiary(address newBeneficiary) external {
    require(msg.sender == _beneficiary, "Not authorized");
    _beneficiary = newBeneficiary;
  }

  /**
    * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
    * beneficiary, distributing the tokens by the geometric distribution. 
    * The amount distributed is reduced by some amount every year
    * to asymptotically distribute the entire balance (like bitcoin halving).
    * @param beneficiary address of the beneficiary to whom vested tokens are transferred
    * @param start the time (as Unix time) at which point vesting starts. 0 if current time is desired
    * @param decayFactor the proportion of tokens to receive in the first period. vesting
    * will decrease geometrically from this value. scaled by precision
    * @param revocable whether the vesting is revocable or not
    */
  constructor (address beneficiary, uint256 start, uint256 decayFactor, bool revocable) public {
    require(beneficiary != address(0), "TokenVesting: beneficiary is the zero address");
    require(start >= block.timestamp || start == 0, "TokenVesting: start must after the current block timestamp or 0");
    require(decayFactor < PRECISION, "TokenVesting: decay factor is too large");

    _beneficiary = beneficiary;
    _start = start == 0 ? block.timestamp : start;
    _decayFactor = decayFactor;
    _revocable = revocable;
  }

  /**
    * @return the beneficiary of the tokens.
    */
  function beneficiary() public view returns (address) {
    return _beneficiary;
  }

  /**
    * @return the start time of the token vesting.
    */
  function start() public view returns (uint256) {
    return _start;
  }

  /**
    * @return the decay factor for token distribution. 
    */
  function decayFactor() public view returns (uint256) {
    return _decayFactor;
  }

  /**
    * @return true if the vesting is revocable.
    */
  function revocable() public view returns (bool) {
    return _revocable;
  }

  /**
    * @return the amount of the token released.
    */
  function released(address token) public view returns (uint256) {
    return _released[token];
  }

  /**
    * @return true if the token is revoked.
    */
  function revoked(address token) public view returns (bool) {
    return _revoked[token];
  }

  /**
    * @notice Transfers vested tokens to beneficiary.
    * @param token ERC20 token which is being vested
    */
  function release(IERC20 token) public {
    uint256 unreleased = releasableAmount(token);

    require(unreleased > 0, "TokenVesting: no tokens are due");

    _released[address(token)] = _released[address(token)] + unreleased;

    token.safeTransfer(_beneficiary, unreleased);

    emit TokensReleased(address(token), unreleased);
  }
  
  function partialRelease(IERC20 token, uint256 value) public {
    uint256 unreleased = releasableAmount(token);
    require(unreleased > 0, "TokenVesting: no tokens are due");
    require(value <= unreleased, "value is greater than unreleased amount");
    
    _released[address(token)] = _released[address(token)] + value;

    token.safeTransfer(_beneficiary, value);

    emit TokensReleased(address(token), value);
  }

  /**
    * @notice Allows the owner to revoke the vesting. Tokens already vested
    * remain in the contract, the rest are returned to the owner.
    * @param token ERC20 token which is being vested
    */
  function revoke(IERC20 token) public onlyOwner {
    require(_revocable, "TokenVesting: cannot revoke");
    require(!_revoked[address(token)], "TokenVesting: token already revoked");

    uint256 balance = token.balanceOf(address(this));

    uint256 unreleased = releasableAmount(token);
    uint256 refund = balance - unreleased;

    _revoked[address(token)] = true;

    token.safeTransfer(owner(), refund);

    emit TokenVestingRevoked(address(token));
  }

  /**
    * @dev Calculates the amount that has already vested but hasn't been released yet.
    * @param token ERC20 token which is being vested
    */
  function releasableAmount(IERC20 token) public view returns (uint256) {
    return _vestedAmount(token) - _released[address(token)];
  }

  /**
    * @dev Calculates the amount that has already vested.
    * @param token ERC20 token which is being vested
    */
  function _vestedAmount(IERC20 token) private view returns (uint256) {
    uint256 currentBalance = token.balanceOf(address(this));
    uint256 totalBalance = currentBalance + _released[address(token)];

    if (block.timestamp < _start) {
      return 0;
    } else if (_revoked[address(token)]) {
      return totalBalance;
    } else {
      return totalBalance * _proportionVested(block.timestamp - _start) / PRECISION;
    }
  }

  /** 
    * @dev Calculates the proportion of tokens in bp that should be vested given a duration. 
    * The proportion of tokens follows the CDF of the geometric distribution.
    * Unsafe if there are too many periods, so we'll just return the entire balance
    * if we exceed 100 periods (100 years).
    */
  function _proportionVested(uint256 duration) private view returns (uint256) {
    uint256 periods = duration / DECAY_PERIOD;
    if (periods > 100) return PRECISION;
    uint256 timeInCurrentPeriod = duration % DECAY_PERIOD;

    // The proportion of tokens the beneficiary is NOT entitled to yet
    // without taking into account the time spent in the current period. 
    // Though slightly confusing, using this representation 
    // makes the math easier and simpler in the loop.
    uint256 propLastPeriod = PRECISION;
    for (uint256 i = 0; i < periods; i++) {
      propLastPeriod = propLastPeriod * (PRECISION - _decayFactor) / PRECISION;
    }
    // The proportion of tokens the beneficiary is NOT entitled to yet
    // if the entire current period has passed. 
    uint256 propThisPeriod = propLastPeriod * (PRECISION - _decayFactor) / PRECISION;

    return
      // The proportion of tokens the beneficiary is entitled to from the last period
      (PRECISION - propLastPeriod) + 
      // The proportion of tokens the beneficiary is entitled to from the current period
      ((propLastPeriod - propThisPeriod) * timeInCurrentPeriod / DECAY_PERIOD); 
  }
}
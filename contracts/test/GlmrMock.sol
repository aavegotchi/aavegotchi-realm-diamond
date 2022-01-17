// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/// @title ERC20 Generic placeholder smart contract for testing and ABI
contract GLMR is ERC20Burnable {

  /*
   *  EIP-2612 states
   */
  bytes32 public constant PERMIT_TYPEHASH =
  keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

  uint256 internal immutable INITIAL_CHAIN_ID;
  bytes32 internal immutable INITIAL_DOMAIN_SEPARATOR;
  mapping(address => uint256) public nonces;

  /// @notice Constructor
  /// @dev Please change the values in here if you want more specific values, or make the constructor takes arguments
  constructor() ERC20("Glamour", "GLMR") {
    INITIAL_CHAIN_ID = block.chainid;
    INITIAL_DOMAIN_SEPARATOR = computeDomainSeparator();
  }

  /// @notice Mint _value tokens for msg.sender
  /// Function not present in ERC20 spec : allow for the minting of a token for test purposes
  /// @param _value Amount of tokens to mint
  function mint(uint256 _value) public {
    _mint(msg.sender, _value);
  }

  /*
   *  EIP-2612 LOGIC
   */

  function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public {
    require(deadline >= block.timestamp, "PERMIT_DEADLINE_EXPIRED");

    // Unchecked because the only math done is incrementing
    // the owner's nonce which cannot realistically overflow.
  unchecked {
    bytes32 digest = keccak256(
      abi.encodePacked(
        "\x19\x01",
        DOMAIN_SEPARATOR(),
        keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline))
      )
    );

    address recoveredAddress = ecrecover(digest, v, r, s);
    require(recoveredAddress != address(0) && recoveredAddress == owner, "INVALID_SIGNER");

    _approve(owner, spender, value);
  }
  }

  function DOMAIN_SEPARATOR() public view returns (bytes32) {
    return block.chainid == INITIAL_CHAIN_ID ? INITIAL_DOMAIN_SEPARATOR : computeDomainSeparator();
  }

  function computeDomainSeparator() internal view returns (bytes32) {
    return
    keccak256(
      abi.encode(
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        keccak256(bytes(name())),
        keccak256("1"), // version
        block.chainid,
        address(this)
      )
    );
  }
}

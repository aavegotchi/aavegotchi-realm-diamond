// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

contract AlchemicaToken is ERC20Capped, Ownable {
  //@todo: auto-approve installationDiamond to spend

  /*
   *  EIP-2612 states
   */
  bytes32 public constant PERMIT_TYPEHASH =
  keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

  uint256 internal immutable INITIAL_CHAIN_ID;
  bytes32 internal immutable INITIAL_DOMAIN_SEPARATOR;
  mapping(address => uint256) public nonces;

  constructor(
    string memory name,
    string memory symbol,
    uint256 _maxSupply,
    address _realmDiamond
  ) ERC20(name, symbol) ERC20Capped(_maxSupply) {
    transferOwnership(_realmDiamond);

    INITIAL_CHAIN_ID = block.chainid;
    INITIAL_DOMAIN_SEPARATOR = computeDomainSeparator();
  }

  /// @notice Mint _value tokens for msg.sender
  /// @param _value Amount of tokens to mint
  function mint(address _to, uint256 _value) public onlyOwner {
    _mint(_to, _value);
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

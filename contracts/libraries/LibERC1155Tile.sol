// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {LibAppStorageTile, TileAppStorage} from "./AppStorageTile.sol";
import {IERC1155TokenReceiver} from "../interfaces/IERC1155TokenReceiver.sol";

library LibERC1155Tile {
  bytes4 internal constant ERC1155_ACCEPTED = 0xf23a6e61; // Return value from `onERC1155Received` call if a contract accepts receipt (i.e `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`).
  bytes4 internal constant ERC1155_BATCH_ACCEPTED = 0xbc197c81; // Return value from `onERC1155BatchReceived` call if a contract accepts receipt (i.e `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`).
  event TransferToParent(address indexed _toContract, uint256 indexed _toTokenId, uint256 indexed _tokenTypeId, uint256 _value);
  event TransferFromParent(address indexed _fromContract, uint256 indexed _fromTokenId, uint256 indexed _tokenTypeId, uint256 _value);
  /**
        @dev Either `TransferSingle` or `TransferBatch` MUST emit when tokens are transferred, including zero value transfers as well as minting or burning (see "Safe Transfer Rules" section of the standard).
        The `_operator` argument MUST be the address of an account/contract that is approved to make the transfer (SHOULD be LibMeta.msgSender()).
        The `_from` argument MUST be the address of the holder whose balance is decreased.
        The `_to` argument MUST be the address of the recipient whose balance is increased.
        The `_id` argument MUST be the token type being transferred.
        The `_value` argument MUST be the number of tokens the holder balance is decreased by and match what the recipient balance is increased by.
        When minting/creating tokens, the `_from` argument MUST be set to `0x0` (i.e. zero address).
        When burning/destroying tokens, the `_to` argument MUST be set to `0x0` (i.e. zero address).        
    */
  event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value);

  /**
        @dev Either `TransferSingle` or `TransferBatch` MUST emit when tokens are transferred, including zero value transfers as well as minting or burning (see "Safe Transfer Rules" section of the standard).      
        The `_operator` argument MUST be the address of an account/contract that is approved to make the transfer (SHOULD be LibMeta.msgSender()).
        The `_from` argument MUST be the address of the holder whose balance is decreased.
        The `_to` argument MUST be the address of the recipient whose balance is increased.
        The `_ids` argument MUST be the list of tokens being transferred.
        The `_values` argument MUST be the list of number of tokens (matching the list and order of tokens specified in _ids) the holder balance is decreased by and match what the recipient balance is increased by.
        When minting/creating tokens, the `_from` argument MUST be set to `0x0` (i.e. zero address).
        When burning/destroying tokens, the `_to` argument MUST be set to `0x0` (i.e. zero address).                
    */
  event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values);

  /**
        @dev MUST emit when approval for a second party/operator address to manage all tokens for an owner address is enabled or disabled (absence of an event assumes disabled).        
    */
  event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

  /**
        @dev MUST emit when the URI is updated for a token ID.
        URIs are defined in RFC 3986.
        The URI MUST point to a JSON file that conforms to the "ERC-1155 Metadata URI JSON Schema".
    */
  event URI(string _value, uint256 indexed _tokenId);

  event MintTile(address indexed _owner, uint256 indexed _tileType, uint256 _tileId);

  function _safeMint(
    address _to,
    uint256 _tileId,
    uint256 _queueId
  ) internal {
    TileAppStorage storage s = LibAppStorageTile.diamondStorage();
    if (s.tileTypes[_tileId].craftTime > 0) {
      require(!s.craftQueue[_queueId].claimed, "LibERC1155: tokenId already minted");
      require(s.craftQueue[_queueId].owner == _to, "LibERC1155: wrong owner");
      s.craftQueue[_queueId].claimed = true;
    }

    addToOwner(_to, _tileId, 1);
    emit MintTile(_to, _tileId, _queueId);
    emit LibERC1155Tile.TransferSingle(address(this), address(0), _to, _tileId, 1);
  }

  function addToOwner(
    address _to,
    uint256 _id,
    uint256 _value
  ) internal {
    TileAppStorage storage s = LibAppStorageTile.diamondStorage();
    s.ownerTileBalances[_to][_id] += _value;
    if (s.ownerTileIndexes[_to][_id] == 0) {
      s.ownerTiles[_to].push(_id);
      s.ownerTileIndexes[_to][_id] = s.ownerTiles[_to].length;
    }
  }

  function removeFromOwner(
    address _from,
    uint256 _id,
    uint256 _value
  ) internal {
    TileAppStorage storage s = LibAppStorageTile.diamondStorage();
    uint256 bal = s.ownerTileBalances[_from][_id];
    require(_value <= bal, "LibERC1155: Doesn't have that many to transfer");
    bal -= _value;
    s.ownerTileBalances[_from][_id] = bal;
    if (bal == 0) {
      uint256 index = s.ownerTileIndexes[_from][_id] - 1;
      uint256 lastIndex = s.ownerTiles[_from].length - 1;
      if (index != lastIndex) {
        uint256 lastId = s.ownerTiles[_from][lastIndex];
        s.ownerTiles[_from][index] = lastId;
        s.ownerTileIndexes[_from][lastId] = index + 1;
      }
      s.ownerTiles[_from].pop();
      delete s.ownerTileIndexes[_from][_id];
    }
  }

  function _burn(
    address _from,
    uint256 _tileType,
    uint256 _amount
  ) internal {
    removeFromOwner(_from, _tileType, _amount);
    emit LibERC1155Tile.TransferSingle(address(this), _from, address(0), _tileType, _amount);
  }

  function onERC1155Received(
    address _operator,
    address _from,
    address _to,
    uint256 _id,
    uint256 _value,
    bytes memory _data
  ) internal {
    uint256 size;
    assembly {
      size := extcodesize(_to)
    }
    if (size > 0) {
      require(
        ERC1155_ACCEPTED == IERC1155TokenReceiver(_to).onERC1155Received(_operator, _from, _id, _value, _data),
        "Wearables: Transfer rejected/failed by _to"
      );
    }
  }

  function onERC1155BatchReceived(
    address _operator,
    address _from,
    address _to,
    uint256[] calldata _ids,
    uint256[] calldata _values,
    bytes memory _data
  ) internal {
    uint256 size;
    assembly {
      size := extcodesize(_to)
    }
    if (size > 0) {
      require(
        ERC1155_BATCH_ACCEPTED == IERC1155TokenReceiver(_to).onERC1155BatchReceived(_operator, _from, _ids, _values, _data),
        "Wearables: Transfer rejected/failed by _to"
      );
    }
  }
}

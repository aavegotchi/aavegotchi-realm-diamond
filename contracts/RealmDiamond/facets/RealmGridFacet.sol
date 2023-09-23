// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../libraries/AppStorage.sol";
import "../../libraries/LibDiamond.sol";
import "../../libraries/LibStrings.sol";
import "../../libraries/LibMeta.sol";
import "../../libraries/LibERC721.sol";
import "../../libraries/LibRealm.sol";
import "../../libraries/LibAlchemica.sol";
import {InstallationDiamondInterface} from "../../interfaces/InstallationDiamondInterface.sol";
import "../../libraries/LibSignature.sol";
import "./ERC721Facet.sol";
import "../../interfaces/IERC1155Marketplace.sol";

contract RealmGridFacet is Modifiers {
  ///@notice Query the 8x8 matrix of a humble parcel
  ///@param _parcelId The parcelId of the humble parcel
  ///@param _gridType The type of grid to query
  ///@return output_ The 8x8 matrix of the humble parcel
  function getHumbleGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[8][8] memory output_) {
    require(s.parcels[_parcelId].size == 0, "RealmFacet: Not humble");
    for (uint256 i; i < 8; i++) {
      for (uint256 j; j < 8; j++) {
        if (_gridType == 0) {
          output_[i][j] = s.parcels[_parcelId].buildGrid[j][i];
        } else if (_gridType == 1) {
          output_[i][j] = s.parcels[_parcelId].tileGrid[j][i];
        }
      }
    }
  }

  ///@notice Query the 16x16 matrix of a reasonable parcel
  ///@param _parcelId The parcelId of the reasonable parcel
  ///@param _gridType The type of grid to query
  ///@return output_ The 16x16 matrix of the reasonable parcel

  function getReasonableGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[16][16] memory output_) {
    require(s.parcels[_parcelId].size == 1, "RealmFacet: Not reasonable");
    for (uint256 i; i < 16; i++) {
      for (uint256 j; j < 16; j++) {
        if (_gridType == 0) {
          output_[i][j] = s.parcels[_parcelId].buildGrid[j][i];
        } else if (_gridType == 1) {
          output_[i][j] = s.parcels[_parcelId].tileGrid[j][i];
        }
      }
    }
  }

  ///@notice Query the 32x64 matrix of a spacious vertical parcel
  ///@param _parcelId The parcelId of the spacious vertical parcel
  ///@param _gridType The type of grid to query
  ///@return output_ The 32x64 matrix of the spacious vertical parcel
  function getSpaciousVerticalGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[32][64] memory output_) {
    require(s.parcels[_parcelId].size == 2, "RealmFacet: Not spacious vertical");
    for (uint256 i; i < 64; i++) {
      for (uint256 j; j < 32; j++) {
        if (_gridType == 0) {
          output_[i][j] = s.parcels[_parcelId].buildGrid[j][i];
        } else if (_gridType == 1) {
          output_[i][j] = s.parcels[_parcelId].tileGrid[j][i];
        }
      }
    }
  }

  ///@notice Query the 64x32 matrix of a spacious horizontal parcel
  ///@param _parcelId The parcelId of the spacious horizontal parcel
  ///@param _gridType The type of grid to query
  ///@return output_ The 64x32 matrix of the spacious horizontal parcel

  function getSpaciousHorizontalGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[64][32] memory output_) {
    require(s.parcels[_parcelId].size == 3, "RealmFacet: Not spacious horizontal");
    for (uint256 i; i < 32; i++) {
      for (uint256 j; j < 64; j++) {
        if (_gridType == 0) {
          output_[i][j] = s.parcels[_parcelId].buildGrid[j][i];
        } else if (_gridType == 1) {
          output_[i][j] = s.parcels[_parcelId].tileGrid[j][i];
        }
      }
    }
  }

  ///@notice Query the 64x64 matrix of a paartner parcel
  ///@param _parcelId The parcelId of the paartner parcel
  ///@param _gridType The type of grid to query
  ///@return output_ The 64x64 matrix of the paartner parcel
  function getPaartnerGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[64][64] memory output_) {
    require(s.parcels[_parcelId].size == 4, "RealmFacet: Not paartner");
    for (uint256 i; i < 64; i++) {
      for (uint256 j; j < 64; j++) {
        if (_gridType == 0) {
          output_[i][j] = s.parcels[_parcelId].buildGrid[j][i];
        } else if (_gridType == 1) {
          output_[i][j] = s.parcels[_parcelId].tileGrid[j][i];
        }
      }
    }
  }

  struct ParcelCoordinates {
    uint256[64][64] coords;
  }

  ///@notice Batch query the parcel coordinates of a list of parcels
  ///@param _parcelIds The parcelIds of the parcels to query
  ///@param _gridType The type of grid to query
  ///@return The parcel coordinates of the parcels
  function batchGetGrid(uint256[] calldata _parcelIds, uint256 _gridType) external view returns (ParcelCoordinates[] memory) {
    ParcelCoordinates[] memory parcels = new ParcelCoordinates[](_parcelIds.length);
    for (uint256 k; k < _parcelIds.length; k++) {
      for (uint256 i; i < 64; i++) {
        for (uint256 j; j < 64; j++) {
          if (_gridType == 0) {
            parcels[k].coords[i][j] = s.parcels[_parcelIds[k]].buildGrid[j][i];
          } else if (_gridType == 1) {
            parcels[k].coords[i][j] = s.parcels[_parcelIds[k]].tileGrid[j][i];
          }
        }
      }
    }
    return parcels;
  }

  function fixGridStartPositions(
    uint256[] memory _parcelIds,
    uint256[] memory _x,
    uint256[] memory _y,
    bool _isTile,
    uint256[] memory _ids
  ) external onlyOwner {
    require(_parcelIds.length == _x.length && _parcelIds.length == _y.length, "RealmFacet: Mismatched arrays");
    if (_isTile) {
      for (uint256 i; i < _parcelIds.length; i++) {
        s.parcels[_parcelIds[i]].startPositionTileGrid[_x[i]][_y[i]] = _ids[i];
      }
    } else {
      for (uint256 i; i < _parcelIds.length; i++) {
        s.parcels[_parcelIds[i]].startPositionBuildGrid[_x[i]][_y[i]] = _ids[i];
      }
    }
  }

  ///@notice Query whether or not a grid position is a suitable start position for an item
  ///@param _parcelId The parcelId of the parcel to query
  ///@param _x The x coordinate of the grid position
  ///@param _y The y coordinate of the grid position
  ///@param _isTile Whether or not item to be installed is a tile
  ///@param _id The id of the item to be installed
  ///@return Whether or not the grid position is a suitable start position for an item

  function isGridStartPosition(uint256 _parcelId, uint256 _x, uint256 _y, bool _isTile, uint256 _id) external view returns (bool) {
    if (_isTile) {
      return s.parcels[_parcelId].startPositionTileGrid[_x][_y] == _id;
    } else {
      return s.parcels[_parcelId].startPositionBuildGrid[_x][_y] == _id;
    }
  }
}

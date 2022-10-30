pragma solidity 0.8.9;

interface IConsoleFacet {
  function assignPoints(uint256[4] memory _alcehmicaAmountsSpent, uint256 _tokenId) external;

  function mintConsoleFromCartridge(address _to) external;

  function getConsoleId(address _owner) external view returns (uint256);

  function mintConsoles(address[] calldata _recipients, uint16[] calldata _initialCartridgeMints) external;

  function balanceOf(address _owner) external view returns (uint256);

  function mintCaartridgeFrom(uint256 _consoleId, address _to) external;

  function ownerOf(uint256 _tokenId) external view returns (address owner);

  function consoleLevel(uint256 _consoleId) external view returns (uint32 level_);
}

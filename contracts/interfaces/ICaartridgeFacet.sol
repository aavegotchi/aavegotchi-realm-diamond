pragma solidity 0.8.9;

interface ICaartridgeFacet {
  function balanceOf(address _owner) external view returns (uint256);

  function mint(address _to, uint256 _consoleId) external returns (uint256, bool);

  function assignCartridgePoints(uint256[4] memory _alchemicaSpent, uint256 _cartridgeId) external;

  function getCartridgeId(address _owner) external view returns (uint256);

  function getPatronId(uint256 _tokenId) external view returns (uint256);
}

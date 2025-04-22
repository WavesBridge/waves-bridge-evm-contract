// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IUnitStandardBridge {
    function bridgeERC20(address token, address clTo, uint256 elAmount) external;
}

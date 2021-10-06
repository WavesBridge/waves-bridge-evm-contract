// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IWrappedTokenV0 {
    function changeAuthority(address newAuthority) external;
    function mint(address account, uint256 amount) external;
    function burn(address account, uint256 amount) external;
}
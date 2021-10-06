// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IValidator {
    function createLock(
        address sender,
        bytes32 recipient,
        uint256 amount,
        bytes4 destination,
        bytes4 tokenSource,
        bytes32 tokenSourceAddress
    ) external returns (uint256);
}

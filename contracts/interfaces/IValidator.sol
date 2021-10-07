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

    function createUnlock(
        uint256 lockId,
        address recipient,
        uint256 amount,
        bytes4 lockSource,
        bytes4 tokenSource,
        bytes32 tokenSourceAddress,
        bytes calldata signature
    ) external returns (bool);
}

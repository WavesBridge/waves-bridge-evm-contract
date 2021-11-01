// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IValidator {
    function createLock(
        uint128 lockId,
        address sender,
        bytes32 recipient,
        uint256 amount,
        bytes4 destination,
        bytes4 tokenSource,
        bytes32 tokenSourceAddress
    ) external returns (uint128);

    function createUnlock(
        uint128 lockId,
        address recipient,
        uint256 amount,
        bytes4 lockSource,
        bytes4 tokenSource,
        bytes32 tokenSourceAddress,
        bytes calldata signature
    ) external returns (bool);
}

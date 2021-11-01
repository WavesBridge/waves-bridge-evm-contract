// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../interfaces/IValidator.sol";

contract MockValidator is IValidator {
    bool returnError = false;

    function createLock(
        uint128 lockId,
        address,
        bytes32,
        uint256,
        bytes4,
        bytes4,
        bytes32
    ) external override view returns (uint128) {
        if (returnError) {
            revert("MockValidator: error");
        }

        return lockId;
    }

    function createUnlock(
        uint128,
        address,
        uint256,
        bytes4,
        bytes4,
        bytes32,
        bytes calldata
    ) external view override returns (bool) {
        return !returnError;
    }

    function setReturnError(bool _returnError) external {
        returnError = _returnError;
    }
}

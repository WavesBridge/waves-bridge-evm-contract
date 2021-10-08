// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../interfaces/IValidator.sol";

contract MockValidator is IValidator {
    uint256 lastLockId = 0;
    bool returnError = false;

    function createLock(
        address,
        bytes32,
        uint256,
        bytes4,
        bytes4,
        bytes32
    ) external override returns (uint256) {
        if (returnError) {
            revert("MockValidator: error");
        }
        uint256 result = lastLockId;
        lastLockId += 1;
        return result;
    }

    function createUnlock(
        uint256,
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

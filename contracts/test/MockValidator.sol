// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../interfaces/IValidator.sol";

contract MockValidator is IValidator {
    bool returnError = false;

    function createLock(
        uint128,
        address,
        bytes32,
        uint256,
        bytes4,
        bytes4,
        bytes32
    ) external override view {
        if (returnError) {
            revert("MockValidator: error");
        }
    }

    function createUnlock(
        uint128,
        address,
        uint256,
        bytes4,
        bytes4,
        bytes32,
        bytes calldata
    ) external view override {
        if (returnError) {
            revert("MockValidator: error");
        }
    }

    function setReturnError(bool _returnError) external {
        returnError = _returnError;
    }
}

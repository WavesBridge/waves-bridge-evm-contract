// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockFeeOracle is Ownable {
    constructor() {}

    function fee(address, address, uint256, bytes4) public pure returns (uint256) {
        return 0.1 ether;
    }

}

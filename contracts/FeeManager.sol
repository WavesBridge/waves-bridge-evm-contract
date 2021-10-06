// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FeeManager is Ownable {

    mapping(address => uint256) public feeFixed;
    uint256 public feeRateBP;

    uint256 public constant BP = 10000;

    address public poolToken;
    uint256 public balanceFeeFixed;

    constructor(address poolToken_, uint256 balanceFeeFixed_, uint256 feeRateBP_) {
        poolToken = poolToken_;
        balanceFeeFixed = balanceFeeFixed_;
        feeRateBP = feeRateBP_;
    }

    function fee(address token, address sender, uint256 amount) public view returns (uint256) {
        if (IERC20(poolToken).balanceOf(sender) >= balanceFeeFixed) {
            return feeFixed[token];
        }
        return amount * feeRateBP / BP;
    }

}
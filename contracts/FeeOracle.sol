// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./Pool.sol";

contract FeeOracle is Ownable {
    using Math for uint256;
    mapping(uint256 => uint256) public multipliers;
    uint256 public baseFeeRateBP;

    uint256 public constant BP = 10000;

    Pool public pool;

    constructor(Pool pool_, uint256 feeRateBP_) {
        pool = pool_;
        baseFeeRateBP = feeRateBP_;
    }

    function setMultiplier(uint256 pid, uint256 multiplier) public onlyOwner {
        multipliers[pid] = multiplier;
    }


    function fee(address token, address sender, uint256 amount, bytes4) public view returns (uint256) {
        uint256 poolLength = pool.poolLength();
        uint256 userShare = 0;
        for (uint256 pid = 0; pid < poolLength; pid++) {
            uint256 poolSize = IERC20(token).balanceOf(address(pool));
            if (poolSize > 0) {
                (uint256 lpAmount,) = pool.userInfo(pid, sender);
                userShare = userShare.max(multipliers[pid] * lpAmount / poolSize);
            }
        }

        return amount / (userShare + (BP / baseFeeRateBP));
    }

}

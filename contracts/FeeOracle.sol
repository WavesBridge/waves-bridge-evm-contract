// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./Pool.sol";

contract FeeOracle is Ownable {
    using Math for uint256;

    mapping(address => uint256) public minFee;
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

    function setMinFee(address token, uint256 _minFee) public onlyOwner {
        minFee[token] = _minFee;
    }


    function fee(address token, address sender, uint256 amount, bytes4) public view returns (uint256) {
        uint256 poolLength = pool.poolLength();
        uint256 userShare = 0;
        for (uint256 pid = 0; pid < poolLength; pid++) {
            (IERC20 lpToken,,,) = pool.poolInfo(pid);
            uint256 poolSize = lpToken.balanceOf(address(pool));
            if (poolSize > 0) {
                (uint256 lpAmount,) = pool.userInfo(pid, sender);
                userShare = userShare.max(multipliers[pid] * lpAmount / poolSize);
            }
        }

        uint256 result = amount / (userShare + (BP / baseFeeRateBP));
        uint256 _minFee = minFee[token];
        if (_minFee > 0 && result < _minFee) {
            return _minFee;
        } else {
            return result;
        }
    }

}

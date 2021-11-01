// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./Staking.sol";

contract FeeOracle is Ownable {
    using Math for uint256;

    // tokenAddress => mintFee
    mapping(address => uint256) public minFee;

    // poolId => multiplier
    uint256 public feeMultiplier;
    uint256 public baseFeeRateBP;

    uint256 public constant BP = 10000;

    IERC20 public xABR;

    constructor(IERC20 xABR_, uint256 baseFeeRateBP_) {
        xABR = xABR_;
        baseFeeRateBP = baseFeeRateBP_;
    }

    function setFeeMultiplier(uint256 multiplier) public onlyOwner {
        feeMultiplier = multiplier;
    }

    function setMinFee(address token, uint256 _minFee) public onlyOwner {
        minFee[token] = _minFee;
    }

    function setBaseFeeRate(uint256 baseFeeRateBP_) public onlyOwner {
        baseFeeRateBP = baseFeeRateBP_;
    }

    // Fourth argument is destination
    function fee(address token, address sender, uint256 amount, bytes4) public view returns (uint256) {
        uint256 _minFee = minFee[token];
        if (xABR.totalSupply() == 0 || baseFeeRateBP == 0 || amount == 0) {
            return _minFee;
        }
        uint256 userShareBP = xABR.balanceOf(sender) * feeMultiplier * BP / xABR.totalSupply();

        uint256 result = (amount * BP) / (userShareBP + (BP * BP / baseFeeRateBP));
        if (_minFee > 0 && result < _minFee) {
            return _minFee;
        } else {
            return result;
        }
    }

}

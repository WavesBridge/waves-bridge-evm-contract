// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// This contract handles swapping to and from xABR, Allbridge's staking token.
contract Staking is ERC20("xABR", "xABR"){
    IERC20 public ABR;

    // Define the ABR token contract
    constructor(IERC20 _ABR) {
        ABR = _ABR;
    }

    // Locks ABR and mints xABR
    function deposit(uint256 _amount) public {
        // Gets the amount of ABR locked in the contract
        uint256 totalABR = ABR.balanceOf(address(this));
        // Gets the amount of xABR in existence
        uint256 totalShares = totalSupply();
        // If no xABR exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalABR == 0) {
            _mint(msg.sender, _amount);
        }
        // Calculate and mint the amount of xABR the ABR is worth. The ratio will change overtime, 
        // as xABR is burned/minted and ABR deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount * totalShares / totalABR;
            _mint(msg.sender, what);
        }
        // Lock the ABR in the contract
        ABR.transferFrom(msg.sender, address(this), _amount);
    }

    // Unlocks the staked + gained ABR and burns xABR
    function withdraw(uint256 _share) public {
        // Gets the amount of xABR in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of ABR the xABR is worth
        uint256 what = _share * ABR.balanceOf(address(this)) / totalShares;
        _burn(msg.sender, _share);
        ABR.transfer(msg.sender, what);
    }
}

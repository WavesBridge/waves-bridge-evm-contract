// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Pool is ERC20("Allbridge Pool", "xABR") {
    IERC20 public baseToken; // Base token stored in the pool

    constructor(IERC20 token) {
        baseToken = token;
    }

    // Deposit base token and receive share token in return
    function deposit(uint256 amount) public {
        uint256 totalBase = baseToken.balanceOf(address(this));
        uint256 totalShares = totalSupply();
        // For the first deposit mint 1:1
        if (totalShares == 0 || totalBase == 0) {
            _mint(msg.sender, amount);
        }
        // For the next deposits use existing proportion of shares to the base token balance to calculate minted amount
        else {
            _mint(msg.sender, (amount * totalShares) / totalBase);
        }
        // Transfer base tokens from the user to the contract
        baseToken.transferFrom(msg.sender, address(this), amount);
    }

    // Burn share tokens and receive base token back according to the current proportion
    function withdraw(uint256 share) public {
        uint256 totalBase = baseToken.balanceOf(address(this));
        uint256 totalShares = totalSupply();
        _burn(msg.sender, share);
        baseToken.transfer(msg.sender, (share * totalBase) / totalShares);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        require(from == address(0) || to == address(0), "Token not transferrable");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./WrappedToken.sol";
import "./FeeManager.sol";
import "./interfaces/IValidator.sol";
import "./interfaces/IWrappedTokenV0.sol";

contract Bridge is Ownable {
    using SafeERC20 for IERC20;

    enum TokenType {
        Native,
        WrappedV0,
        Wrapped
    }
    uint256 private constant SYSTEM_PRECISION = 9;

    event Sent(
        bytes4 tokenSource,
        bytes32 tokenSourceAddress,
        address sender,
        bytes32 indexed recipient,
        uint256 amount,
        uint256 indexed lockId,
        bytes4 destination
    );

    // Validator contract address
    address public validator;

    // Address to collect fee
    address public feeCollector;

    // Fee manager address
    address public feeManager;

    // Id of the blockchain
    bytes4 public blockchainId;

    // Native WETH address
    address public WETH;

    // Structure for token info
    struct TokenInfo {
        bytes4 tokenSource;
        bytes32 tokenSourceAddress;
        uint8 precision;
        TokenType tokenType;
    }

    // Map to get token info by its address
    mapping(address => TokenInfo) public tokenInfos;

    constructor(
        bytes4 blockchainId_,
        address feeCollector_,
        address feeManager_,
        address validator_,
        address WETH_
    ) {
        blockchainId = blockchainId_;
        feeCollector = feeCollector_;
        feeManager = feeManager_;
        validator = validator_;
        WETH = WETH_;
    }

    // Method to lock tokens
    function lock(
        address tokenAddress,
        uint256 amount,
        bytes32 recipient,
        bytes4 destination
    ) external {
        (uint256 amountToLock, uint256 fee, TokenInfo memory tokenInfo) = _createLock(
            tokenAddress,
            amount,
            recipient,
            destination
        );

        if (tokenInfo.tokenType == TokenType.Native) {
            // If token is native - transfer tokens from user to contract
            IERC20(tokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                amountToLock
            );
        } else if (tokenInfo.tokenType == TokenType.WrappedV0) {
            // Legacy wrapped tokens burn
            IWrappedTokenV0(tokenAddress).burn(msg.sender, amountToLock);
        } else if (tokenInfo.tokenType == TokenType.Wrapped) {
            // If token is wrapped - burn tokens
            WrappedToken(tokenAddress).burn(msg.sender, amountToLock);
        } else {
            revert("Unknown token type");
        }

        if (fee > 0) {
            // If there is fee - transfer it to fee collector address
            IERC20(tokenAddress).safeTransferFrom(
                msg.sender,
                feeCollector,
                fee
            );
        }
    }

    function lockEth(bytes32 recipient, bytes4 destination) external payable {
        (, uint256 fee, ) = _createLock(
            WETH,
            msg.value,
            recipient,
            destination
        );

        if (fee > 0) {
            // If there is fee - transfer ETH to fee collector address
            payable(feeCollector).transfer(fee);
        }
    }

    // Private method to validate lock, create lock record, and emmit the event
    // Method returns amount to lock and token info structure
    function _createLock(
        address tokenAddress,
        uint256 amount,
        bytes32 recipient,
        bytes4 destination
    ) private returns (uint256, uint256, TokenInfo memory) {
        require(amount > 0, "Bridge: amount is 0");
        require(destination != blockchainId, "Bridge: source chain");
        TokenInfo memory tokenInfo = tokenInfos[tokenAddress];
        require(
            tokenInfo.tokenSourceAddress != bytes32(0),
            "Bridge: unsupported token"
        );

        uint256 fee = FeeManager(feeManager).fee(tokenAddress, msg.sender, amount);

        require(amount > fee, "Bridge: amount too small");

        // Amount to lock is amount without fee
        uint256 amountToLock = amount - fee;

        // Create and add lock structure to the locks list
        uint256 lockId = IValidator(validator).createLock(
            msg.sender,
            recipient,
            toSystemPrecision(amountToLock, tokenInfo.precision),
            destination,
            tokenInfo.tokenSource,
            tokenInfo.tokenSourceAddress
        );

        emit Sent(
            tokenInfo.tokenSource,
            tokenInfo.tokenSourceAddress,
            msg.sender,
            recipient,
            amountToLock,
            lockId,
            destination
        );
        return (amountToLock, fee, tokenInfo);
    }

    // Convert amount from token precision to system precision
    function toSystemPrecision(uint256 amount, uint8 precision)
        private
        pure
        returns (uint256)
    {
        if (precision > SYSTEM_PRECISION) {
            return amount / (10**(precision - SYSTEM_PRECISION));
        } else if (precision < SYSTEM_PRECISION) {
            return amount * (10**(SYSTEM_PRECISION - precision));
        } else {
            return amount;
        }
    }

    // Convert amount from system precision to token precision
    function fromSystemPrecision(uint256 amount, uint8 precision)
        private
        pure
        returns (uint256)
    {
        if (precision > SYSTEM_PRECISION) {
            return amount * (10**(precision - SYSTEM_PRECISION));
        } else if (precision < SYSTEM_PRECISION) {
            return amount / (10**(SYSTEM_PRECISION - precision));
        } else {
            return amount;
        }
    }
}

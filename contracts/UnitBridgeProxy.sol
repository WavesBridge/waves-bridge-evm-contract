// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IUnitNativeBridge} from "./interfaces/IUnitNativeBridge.sol";
import {IUnitStandardBridge} from "./interfaces/IUnitStandardBridge.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

pragma experimental ABIEncoderV2;

contract UnitBridgeProxy is Ownable {
    using SafeERC20 for IERC20;
    uint256 public baseFeeRateBP;
    uint256 public constant BP = 10000;
    IUnitNativeBridge public unitNativeBridge;
    IUnitStandardBridge public unitStandardBridge;
    // tokenAddress => mintFee
    mapping(address => uint256) public minFee;

    enum TokenType {
        Base,
        Native
    }

    // Address to collect fee
    address public feeCollector;

    // Structure for token info
    struct TokenInfo {
        bytes32 tokenSourceAddress;
        bytes4 tokenSource;
        uint8 precision;
        bool disableFee;
        TokenType tokenType;
    }

    // Map to get token info by its address
    mapping(address => TokenInfo) public tokenInfos;

    // Structure for getting tokenAddress by tokenSource and tokenSourceAddress
    // tokenSource => tokenSourceAddress => nativeAddress
    mapping(bytes4 => mapping(bytes32 => address)) public tokenSourceMap;


    constructor(
        address feeCollector_,
        IUnitNativeBridge unitNativeBridge_,
        IUnitStandardBridge unitStandardBridge_
    ) {
        feeCollector = feeCollector_;
        unitNativeBridge = unitNativeBridge_;
        unitStandardBridge = unitStandardBridge_;
    }

    // Method to lock tokens
    function lock(
        address tokenAddress,
        address recipient,
        uint256 amount
    ) external {
        require(amount > 0, "Bridge: amount is 0");
        TokenInfo memory tokenInfo = tokenInfos[tokenAddress];
        require(
            tokenInfo.tokenSourceAddress != bytes32(0),
            "Bridge: unsupported token"
        );
        require(tokenInfo.tokenType == TokenType.Native, "Bridge: invalid token type");

        uint256 fee = 0;
        if (!tokenInfo.disableFee) {
            fee = getFee(tokenAddress, amount);
        }

        require(amount > fee, "Bridge: amount too small");

        // Amount to lock is amount without fee
        uint256 amountToLock = amount - fee;

        IERC20(tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            amountToLock
        );
        unitStandardBridge.bridgeERC20(tokenAddress, recipient, amountToLock);

        if (fee > 0) {
            // If there is fee - transfer it to fee collector address
            IERC20(tokenAddress).safeTransferFrom(
                msg.sender,
                feeCollector,
                fee
            );
        }
    }

    function lockBase(address wrappedBaseTokenAddress, address recipient) external payable {
        require(msg.value > 0, "Bridge: amount is 0");
        TokenInfo memory tokenInfo = tokenInfos[wrappedBaseTokenAddress];
        require(
            tokenInfo.tokenSourceAddress != bytes32(0),
            "Bridge: unsupported token"
        );
        require(tokenInfo.tokenType == TokenType.Base, "Bridge: invalid token type");

        uint256 fee = 0;
        if (!tokenInfo.disableFee) {
            fee = getFee(wrappedBaseTokenAddress, msg.value);
        }

        require(msg.value > fee, "Bridge: amount too small");

        // Amount to lock is amount without fee
        uint256 amountToLock = msg.value - fee;

        unitNativeBridge.sendNative{value: amountToLock}(bytes20(recipient));

        if (fee > 0) {
            // If there is fee - transfer ETH to fee collector address
            payable(feeCollector).transfer(fee);
        }
    }

    // Method to add token that already exist in the current blockchain
    // Fee has to be in system precision
    function addToken(
        bytes4 tokenSource,
        bytes32 tokenSourceAddress,
        address nativeTokenAddress,
        TokenType tokenType) external onlyOwner {
        require(
            tokenInfos[nativeTokenAddress].tokenSourceAddress == bytes32(0) &&
            tokenSourceMap[tokenSource][tokenSourceAddress] == address(0), "Bridge: exists");
        uint8 precision = 18;
        if (tokenType == TokenType.Native) {
            IERC20(nativeTokenAddress).approve(address(unitStandardBridge), type(uint).max);
            precision = ERC20(nativeTokenAddress).decimals();
        }

        tokenSourceMap[tokenSource][tokenSourceAddress] = nativeTokenAddress;
        tokenInfos[nativeTokenAddress] = TokenInfo(
            tokenSourceAddress,
            tokenSource,
            precision,
            false,
            tokenType);
    }

    // Method to remove token from lists
    function removeToken(
        bytes4 tokenSource,
        bytes32 tokenSourceAddress) external onlyOwner {
        address tokenAddress = tokenSourceMap[tokenSource][tokenSourceAddress];
        require(tokenAddress != address(0), "Bridge: token not found");

        delete tokenInfos[tokenAddress];
        delete tokenSourceMap[tokenSource][tokenSourceAddress];
    }

    function setFeeCollector(address _feeCollector) external onlyOwner {
        feeCollector = _feeCollector;
    }

    function setDisabledFee(address tokenAddress, bool disableFee) external onlyOwner {
        TokenInfo storage tokenInfo = tokenInfos[tokenAddress];
        require(
            tokenInfo.tokenSourceAddress != bytes32(0),
            "Bridge: unsupported token"
        );
        tokenInfo.disableFee = disableFee;
    }

    function setMinFee(address token, uint256 _minFee) public onlyOwner {
        minFee[token] = _minFee;
    }

    function setBaseFeeRate(uint256 baseFeeRateBP_) public onlyOwner {
        baseFeeRateBP = baseFeeRateBP_;
    }

    function getFee(address token, uint256 amount) public view returns (uint256) {
        uint256 _minFee = minFee[token];
        if (baseFeeRateBP == 0 || amount == 0) {
            return _minFee;
        }

        uint256 result = (amount * baseFeeRateBP) / BP;
        if (_minFee > 0 && result < _minFee) {
            return _minFee;
        } else {
            return result;
        }
    }
}

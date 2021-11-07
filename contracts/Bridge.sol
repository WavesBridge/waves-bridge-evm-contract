// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./WrappedToken.sol";
import "./FeeOracle.sol";
import "./interfaces/IValidator.sol";
import "./interfaces/IWrappedTokenV0.sol";

contract Bridge is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant TOKEN_MANAGER = keccak256("TOKEN_MANAGER");
    bytes32 public constant BRIDGE_MANAGER = keccak256("BRIDGE_MANAGER");
    bytes32 public constant STOP_MANAGER = keccak256("STOP_MANAGER");

    bool active;

    enum TokenType {
        Base,
        Native,
        WrappedV0,
        Wrapped
    }

    enum TokenStatus {
        Disabled,
        Enabled
    }

    uint256 private constant SYSTEM_PRECISION = 9;

    event Sent(
        bytes4 tokenSource,
        bytes32 tokenSourceAddress,
        address sender,
        bytes32 indexed recipient,
        uint256 amount,
        uint128 indexed lockId,
        bytes4 destination
    );
    event Received(address indexed recipient, address token, uint256 amount, uint128 indexed lockId, bytes4 source);

    // Validator contract address
    address public validator;

    // Address to collect fee
    address public feeCollector;

    // Fee manager address
    address public feeOracle;

    // Fee manager address
    address public unlockSigner;

    // Structure for token info
    struct TokenInfo {
        bytes4 tokenSource;
        bytes32 tokenSourceAddress;
        uint8 precision;
        TokenType tokenType;
        TokenStatus tokenStatus;
    }

    // Map to get token info by its address
    mapping(address => TokenInfo) public tokenInfos;

    // Structure for getting tokenAddress by tokenSource and tokenSourceAddress
    // tokenSource => tokenSourceAddress => nativeAddress
    mapping(bytes4 => mapping(bytes32 => address)) public tokenSourceMap;

    modifier isActive() {
        require(active, "Bridge: is not active");
        _;
    }

    constructor(
        address feeCollector_,
        address admin_,
        address validator_,
        address feeOracle_,
        address unlockSigner_
    ) {
        feeCollector = feeCollector_;
        validator = validator_;
        feeOracle = feeOracle_;
        _setupRole(DEFAULT_ADMIN_ROLE, admin_);
        unlockSigner = unlockSigner_;
        active = false;
    }

    // Method to lock tokens
    function lock(
        uint128 lockId,
        address tokenAddress,
        bytes32 recipient,
        bytes4 destination,
        uint256 amount
    ) external isActive {
        (uint256 amountToLock, uint256 fee, TokenInfo memory tokenInfo) = _createLock(
            lockId,
            tokenAddress,
            amount,
            recipient,
            destination
        );

        require(tokenInfo.tokenStatus == TokenStatus.Enabled, "Bridge: disabled token");

        if (tokenInfo.tokenType == TokenType.Native) {
            // If token is native - transfer tokens from user to contract
            IERC20(tokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                amountToLock
            );
        } else if (tokenInfo.tokenType == TokenType.Wrapped) {
            // If wrapped then butn the token
            WrappedToken(tokenAddress).burn(msg.sender, amountToLock);
        } else if (tokenInfo.tokenType == TokenType.WrappedV0) {
            // Legacy wrapped tokens burn
            IWrappedTokenV0(tokenAddress).burn(msg.sender, amountToLock);
        } else {
            revert("Bridge: invalid token type");
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

    function lockBase(
        uint128 lockId, 
        address wrappedBaseTokenAddress, 
        bytes32 recipient, 
        bytes4 destination) external payable isActive {
        (, uint256 fee, TokenInfo memory tokenInfo) = _createLock(
            lockId,
            wrappedBaseTokenAddress,
            msg.value,
            recipient,
            destination
        );

        require(tokenInfo.tokenStatus == TokenStatus.Enabled, "Bridge: disabled token");
        require(tokenInfo.tokenType == TokenType.Base, "Bridge: invalid token type");

        if (fee > 0) {
            // If there is fee - transfer ETH to fee collector address
            payable(feeCollector).transfer(fee);
        }
    }

    // Method unlock funds. Amount has to be in system precision
    function unlock(
        uint128 lockId,
        address recipient, uint256 amount,
        bytes4 lockSource, bytes4 tokenSource,
        bytes32 tokenSourceAddress,
        bytes calldata signature) external isActive {
        // Create message hash and validate the signature
        IValidator(validator).createUnlock(
                lockId,
                recipient,
                amount,
                lockSource,
                tokenSource,
                tokenSourceAddress,
                signature);

        // Mark lock as received
        address tokenAddress = tokenSourceMap[tokenSource][tokenSourceAddress];
        require(tokenAddress != address(0), "Bridge: unsupported token");
        TokenInfo memory tokenInfo = tokenInfos[tokenAddress];

        // Transform amount form system to token precision
        uint256 amountWithTokenPrecision = fromSystemPrecision(amount, tokenInfo.precision);
        uint256 fee = 0;
        if (msg.sender == unlockSigner) {
            fee = FeeOracle(feeOracle).minFee(tokenAddress);
            require(amountWithTokenPrecision > fee, "Bridge: amount too small");
            amountWithTokenPrecision = amountWithTokenPrecision - fee;
        }

        if (tokenInfo.tokenType == TokenType.Base) {
            // If token is WETH - transfer ETH
            payable(recipient).transfer(amountWithTokenPrecision);
            if (fee > 0) {
                payable(feeCollector).transfer(fee);
            }
        } else if (tokenInfo.tokenType == TokenType.Native) {
            // If token is native - transfer the token
            IERC20(tokenAddress).safeTransfer(recipient, amountWithTokenPrecision);
            if (fee > 0) {
                IERC20(tokenAddress).safeTransfer(feeCollector, fee);
            }
        } else if (tokenInfo.tokenType == TokenType.Wrapped) {
            // Else token is wrapped - mint tokens to the user
            WrappedToken(tokenAddress).mint(recipient, amountWithTokenPrecision);
            if (fee > 0) {
                WrappedToken(tokenAddress).mint(feeCollector, fee);
            }
        } else if (tokenInfo.tokenType == TokenType.WrappedV0) {
            // Legacy wrapped token
            IWrappedTokenV0(tokenAddress).mint(recipient, amountWithTokenPrecision);
            if (fee > 0) {
                IWrappedTokenV0(tokenAddress).mint(feeCollector, fee);
            }
        }

        emit Received(recipient, tokenAddress, amountWithTokenPrecision, lockId, lockSource);
    }

    // Method to add token that already exist in the current blockchain
    // Fee has to be in system precision
    // If token is wrapped, but it was deployed manually, isManualWrapped must be true
    function addToken(
        bytes4 tokenSource, 
        bytes32 tokenSourceAddress, 
        address nativeTokenAddress, 
        TokenType tokenType) external onlyRole(TOKEN_MANAGER) {
        require(
            tokenInfos[nativeTokenAddress].tokenSourceAddress == bytes32(0) &&
            tokenSourceMap[tokenSource][tokenSourceAddress] == address(0), "Bridge: exists");
        uint8 precision = ERC20(nativeTokenAddress).decimals();

        tokenSourceMap[tokenSource][tokenSourceAddress] = nativeTokenAddress;
        tokenInfos[nativeTokenAddress] = TokenInfo(
            tokenSource, 
            tokenSourceAddress, 
            precision, 
            tokenType, 
            TokenStatus.Enabled);
    }

    // Method to remove token from lists
    function removeToken(
        bytes4 tokenSource, 
        bytes32 tokenSourceAddress, 
        address newAuthority) external onlyRole(TOKEN_MANAGER) {
        require(newAuthority != address(0), "Bridge: zero address authority");
        address tokenAddress = tokenSourceMap[tokenSource][tokenSourceAddress];
        require(tokenAddress != address(0), "Bridge: token not found");
        TokenInfo memory tokenInfo = tokenInfos[tokenAddress];

        if (tokenInfo.tokenType == TokenType.Base && address(this).balance > 0) {
            payable(newAuthority).transfer(address(this).balance);
        }

        uint256 tokenBalance = IERC20(tokenAddress).balanceOf(address(this));
        if (tokenBalance > 0) {
            IERC20(tokenAddress).safeTransfer(newAuthority, tokenBalance);
        }

        if (tokenInfo.tokenType == TokenType.Wrapped) {
            WrappedToken(tokenAddress).transferOwnership(newAuthority);
        } else if (tokenInfo.tokenType == TokenType.WrappedV0) {
            IWrappedTokenV0(tokenAddress).changeAuthority(newAuthority);
        }

        delete tokenInfos[tokenAddress];
        delete tokenSourceMap[tokenSource][tokenSourceAddress];
    }

    function setFeeOracle(address _feeOracle) external onlyRole(TOKEN_MANAGER) {
        feeOracle = _feeOracle;
    }

    function setFeeCollector(address _feeCollector) external onlyRole(TOKEN_MANAGER) {
        feeCollector = _feeCollector;
    }

    function setValidator(address _validator ) external onlyRole(BRIDGE_MANAGER) {
        validator = _validator;
    }

    function setUnlockSigner(address _unlockSigner ) external onlyRole(BRIDGE_MANAGER) {
        unlockSigner = _unlockSigner;
    }

    function setTokenStatus(address tokenAddress, TokenStatus status)  external onlyRole(TOKEN_MANAGER) {
        require(tokenInfos[tokenAddress].tokenSourceAddress != bytes32(0), "Bridge: unsupported token");
        tokenInfos[tokenAddress].tokenStatus = status;
    }

    function startBridge() external onlyRole(BRIDGE_MANAGER) {
        active = true;
    }

    function stopBridge() external onlyRole(STOP_MANAGER) {
        active = false;
    }

    // Private method to validate lock, create lock record, and emmit the event
    // Method returns amount to lock and token info structure
    function _createLock(
        uint128 lockId,
        address tokenAddress,
        uint256 amount,
        bytes32 recipient,
        bytes4 destination
    ) private returns (uint256, uint256, TokenInfo memory) {
        require(amount > 0, "Bridge: amount is 0");
        TokenInfo memory tokenInfo = tokenInfos[tokenAddress];
        require(
            tokenInfo.tokenSourceAddress != bytes32(0),
            "Bridge: unsupported token"
        );

        uint256 fee = FeeOracle(feeOracle).fee(tokenAddress, msg.sender, amount, destination);

        require(amount > fee, "Bridge: amount too small");

        // Amount to lock is amount without fee
        uint256 amountToLock = amount - fee;

        // Create and add lock structure to the locks list
        IValidator(validator).createLock(
            lockId,
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

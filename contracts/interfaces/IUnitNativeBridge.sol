// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IUnitNativeBridge {
    function sendNative(bytes20 wavesRecipient) payable external;
}

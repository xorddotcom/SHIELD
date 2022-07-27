//  SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

interface IVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint[1] memory input
    ) external view returns (bool);
}

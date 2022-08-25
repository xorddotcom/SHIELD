// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./interfaces/IMultiplierVerifier.sol";

import "hardhat/console.sol";

/// @title A multiplier contract to proof a * b = c
/// @author Shield
/// @notice Use this contract as only starter kit template

contract Multiplier {
    IMultiplierVerifier public immutable verifier;

    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    constructor(IMultiplierVerifier _verifier) payable {
        verifier = _verifier;
    }

    /// @dev Verify proof that a * b = result
    /// @param _proof commitment proof
    function verify(Proof calldata _proof, uint256 result) public view {
        // Uncomment this line to print a log in your terminal
        // console.log("Unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);

        require(
            verifier.verifyProof(
                _proof.a,
                _proof.b,
                _proof.c,
                [uint256(result)]
            ),
            "Invalid verify proof"
        );
    }
}

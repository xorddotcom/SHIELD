/*
  @dev script file to update circom generated verifier
       solidity file version to 0.8.0
*/
const fs = require("fs");
const solidityRegex = /pragma solidity \^\d+\.\d+\.\d+/

let content = fs.readFileSync("./contracts/Verifier.sol", { encoding: 'utf-8' });

let interfaceContent = fs.readFileSync("./contracts/interfaces/IVerifier.sol", { encoding: 'utf-8' })

const inputVariable = content.split("uint[2] memory c,")[1].split(")")[0].trim("")

let interfaceBumped = interfaceContent.replace("uint256[1] memory input", inputVariable);

let bumped = content.replace(solidityRegex, 'pragma solidity ^0.8.0');

fs.writeFileSync("./contracts/Verifier.sol", bumped);
fs.writeFileSync("./contracts/interfaces/IVerifier.sol", interfaceBumped);
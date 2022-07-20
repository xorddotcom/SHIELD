/*
  @dev script file to update circom generated verifier
       solidity file version to 0.8.0
*/

const fs = require('fs');

const solidityRegex = /pragma solidity \^\d+\.\d+\.\d+/;

let content = fs.readFileSync('./contracts/Verifier.sol', {
  encoding: 'utf-8',
});
let bumped = content.replace(solidityRegex, 'pragma solidity ^0.8.0');

fs.writeFileSync('./contracts/Verifier.sol', bumped);

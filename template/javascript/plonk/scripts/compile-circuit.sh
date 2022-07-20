#!/bin/bash

cd circuits

if [ -f ./build ]; then
  echo "build dir already exists..."
  cd build
else
  echo 'creating build dir...'
  mkdir build
  cd build
fi

if [ -f ./Multiplier ]; then
  echo "build dir already exists..."
else
  echo 'creating Multiplier dir...'
  mkdir Multiplier
fi

if [ -f ./powersOfTau28_hez_final_10.ptau ]; then
  echo "powersOfTau28_hez_final_10.ptau already exists. Skipping."
else
  echo 'Downloading powersOfTau28_hez_final_10.ptau'
  wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau
fi

echo "Compiling Multiplier.circom..."

# compile circuit

circom ../Multiplier.circom --r1cs --wasm --sym -o Multiplier

cd Multiplier
snarkjs r1cs info Multiplier.r1cs

# Start a new zkey and make a contribution

snarkjs plonk setup Multiplier.r1cs ../powersOfTau28_hez_final_10.ptau circuit_final.zkey
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

# # generate solidity contract
snarkjs zkey export solidityverifier circuit_final.zkey ../../../contracts/Verifier.sol

# cd ..

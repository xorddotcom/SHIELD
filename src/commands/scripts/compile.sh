#!/bin/bash

ROOT_PATH=$(pwd)
INPUT_BASE_PATH=$1
OUTPUT_BASE_PATH=$2
PTAU=$3
CIRCUIT_NAME=$4
PROTOCOL=$5
CIRCUIT_PATH=$6
ZKEY=$7
CONTRIBUTION=$8
ENTROPY=$9
OUTPUT_BASE_NAME=${OUTPUT_BASE_PATH//./}
OUTPUT_BASE_NAME=${OUTPUT_BASE_NAME//\//}




if [ -d $OUTPUT_BASE_PATH ]; then
  echo "${OUTPUT_BASE_NAME} dir already exists..."
  cd $OUTPUT_BASE_PATH
else
  echo "creating ${OUTPUT_BASE_NAME} dir..."
  mkdir $OUTPUT_BASE_PATH
  cd $OUTPUT_BASE_PATH
fi

if [ -d "./${CIRCUIT_NAME}" ]; then
  echo "${CIRCUIT_NAME} dir already exists..."
else
  echo "creating ${CIRCUIT_NAME} dir..."
  mkdir "./${CIRCUIT_NAME}"
fi

cd "${ROOT_PATH}"
echo "${INPUT_BASE_PATH}${PTAU}"
if [ -f "${INPUT_BASE_PATH}${PTAU}" ]; then
  echo "${PTAU} already exists. Skipping."
else
  echo "Downloading ${PTAU}"
  wget -O "${INPUT_BASE_PATH}${PTAU}" https://hermez.s3-eu-west-1.amazonaws.com/$PTAU
fi

echo "Compiling ${CIRCUIT_NAME}..."

# # compile circuit

circom "$INPUT_BASE_PATH$CIRCUIT_PATH" --r1cs --wasm --sym -o $OUTPUT_BASE_PATH$CIRCUIT_NAME

# log circuit info
snarkjs r1cs info "$OUTPUT_BASE_PATH$CIRCUIT_NAME/$CIRCUIT_NAME.r1cs"

# # Start a new zkey and make a contribution

if [ "$PROTOCOL" = "groth16" ]; then
  snarkjs $PROTOCOL setup "$OUTPUT_BASE_PATH$CIRCUIT_NAME/$CIRCUIT_NAME.r1cs" "${INPUT_BASE_PATH}${PTAU}" "${OUTPUT_BASE_PATH}${CIRCUIT_NAME}/circuit_0000.zkey"
  snarkjs zkey contribute "${OUTPUT_BASE_PATH}${CIRCUIT_NAME}/circuit_0000.zkey" "${OUTPUT_BASE_PATH}${CIRCUIT_NAME}/${ZKEY}" --name="$CONTRIBUTION" -v -e="$ENTROPY"
else
  snarkjs $PROTOCOL setup "$OUTPUT_BASE_PATH$CIRCUIT_NAME/$CIRCUIT_NAME.r1cs" "${INPUT_BASE_PATH}${PTAU}" "${OUTPUT_BASE_PATH}${CIRCUIT_NAME}/${ZKEY}"
fi
snarkjs zkey export verificationkey "${OUTPUT_BASE_PATH}${CIRCUIT_NAME}/${ZKEY}" "${OUTPUT_BASE_PATH}${CIRCUIT_NAME}/verification_key.json"

if [ -d "./contracts" ]; then
  echo "contracts dir already exists..."
else
  echo "creating contracts dir..."
  mkdir "./contracts"
fi

# # # generate solidity contract
snarkjs zkey export solidityverifier "${OUTPUT_BASE_PATH}${CIRCUIT_NAME}/${ZKEY}" "./contracts/${CIRCUIT_NAME}_Verifier.sol"

# # cd ..

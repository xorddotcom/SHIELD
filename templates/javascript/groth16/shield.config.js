module.exports = {
  // (optional) solidity version for compiled contracts, defaults to `^0.8.0`
  solidity: "^0.8.0",
  circom: {
    // (optional) Base path for files being read, defaults to `./circuits/`
    inputBasePath: "./circuits/",
    // (optional) Base path for files being output, defaults to `./circuits/`
    outputBasePath: "./build/",
    // (required) The final ptau file, relative to inputBasePath, from a Phase 1 ceremony
    ptau: "powersOfTau28_hez_final_10.ptau",
    // (required) Each object in this array refers to a separate circuit
    circuits: [
      {
        // (required) The name of the circuit
        name: "Multiplier",
        // (optional) Protocol used to build circuits ("groth16" or "plonk"), defaults to "groth16"
        protocol: "groth16",
        // (optional) Input path for circuit file, inferred from `name` if unspecified
        circuit: "Multiplier.circom",
        // (optional) Output path for zkey file, inferred from `name` if unspecified
        zkey: "Multiplier.zkey",
      },
    ],
  },
};

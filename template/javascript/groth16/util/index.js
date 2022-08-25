const path = require("path");
const { groth16 } = require("snarkjs");

const prove = async (witness) => {
  const wasmPath = path.join(
    __dirname,
    "../build/Multiplier/Multiplier_js/Multiplier.wasm"
  );
  const zkeyPath = path.join(__dirname, "../build/Multiplier/Multiplier.zkey");
  const { proof, publicSignals } = await groth16.fullProve(
    witness,
    wasmPath,
    zkeyPath
  );

  const solProof = {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ],
    c: [proof.pi_c[0], proof.pi_c[1]],
  };
  return { solProof, publicSignals };
};

module.exports = { prove }
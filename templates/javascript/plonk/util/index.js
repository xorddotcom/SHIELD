const path = require('path');
const { plonk } = require('snarkjs');

const prove = async (witness) => {
  const wasmPath = path.join(
    __dirname,
    "../build/Multiplier/Multiplier_js/Multiplier.wasm"
  );
  const zkeyPath = path.join(
    __dirname,
    "../build/Multiplier/Multiplier.zkey"
  );

  const { proof: _proof, publicSignals: _publicSignals } = await plonk.fullProve(
    witness,
    wasmPath,
    zkeyPath
  );

  const calldata = await plonk.exportSolidityCallData(_proof, _publicSignals)

  const calldataSplit = calldata.split(",");

  const [proof, ...rest] = calldataSplit;

  const publicSignals = JSON.parse(rest.join(",")).map((x) =>
    BigInt(x).toString()
  );

  return { proof, publicSignals };

};

module.exports = { prove }
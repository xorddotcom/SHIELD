const path = require('path');
const { groth16, plonk } = require('snarkjs');



function unstringifyBigInts(o) {
  if ((typeof (o) == "string") && (/^[0-9]+$/.test(o))) {
    return BigInt(o);
  } else if ((typeof (o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o))) {
    return BigInt(o);
  } else if (Array.isArray(o)) {
    return o.map(unstringifyBigInts);
  } else if (typeof o == "object") {
    if (o === null) return null;
    const res = {};
    const keys = Object.keys(o);
    keys.forEach((k) => {
      res[k] = unstringifyBigInts(o[k]);
    });
    return res;
  } else {
    return o;
  }
}



const prove = async (witness) => {
  const wasmPath = path.join(
    __dirname,
    "../circuits/build/Multiplier/Multiplier_js/Multiplier.wasm"
  );
  const zkeyPath = path.join(
    __dirname,
    "../circuits/build/Multiplier/circuit_final.zkey"
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
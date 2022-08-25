import { BigNumberish } from "ethers";
import path from "path";
// @ts-ignore
import { plonk } from "snarkjs";

export type Witness = {
  a: number;
  b: number;
  c: number;
};

export type ProveProps = {
  proof: string;
  publicSignals: Array<string>;
};

export const prove = async (witness: Witness): Promise<ProveProps> => {
  const wasmPath = path.join(
    __dirname,
    "../build/Multiplier/Multiplier_js/Multiplier.wasm"
  );
  const zkeyPath = path.join(__dirname, "../build/Multiplier/Multiplier.zkey");

  const { proof: _proof, publicSignals: _publicSignals } =
    await plonk.fullProve(witness, wasmPath, zkeyPath);

  const calldata = await plonk.exportSolidityCallData(_proof, _publicSignals);

  const calldataSplit = calldata.split(",");

  const [proof, ...rest] = calldataSplit;

  const publicSignals = JSON.parse(rest.join(",")).map(
    (x: string | number | bigint | boolean) => BigInt(x).toString()
  );

  return { proof, publicSignals };
};

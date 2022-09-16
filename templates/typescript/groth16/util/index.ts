import { BigNumberish } from "ethers";
import path from "path";
// @ts-ignore
import { groth16 } from "snarkjs";

export type Witness = {
  a: number;
  b: number;
  c: number;
};

export type ProveProps = {
  solProof: Proof;
  publicSignals: Array<string>;
};

export type Proof = {
  a: [BigNumberish, BigNumberish];
  b: [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]];
  c: [BigNumberish, BigNumberish];
};

export const prove = async (witness: Witness): Promise<ProveProps> => {
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

  const solProof: Proof = {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ],
    c: [proof.pi_c[0], proof.pi_c[1]],
  };
  return { solProof, publicSignals };
};

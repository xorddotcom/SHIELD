import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { expect, assert } from "chai";
import { ethers } from "hardhat";
// @ts-ignore
import { F1Field, Scalar } from "ffjavascript";
import { Proof, prove, Witness } from "../util";
import { MultiplierVerifier } from "../typechain-types";
import { Multiplier } from "../typechain-types/Multiplier";
const wasm_tester = require("circom_tester").wasm;

exports.p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

const Fr = new F1Field(exports.p);

describe("Multiplier", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function deployMultiplierFixture() {
    const Verifier = await ethers.getContractFactory("MultiplierVerifier");
    const verifier: MultiplierVerifier = await Verifier.deploy();

    const Multiplier = await ethers.getContractFactory("Multiplier");
    const multiplier: Multiplier = await Multiplier.deploy(verifier.address);

    return { multiplier };
  }

  describe("Circuit test", function () {
    it("Multipler test", async () => {
      const circuit = await wasm_tester("circuits/Multiplier.circom");
      await circuit.loadConstraints();

      const INPUT: Witness = {
        a: 2,
        b: 3,
        c: 6,
      };

      const witness = await circuit.calculateWitness(INPUT, true);

      assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
      assert(Fr.eq(Fr.e(witness[1]), Fr.e(6)));
    });
  });

  describe("Verifier Contract test", function () {
    it("Should return true for correct proofs", async function () {
      const { multiplier } = await loadFixture(deployMultiplierFixture);

      const witness: Witness = {
        a: 1,
        b: 2,
        c: 2,
      };

      const { solProof, publicSignals } = await prove(witness);

      expect(await multiplier.verify(solProof, publicSignals[0])).not.to.be
        .reverted;
    });
    it("Should return false for invalid proof", async function () {
      const { multiplier } = await loadFixture(deployMultiplierFixture);

      const solProof: Proof = {
        a: [0, 0],
        b: [
          [0, 0],
          [0, 0],
        ],
        c: [0, 0],
      };

      await expect(multiplier.verify(solProof, 0)).to.be.revertedWith(
        "Invalid verify proof"
      );
    });
  });
});

const {
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");

const { prove } = require('../util');
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);



describe("Multiplier", function () {

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function deployMultiplierFixture() {

    const Verifier = await ethers.getContractFactory("PlonkVerifier");
    const verifier = await Verifier.deploy();

    const witness = {
      a: 1, b: 2, c: 2
    };

    const { solProof, publicSignals } = await prove(witness);


    const Multiplier = await ethers.getContractFactory("Multiplier");
    const multiplier = await Multiplier.deploy(verifier.address);

    return { multiplier };
  }


  describe("Circuit test", function () {

    it("Multipler test", async () => {
      const circuit = await wasm_tester("circuits/Multiplier.circom");
      await circuit.loadConstraints();

      const INPUT = {
        "a": 2,
        "b": 3,
        "c": 6,
      }

      const witness = await circuit.calculateWitness(INPUT, true);

      assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
      assert(Fr.eq(Fr.e(witness[1]), Fr.e(6)));
    });
  });

  describe("Verifier Contract test", function () {

    it("Should return true for correct proofs", async function () {

      const { multiplier } = await loadFixture(deployMultiplierFixture);

      const witness = {
        a: 8, b: 8, c: 64
      };

      const { proof, publicSignals } = await prove(witness);

      expect(await multiplier.verify(proof, publicSignals)).not.to.be.reverted;
    });
    it("Should return false for invalid proof", async function () {
      const { multiplier } = await loadFixture(deployMultiplierFixture);

      const proof = "0x03896d7417666c918f914b33a43ef194be83756403c2fda42f6480b8865d2a7f1ba219448ef3ef6c06e27065658d94e60959cc1a7df9e8c89e27bdd8e4eb793e199bca81ba3b36feda7d21ee610431c9adf55ecc67d689d82788b80b44bebc0f2f05dc3c2a41e625244a8f391cab073f0620ecdb4ba8743feca9bc9ffacd53bd0a2040a56fb7442739ff852fffb33988aed5d27d23a3033ded2a43ad23ba9f3c13d05452a6ae5557d3e3fd3efce2eb49dc9a59ba195010f372eab31899a6a9f0125230bd7697a3ffbd50c88b0db7785508ae43805d6a6139a58b79a41e79de4325af1b21d0cfa8399827855526b582bb9396bb4107dea5f61c93f7bcc07fdef630441a16d59db56bc894e8392f99a77fed3f1318b0cf26f25d9adca7a4a1aeb600b1d55fedb8040e9ec9fe23cecd9aaf4df441ba8fbff4233025f65ba268a0d404de0bdd541528696268208065f7be99d58610998afef4f83085ca13e212fb6d047db4b880b4983c7f88fae8da4a95ff0acb50ef6ee7fdaca243b616226e3e5a300d5a7b0eb954667a00fde2e5a52924fdbf10c9f43eb63667c39e4acb4327c901a1b22d6f42e7e2f1d079d38774fa601738b9cbf6684bb9361a03c1260cfadc1d1262e9f414579c2b10a9c66f511631119e05b6f5cc0872ecf3f1ca3af084f41256c040b935d3f075bc995950837f92afe35bad087dea0784e3bb026bfd73d8170d237820f0631b510d6bd4041a998ac9d174800758f3c67e2ba44e72bb07b417e4a390e3657ecd912a93afc8c1ed74c3ca1bd14b9994c11a0966231c534d3813d2d3e6f72693e10c9be769da6d016c7b27bc07d9e56f9d60adead0073dba9c0bbf073f81224846e728ec8befdac77c7a69225ffc8c7bd6eac5b928375772e8100ace9f6767b6cadd9b9a162e0b4e8772f62ed2cda16723992287e66a13ceff0dd11865ccb10daa9140fc0e40a9add51ac400d71283500cf3cb80179bf598251ad44f5812ee323fc8f1b8b10a1b591d97f43d0683064740f0d8b5d1093e6f1e294f54dced4adffd15a99259f341747bb9ce7738e2ba04b511466e4c7bbb7fb628f6577f252a444f6e7d36bb8cedcff7b0ba19e828bd28c752a0cb4bf0c1632c"

      await expect(multiplier.verify(proof, ["666"])).to.be.revertedWith(
        "Invalid verify proof"
      );
    });
  });
});




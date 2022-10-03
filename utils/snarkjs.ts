// @ts-ignore
import bfj from "bfj";
// @ts-ignore
import { utils, Scalar } from "ffjavascript";
import fs from "fs";
import path from "path";
import shelljs from "shelljs";
import fsExtra from "fs-extra";
import { fileExists } from "./utils";
import { log } from "./logger";
import { wtnsBuilder } from "./witness";
// @ts-ignore
import * as fastFile from "fastfile";
const { zKey, plonk, wtns } = require("snarkjs");
const { stringifyBigInts, unstringifyBigInts } = utils;
import {
  createBinFile,
  endWriteSection,
  startWriteSection,
  writeBigInt,
  // @ts-ignore
} from "@iden3/binfileutils";

export const WrappedSnarkJs = {
  groth16: {
    setup: async (r1csPath: string, ptauPath: string, zkeyPath: string) => {
      try {
        const response = await zKey.newZKey(r1csPath, ptauPath, zkeyPath);
        if (response) {
          log(`\n✓ Successful Groth16 setup\n`, "success");
        }
        return response;
      } catch (error) {
        log(`${error}`, "error");
        throw error;
      }
    },
    contribute: async (
      zkeyPath: string,
      finalZkPath: string,
      contributer: string,
      entropy: string
    ) => {
      try {
        const response = await zKey.contribute(
          zkeyPath,
          finalZkPath,
          contributer,
          entropy
        );
        if (response) {
          log(`✓ Contributed`, "success");
          log(`\n✓ Successfully generated the final zkey file\n`, "success");
        }
        return response;
      } catch (error) {
        log(`${error}`, "error");
        throw error;
      }
    },
  },
  plonk: {
    setup: async (r1csPath: string, ptauPath: string, zkeyPath: string) => {
      try {
        const response = await plonk.setup(r1csPath, ptauPath, zkeyPath);
        if (response) {
          log(`\n✓ Successful Plonk setup\n`, "success");
        }
        return response;
      } catch (error) {
        log(`${error}`, "error");
        throw error;
      }
    },
  },
  util: {
    generateVkey: async (zkeyPath: string, vKeyPath: string) => {
      try {
        const vKey = await zKey.exportVerificationKey(zkeyPath);
        await bfj.write(vKeyPath, stringifyBigInts(vKey), { space: 1 });
        if (vKey) {
          log(
            `\n✓ Successfully generated the verification key file\n`,
            "success"
          );
        }
      } catch (error) {
        log(`${error}`, "error");
        throw error;
      }
    },
    generateSolidityVerifier: async (
      zkeyPath: string,
      solidityPath: string
    ) => {
      try {
        const templates = { groth16: "", plonk: "" };

        fsExtra.createFileSync(solidityPath);

        templates.groth16 = await fs.promises.readFile(
          path.join(
            __dirname,
            "..",
            "..",
            "templates/ejs",
            "verifier_groth16.sol.ejs"
          ),
          "utf8"
        );
        templates.plonk = await fs.promises.readFile(
          path.join(
            __dirname,
            "..",
            "..",
            "templates/ejs",
            "verifier_plonk.sol.ejs"
          ),
          "utf8"
        );
        const response = await zKey.exportSolidityVerifier(zkeyPath, templates);
        fs.writeFileSync(solidityPath, response, "utf-8");
        if (response) {
          log(
            `\n✓ Successfully generated the solidity verifier file\n`,
            "success"
          );
        }
        return response;
      } catch (error) {
        log(`${error}`, "error");
        throw error;
      }
    },
    downloadPtau: async (ptauPath: string, ptau: string) => {
      try {
        if (await fileExists(ptauPath)) {
          log(
            `\n${ptau} file already exist at ${ptauPath}, skipping this step\n`,
            "warning"
          );
        } else {
          const ptauCmd = `wget -O "${ptauPath}" https://hermez.s3-eu-west-1.amazonaws.com/${ptau}`;
          shelljs.exec(ptauCmd);
          log(`\n✓ Successfully generated the ${ptau} file\n`, "success");
        }
      } catch (error) {
        log(`${error}`, "error");
        throw error;
      }
    },
    generateWtns: async (wtnsPath: string, wasmPath: string, input: any) => {
      try {
        const _input = unstringifyBigInts(input);

        const fdWasm = await fastFile.readExisting(wasmPath);
        const wasm = await fdWasm.read(fdWasm.totalSize);
        await fdWasm.close();

        const wc = await wtnsBuilder(wasm, {
          log() {},
        });
        let w;
        if (wc.circom_version() == 1) {
          w = await wc.calculateBinWitness(_input, true);

          const fdWtns = await createBinFile(wtnsPath, "wtns", 2, 2);

          await writeBin(fdWtns, w, wc.prime);

          await fdWtns.close();
        } else {
          const fdWtns = await fastFile.createOverride(wtnsPath);

          w = await wc.calculateWTNSBin(_input, true);

          await fdWtns.write(w);
          await fdWtns.close();
        }

        const wtnsData = await wtns.exportJson(wtnsPath);
        await bfj.write(
          wtnsPath.replace(".wtns", ".json"),
          stringifyBigInts(wtnsData),
          { space: 1 }
        );
        if (wtnsData) {
          log(`✓ Successfully generated the witness file`, "success");
        }
        return w;
      } catch (error) {
        log(`${error}`, "error");
        throw error;
      }
    },
  },
};

async function writeBin(fd: any, witnessBin: any, prime: any) {
  await startWriteSection(fd, 1);
  const n8 = (Math.floor((Scalar.bitLength(prime) - 1) / 64) + 1) * 8;
  await fd.writeULE32(n8);
  await writeBigInt(fd, prime, n8);
  if (witnessBin.byteLength % n8 != 0) {
    throw new Error("Invalid witness length");
  }
  await fd.writeULE32(witnessBin.byteLength / n8);
  await endWriteSection(fd);

  await startWriteSection(fd, 2);
  await fd.write(witnessBin);
  await endWriteSection(fd);
}

// @ts-ignore
import bfj from "bfj";
// @ts-ignore
import { utils } from "ffjavascript";
import fs from "fs";
import path from "path";
import shelljs from "shelljs";
import fsExtra from "fs-extra";
import { fileExists } from "./utils";
import { log } from "./logger";
import { wtnsBuilder } from "./witness";
// @ts-ignore
import * as fastFile from "fastfile";
const { zKey, plonk } = require("snarkjs");
const { stringifyBigInts } = utils;
// @ts-ignore

const DEFAULT_NODE_ARGS = "--max-old-space-size=8192 --stack-size=65500";
const NODE_ARGS = process.env.NODE_ARGS || DEFAULT_NODE_ARGS;
const NODE_CMD = `node ${NODE_ARGS}`;

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
        const fdWasm = await fastFile.readExisting(wasmPath);
        const wasm = await fdWasm.read(fdWasm.totalSize);
        await fdWasm.close();

        const logs = [];

        const witness = await wtnsBuilder(wasm, {
          log(message: bigint, label?: string) {
            if (label) {
              logs.push(label + ": " + message.toString());
            } else {
              logs.push(message.toString());
            }
          },
        });

        const witnessBinFile = await witness.calculateWTNSBin(input, true);

        const fsWtns = await fastFile.createOverride(wtnsPath);

        await fsWtns.write(witnessBinFile);
        await fsWtns.close();

        const snarkjsPath = path.join(
          require.resolve("snarkjs"),
          "..",
          "cli.cjs"
        );

        const command = `${NODE_CMD} ${snarkjsPath} wej ${wtnsPath} ${wtnsPath.replace(
          ".wtns",
          ".json"
        )}`;

        shelljs.exec(command);

        if (witnessBinFile) {
          log(`✓ Successfully generated the witness file`, "success");
        }

        return witnessBinFile;
      } catch (error) {
        log(`${error}`, "error");
        throw error;
      }
    },
  },
};

function defaultWitnessOption() {
  let logFn = console.log;
  let calculateWitnessOptions = {
    sanityCheck: true,
    logTrigger: logFn,
    logOutput: logFn,
    logStartComponent: logFn,
    logFinishComponent: logFn,
    logSetSignal: logFn,
    logGetSignal: logFn,
  };
  return calculateWitnessOptions;
}

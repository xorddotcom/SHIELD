const { zKey ,plonk } = require("snarkjs");
// @ts-ignore
import bfj from "bfj";
// @ts-ignore
import { utils } from "ffjavascript";
import fs from "fs";
import path from "path";
import shelljs from "shelljs";
import { log } from "./logger";
import { fileExists } from "./utils";
const { stringifyBigInts } = utils;

export const groth16Setup = async (
  r1csPath: string,
  ptauPath: string,
  zkeyPath: string
) => {
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
};

export const plonkSetup = async (
  r1csPath: string,
  ptauPath: string,
  zkeyPath: string
) => {
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
};

export const groth16Contribute = async (
  zkeyPath: string,
  finalZkPath: string,
  contributer: string,
  entropy: string
) => {
  try {
    const response = zKey.contribute(
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
};

export const verificationFile = async (zkeyPath: string, vKeyPath: string) => {
  try {
    const vKey = await zKey.exportVerificationKey(zkeyPath);
    await bfj.write(vKeyPath, stringifyBigInts(vKey), { space: 1 });
    if (vKey) {
      log(`\n✓ Successfully generated the verification key file\n`, "success");
    }
  } catch (error) {
    log(`${error}`, "error");
    throw error;
  }
};

export const solidityVerifier = async (
  zkeyPath: string,
  solidityPath: string
) => {
  try {
    const templates = { groth16: "", plonk: "" };

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
      log(`\n✓ Successfully generated the solidity verifier file\n`, "success");
    }
    return response;
  } catch (error) {
    log(`${error}`, "error");
    throw error;
  }
};

export const downloadPtauFile = async (ptauPath: string, ptau: string) => {
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
};

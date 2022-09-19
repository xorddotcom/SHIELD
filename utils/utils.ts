import path from "path";
import fsExtra from "fs-extra";
import { log } from "./logger";
import fs from "fs";
export const indexDist = "node ../../dist/src/index.js";

const groth16InterfaceContent = (
  inputVariable: string,
  CIRCUIT_NAME: string,
  SOLIDITY_VERSION: string
) => {
  return `
    //  SPDX-License-Identifier: GPL-3.0-only

    pragma solidity ${SOLIDITY_VERSION};

     interface I${CIRCUIT_NAME}Verifier {
         function verifyProof(
             uint256[2] calldata a,
             uint256[2][2] calldata b,
             uint256[2] calldata c,
             ${inputVariable}
         ) external view returns (bool);
    }`;
};

const plonkInterfaceContent = (
  inputVariable: string,
  CIRCUIT_NAME: string,
  SOLIDITY_VERSION: string
) => {
  return `
   //  SPDX-License-Identifier: GPL-3.0-only

   pragma solidity ${SOLIDITY_VERSION};

   interface I${CIRCUIT_NAME}Verifier {
      function verifyProof(bytes memory proof, ${inputVariable})
         external
         view
         returns (bool);
  }`;
};

export const getEmptyDirByPath = async (path: string, exitCode: number) => {
  const dir = await fsExtra.ensureDir(path);
  if (dir === undefined) {
    log(`"${path}" dir already exist`, "info");
    if (exitCode === 1) {
      process.exit(1);
    }
    return;
  }
  log(`✓ "${path}" dir created`, "success");
  await fsExtra.emptyDir(path);
  return path;
};

export const getEmptyDir = async (name: string, exitCode: number) => {
  try {
    const tmpDir = path.join(process.cwd(), `/${name}`);
    const dir = await fsExtra.ensureDir(tmpDir);
    if (dir === undefined) {
      log(
        `A folder named "${name}" already exist, delete or move it to somewhere else and try again!!`,
        "error"
      );
      if (exitCode === 1) {
        process.exit(1);
      }
    }
    await fsExtra.emptyDir(tmpDir);
    return tmpDir;
  } catch (error) {
    log(`${error}`, "error");
    throw error;
  }
};

export const fileExists = async (file: fsExtra.PathLike) => {
  return fs.promises
    .access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
};

export const updateCopyProjectName = async (
  name: string,
  projectPath: string
) => {
  try {
    const packageJsonPath = path.join(projectPath, `/package.json`);
    const packageJson = fsExtra.readJsonSync(packageJsonPath);

    packageJson.name = name;

    const res = await fsExtra.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 3)
    );
    return res;
  } catch (error) {
    log(
      "unable to locate the package.json file or rewrite the project name",
      "error"
    );
    return null;
  }
};

export const createInterface = async (
  CIRCUIT_NAME: string,
  protocol: string,
  content: string,
  SOLIDITY_VERSION: string
) => {
  try {
    const tmpDir = path.join(process.cwd(), `/contracts/interfaces`);
    await fsExtra.ensureDir(tmpDir);
    await fsExtra.createFileSync(
      `./contracts/interfaces/I${CIRCUIT_NAME}Verifier.sol`
    );

    let inputVariable = "";
    let interfaceBumped = "";
    if (protocol === "groth16") {
      inputVariable = content
        .split("uint[2] memory c,")[1]
        .split(")")[0]
        .trim();

      interfaceBumped = groth16InterfaceContent(
        inputVariable,
        CIRCUIT_NAME,
        SOLIDITY_VERSION
      );
    } else {
      inputVariable = content
        .split("bytes memory proof,")[1]
        .split(")")[0]
        .trim();
      interfaceBumped = plonkInterfaceContent(
        inputVariable,
        CIRCUIT_NAME,
        SOLIDITY_VERSION
      );
    }

    await fsExtra.writeFileSync(
      `./contracts/interfaces/I${CIRCUIT_NAME}Verifier.sol`,
      interfaceBumped
    );
  } catch (error) {
    log(`${error}`, "error");
    throw error;
  }
};

export const bumpSolidityVersion = async (
  SOLIDITY_VERSION: string,
  CIRCUIT_NAME: string,
  PROTOCOL: string
) => {
  try {
    const solidityRegex = /pragma solidity \^\d+\.\d+\.\d+/;

    const content = fsExtra.readFileSync(
      `./contracts/${CIRCUIT_NAME}_Verifier.sol`,
      {
        encoding: "utf-8",
      }
    );

    await createInterface(CIRCUIT_NAME, PROTOCOL, content, SOLIDITY_VERSION);

    const bumped = content.replace(
      solidityRegex,
      "pragma solidity " + SOLIDITY_VERSION
    );

    let bumpedContractName = "";

    if (PROTOCOL === "groth16") {
      bumpedContractName = bumped.replace(
        "contract Verifier",
        `contract ${CIRCUIT_NAME}Verifier`
      );
    } else {
      bumpedContractName = bumped.replace(
        "contract PlonkVerifier",
        `contract ${CIRCUIT_NAME}Verifier`
      );
    }

    fsExtra.writeFileSync(
      `./contracts/${CIRCUIT_NAME}_Verifier.sol`,
      bumpedContractName
    );
  } catch (error) {
    log(`${error}`, "error");
    throw error;
  }
};

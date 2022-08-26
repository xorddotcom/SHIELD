import path from "path";
import fsExtra from "fs-extra";
import { log } from "./logger";

export const indexDist = "node ../../dist/src/index.js";

const groth16InterfaceContent = (
  inputVariable: string,
  CIRCUIT_NAME: string
) => {
  return `
    //  SPDX-License-Identifier: GPL-3.0-only

    pragma solidity ^0.8.0;

     interface I${CIRCUIT_NAME}Verifier {
         function verifyProof(
             uint256[2] calldata a,
             uint256[2][2] calldata b,
             uint256[2] calldata c,
             ${inputVariable}
         ) external view returns (bool);
    }`;
};

const plonkInterfaceContent = (inputVariable: string, CIRCUIT_NAME: string) => {
  return `
   //  SPDX-License-Identifier: GPL-3.0-only

   pragma solidity ^0.8.0;

   interface I${CIRCUIT_NAME}Verifier {
      function verifyProof(bytes memory proof, ${inputVariable})
         external
         view
         returns (bool);
  }`;
};

export const getEmptyDir = async (name: string) => {
  const tmpDir = path.join(process.cwd(), `/${name}`);
  const dir = await fsExtra.ensureDir(tmpDir);
  if (dir === undefined) {
    log(
      `A folder named "${name}" already exist, delete or move it to somewhere else and try again!!`,
      "error"
    );
    process.exit(1);
  }
  await fsExtra.emptyDir(tmpDir);
  return tmpDir;
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
  } catch (e) {
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
  content: string
) => {
  const tmpDir = path.join(process.cwd(), `/contracts/interfaces`);
  await fsExtra.ensureDir(tmpDir);

  fsExtra.createFileSync(`./contracts/interfaces/I${CIRCUIT_NAME}Verifier.sol`);

  let inputVariable = "";
  let interfaceBumped = "";
  if (protocol === "groth16") {
    inputVariable = content.split("uint[2] memory c,")[1].split(")")[0].trim();
    interfaceBumped = groth16InterfaceContent(inputVariable, CIRCUIT_NAME);
  } else {
    inputVariable = content
      .split("bytes memory proof,")[1]
      .split(")")[0]
      .trim();

    interfaceBumped = plonkInterfaceContent(inputVariable, CIRCUIT_NAME);
  }

  fsExtra.writeFileSync(
    `./contracts/interfaces/I${CIRCUIT_NAME}Verifier.sol`,
    interfaceBumped
  );
};

export const bumpSolidityVersion = async (
  CIRCUIT_NAME: string,
  protocol: string
) => {
  try {
    const solidityRegex = /pragma solidity \^\d+\.\d+\.\d+/;

    const content = fsExtra.readFileSync(
      `./contracts/${CIRCUIT_NAME}_Verifier.sol`,
      {
        encoding: "utf-8",
      }
    );

    createInterface(CIRCUIT_NAME, protocol, content);

    const bumped = content.replace(solidityRegex, "pragma solidity ^0.8.0");

    let bumpedContractName = "";

    if (protocol === "groth16") {
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
  } catch (e) {
    throw e;
  }
};

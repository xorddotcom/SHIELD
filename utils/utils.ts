import chalk from "chalk";
import path from "path";
import fsExtra from "fs-extra";

export const indexDist = "node ../../dist/src/index.js";

export const getEmptyDir = async (name: string) => {
  const tmpDir = path.join(process.cwd(), `/${name}`);
  console.log({ tmpDir });
  const dir = await fsExtra.ensureDir(tmpDir);
  console.log({ dir });
  if (dir === undefined) {
    console.log(
      chalk.red(
        `A folder named "${name}" already exist, delete or move it to somewhere else and try again!!`
      )
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
    console.log(e);
    return null;
  }
};

export const updateCompileCircuit = async (
  projectPath: string,
  contributionName: string,
  entropy: string
) => {
  try {
    const filePath = path.join(projectPath, `/scripts/compile-circuit.sh`);
    let fileContent: Buffer | string = await fsExtra.readFile(filePath);

    fileContent = fileContent
      .toString()
      .replace("1st Contributor Name", contributionName);

    fileContent = fileContent.toString().replace("random text", entropy);

    const res = await fsExtra.writeFile(filePath, fileContent);
    return res;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const bumpSolidityVersion = (CIRCUIT_NAME: string) => {
  try {
    const solidityRegex = /pragma solidity \^\d+\.\d+\.\d+/;

    const content = fsExtra.readFileSync(
      `./contracts/${CIRCUIT_NAME}_Verifier.sol`,
      {
        encoding: "utf-8",
      }
    );

    const interfaceContent = fsExtra.readFileSync(
      `./contracts/interfaces/I${CIRCUIT_NAME}Verifier.sol`,
      { encoding: "utf-8" }
    );

    const inputVariable = content
      .split("uint[2] memory c,")[1]
      .split(")")[0]
      .trim();

    const interfaceBumped = interfaceContent.replace(
      "uint256[1] memory input",
      inputVariable
    );

    const bumped = content.replace(solidityRegex, "pragma solidity ^0.8.0");
    const bumpedContractName = bumped.replace(
      "contract Verifier",
      `contract ${CIRCUIT_NAME}Verifier`
    );

    fsExtra.writeFileSync(
      `./contracts/${CIRCUIT_NAME}_Verifier.sol`,
      bumpedContractName
    );
    fsExtra.writeFileSync(
      `./contracts/interfaces/I${CIRCUIT_NAME}Verifier.sol`,
      interfaceBumped
    );
  } catch (e) {
    throw e;
  }
};

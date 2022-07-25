import ora from "ora";
import path from "path";
import chalk from "chalk";
import fsExtra from "fs-extra";
import Enquirer from "enquirer";
import { spawn } from "child_process";

import { getPackageRoot } from "../../utils/packageInfo.js";
import { Reporter } from "../../sentry/index.js";

const { prompt } = Enquirer;

export const init = async () => {
  try {
    let projectName = "";
    let projectPath = "";
    let projectLanguage = "";
    let proofSystem = "";
    let contributionName = "";
    const response = await prompt([
      {
        type: "input",
        name: "folderName",
        message: "Please enter the name of project?",
        initial: "shield-demo",
        onSubmit: async (name, value) => {
          value = value.trim();
          if (
            value &&
            /^[^\s^\x00-\x1f\\?*:"";<>|\/.][^\x00-\x1f\\?*:"";<>|\/]*[^\s^\x00-\x1f\\?*:"";<>|\/.]+$/.test(
              value
            )
          ) {
            console.log("");
            const temp = await getEmptyDir(value.trim());
            projectName = value.trim();
          } else {
            printNameValidationError();
            process.exit(1);
          }
        },
      },
      {
        type: "select",
        name: "language",
        message: "Please select the language for project.",
        choices: ["Javascript", "Typescript"],
        result: async (value) => {
          projectLanguage = value.toLowerCase();
        },
      },
      {
        type: "select",
        name: "proofSystem",
        message: "Please select the proof system for project.",
        choices: ["Groth16", "Plonk"],
        result: async (value) => {
          try {
            proofSystem = value;
            const src = `${getPackageRoot()}/template/${projectLanguage}/${value.toLowerCase()}`;
            const dest = `${process.cwd()}/${projectName}`;
            projectPath = dest;
            if (value === "Plonk") {
              await fsExtra.copy(src, dest);
              await updateGeneratedProjectName(projectName, projectPath);
              console.log(
                chalk.greenBright("Successfully generated the code.")
              );
            }
          } catch (e) {
            console.log(
              chalk.red(
                e.message ? e.message : "Error while generating the code."
              )
            );
            Reporter.reportError(e);
            process.exit(1)
          }
        },
      },
      {
        type: "input",
        name: "contributerName",
        message: "Please enter the contribution name for groth16 setup?",
        initial: "1st Contributor Name",
        skip: () => proofSystem === "Plonk",
        onSubmit: async (name, value) => {
          if (proofSystem === "Groth16") {
            contributionName = value;
          }
        },
      },
      {
        type: "input",
        name: "entropy",
        message: "Please enter the entropy for groth16 setup?",
        initial: "random text",
        skip: () => proofSystem === "Plonk",
        onSubmit: async (name, value) => {
          try {
            if (proofSystem === "Groth16") {
              const src = `${getPackageRoot()}/template/${projectLanguage}/groth16`;
              const dest = `${process.cwd()}/${projectName}`;
              await fsExtra.copy(src, dest);
              await updateCompileCircuit(dest, contributionName, value);
              await updateGeneratedProjectName(projectName, dest);
              console.log("");
              console.log(
                chalk.greenBright("Successfully generated the code.")
              );
            }
          } catch (e) {
            console.log(
              chalk.red(
                e.message ? e.message : "Error while generating the code."
              )
            );
            Reporter.reportError(e);
            process.exit(1)
          }
        },
      },
      {
        type: "select",
        name: "package",
        message: "Please select the package manager for project.",
        choices: ["npm", "yarn"],
        result: (val) => {
          try {
            const spinner = ora(
              chalk.greenBright("Installing Dependencies...")
            ).start();
            const OS = /^win/.test(process.platform) ? "win" : "linux";
            const command =
              val == "npm"
                ? OS === "win"
                  ? "npm.cmd"
                  : "npm"
                : OS === "win"
                ? "yarn.cmd"
                : "yarn";
            const args = val == "npm" ? ["install"] : [];
            const dependencies = spawn(command, args, { cwd: projectPath });
            dependencies.stdout.on("data", (data) => {
              console.log(data.toString());
            });
            dependencies.stderr.once("data", () => {
              spinner.stopAndPersist();
            });
            dependencies.stderr.on("data", (data) => {
              console.log(data.toString());
            });
            dependencies.stdout.once("close", (data) => {
              spinner.succeed(
                chalk.greenBright("Dependencies succesfully installed.")
              );
              console.log("");
              console.log(chalk.greenBright("Happy coding :)"));
            });
          } catch (e) {
            console.log(
              chalk.red(e.message ? e.message : "Error while installing deps.")
            );
            Reporter.reportError(e);
            process.exit(1)
          }
        },
      },
    ]);
  } catch (e) {
    console.log(chalk.red(e.message ? e.message : "Aborted."));
    Reporter.reportError(e);
    process.exit(1)
  }
};

const printNameValidationError = () => {
  console.log("");
  console.log(chalk.red("Kindly enter a valid name."));
  console.log("");
  console.log(chalk.red("A valid name cannot have following attributes."));
  console.log("");
  console.log(
    chalk.red(`The characters not allowed at the beginning or the end are:
- Blank space
- Dot (.)`)
  );
  console.log("");
  console.log(
    chalk.red(`The characters not allowed in any place in the folder name are:
- Asterisk (*)
- Backslash ()
- Colon (:)
- Double quote (")
- Forward slash (/)
- Greater than (>)
- Less than (<)
- Question mark (?)
- Vertical bar or pipe (|)`)
  );
};

async function getEmptyDir(name) {
  const tmpDir = path.join(process.cwd(), `/${name}`);
  const dir = await fsExtra.ensureDir(tmpDir);
  if (!dir) {
    console.log(
      chalk.red(
        `A folder named "${name}" already exist, delete or move it to somewhere else and try again!!`
      )
    );
    process.exit(1);
  }
  const empty = await fsExtra.emptyDir(tmpDir);

  return tmpDir;
}

async function updateGeneratedProjectName(name, projectPath) {
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
}

async function updateCompileCircuit(projectPath, contributionName, entropy) {
  try {
    const filePath = path.join(projectPath, `/scripts/compile-circuit.sh`);
    let fileContent = await fsExtra.readFile(filePath);

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
}

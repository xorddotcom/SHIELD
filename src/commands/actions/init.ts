import chalk from "chalk";
import Enquirer from "enquirer";
import fsExtra from "fs-extra";
import { spawn } from "child_process";
import ora from "ora";
import { printNameValidationError } from "../../../utils/error";
import {
  getEmptyDir,
  updateCopyProjectName,
  updateCompileCircuit,
} from "../../../utils/utils";
import { getPackageRoot } from "../../../utils/packageInfo";

const { prompt } = Enquirer;

export const init = async () => {
  try {
    let projectName = "";
    let projectPath = "";
    let projectLanguage = "";
    let proofSystem = "";
    let contributionName = "";
    await prompt([
      {
        type: "input",
        name: "folderName",
        message: "Please enter the name of project?",
        initial: "shield-demo",
        onSubmit: async (name, value): Promise<boolean> => {
          value = value.trim();
          if (
            value &&
            /^[^\s^\x00-\x1f\\?*:"";<>|\/.][^\x00-\x1f\\?*:"";<>|\/]*[^\s^\x00-\x1f\\?*:"";<>|\/.]+$/.test(
              value
            )
          ) {
            await getEmptyDir(value.trim());
            projectName = value.trim();
            return true;
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
        result: async (value): Promise<string> => {
          projectLanguage = value.toLowerCase();
          return projectLanguage;
        },
      },
      {
        type: "select",
        name: "proofSystem",
        message: "Please select the proof system for project.",
        choices: ["Groth16", "Plonk"],
        result: async (value) => {
          proofSystem = value;
          const src = `${getPackageRoot()}/template/${projectLanguage}/${value.toLowerCase()}`;
          const dest = `${process.cwd()}/${projectName}`;
          projectPath = dest;
          if (value === "Plonk") {
            await fsExtra.copy(src, dest);
            await updateCopyProjectName(projectName, projectPath);
            console.log(chalk.greenBright("Successfully generated the code."));
          }
          return dest;
        },
      },
      {
        type: "input",
        name: "contributerName",
        message: "Please enter the contribution name for groth16 setup?",
        initial: "1st Contributor Name",
        skip: () => proofSystem === "Plonk",
        onSubmit: async (name, value): Promise<boolean> => {
          if (proofSystem === "Groth16") {
            contributionName = value;
          }
          return true;
        },
      },
      {
        type: "input",
        name: "entropy",
        message: "Please enter the entropy for groth16 setup?",
        initial: "random text",
        skip: () => proofSystem === "Plonk",
        onSubmit: async (name, value): Promise<boolean> => {
          if (proofSystem === "Groth16") {
            const src = `${getPackageRoot()}/template/${projectLanguage}/groth16`;
            const dest = `${process.cwd()}/${projectName}`;
            await fsExtra.copy(src, dest);
            await updateCompileCircuit(dest, contributionName, value);
            await updateCopyProjectName(projectName, dest);
            console.log("");
            console.log(chalk.greenBright("Successfully generated the code."));
          }
          return true;
        },
      },
      {
        type: "select",
        name: "package",
        message: "Please select the package manager for project.",
        choices: ["npm", "yarn"],
        result: (val) => {
          const spinner = ora(
            chalk.greenBright("Installing Dependencies...")
          ).start();
          const OS = /^win/.test(process.platform) ? "win" : "linux";
          const command =
            val === "npm"
              ? OS === "win"
                ? "npm.cmd"
                : "npm"
              : OS === "win"
              ? "yarn.cmd"
              : "yarn";
          const args = val === "npm" ? ["install"] : [];
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
          dependencies.stdout.once("close", () => {
            spinner.succeed(
              chalk.greenBright("Dependencies succesfully installed.")
            );
            console.log("");
            console.log(chalk.greenBright("Happy coding :)"));
          });
          return "Happy coding :)";
        },
      },
    ]);
  } catch (error) {
    let errorMessage = "Aborted.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.log(chalk.red(errorMessage));
  }
};

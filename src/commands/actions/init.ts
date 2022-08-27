import chalk from "chalk";
import Enquirer from "enquirer";
import fsExtra from "fs-extra";
import { spawn } from "child_process";
import ora from "ora";
import { printNameValidationError } from "../../../utils/error";
import { getEmptyDir, updateCopyProjectName } from "../../../utils/utils";
import { getPackageRoot } from "../../../utils/packageInfo";
import { log } from "../../../utils/logger";
const { prompt } = Enquirer;
export const init = async () => {
  try {
    let projectName = "";
    let projectPath = "";
    let type = "";
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
            /^[^\s^\x00-\x1f\\?:"";<>|\/.][^\x00-\x1f\\?:"";<>|\/][^\s^\x00-\x1f\\?:"";<>|\/.]+$/.test(
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
        name: "projectType",
        message: "What do you want to do?.",
        choices: [
          {
            name: "Javascript",
            message: "Create a Javascript project?",
            value: "type",
          },
          {
            name: "Typescript",
            message: "Create a Typescript project?",
            value: "type",
          },
          {
            name: "Empty",
            message: "Create an empty shield.config.js?",
            value: "type",
          },
          {
            name: "Quit",
            message: "Quit",
            value: "type",
          },
        ],
        result: async (value) => {
          type = value;
          if (type === "Quit") {
            process.exit(1);
          } else if (type === "Empty") {
            const src = `${getPackageRoot()}/template/config`;
            const dest = `${process.cwd()}/${projectName}`;
            projectPath = dest;
            await fsExtra.copy(src, dest);
            log("Successfully generated the config file.", "success");
            process.exit(1);
          }
          return value;
        },
      },
      {
        type: "select",
        name: "proofSystem",
        message: "Please select the proof system for project.",
        choices: ["Groth16", "Plonk"],
        result: async (value) => {
          const src = `${getPackageRoot()}/template/${type.toLowerCase()}/${value.toLowerCase()}`;
          const dest = `${process.cwd()}/${projectName}`;
          projectPath = dest;
          await fsExtra.copy(src, dest);
          await updateCopyProjectName(projectName, projectPath);
          log("Successfully generated the code.", "success");
          return dest;
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
            log(data.toString(), "info");
          });
          dependencies.stderr.once("data", () => {
            spinner.stopAndPersist();
          });
          dependencies.stderr.on("data", (data) => {
            log(data.toString(), "info");
          });
          dependencies.stdout.once("close", () => {
            spinner.succeed(
              chalk.greenBright("Dependencies succesfully installed.")
            );
            log("\nHappy Coding :)", "success");
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
    log(errorMessage, "error");
  }
};

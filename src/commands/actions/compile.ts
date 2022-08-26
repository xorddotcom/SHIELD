/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/no-unused-vars */
import chalk from "chalk";
import { spawn } from "child_process";
import { prompt } from "enquirer";
import ora from "ora";
import fsExtra from "fs-extra";
import { getPackageRoot } from "../../../utils/packageInfo";
import { bumpSolidityVersion } from "../../../utils/utils";
import { log } from "../../../utils/logger";

enum Protocol {
  GROTH16 = "groth16",
  PLONK = "plonk",
}

interface Contributions {
  [key: string]: {
    contributerName: string;
    randomEntropy: string;
  };
}

interface ICircuits {
  name: string;
  protocol?: Protocol;
  circuit?: string;
  zkey?: string;
}
interface IUserConfig {
  solidity?: string;
  circom: {
    inputBasePath?: string;
    outputBasePath?: string;
    ptau: string;
    circuits: ICircuits[];
  };
}

export const compile = async (options: any) => {
  try {
    let userConfig: IUserConfig;
    let circuits: ICircuits[];
    const defaultConfig: IUserConfig = {
      solidity: "^0.8.0",
      circom: {
        inputBasePath: "./circuits/",
        outputBasePath: "./build/",
        ptau: "",
        circuits: [],
      },
    };

    try {
      userConfig = require(`${process.cwd()}/shield.config.js`);
      circuits = userConfig.circom.circuits;
      if (options.circuit) {
        circuits = circuits.filter((circuit) => {
          return circuit.name === options.circuit;
        });
      }

      if (!userConfig.circom) {
        log(
          "unable to locate circom user defined config in file shield.config.js.",
          "error"
        );
        process.exit(1);
      } else if (!userConfig.circom.ptau) {
        log(
          "please define the ptau file name in file shield.config.js.",
          "error"
        );
        process.exit(1);
      } else if (!circuits.length) {
        log(
          "please define the circuit details for compilation of circuits in file shield.config.js.",
          "error"
        );
        process.exit(1);
      } else {
        for (let i = 0; i < circuits.length; i++) {
          if (!circuits[i].name) {
            log(
              "please define the circuit name for compilation of the circuit in file shield.config.js.",
              "error"
            );
            process.exit(1);
          }
          if (!circuits[i].protocol) {
            circuits[i].protocol = Protocol.GROTH16;
          }
          if (!circuits[i].zkey) {
            circuits[i].zkey = circuits[i].name;
          }
          if (!circuits[i].circuit) {
            circuits[i].circuit = `${circuits[i].name}.circom`;
          }
        }
      }
    } catch (e) {
      log("unable to locate shield config file.", "error");
      process.exit(1);
    }

    const finalConfig: IUserConfig = {
      solidity: userConfig.solidity
        ? userConfig.solidity
        : defaultConfig.solidity,
      circom: {
        inputBasePath: userConfig.circom.inputBasePath
          ? userConfig.circom.inputBasePath
          : defaultConfig.circom.inputBasePath,
        outputBasePath: userConfig.circom.outputBasePath
          ? userConfig.circom.outputBasePath
          : defaultConfig.circom.outputBasePath,
        ptau: userConfig.circom.ptau,
        circuits,
      },
    };

    const contributions: Contributions = {};
    for (let i = 0; i < finalConfig.circom.circuits.length; i++) {
      try {
        fsExtra.readFileSync(
          `${process.cwd()}/${finalConfig.circom.inputBasePath}${
            circuits[i].name
          }.circom`,
          {
            encoding: "utf-8",
          }
        );
      } catch (e) {
        log(
          `unable to read file ${process.cwd()}/${
            finalConfig.circom.inputBasePath
          }${circuits[i].name}.circom`,
          "warning"
        );
        continue;
      }

      if (finalConfig.circom.circuits[i].protocol === "groth16") {
        await prompt([
          {
            type: "input",
            name: "contributerName",
            message: `Please enter the contribution of ${finalConfig.circom.circuits[i].name} circuit for groth16 setup?`,
            initial: "1st Contributor Name",
            result: async (value): Promise<string> => {
              contributions[`${finalConfig.circom.circuits[i].name}`] = {
                contributerName: value.toLowerCase(),
                randomEntropy: "random text",
              };
              return value.toLowerCase();
            },
          },
          {
            type: "input",
            name: "entropy",
            message: `Please enter the entropy of ${finalConfig.circom.circuits[i].name} for groth16 setup?`,
            initial: "random text",
            result: async (value): Promise<string> => {
              contributions[
                `${finalConfig.circom.circuits[i].name}`
              ].randomEntropy = value.toLowerCase();
              return value.toLowerCase();
            },
          },
        ]);
      }
    }

    for (let i = 0; i < finalConfig.circom.circuits.length; i++) {
      const spinner = ora(
        chalk.greenBright(`Compiling ${finalConfig.circom.circuits[i].name}`)
      ).start();

      const contribution = contributions[finalConfig.circom.circuits[i].name];

      const executeCompile = spawn("bash", [
        `${getPackageRoot()}/src/commands/scripts/compile.sh`,
        finalConfig.circom.inputBasePath as string,
        finalConfig.circom.outputBasePath as string,
        finalConfig.circom.ptau,
        finalConfig.circom.circuits[i].name,
        finalConfig.circom.circuits[i].protocol as string,
        finalConfig.circom.circuits[i].circuit as string,
        finalConfig.circom.circuits[i].zkey as string,
        contribution ? contribution.contributerName : "",
        contribution ? contribution.randomEntropy : "",
      ]);

      executeCompile.stdout.on("data", (data) => log(data.toString(), "info"));
      executeCompile.stderr.on("data", (data) => log(data.toString(), "info"));
      executeCompile.stdout.once("close", () => {
        bumpSolidityVersion(
          finalConfig.circom.circuits[i].name,
          finalConfig.circom.circuits[i].protocol as string
        );
        spinner.succeed(
          chalk.greenBright(
            `${finalConfig.circom.circuits[i].name} succesfully compiled.`
          )
        );
      });
    }
  } catch (e: any) {
    log(e.message, "error");
  }
};

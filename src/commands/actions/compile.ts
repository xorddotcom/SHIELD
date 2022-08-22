/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/no-unused-vars */
import chalk from "chalk";
import { spawn } from "child_process";
import { getPackageRoot } from "../../../utils/packageInfo";
import { bumpSolidityVersion } from "../../../utils/utils";

enum Protocol {
  GROTH16 = "groth16",
  PLONK = "plonk",
}
interface ICircuits {
  name: string;
  protocol?: Protocol;
  circuit?: string;
  input?: string;
  wasm?: string;
  zkey?: string;
  beacon?: string;
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
export const compile = async () => {
  try {
    let userConfig: IUserConfig;
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
      if (!userConfig.circom) {
        console.log(
          chalk.red(
            "unable to locate circom user defined config in file shield.config.js."
          )
        );
        process.exit(1);
      } else if (!userConfig.circom.ptau) {
        console.log(
          chalk.red(
            "please define the ptau file name in file shield.config.js."
          )
        );
        process.exit(1);
      } else if (!userConfig.circom.circuits.length) {
        console.log(
          chalk.red(
            "please define the circuit details for compilation of circuits in file shield.config.js."
          )
        );
        process.exit(1);
      } else {
        for (let i = 0; i < userConfig.circom.circuits.length; i++) {
          if (!userConfig.circom.circuits[i].name) {
            console.log(
              chalk.red(
                "please define the circuit name for compilation of the circuit in file shield.config.js."
              )
            );
            process.exit(1);
          }
          if (!userConfig.circom.circuits[i].protocol) {
            userConfig.circom.circuits[i].protocol = Protocol.GROTH16;
          }
          if (!userConfig.circom.circuits[i].wasm) {
            userConfig.circom.circuits[i].wasm =
              userConfig.circom.circuits[i].name;
          }
          if (!userConfig.circom.circuits[i].zkey) {
            userConfig.circom.circuits[i].zkey =
              userConfig.circom.circuits[i].name;
          }
          if (!userConfig.circom.circuits[i].circuit) {
            userConfig.circom.circuits[
              i
            ].circuit = `${userConfig.circom.circuits[i].name}.circom`;
          }
        }
      }
    } catch (e) {
      console.log(e);
      console.log(chalk.red("unable to locate shield config file."));
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
        circuits: [...userConfig.circom.circuits],
      },
    };
    console.log("final config --", finalConfig);

    for (let i = 0; i < finalConfig.circom.circuits.length; i++) {
      const executeCompile = spawn("bash", [
        `${getPackageRoot()}/src/commands/scripts/compile.sh`,
        finalConfig.circom.inputBasePath as string,
        finalConfig.circom.outputBasePath as string,
        finalConfig.circom.ptau,
        finalConfig.circom.circuits[i].name,
        finalConfig.circom.circuits[i].protocol as string,
        finalConfig.circom.circuits[i].circuit as string,
        finalConfig.circom.circuits[i].zkey as string,
      ]);
      executeCompile.stdout.on("data", (data) => console.log(data.toString()));
      executeCompile.stderr.on("data", (data) => console.log(data.toString()));
      executeCompile.stdout.once("close", () => {
        bumpSolidityVersion(finalConfig.circom.circuits[i].name);
      });
    }
  } catch (e: any) {
    console.log(e.message);
    // throw e;
  }
};

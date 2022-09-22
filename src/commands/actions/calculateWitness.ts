/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/no-unused-vars */
import chalk from "chalk";
import ora from "ora";
import { log } from "../../../utils/logger";
import { initFS } from "../../../utils/wasm";
import {
  fileExists,
  getEmptyDir,
  getEmptyDirByPath,
} from "../../../utils/utils";
import { builder } from "../../../utils/witness";
import ufs from "@phated/unionfs";
import path from "path";
import { WrappedSnarkJs } from "../../../utils/snarkjs";

const { utils } = require("ffjavascript");

enum Protocol {
  GROTH16 = "groth16",
  PLONK = "plonk",
}

interface ICircuits {
  name: string;
  protocol?: Protocol;
  circuit?: string;
  zkey?: string;
  witness?: string;
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

export const generateWitness = async (options: any) => {
  console.log("generating witness");
  try {
    let userConfig: IUserConfig;
    let circuits: ICircuits[];
    const defaultConfig: IUserConfig = {
      solidity: "^0.8.0",
      circom: {
        inputBasePath: "/circuits",
        outputBasePath: "/build",
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

    const wasmFs = await initFS();

    const outputBasePath = `${process.cwd()}${
      finalConfig.circom.outputBasePath as string
    }`;

    for (let i = 0; i < finalConfig.circom.circuits.length; i++) {
      const circuitName = finalConfig.circom.circuits[i].name;

      const circuitPath = `${process.cwd()}${
        finalConfig.circom.inputBasePath as string
      }/${finalConfig.circom.circuits[i].circuit as string}`;

      const wtnsFilePath = `${process.cwd()}${
        finalConfig.circom.inputBasePath as string
      }/witness.wtns`;

      const wasmPath = `${outputBasePath}/${circuitName}/${circuitName}_js/${circuitName}.wasm`;

      const inputFilePath = `${process.cwd()}${
        finalConfig.circom.inputBasePath as string
      }/${finalConfig.circom.circuits[i].witness as string}`;

      console.log({ inputFilePath });

      if (await fileExists(inputFilePath)) {
        const spinner = ora(
          chalk.greenBright(`Compiling ${circuitName}\n`)
        ).start();

        const wasmData = ufs.readFileSync(wasmPath);

        let logs;

        try {
          const witness = await builder(wasmData, {
            log(message: any, label: string) {
              if (label) {
                console.log("labellllllssss =============>", {
                  label,
                  message,
                });
                logs.push(label + ": " + message.toString());
              } else {
                console.log("labellllllssss =============>", {
                  label,
                  message,
                });
                logs.push(message.toString());
              }
            },
          });

          const inputFileData = await wasmFs.readFileSync(
            inputFilePath,
            "utf8"
          );

          const input = utils.unstringifyBigInts(JSON.parse(inputFileData));

          const wtnsFile = await witness.calculateWTNSBin(input, true);

          await WrappedSnarkJs.util.generateWtns(wtnsFilePath, wasmPath, input);

          spinner.succeed(
            chalk.greenBright(`${circuitName} succesfully compiled.`)
          );
        } catch (err) {
          console.log("error in generate witness", err);
        }
      } else {
        log(
          `unable to locate ${finalConfig.circom.circuits[i].witness} at dir ${inputFilePath} user defined config in file shield.config.js.`,
          "error"
        );
      }
    }
    process.exit(0);
  } catch (e: any) {
    log(e.message, "error");
  }
};

/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/no-unused-vars */
import chalk from "chalk";
import ora from "ora";
import { log, logSignals } from "../../../utils/logger";
import { initFS } from "../../../utils/wasm";
import { fileExists } from "../../../utils/utils";
import { WrappedSnarkJs } from "../../../utils/snarkjs";
import { Checker } from "../../../utils/checker";
// @ts-ignore
import { load } from "r1csfile";
// @ts-ignore
import { utils } from "ffjavascript";

enum Protocol {
  GROTH16 = "groth16",
  PLONK = "plonk",
}

interface ICircuits {
  name: string;
  protocol?: Protocol;
  circuit?: string;
  zkey?: string;
  input?: string;
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

export const debug = async (options: any) => {
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

      const spinner = ora(
        chalk.greenBright(`Debugging ${circuitName}\n`)
      ).start();

      const wtnsFilePath = `${process.cwd()}${
        finalConfig.circom.inputBasePath as string
      }/${finalConfig.circom.circuits[i].name}_witness.wtns`;

      const wasmFilePath = `${outputBasePath}/${circuitName}/${circuitName}_js/${circuitName}.wasm`;

      const r1csFilePath = `${outputBasePath}/${circuitName}/${circuitName}.r1cs`;

      const symFilePath = `${outputBasePath}/${circuitName}/${circuitName}.sym`;

      if (!(await fileExists(wasmFilePath))) {
        log(
          `\nUnable to locate ${circuitName}.wasm at dir ${wasmFilePath}, run shield compile to generate .wasm file in this output dir`,
          "error"
        );
        continue;
      }

      if (!(await fileExists(r1csFilePath))) {
        log(
          `\nUnable to locate file ${circuitName}.r1cs at dir ${r1csFilePath}, run shield compile to generate .r1cs file in this output dir`,
          "error"
        );
        continue;
      }

      if (!(await fileExists(symFilePath))) {
        log(
          `\nUnable to locate file ${circuitName}.sym at dir ${symFilePath}, run shield compile to generate .sym file in this output dir`,
          "error"
        );
        continue;
      }

      const inputFilePath = `${process.cwd()}${
        finalConfig.circom.inputBasePath as string
      }/${finalConfig.circom.circuits[i].input as string}`;

      if (await fileExists(inputFilePath)) {
        try {
          const inputFileData = await wasmFs.readFileSync(
            inputFilePath,
            "utf8"
          );

          const input = utils.unstringifyBigInts(JSON.parse(inputFileData));

          const wtnsFile = await WrappedSnarkJs.util.generateWtns(
            wtnsFilePath,
            wasmFilePath,
            input
          );

          const r1cs = await load(r1csFilePath, true, false);

          const symFile = await wasmFs.readFileSync(symFilePath);

          await logSignals(r1cs, wtnsFile, symFile);

          const checker = new Checker(r1csFilePath, symFilePath);

          await checker.checkConstraintsAndOutput(
            wtnsFilePath.replace(".wtns", ".json")
          );
          spinner.succeed(
            chalk.greenBright(`${circuitName} succesfully debugged.`)
          );
        } catch (error) {
          if (error instanceof Error) {
            spinner.fail(chalk.redBright(`${error.message}`));
          } else {
            log(
              `\nerror while debugging the circuit ${circuitName} ${error}`,
              "error"
            );
            spinner.fail(chalk.redBright(`${error}`));
          }
        }
      } else {
        log(
          `unable to locate ${finalConfig.circom.circuits[i].input} at dir ${inputFilePath} user defined config in file shield.config.js.`,
          "error"
        );
      }
    }
    process.exit(0);
  } catch (error: any) {
    log(error.message, "error");
  }
};

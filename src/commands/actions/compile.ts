/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/no-unused-vars */
import chalk from "chalk";
import { prompt } from "enquirer";
import ora from "ora";
import fsExtra from "fs-extra";
// @ts-ignore because they don't ship types
import { CircomRunner, bindings } from "circom2";
import { log } from "../../../utils/logger";
import {
  groth16Setup,
  groth16Contribute,
  verificationFile,
  solidityVerifier,
  downloadPtauFile,
  plonkSetup,
} from "../../../utils/snarkjs";
import { initFS } from "../../../utils/wasm";
import * as fs from "fs/promises";
import {
  bumpSolidityVersion,
  getEmptyDir,
  getEmptyDirByPath,
} from "../../../utils/utils";

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
  console.log("starting compile");
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

    const contributions: Contributions = {};
    for (let i = 0; i < finalConfig.circom.circuits.length; i++) {
      try {
        fsExtra.readFileSync(
          `${process.cwd()}${finalConfig.circom.inputBasePath}/${
            circuits[i].name
          }.circom`,
          {
            encoding: "utf-8",
          }
        );
      } catch (e) {
        log(
          `unable to read file ${process.cwd()}${
            finalConfig.circom.inputBasePath
          }/${circuits[i].name}.circom`,
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

    const wasmFs = await initFS();

    const outputBasePath = `${process.cwd()}${
      finalConfig.circom.outputBasePath as string
    }`;

    await getEmptyDirByPath(outputBasePath, 0);

    for (let i = 0; i < finalConfig.circom.circuits.length; i++) {
      const circuitName = finalConfig.circom.circuits[i].name;

      // Paths

      const circuitPath = `${process.cwd()}${
        finalConfig.circom.inputBasePath as string
      }/${finalConfig.circom.circuits[i].circuit as string}`;
      const ptauPath = `${outputBasePath}/${finalConfig.circom.ptau}`;
      const r1csPath = `${outputBasePath}/${circuitName}/${circuitName}.r1cs`;
      const zKeyPath = {
        zero: `${outputBasePath}/${circuitName}/circuit_0000.zkey`,
        final: `${outputBasePath}/${circuitName}/${finalConfig.circom.circuits[i].zkey}`,
      };
      const vKeyPath = `${outputBasePath}/${circuitName}/verification_key.json`;
      const solVerifierPath = `${process.cwd()}/contracts/${circuitName}_Verifier.sol`;
      const wasmPath = require.resolve("circom2/circom.wasm");

      await getEmptyDirByPath(`${outputBasePath}/${circuitName}`, 0);

      const spinner = ora(
        chalk.greenBright(`Compiling ${circuitName}\n`)
      ).start();

      const circom = new CircomRunner({
        args: [
          circuitPath,
          "--r1cs",
          "--wat",
          "--wasm",
          "--sym",
          "-o",
          `${outputBasePath}/${circuitName}`,
        ],
        env: {},
        preopens: {
          "/": "/",
        },
        bindings: {
          ...bindings,
          fs: wasmFs,
        },
        returnOnExit: true,
      });

      const circomWasm = await fs.readFile(wasmPath);

      try {
        await circom.execute(circomWasm);
      } catch (err) {
        if (`${err}` !== "RuntimeError: unreachable") {
          log(`${err}`, "error");
        }
      }

      await downloadPtauFile(ptauPath, finalConfig.circom.ptau);

      if (finalConfig.circom.circuits[i].protocol === "groth16") {
        await groth16Setup(r1csPath, ptauPath, zKeyPath.zero);

        const contribution = contributions[finalConfig.circom.circuits[i].name];

        await groth16Contribute(
          zKeyPath.zero,
          zKeyPath.final,
          contribution ? contribution.contributerName : "",
          contribution ? contribution.randomEntropy : ""
        );
      } else {
        await plonkSetup(r1csPath, ptauPath, zKeyPath.final);
      }

      await verificationFile(zKeyPath.final, vKeyPath);

      solidityVerifier(zKeyPath.final, solVerifierPath);

      bumpSolidityVersion(
        finalConfig.solidity ? finalConfig.solidity : "^0.8.0",
        circuitName,
        finalConfig.circom.circuits[i].protocol as string
      );
      spinner.succeed(
        chalk.greenBright(`${circuitName} succesfully compiled.`)
      );
    }
  } catch (e: any) {
    log(e.message, "error");
  }
};

const chalk = require("chalk");
// @ts-ignore
import { readBinFile, readSection } from "@iden3/binfileutils";
import { readWtnsHeader } from "./witness";
// @ts-ignore
import { Scalar } from "ffjavascript";

const TYPES = {
  info: "info",
  error: "error",
  success: "success",
  warning: "warning",
  normal: "normal",
};

const COLORS = {
  [TYPES.info]: {
    text: chalk.blue,
    background: chalk.black.bgBlue,
  },
  [TYPES.success]: {
    text: chalk.green,
    background: chalk.black.bgGreen,
  },
  [TYPES.error]: {
    text: chalk.red,
    background: chalk.black.bgRed,
  },
  [TYPES.warning]: {
    text: chalk.yellow,
    background: chalk.black.bgYellow,
  },
  [TYPES.normal]: {
    text: chalk.white,
    background: chalk.black.white,
  },
};

export const log = (message = "", type = TYPES.info) => {
  const colorType = COLORS[type];
  console.log(`${colorType.text(message)}\n`);
};

export const circomLog = (message = "") => {
  console.log(
    chalk.yellow.bold(`CIRCUIT LOG:`),
    chalk.blue.bold(`${message}\n`)
  );
};

export const logSignals = async (r1cs: any, wtnsFile: any, symFile: any) => {
  if (r1cs) {
    const { fd: fdWtns, sections: sectionsWtns } = await readBinFile(
      wtnsFile,
      "wtns",
      2,
      1 << 25,
      1 << 23
    );

    const wtns = await readWtnsHeader(fdWtns, sectionsWtns);
    const buffWitness = await readSection(fdWtns, sectionsWtns, 2);

    let outputPrefixes: any = {};
    let inputPrefixes: any = {};
    let lastPos = 0;
    let dec = new TextDecoder("utf-8");
    for (let i = 0; i < symFile.length; i++) {
      if (symFile[i] === 0x0a) {
        let line = dec.decode(symFile.slice(lastPos, i));
        let wireNo = +line.split(",")[0];
        if (wireNo <= r1cs.nOutputs) {
          outputPrefixes[wireNo] =
            line.split(",")[3].replace("main.", "") + " = ";
        } else {
          inputPrefixes[wireNo] =
            line.split(",")[3].replace("main.", "") + " = ";
        }
        lastPos = i;
      }
    }

    let outputSignals: any = {};

    if (r1cs.nOutputs > 0) {
      for (const wire in outputPrefixes) {

        // @ts-ignore
        const b = buffWitness.slice(wire * wtns.n8, wire * wtns.n8 + wtns.n8);

        const outputPrefix = outputPrefixes[wire] || "";

        try {
          outputSignals[outputPrefix.replace("=", "").trim()] =
            Scalar.fromRprLE(b).toString();
        } catch (err) {
          outputSignals[outputPrefix.replace("=", "").trim()] = "0";
        }
      }
    }

    let inputSignals: any = {};

    console.log({ inputPrefixes });

    for (const wire in inputPrefixes) {
      // @ts-ignore
      const b = buffWitness.slice(wire * wtns.n8, wire * wtns.n8 + wtns.n8);

      console.log({ b });

      const inputPrefix = inputPrefixes[wire] || "";

      console.log({ inputPrefix }, b);

      try {
        inputSignals[inputPrefix.replace("=", "").trim()] =
          Scalar.fromRprLE(b).toString();
      } catch (err) {
        inputSignals[inputPrefix.replace("=", "").trim()] = "0";
      }
    }

    if (Object.keys(inputSignals).length !== 0) {
      console.log(chalk.cyan(`Input Signals:\n`));

      console.table(inputSignals);
    } else {
      console.log(chalk.yellow(`No input signal found\n`));
    }

    if (Object.keys(outputSignals).length !== 0) {
      console.log(chalk.cyan(`\nOutput Signals:\n`));

      console.table(outputSignals);
    } else {
      console.log(chalk.yellow(`No ouput signal found:\n`));
    }

    await fdWtns.close();
  }
};

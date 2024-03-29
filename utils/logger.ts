const chalk = require("chalk");
import {
  readBinFile,
  readSection,
  // @ts-ignore
} from "@iden3/binfileutils";
import { readWtnsHeader } from "./witness";
// @ts-ignore
import { Scalar } from "ffjavascript";
import { arrayLogger } from "./utils";

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

export const logSignals = async (
  r1cs: any,
  wtnsFile: any,
  symFile: any,
  jsonInputs: any
) => {
  if (r1cs) {
    const { fd: fdWtns, sections: sectionsWtns } = await readBinFile(
      wtnsFile,
      "wtns",
      2,
      1 << 25,
      1 << 23
    );

    const { n8 } = await readWtnsHeader(fdWtns, sectionsWtns);
    const buffWitness = await readSection(fdWtns, sectionsWtns, 2);

    let outputPrefixes: any = {};
    let lastPos = 0;
    let dec = new TextDecoder("utf-8");
    for (let i = 0; i < symFile.length; i++) {
      if (symFile[i] === 0x0a) {
        let line = dec.decode(symFile.slice(lastPos, i));
        let wireNo = +line.split(",")[0];
        if (wireNo <= r1cs.nOutputs) {
          outputPrefixes[wireNo] =
            line.split(",")[3].replace("main.", "") + " = ";
        }
        lastPos = i;
      }
    }
    if (r1cs.nOutputs > 0) {
      let outputSignals: any = {};
      let outputIndex = 1;
      for (; outputIndex <= r1cs.nOutputs; outputIndex++) {
        const b = buffWitness.slice(outputIndex * n8, outputIndex * n8 + n8);
        const outputPrefix = outputPrefixes[outputIndex] || "";
        try {
          outputSignals[outputPrefix.replace("=", "").trim()] =
            Scalar.fromRprLE(b).toString();
        } catch (err) {
          outputSignals[outputPrefix.replace("=", "").trim()] = "0";
        }
      }

      if (Object.keys(outputSignals).length !== 0) {
        console.log(chalk.cyan(`\nOutput Signals:\n`));

        console.table(outputSignals);
      } else {
        console.log(chalk.yellow(`No output signal found:\n`));
      }
    }

    const sortedSignals = Object.keys(jsonInputs).sort();

    let inputSignals: any = {};

    for (const key of sortedSignals) {
      if (Object.prototype.hasOwnProperty.call(jsonInputs, key)) {
        const element = jsonInputs[key];
        if (typeof element === "object") {
          inputSignals = { ...inputSignals, ...arrayLogger("matrix", element) };
        } else {
          inputSignals[key] = jsonInputs[key];
        }
      } else {
      }
    }

    if (Object.keys(jsonInputs).length !== 0) {
      console.log(chalk.cyan(`\nInput Signals:\n`));
      console.table(inputSignals);
    } else {
      console.log(chalk.yellow(`No input signal found:\n`));
    }
    await fdWtns.close();
  }
};

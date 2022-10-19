// @ts-ignore
import { load } from "r1csfile";
// @ts-ignore
import { ZqField } from "ffjavascript";
import { log } from "./logger";
import assert from "assert";

const nodefs = require("fs");
const fs = require("fs/promises");

const groupOrderPrimeStr =
  "21888242871839275222246405745257275088548364400416034343698204186575808495617";
const groupOrderPrime = BigInt(groupOrderPrimeStr);

export class Checker {
  r1csFilepath;
  symFilepath;
  r1cs: { constraints: any; prime: any; nConstraints: number } | any;
  symbols: {} | undefined;
  signals: {} | undefined;
  constructor(r1csFilepath: string, symFilepath: string) {
    this.r1csFilepath = r1csFilepath;
    this.symFilepath = symFilepath;
  }
  async load() {
    this.r1cs = await load(this.r1csFilepath, true, false);
    const { symbols, signals } = await readSymbols(this.symFilepath);
    this.symbols = symbols;
    this.signals = signals;
  }

  async checkConstraintsAndOutput(witnessFilePath: string) {
    // 0. load r1cs and witness
    try {
      if (!this.r1cs) {
        await this.load();
      }
      let witness;
      if (witnessFilePath.endsWith("json")) {
        witness = JSON.parse(nodefs.readFileSync(witnessFilePath).toString());
      }
      // 1. check constraints
      const F = new ZqField(this.r1cs?.prime);
      const constraints = this.r1cs?.constraints;
      if (this.r1cs.nConstraints !== 0) {
        await checkConstraints(F, constraints, witness, this.signals);
      } else {
        log("No quadratic constraint signal found:\n", "info");
      }
      return true;
    } catch (err) {
      console.log({ err });
    }
  }
}

async function readSymbols(path: string) {
  let symbols: any = {};
  let signals: any = {};

  const symsStr = await fs.readFile(path, "utf8");
  const lines = symsStr.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const arr = lines[i].split(",");
    if (arr.length != 4) continue;
    const symbol = arr[3];
    const labelIdx = Number(arr[0]);
    const varIdx = Number(arr[1]);
    const componentIdx = Number(arr[2]);
    symbols[symbol] = {
      labelIdx,
      varIdx,
      componentIdx,
    };
    if (signals[varIdx] == null) {
      signals[varIdx] = [symbol];
    } else {
      signals[varIdx].push(symbol);
    }
  }
  return { symbols, signals };
}

async function checkConstraints(
  F: any,
  constraints: any,
  witness: any,
  signals: any
) {
  if (!constraints) {
    throw new Error("empty constraints");
  }
  for (let i = 0; i < constraints.length; i++) {
    checkConstraint(constraints[i], i);
  }

  function checkConstraint(constraint: any, initializer: number) {
    const a = evalLC(constraint[0]);
    const b = evalLC(constraint[1]);
    const c = evalLC(constraint[2]);

    const passed = F.isZero(F.sub(F.mul(a, b), c));

    log(
      `Constraint no ${initializer + 1}: ${passed ? "passed" : "fail"}`,
      passed ? "success" : "error"
    );

    const equation = `${displayLc(constraint[0])} * ${displayLc(
      constraint[1]
    )} = ${displayLc(constraint[2])}`;

    log(`=> ${equation}`, "normal");

    if (!passed) {
      log("\nInvalid constraint:", "error");

      log(`=> ${equation}`, "error");

      let sigs = new Set<number>();
      for (const c of constraint) {
        for (const s in c) {
          sigs.add(Number(s));
        }
      }

      let calculatedEquation = equation;

      for (const s of sigs) {
        if (s != 0) {
          calculatedEquation = calculatedEquation.replaceAll(
            `signal${s}`,
            witness[s]
          );
        } else {
          calculatedEquation = calculatedEquation.replace(`signal${0}`, "1");
        }
      }

      log(`=> ${calculatedEquation}`, "error");

      log("Related signals:", "normal");

      for (const s of sigs) {
        // signal 0 is 'one'
        if (s != 0) {
          log(
            `signal${s}: ${signals[s].join(" ")}, value: ${witness[s]}`,
            "normal"
          );
        }
      }
      log(
        `please check your circuit and input at constraint ${
          initializer + 1
        } \n`,
        "error"
      );

      throw new Error("Constraint doesn't match");
    } else {
      let sigs = new Set<number>();
      for (const c of constraint) {
        for (const s in c) {
          sigs.add(Number(s));
        }
      }

      let calculatedEquation = equation;

      for (const s of sigs) {
        if (s != 0) {
          calculatedEquation = calculatedEquation.replace(
            `signal${s}`,
            witness[s]
          );
        } else {
          calculatedEquation = calculatedEquation.replaceAll(`signal${0}`, "1");
        }
      }

      log(`=> ${calculatedEquation}`, "normal");

      log("Related signals:", "normal");

      for (const s of sigs) {
        if (s != 0) {
          log(
            `signal${s}: ${signals[s].join(" ")}, value: ${witness[s]}`,
            "normal"
          );
        } else {
          log(`signal0: constant, value: 1`, "normal");
        }
      }
    }
  }

  function evalLC(lc: any) {
    let v = F.zero;
    for (let w in lc) {
      v = F.add(v, F.mul(BigInt(lc[w]), BigInt(witness[w])));
    }
    return v;
  }

  function displayLc(lc: any) {
    const entries = Object.entries(lc);
    if (entries.length == 0) {
      return "0";
    }
    function displayField(x: any) {
      const f = BigInt(x);
      // display some field element as negative int for better reading
      if (f >= groupOrderPrime - 200n) {
        return `(-${(groupOrderPrime - f).toString()})`;
      }
      return f.toString();
    }
    function displayMonomial(coef: any, signalIdx: any) {
      return `${displayField(coef)}*signal${signalIdx}`;
    }
    return (
      "(" + entries.map((kv) => displayMonomial(kv[1], kv[0])).join(" + ") + ")"
    );
  }
}

async function assertOut(
  symbols: any,
  actualOut: { [x: string]: { toString: () => any } },
  expectedOut: any
) {
  if (!symbols) {
    throw new Error("empty symbols");
  }

  checkObject("main", expectedOut);

  function checkObject(prefix: string, eOut: any) {
    if (Array.isArray(eOut)) {
      for (let i = 0; i < eOut.length; i++) {
        checkObject(prefix + "[" + i + "]", eOut[i]);
      }
    } else if (typeof eOut == "object" && eOut.constructor.name == "Object") {
      for (let k in eOut) {
        checkObject(prefix + "." + k, eOut[k]);
      }
    } else {
      if (typeof symbols[prefix] == "undefined") {
        assert(false, "Output variable not defined: " + prefix);
      }
      const ba = actualOut[symbols[prefix].varIdx].toString();
      const be = eOut.toString();
      assert.strictEqual(ba, be, prefix);
    }
  }
}

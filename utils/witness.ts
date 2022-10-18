import {
  startReadUniqueSection,
  readBigInt,
  endReadSection,
  // @ts-ignore
} from "@iden3/binfileutils";
import { circomLog, log } from "./logger";

export const readWtnsHeader = async (fd: any, sections: any) => {
  await startReadUniqueSection(fd, sections, 1);
  const n8 = await fd.readULE32();
  const q = await readBigInt(fd, n8);
  const nWitness = await fd.readULE32();
  await endReadSection(fd);
  return { n8, q, nWitness };
};

export const wtnsBuilder = async (
  code: BufferSource,
  options: { log?: (message: any, label: string) => void }
) => {
  options = options || {};

  let wasmModule;
  try {
    wasmModule = await WebAssembly.compile(code);
  } catch (error) {
    // @ts-ignore
    throw new Error(error);
  }

  let wc;

  let errStr = "";
  let msgStr = "";

  const instance = await WebAssembly.instantiate(wasmModule, {
    runtime: {
      exceptionHandler: function (code: number) {
        let error;
        if (code == 1) {
          error = "Signal not found.\n";
        } else if (code == 2) {
          error = "Too many signals set.\n";
        } else if (code == 3) {
          error = "Signal already set.\n";
        } else if (code == 4) {
          error = "Assert Failed.\n";
        } else if (code == 5) {
          error = "Not enough memory.\n";
        } else if (code == 6) {
          error = "Input signal array access exceeds the size.\n";
        } else {
          error = "Unknown error.\n";
        }
        throw new Error(error + errStr);
      },
      printErrorMessage: function () {
        errStr += getMessage() + "\n";
      },
      writeBufferMessage: function () {
        const msg = getMessage();
        // Any calls to `log()` will always end with a `\n`, so that's when we print and reset
        if (msg === "\n") {
          circomLog(msgStr);
        }
        if (msg === "\n") {
          msgStr = "";
        } else {
          // If we've buffered other content, put a space in between the items
          if (msgStr !== "") {
            msgStr += " ";
          }
          // Then append the message to the message we are creating
          msgStr += msg;
        }
      },
      showSharedRWMemory: function () {
        printSharedRWMemory();
      },
    },
  });

  const sanityCheck = options;

  wc = new WitnessCalculator(instance, sanityCheck);
  return wc;

  function getMessage() {
    var message = "";
    // @ts-ignore

    var c = instance.exports.getMessageChar();
    while (c != 0) {
      message += String.fromCharCode(c);
      // @ts-ignore
      c = instance.exports.getMessageChar();
    }
    return message;
  }

  function printSharedRWMemory() {
    // @ts-ignore
    const shared_rw_memory_size = instance.exports.getFieldNumLen32();
    const arr = new Uint32Array(shared_rw_memory_size);
    for (let j = 0; j < shared_rw_memory_size; j++) {
      arr[shared_rw_memory_size - 1 - j] =
        // @ts-ignore
        instance.exports.readSharedRWMemory(j);
    }

    // If we've buffered other content, put a space in between the items
    if (msgStr !== "") {
      msgStr += " ";
    }
    // Then append the value to the message we are creating
    msgStr += fromArray32(arr).toString();
    const label = getMessage();
  }
};

class WitnessCalculator {
  instance: any;
  version: any;
  n32: any;
  prime: bigint;
  witnessSize: any;
  sanityCheck: any;
  constructor(instance: any, sanityCheck: any) {
    this.instance = instance;

    this.version = this.instance.exports.getVersion();
    this.n32 = this.instance.exports.getFieldNumLen32();

    this.instance.exports.getRawPrime();
    const arr = new Uint32Array(this.n32);
    for (let i = 0; i < this.n32; i++) {
      arr[this.n32 - 1 - i] = this.instance.exports.readSharedRWMemory(i);

    }
    this.prime = fromArray32(arr);


    this.witnessSize = this.instance.exports.getWitnessSize();

    this.sanityCheck = sanityCheck;
  }

  circom_version() {
    return this.instance.exports.getVersion();
  }

  async _doCalculateWitness(input: any, sanityCheck: any) {
    try {
      //input is assumed to be a map from signals to arrays of bigints
      this.instance.exports.init(this.sanityCheck || sanityCheck ? 1 : 0);
      const keys = Object.keys(input);
  
      var input_counter = 0;
      keys.forEach((k) => {
        const h = fnvHash(k);
        const hMSB = parseInt(h.slice(0, 8), 16);
        const hLSB = parseInt(h.slice(8, 16), 16);
        const fArr = flatArray(input[k]);
        let signalSize = this.instance.exports.getInputSignalSize(hMSB, hLSB);

        if (signalSize < 0) {
          throw new Error(`Signal ${k} not found\n`);
        }
        if (fArr.length < signalSize) {
          throw new Error(`Not enough values for input signal ${k}\n`);
        }
        if (fArr.length > signalSize) {
          throw new Error(`Too many values for input signal ${k}\n`);
        }
        for (let i = 0; i < fArr.length; i++) {
          const arrFr = toArray32(BigInt(fArr[i]) % this.prime, this.n32);
          for (let j = 0; j < this.n32; j++) {
            this.instance.exports.writeSharedRWMemory(
              j,
              arrFr[this.n32 - 1 - j]
            );
          }
          try {
            this.instance.exports.setInputSignal(hMSB, hLSB, i);
            input_counter++;
          } catch (error) {
            // @ts-ignore
            throw new Error(error);
          }
        }
      });
      if (input_counter < this.instance.exports.getInputSize()) {
        throw new Error(
          `Not all inputs have been set. Only ${input_counter} out of ${this.instance.exports.getInputSize()}`
        );
      }
    } catch (error) {
      // @ts-ignore
      log(`${error.message}`, "error");
    }
  }

  async calculateWitness(input: any, sanityCheck: any) {
    const w = [];

    await this._doCalculateWitness(input, sanityCheck);

    for (let i = 0; i < this.witnessSize; i++) {
      this.instance.exports.getWitness(i);
      const arr = new Uint32Array(this.n32);

      for (let j = 0; j < this.n32; j++) {
        arr[this.n32 - 1 - j] = this.instance.exports.readSharedRWMemory(j);
      }

      // @ts-ignore
      w.push(fromArray32(arr));
      // @ts-ignore
      wtnsFile;
    }

    return w;
  }

  async calculateBinWitness(input: any, sanityCheck: any) {
    const buff32 = new Uint32Array(this.witnessSize * this.n32);
    const buff = new Uint8Array(buff32.buffer);
    await this._doCalculateWitness(input, sanityCheck);
    for (let i = 0; i < this.witnessSize; i++) {
      this.instance.exports.getWitness(i);
      const pos = i * this.n32;
      for (let j = 0; j < this.n32; j++) {
        buff32[pos + j] = this.instance.exports.readSharedRWMemory(j);
      }
    }

    return buff;
  }

  async calculateWTNSBin(input: any, sanityCheck: any) {
    const buff32 = new Uint32Array(this.witnessSize * this.n32 + this.n32 + 11);
    const buff = new Uint8Array(buff32.buffer);
  
    await this._doCalculateWitness(input, sanityCheck);

    //"wtns"
    buff[0] = "w".charCodeAt(0);
    buff[1] = "t".charCodeAt(0);
    buff[2] = "n".charCodeAt(0);
    buff[3] = "s".charCodeAt(0);

    //version 2
    buff32[1] = 2;

    //number of sections: 2
    buff32[2] = 2;

    //id section 1
    buff32[3] = 1;

    const n8 = this.n32 * 4;
    //id section 1 length in 64bytes
    const idSection1length = 8 + n8;
    const idSection1lengthHex = idSection1length.toString(16);
    buff32[4] = parseInt(idSection1lengthHex.slice(0, 8), 16);
    buff32[5] = parseInt(idSection1lengthHex.slice(8, 16), 16);

    //this.n32
    buff32[6] = n8;

    //prime number
    this.instance.exports.getRawPrime();

    var pos = 7;
    for (let j = 0; j < this.n32; j++) {
      buff32[pos + j] = this.instance.exports.readSharedRWMemory(j);
    }
    pos += this.n32;

    // witness size
    buff32[pos] = this.witnessSize;
    pos++;

    //id section 2
    buff32[pos] = 2;
    pos++;

    // section 2 length
    const idSection2length = n8 * this.witnessSize;
    const idSection2lengthHex = idSection2length.toString(16);
    buff32[pos] = parseInt(idSection2lengthHex.slice(0, 8), 16);
    buff32[pos + 1] = parseInt(idSection2lengthHex.slice(8, 16), 16);

    pos += 2;
    for (let i = 0; i < this.witnessSize; i++) {
      this.instance.exports.getWitness(i);
      for (let j = 0; j < this.n32; j++) {
        buff32[pos + j] = this.instance.exports.readSharedRWMemory(j);
      }
      pos += this.n32;
    }

    return buff;
  }
}

function toArray32(rem: any, size: any) {
  const res = []; //new Uint32Array(size); //has no unshift
  const radix = BigInt(0x100000000);
  while (rem) {
    // @ts-ignore
    res.unshift(Number(rem % radix));
    rem = rem / radix;
  }
  if (size) {
    var i = size - res.length;
    while (i > 0) {
      // @ts-ignore
      res.unshift(0);
      i--;
    }
  }
  return res;
}

function fromArray32(arr: any) {
  //returns a BigInt
  var res = BigInt(0);
  const radix = BigInt(0x100000000);
  for (let i = 0; i < arr.length; i++) {
    res = res * radix + BigInt(arr[i]);
  }
  return res;
}

function flatArray(a: any) {
  var res: never[] = [];
  fillArray(res, a);
  return res;

  function fillArray(res: any, a: any) {
    if (Array.isArray(a)) {
      for (let i = 0; i < a.length; i++) {
        fillArray(res, a[i]);
      }
    } else {
      res.push(a);
    }
  }
}

function fnvHash(str: any) {
  const uint64_max = BigInt(2) ** BigInt(64);
  let hash = BigInt("0xCBF29CE484222325");
  for (var i = 0; i < str.length; i++) {
    hash ^= BigInt(str[i].charCodeAt());
    hash *= BigInt(0x100000001b3);
    hash %= uint64_max;
  }
  let shash = hash.toString(16);
  let n = 16 - shash.length;
  shash = "0".repeat(n).concat(shash);
  return shash;
}

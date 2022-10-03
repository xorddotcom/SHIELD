# SHIELD

<p align="center" >
<img src="https://xord.notion.site/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F283b98b7-fdae-4e5a-acaf-248242084e4a%2FICON.png?table=block&id=5306223c-a4f7-45d1-9f54-b9a5f4004cd6&spaceId=49976899-64a1-40fd-a3e6-c2ad82ad7aa1&width=250&userId=&cache=v2" alt="shield" width="200" height="200">
</p>

The shield is a development framework for circom developers, but we plan it for other languages such as CAIRO, SNARKYJS, etc.

The core reason is to provide libraries, plugins, and testing tools to ensure code quality and security.

Circomlib (which is the most popular library to build circom circuits) has over 1800 weekly downloads.

## Pre-Requisite


You have to setup the environment before using it and install the following to get started with shield cli.

#### Windows

- [rust](https://www.rust-lang.org/tools/install)
- [circom](https://docs.circom.io/getting-started/installation/)
- [nodejs](https://nodejs.org/en/download/)

In future versions, we will provide a script to setup the environment with single command execution.

#### Linux/Mac

- [nodejs](https://nodejs.org/en/download/)


## Installation

Install shield globally with npm:

```bash

$ npm i -g @xorddotcom/shield
```
    
## Usage

### Getting Started

To create a sample project, run
In future versions, we will provide a script to setup the environment with single command execution.

```bash

$ shield init
```

create a JavaScript, TypeScript project, or an empty shield.config.js

```
? What do you want to do? …
❯ Create a JavaScript project
  Create a TypeScript project
  Create an empty shield.config.js
  Quit
```

### Compiling your circuits

```bash 

$ shield compile
```

```bash

Usage: shield compile [options]

compiles the circuits to verifer contracts

Options:
  -c, --circuit <value>  specific circuit to compile
  -h, --help             display help for command


```

### Basic configuration

Set up your project with the following minimal shield.config.js at the root. 

```javascript

module.exports = {
  // (optional) solidity version for compiled contracts, defaults to `^0.8.0`
  solidity: "^0.8.0",
  circom: {
    // (optional) Base path for files being read, defaults to `./circuits/`
    inputBasePath: "./circuits/",
    // (optional) Base path for files being output, defaults to `./circuits/`
    outputBasePath: "./build/",
    // (required) The final ptau file, relative to inputBasePath, from a Phase 1 ceremony
    ptau: "powersOfTau28_hez_final_10.ptau",
    // (required) Each object in this array refers to a separate circuit
    circuits: [
      {
        // (required) The name of the circuit
        name: "demo",
        // (optional) Protocol used to build circuits ("groth16" or "plonk"), defaults to "groth16"
        protocol: "groth16",
        // (optional) Input path for circuit file, inferred from `name` if unspecified
        circuit: "demo.circom",
        // (optional) Output path for zkey file, inferred from `name` if unspecified
        zkey: "demo.zkey",
        // (optional) Input path for input signal data, inferred from `name` if unspecified
        input: "input.json",
        // // (optional) Output path for witness file, inferred from `name` if unspecified
        witness: "demo.json",
      },
    ],
  },
};

```


Your project structure should look like this:

```javascript

.
├── circuits
│   └── demo.circom
└── shield.config.js

```
Now, you can use shield compile to compile the circuits and output demo_Verifier.sol, demo.zkey,demo.wasm and Verifier contract interface files into their respective directories:

```javascript
.
├── build
│   └── demo
│       ├── circuit_0000.zkey
│       ├── demo_js
│       │   ├── demo.wasm
│       │   ├── generate_witness.js
│       │   └── witness_calculator.js
│       ├── demo.r1cs
│       ├── demo.sym
│       ├── demo.zkey
│       └── verification_key.json
├── circuits
│   ├── demo.circom
│   ├── input.json
│   ├── demo.wtns
│   ├── demo.json
│   └── powersOfTau28_hez_final_10.ptau
├── contracts
│   ├── demo_Verifier.sol
│   └── interfaces
│       └── IdemoVerifier.sol
└── shield.config.js


```

### Debugging your circuits

Debug feature allows you to display the circom circuits logs, input/output signals logs, and the passed/failed Constraints along with signals calculations. 

To debug with an error stack trace and generate a witness JSON/Wtns file, run:

```bash 

$ shield debug
```


```bash

Usage: shield debug [options]

debug (display input/output signals, circuit logs, and passed/failed constraints ) and generate a witness file of the circuit

Options:
  -c, --circuit <value>  specific circuit to debug
  -h, --help             display help for command

```

#### Example debug logs

```

Input Signals:

┌───────────┬────────┐
│ (Signals) │ Values │
├───────────┼────────┤
│    c      │  '4'   │
│    a      │  '2'   │
│    b      │  '2'   │
└───────────┴────────┘

No ouput signal found:

Constraint no 1: passed

=> ((-1)*signal2) * (1*signal3) = ((-1)*signal1)

=> ((-1)*2) * (1*2) = ((-1)*4)

Related signals:

signal2: main.a, value: 2

signal3: main.b, value: 2

signal1: main.c, value: 4


```

## Contribution
For making a contribution refer to [CONTRIBUTION.md](https://github.com/xorddotcom/SHIELD/blob/main/CONTRIBUTION.md) file.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Donate

[![Buy Us A Coffee](https://srv-cdn.himpfen.io/badges/buymeacoffee/buymeacoffee-flat.svg)](https://cryptip.me/0xf1f7dfb65C47445ACA50319512373A50C396fCdF) &nbsp;


**Ethereum      :** `0xf1f7dfb65C47445ACA50319512373A50C396fCdF` <br />
**Optimism      :** `0xf1f7dfb65C47445ACA50319512373A50C396fCdF` <br />
**Polygon       :** `0xf1f7dfb65C47445ACA50319512373A50C396fCdF` <br />
**Zksync        :** `0xf1f7dfb65C47445ACA50319512373A50C396fCdF` <br />
**Arbitrum      :** `0xf1f7dfb65C47445ACA50319512373A50C396fCdF` <br />

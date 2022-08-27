# SHIELD

<p align="center" >
<img src="https://xord.notion.site/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F283b98b7-fdae-4e5a-acaf-248242084e4a%2FICON.png?table=block&id=5306223c-a4f7-45d1-9f54-b9a5f4004cd6&spaceId=49976899-64a1-40fd-a3e6-c2ad82ad7aa1&width=250&userId=&cache=v2" alt="shield" width="200" height="200">
</p>
The shield is a development framework for circom developers but we plan it for other languages such as CAIRO, SNARKYJS, etc.

The core reason is to provide libraries, plugins, and testing tools to ensure code quality and security.

Circomlib (which is the most popular library to build circom circuits) has over 1800 weekly downloads.

## Pre-Requisite
You have to setup the environment before using it and install the following to get started with shield cli.
- [rust](https://www.rust-lang.org/tools/install)
- [circom](https://docs.circom.io/getting-started/installation/)
- [nodejs](https://nodejs.org/en/download/)

In future versions we'll provide a script to setup the environment with a single command execution.

## Installation

Install shield globally with npm:

```bash
$ npm install -g @shield/cli
```
    
## Usage

### Getting Started

To create a sample project, run

```bash
$ shield init
```

create a JavaScript, TypeScript project, or an empty shield.config.js

```
? What do you want to do? …
❯ Create a JavaScript project
  Create a TypeScript project
  Create an empty hardhat.config.js
  Quit
```

### Compiling your circuits

```bash 
$ npx hardhat compile
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
│   └── powersOfTau28_hez_final_10.ptau
├── contracts
│   ├── demo_Verifier.sol
│   └── interfaces
│       └── IdemoVerifier.sol
└── shield.config.js


```


Currently, we are only providing the initialization and compiling feature in this CLI but we're working iteratively and working on other features as well that we have in our roadmap such as debugging with error stack trace.

## Contribution
For making a contribution refer to [CONTRIBUTION.md](https://github.com/xorddotcom/SHIELD/CONTRIBUTION.md) file.

## License

[MIT](https://choosealicense.com/licenses/mit/)

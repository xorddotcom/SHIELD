
import { expect } from 'chai';
import { exec } from "child_process";
import concat from "concat-stream"

function runCommand(command, callback) {
  return exec(
    command,
    (
      function () {
        return function (err, data, stderr) {
          if (!callback)
            return;

          callback(err, data, stderr);
        }
      }
    )(callback)
  );
}

function runSync(command) {
  try {
    return {
      data: execSync(command).toString(),
      err: null,
      stderr: null
    }
  }
  catch (error) {
    return {
      data: null,
      err: error.stderr.toString(),
      stderr: error.stderr.toString()
    }
  }
}


const ENTER = "\x0D"
const DOWN = '\x1B\x5B\x42'
const UP = '\x1B\x5B\x41'
const SPACE = '\x20'

/**
 * Creates a command and executes inputs (user responses) to the stdin
 * Returns a promise that resolves when all inputs are sent
 * Rejects the promise if any error
 * @param {string} process Path of the process to execute
 * @param {Array} inputs (Optional) Array of inputs (user responses)
 * @param {Object} opts (optional) Environment variables
 */
function executeWithInput(process, inputs = [], opts = {}) {
  if (!Array.isArray(inputs)) {
    opts = inputs;
    inputs = [];
  }

  const { env = null, timeout = 100, maxTimeout = 10000 } = opts;
  const childProcess = runCommand(process)
  childProcess.stdin.setEncoding('utf-8');

  let currentInputTimeout, killIOTimeout;

  // Creates a loop to feed user inputs to the child process in order to get results from the tool
  // This code is heavily inspired (if not blantantly copied) from inquirer-test:
  // https://github.com/ewnd9/inquirer-test/blob/6e2c40bbd39a061d3e52a8b1ee52cdac88f8d7f7/index.js#L14
  const loop = inputs => {
    if (killIOTimeout) {
      clearTimeout(killIOTimeout);
    }

    if (!inputs.length) {
      childProcess.stdin.end();

      // Set a timeout to wait for CLI response. If CLI takes longer than
      // maxTimeout to respond, kill the childProcess and notify user
      killIOTimeout = setTimeout(() => {
        console.error('Error: Reached I/O timeout');
        childProcess.kill(constants.signals.SIGTERM);
      }, maxTimeout);

      return;
    }

    currentInputTimeout = setTimeout(() => {
      childProcess.stdin.write(inputs[0]);
      // Log debug I/O statements on tests
      if (env && env.DEBUG) {
        console.log('input:', inputs[0]);
      }
      loop(inputs.slice(1));
    }, timeout);
  };

  const promise = new Promise((resolve, reject) => {
    // Get errors from CLI
    childProcess.stderr.on('data', data => {
      // Log debug I/O statements on tests
      if (env && env.DEBUG) {
        console.log('error:', data.toString());
      }
    });

    // Get output from CLI
    childProcess.stdout.on('data', data => {
      // Log debug I/O statements on tests
      if (env && env.DEBUG) {
        console.log('output:', data.toString());
      }
    });

    childProcess.stderr.once('data', err => {
      childProcess.stdin.end();

      if (currentInputTimeout) {
        clearTimeout(currentInputTimeout);
        inputs = [];
      }
      reject(err.toString());
    });

    childProcess.on('error', reject);

    // Kick off the process
    loop(inputs);

    childProcess.stdout.pipe(
      concat(result => {
        if (killIOTimeout) {
          clearTimeout(killIOTimeout);
        }

        resolve(result.toString());
      })
    );
  });

  // Appending the process to the promise, in order to
  // add additional parameters or behavior (such as IPC communication)
  promise.attachedProcess = childProcess;

  return promise;
}


describe('The shield CLI', () => {

  before(async () => {
    await executeWithInput(
      'rm -rf test/mocks',
    );
  })

  describe('Compile', () => {

    // TODO add the test case if the cli doesn't exists
    // TODO Installating of the cli

    it('should through error on empty sheild command', async () => {
      try {
        const response = await executeWithInput(
          'shield',
        );
      } catch (err) {
        expect(err).to.contains.oneOf(["shield", "init", "help"])
      }
    });

    it('should work on help command properly', async () => {
      const response = await executeWithInput(
        'shield --help',
      );
      expect(response).to.contains.oneOf(["shield", "init", "help"])
    });

    it('should trough error on invalid help command', async () => {
      try {
        const response = await executeWithInput(
          'shield --helpme',
        );
      }
      catch (err) {
        expect(err).to.equal(
          "error: unknown option '--helpme'\n(Did you mean --help?)\n"
        );
      }
    });

  })

  describe('Inintiaze Package', () => {

    it('should fail to initialize the folder if same name exists', async () => {

      await executeWithInput(
        'cd test && mkdir mocks && cd mocks && mkdir demo-init',
      );

      const response = await executeWithInput(
        'cd test/mocks && shield init', ["demo-init", ENTER]
      );

      let result = response.includes('already exist')

      expect(result).to.equal(true)

    });

    describe('Typescript', () => {
      describe('Groth16', () => {
      });
      describe('Plonk', () => {
      });
    });

    describe('Javascript', () => {
      describe('Groth16', () => {
      });
      describe('Plonk', () => {
      });
    });
  })
});

import { exec } from "child_process";
import concat from "concat-stream"


export const KEYS = {
  ENTER: "\x0D",
  DOWN: '\x1B\x5B\x42',
  UP: '\x1B\x5B\x41',
  SPACE: '\x20',
  ESCAP: '\x1B'

}

export function runCommand(command, callback) {
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

export function runSync(command) {
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

/**
 * Creates a command and executes inputs (user responses) to the stdin
 * Returns a promise that resolves when all inputs are sent
 * Rejects the promise if any error
 * @param {string} process Path of the process to execute
 * @param {Array} inputs (Optional) Array of inputs (user responses)
 * @param {Object} opts (optional) Environment variables
 */
export function executeWithInput(process, inputs = [], opts = {}) {
  if (!Array.isArray(inputs)) {
    opts = inputs;
    inputs = [];
  }

  const { env = null, timeout = 100, maxTimeout = 10000 } = opts;
  const childProcess = runCommand(process)
  childProcess.stdin.setEncoding('utf-8');

  let currentInputTimeout, killIOTimeout;

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

import ufs from "@phated/unionfs";
import { createFsFromVolume, Volume } from "memfs";
import * as nodefs from "fs";
import shimmer from "shimmer";

export const initFS = () => {
  const vol = Volume.fromJSON({
    "/dev/stdin": "",
    "/dev/stdout": "",
    "/dev/stderr": "",
  });

  const memfs = createFsFromVolume(vol);

  ufs
    .use(nodefs)
    .use(memfs as unknown as typeof nodefs);

  let bufferSize = 10 * 1024 * 1024;
  let writeBuffer = new Uint8Array(bufferSize);
  let writeBufferFd = -1;
  let writeBufferOffset = 0;
  let writeBufferPos = 0;

  const wasmFs = {
    ...ufs,
    // @ts-ignore
    writeSync(fd, buf, offset, len, pos) {
      if (
        writeBufferFd === fd &&
        writeBufferOffset + len < bufferSize &&
        pos === writeBufferPos + writeBufferOffset
      ) {
        writeBuffer.set(buf, writeBufferOffset);
        writeBufferOffset += len;
        return len;
      } else {
        if (writeBufferFd >= 0) {
          ufs.writeSync(
            writeBufferFd,
            writeBuffer,
            0,
            writeBufferOffset,
            writeBufferPos
          );
        }
        writeBufferFd = fd;
        writeBufferOffset = 0;

        writeBuffer.set(buf, writeBufferOffset);
        writeBufferOffset += len;
        writeBufferPos = pos;
      }
      return len;
    },
    // @ts-ignore
    closeSync(fd) {
      if (writeBufferFd >= 0) {
        ufs.writeSync(
          writeBufferFd,
          writeBuffer,
          0,
          writeBufferOffset,
          writeBufferPos
        );
        writeBufferFd = -1;
        writeBufferOffset = 0;
        writeBufferPos = 0;
      }
      if (fd >= 0) {
        return ufs.closeSync(fd);
      }
    },
    getStdOut() {
      let promise = new Promise((resolve) => {
        resolve(ufs.readFileSync("/dev/stdout", "utf8"));
      });
      return promise;
    },
  };

  wasmFs.writeFileSync("/dev/stderr", "");
  wasmFs.writeFileSync("/dev/stdout", "");

  let stdout = "";
  let stderr = "";
  // We wrap the writeSync function because circom2 doesn't allow us to
  // configure the logging and it doesn't exit with proper exit codes
  shimmer.wrap(wasmFs, "writeSync", function (original) {
    return function (fd, data, offsetOrPosition, lengthOrEncoding, position) {
      if (fd === 1) {
        if (typeof data === "string") {
          stdout += data;
          // This is a little fragile, but we assume the wasmer-js
          // terminal character is a newline by itself
          if (stdout.endsWith("\n")) {
            const msg = stdout.trim();
            stdout = "";
          }
          return data.length;
        } else {
          stdout += new TextDecoder().decode(data);
          if (stdout.endsWith("\n")) {
            const msg = stdout.trim();
            stdout = "";
          }
          return data.byteLength;
        }
      }

      // If writing to stderr, we hijack and throw an error
      if (fd == 2) {
        if (typeof data === "string") {
          stderr += data;
          // This is a little fragile, but we assume that circom2
          // ends the failed compile with "previous errors were found"
          if (stderr.includes("previous errors were found")) {
            const msg = stderr.trim();
            stderr = "";
            throw new Error(msg);
          }
          return data.length;
        } else {
          stderr += new TextDecoder().decode(data);
          // This is a little fragile, but we assume that circom2
          // ends the failed compile with "previous errors were found"
          if (stderr.includes("previous errors were found")) {
            const msg = stderr.trim();
            stderr = "";
            throw new Error(msg);
          }
          return data.byteLength;
        }
      }

      if (typeof data === "string") {
        if (typeof lengthOrEncoding !== "number") {
          // @ts-ignore
          return original(fd, data, offsetOrPosition, lengthOrEncoding);
        } else {
          throw Error("Invalid arguments");
        }
      } else {
        if (typeof lengthOrEncoding !== "string") {
          return original(
            fd,
            data,
            offsetOrPosition,
            lengthOrEncoding,
            position
          );
        } else {
          throw Error("Invalid arguments");
        }
      }
    };
  });

  return wasmFs;
};

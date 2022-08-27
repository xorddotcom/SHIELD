// @ts-nocheck
import { executeWithInput, KEYS } from "../utils/cmd";
// import "@types/jest";
import { indexDist } from "../utils/utils";
import { getPackageJson } from "../utils/packageInfo";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("The Shield CLI", () => {
  beforeAll(async () => {
    await executeWithInput("rm -rf test/templates");
  });

  afterAll(async () => {
    await executeWithInput("rm -rf test/templates");
  });
  describe("Shield Compile", () => {
    it("should through error on empty sheild command", async () => {
      try {
        await executeWithInput("shield");
      } catch (err) {
        const numberOfMatches = ["shield", "Usage", "init", "help"].filter(
          (x) => err.indexOf(x) > -1
        ).length;
        expect(numberOfMatches).toBeGreaterThan(0);
      }
    });
    it("should work on help command", async () => {
      const response = await executeWithInput("shield --help");
      const numberOfMatches = ["shield", "Usage", "init", "help"].filter(
        (x) => response.indexOf(x) > -1
      ).length;
      expect(numberOfMatches).toBeGreaterThan(0);
    });
    it("should trough error on invalid help command", async () => {
      try {
        await executeWithInput(`node ./dist/src/index.js --helpme`);
      } catch (err) {
        const response = err.includes("unknown option '--helpme");
        expect(response).toBe(true);
      }
    });
  });

  describe("Shield Version", () => {
    it("should log correct version information", async () => {
      const response = await executeWithInput(`shield --version`);
      const packageJson = await getPackageJson();
      expect(response.trim()).toBe(packageJson.version);
    });
  });

  describe("Shield Init", () => {
    it("should fail to initialize the folder if it already exists", async () => {
      await executeWithInput(
        "cd test && mkdir templates && cd templates && mkdir demo-init"
      );

      const response = await executeWithInput(
        "cd test/templates && shield init",
        ["demo-init", KEYS.ENTER]
      );

      const nodeResponse = await executeWithInput(
        `cd test/templates && ${indexDist} init`,
        ["demo-init", KEYS.ENTER]
      );

      const result = response.includes("already exist");
      const nodeResult = nodeResponse.includes("already exist");

      expect(result).toBe(true);
      expect(nodeResult).toBe(true);
    });

    it("should through error on invalid initialize command", async () => {
      try {
        await executeWithInput("shield --initialize");
      } catch (err) {
        expect(err).toBe("error: unknown option '--initialize'\n");
      }
    });

    describe("Typescript", () => {
      describe("Ts Groth16", () => {
        it("should create groth16 typescript template", async () => {
          const response = await executeWithInput(
            "cd test/templates && shield init",
            ["ts-groth16", KEYS.ENTER, KEYS.DOWN, KEYS.ENTER, KEYS.ENTER]
          );

          sleep(5000);

          const result = response.includes("Successfully generated the code.");

          const listResponse = await executeWithInput(
            "cd test/templates/ts-groth16 && ls"
          );

          expect(listResponse).toBe(
            "circuits\n" +
              "contracts\n" +
              "hardhat.config.ts\n" +
              "package.json\n" +
              "README.md\n" +
              "scripts\n" +
              "shield.config.js\n" +
              "test\n" +
              "tsconfig.json\n" +
              "util\n"
          );

          expect(result).toBe(true);
        });
      });
      describe("Ts Plonk", () => {
        it("should create plonk typescript template", async () => {
          const response = await executeWithInput(
            `cd test/templates && ${indexDist} init`,
            [
              "ts-plonk",
              KEYS.ENTER,
              KEYS.DOWN,
              KEYS.ENTER,
              KEYS.DOWN,
              KEYS.ENTER,
              KEYS.ESCAP,
            ]
          );

          sleep(5000);

          const result = response.includes("Successfully generated the code.");

          const listResponse = await executeWithInput(
            "cd test/templates/ts-plonk && ls"
          );

          expect(listResponse).toBe(
            "circuits\n" +
              "contracts\n" +
              "hardhat.config.ts\n" +
              "package.json\n" +
              "README.md\n" +
              "scripts\n" +
              "shield.config.js\n" +
              "test\n" +
              "tsconfig.json\n" +
              "util\n"
          );

          expect(result).toBe(true);
        });
      });
    });

    describe("Javascript", () => {
      describe("Js Groth16", () => {
        it("should create groth16 javascript template", async () => {
          const response = await executeWithInput(
            "cd test/templates && shield init",
            ["js-groth16", KEYS.ENTER, KEYS.ENTER, KEYS.ENTER]
          );

          sleep(5000);

          const result = response.includes("Successfully generated the code.");

          const listResponse = await executeWithInput(
            "cd test/templates/js-groth16 && ls"
          );

          expect(listResponse).toBe(
            "circuits\n" +
              "contracts\n" +
              "hardhat.config.js\n" +
              "package.json\n" +
              "README.md\n" +
              "scripts\n" +
              "shield.config.js\n" +
              "test\n" +
              "util\n"
          );

          expect(result).toBe(true);
        });
      });
      describe("Js Plonk", () => {
        it("should create plonk javascript template", async () => {
          const response = await executeWithInput(
            `cd test/templates && ${indexDist} init`,
            [
              "js-plonk",
              KEYS.ENTER,
              KEYS.ENTER,
              KEYS.DOWN,
              KEYS.ENTER,
              KEYS.ESCAP,
            ]
          );

          sleep(5000);

          const result = response.includes("Successfully generated the code.");

          const listResponse = await executeWithInput(
            "cd test/templates/js-plonk && ls"
          );

          expect(listResponse).toBe(
            "circuits\n" +
              "contracts\n" +
              "hardhat.config.js\n" +
              "package.json\n" +
              "README.md\n" +
              "scripts\n" +
              "shield.config.js\n" +
              "test\n" +
              "util\n"
          );

          expect(result).toBe(true);
        });
      });
    });

    describe("Empty Config", () => {
      describe("Js Groth16", () => {
        it("should create groth16 javascript template", async () => {
          const response = await executeWithInput(
            "cd test/templates && shield init",
            ["empty-config", KEYS.ENTER, KEYS.DOWN, KEYS.DOWN, KEYS.ENTER]
          );

          const result = response.includes(
            "Successfully generated the config file"
          );

          expect(result).toBe(true);
        });
      });
    });
  });
});

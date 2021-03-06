import { expect } from 'chai';
import { executeWithInput, KEYS } from '../utils/cmd.js';
import path from "path";
import fsExtra from "fs-extra";


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('The Shield CLI', () => {

  before(async () => {
    await executeWithInput(
      'rm -rf test/templates',
    );
  })

  after(async () => {
    await executeWithInput(
      'rm -rf test/templates',
    );
  })

  describe('Shield Compile', () => {
    it('should through error on empty sheild command', async () => {
      try {
        await executeWithInput(
          'shield',
        );
      } catch (err) {
        expect(err).to.contains.oneOf(["shield", "init", "help"])
      }
    });
    it('should work on help command', async () => {
      const response = await executeWithInput(
        'shield --help',
      );
      expect(response).to.contains.oneOf(["shield", "init", "help"])
    });
    it('should trough error on invalid help command', async () => {
      try {
        await executeWithInput(
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
  describe('Shield Init', () => {

    it('should fail to initialize the folder if it already exists', async () => {

      await executeWithInput(
        'cd test && mkdir templates && cd templates && mkdir demo-init',
      );

      const response = await executeWithInput(
        'cd test/templates && shield init', ["demo-init", KEYS.ENTER]
      );

      let result = response.includes('already exist')

      expect(result).to.equal(true)

    });


    it('should through error on invalid initialize command', async () => {
      try {
        await executeWithInput(
          'shield --initialize',
        );
      }
      catch (err) {
        expect(err).to.equal(
          "error: unknown option '--initialize'\n"
        );
      }
    });

    describe('Typescript', () => {
      describe('Ts Groth16', () => {

        it('should create groth16 typescript template', async () => {

          const response = await executeWithInput(
            'cd test/templates && shield init', ["ts-groth16", KEYS.ENTER, KEYS.DOWN, KEYS.ENTER, KEYS.ENTER, "Alice", KEYS.ENTER, "cafe's mayfair biscuit", KEYS.ENTER]
          );

          sleep(5000)

          const result = response.includes("Successfully generated the code.")

          const listResponse = await executeWithInput(
            'cd test/templates/ts-groth16 && ls'
          );

          expect(listResponse).to.equal('circuits\n' +
            'contracts\n' +
            'hardhat.config.ts\n' +
            'package.json\n' +
            'README.md\n' +
            'scripts\n' +
            'test\n' +
            'tsconfig.json\n' +
            'util\n'
          )

          expect(result).to.equals(true)

        });

        it("should contain correct contributer name", async () => {

          const filePath = path.join(process.cwd(), `/test/templates/ts-groth16/scripts/compile-circuit.sh`);
          let fileContent = await fsExtra.readFile(filePath);
          let result = fileContent.toString().includes('--name="Alice"')
          expect(result).to.equal(true)
        })

        it("should contain correct entropy string", async () => {
          const filePath = path.join(process.cwd(), `/test/templates/ts-groth16/scripts/compile-circuit.sh`);
          let fileContent = await fsExtra.readFile(filePath);
          let result = fileContent.toString().includes(`-e="cafe's mayfair biscuit"`)
          expect(result).to.equal(true)
        })

      });
      describe('Ts Plonk', () => {
        it('should create plonk typescript template', async () => {

          const response = await executeWithInput(
            'cd test/templates && shield init', ["ts-plonk", KEYS.ENTER, KEYS.DOWN, KEYS.ENTER, KEYS.DOWN, KEYS.ENTER, KEYS.ESCAP]
          );

          sleep(5000)

          const result = response.includes("Successfully generated the code.")

          const listResponse = await executeWithInput(
            'cd test/templates/ts-plonk && ls'
          );

          expect(listResponse).to.equal('circuits\n' +
            'contracts\n' +
            'hardhat.config.ts\n' +
            'package.json\n' +
            'README.md\n' +
            'scripts\n' +
            'test\n' +
            'tsconfig.json\n' +
            'util\n'
          )

          expect(result).to.equals(true)

        });
      });

      describe('Javascript', () => {
        describe('Js Groth16', () => {

          it('should create groth16 javascript template', async () => {

            const response = await executeWithInput(
              'cd test/templates && shield init', ["js-groth16", KEYS.ENTER, KEYS.ENTER, KEYS.ENTER, "Alice", KEYS.ENTER, "cafe's mayfair biscuit", KEYS.ENTER]
            );

            sleep(5000)

            const result = response.includes("Successfully generated the code.")

            const listResponse = await executeWithInput(
              'cd test/templates/js-groth16 && ls'
            );

            expect(listResponse).to.equal('circuits\n' +
              'contracts\n' +
              'hardhat.config.js\n' +
              'package.json\n' +
              'README.md\n' +
              'scripts\n' +
              'test\n' +
              'util\n'
            )

            expect(result).to.equals(true)

          });

          it("should contain correct contributer name", async () => {
            const filePath = path.join(process.cwd(), `/test/templates/js-groth16/scripts/compile-circuit.sh`);
            let fileContent = await fsExtra.readFile(filePath);
            let result = fileContent.toString().includes('--name="Alice"')
            expect(result).to.equal(true)
          })

          it("should contain correct entropy string", async () => {
            const filePath = path.join(process.cwd(), `/test/templates/js-groth16/scripts/compile-circuit.sh`);
            let fileContent = await fsExtra.readFile(filePath);
            let result = fileContent.toString().includes(`-e="cafe's mayfair biscuit"`)
            expect(result).to.equal(true)
          })

        });
        describe('Js Plonk', () => {
          it('should create plonk javascript template', async () => {

            const response = await executeWithInput(
              'cd test/templates && shield init', ["js-plonk", KEYS.ENTER, KEYS.ENTER, KEYS.DOWN, KEYS.ENTER, KEYS.ESCAP]
            );

            sleep(5000)

            const result = response.includes("Successfully generated the code.")

            const listResponse = await executeWithInput(
              'cd test/templates/js-plonk && ls'
            );

            expect(listResponse).to.equal('circuits\n' +
              'contracts\n' +
              'hardhat.config.js\n' +
              'package.json\n' +
              'README.md\n' +
              'scripts\n' +
              'test\n' +
              'util\n'
            )

            expect(result).to.equals(true)

          });
        });
      });
    })
  })
});
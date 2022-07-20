import chalk from "chalk";
import Enquirer from "enquirer";
import path from "path";
import fsExtra from "fs-extra";
import { findUpSync } from "find-up";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const { prompt } = Enquirer;
const __filename = fileURLToPath(import.meta.url);

export const init = async () => {
  try {
    let projectName = "";
    let projectPath = "";
    let projectLanguage = "";
    let proofSystem = "";
    let contributionName = "";
    const response = await prompt([
      {
        type: "input",
        name: "folderName",
        message: "Please enter the name of project?",
        initial: "shield-demo",
        onSubmit: async (name, value) => {
          value = value.trim();
          if (
            value &&
            /^[^\s^\x00-\x1f\\?*:"";<>|\/.][^\x00-\x1f\\?*:"";<>|\/]*[^\s^\x00-\x1f\\?*:"";<>|\/.]+$/.test(
              value
            )
          ) {
            console.log("");
            const temp = await getEmptyDir(value.trim());
            projectName = value.trim();
          } else {
            printNameValidationError();
            process.exit(1);
          }
        },
      },
      {
        type: "select",
        name: "language",
        message: "Please select the language for project.",
        choices: ["Javascript", "Typescript"],
        result: async (value) => {
          projectLanguage = value.toLowerCase();
        },
      },
      {
        type: "select",
        name: "proofSystem",
        message: "Please select the proof system for project.",
        choices: ["Groth16", "Plonk"],
        result: async (value) => {
          proofSystem = value;
          if (value === "Plonk") {
            const src = `${getPackageRoot()}/template/${projectLanguage}/${value.toLowerCase()}`;
            const dest = `${process.cwd()}/${projectName}`;
            projectPath = dest;
            await fsExtra.copy(src, dest);
            await updateCopyProjectName(projectName, projectPath);
            console.log(chalk.greenBright("Successfully generated the code."));
          }
        },
      },
      {
        type: "input",
        name: "contributerName",
        message: "Please enter the contribution name for groth16 setup?",
        initial: "1st Contributor Name",
        skip: () => proofSystem === "Plonk",
        onSubmit: async (name, value) => {
          contributionName = value;
        },
      },
      {
        type: "input",
        name: "folderName",
        message: "Please enter the entropy for groth16 setup?",
        initial: "random text",
        skip: () => proofSystem === "Plonk",
        onSubmit: async (name, value) => {
          const src = `${getPackageRoot()}/template/${projectLanguage}/groth16`;
          const dest = `${process.cwd()}/${projectName}`;
          await fsExtra.copy(src, dest);
          await updateCompileCircuit(dest, contributionName, value);
          await updateCopyProjectName(projectName, dest);
          console.log(chalk.greenBright("Successfully generated the code."));
        },
      },
      {
        type: "select",
        name: "package",
        message: "Please select the package manager for project.",
        choices: ["npm", "yarn"],
        result: (val) => {
          console.log(chalk.greenBright("Installing Dependencies..."));
          const command = val == "npm" ? `npm` : `yarn`;
          const args = val == "npm" ? ["install"] : [];
          const dependencies = spawn(command, args, { cwd: projectPath });
          dependencies.stdout.on("data", (data) => {
            console.log(data.toString());
          });
          dependencies.stderr.on("data", (data) => {
            console.log(data.toString());
          });
          dependencies.stdout.once("close", (data) => {
            console.log(
              chalk.greenBright("Dependencies succesfully installed.")
            );
            console.log("");
            console.log(chalk.greenBright("Happy coding :)"));
          });
        },
      },
    ]);
  } catch (e) {
    console.log(chalk.red(e.message ? e.message : "Aborted."));
  }
};

const printNameValidationError = () => {
  console.log("");
  console.log(chalk.red("Kindly enter a valid name."));
  console.log("");
  console.log(chalk.red("A valid name cannot have following attributes."));
  console.log("");
  console.log(
    chalk.red(`The characters not allowed at the beginning or the end are:
- Blank space
- Dot (.)`)
  );
  console.log("");
  console.log(
    chalk.red(`The characters not allowed in any place in the folder name are:
- Asterisk (*)
- Backslash ()
- Colon (:)
- Double quote (")
- Forward slash (/)
- Greater than (>)
- Less than (<)
- Question mark (?)
- Vertical bar or pipe (|)`)
  );
};

async function getEmptyDir(name) {
  const tmpDir = path.join(process.cwd(), `/${name}`);
  const dir = await fsExtra.ensureDir(tmpDir);
  if (!dir) {
    console.log(
      chalk.red(
        `A folder named "${name}" already exist, delete or move it to somewhere else and try again!!`
      )
    );
    process.exit(1);
  }
  const empty = await fsExtra.emptyDir(tmpDir);

  return tmpDir;
}

function getPackageRoot() {
  const packageJsonPath = getPackageJsonPath();

  return path.dirname(packageJsonPath);
}

function getPackageJsonPath() {
  return findClosestPackageJson(__filename);
}

function findClosestPackageJson(file) {
  const res = findUpSync("package.json", { cwd: path.dirname(file) });
  return res;
}

async function updateCopyProjectName(name, projectPath) {
  try {
    const packageJsonPath = path.join(projectPath, `/package.json`);
    const packageJson = fsExtra.readJsonSync(packageJsonPath);

    packageJson.name = name;

    const res = await fsExtra.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 3)
    );
    return res;
  } catch (e) {
    console.log(e);
    return null;
  }
}

async function updateCompileCircuit(projectPath, contributionName, entropy) {
  try {
    const filePath = path.join(projectPath, `/scripts/compile-circuit.sh`);
    let fileContent = await fsExtra.readFile(filePath);

    fileContent = fileContent
      .toString()
      .replace("1st Contributor Name", contributionName);

    fileContent = fileContent.toString().replace("random text", entropy);

    const res = await fsExtra.writeFile(filePath, fileContent);
    return res;
  } catch (e) {
    console.log(e);
    return null;
  }
}

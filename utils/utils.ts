import chalk from 'chalk';
import path from 'path';
import fsExtra from 'fs-extra';
// import { findUpSync } from 'find-up';

export const printNameValidationError = () => {
  console.log('');
  console.log(chalk.red('Kindly enter a valid name.'));
  console.log('');
  console.log(chalk.red('A valid name cannot have following attributes.'));
  console.log('');
  console.log(
    chalk.red(`The characters not allowed at the beginning or the end are:
- Blank space
- Dot (.)`)
  );
  console.log('');
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

export const getEmptyDir = async (name: string) => {
  const tmpDir = path.join(process.cwd(), `/${name}`);
  console.log({ tmpDir });
  const dir = await fsExtra.ensureDir(tmpDir);
  if (dir === null) {
    console.log(
      chalk.red(
        `A folder named "${name}" already exist, delete or move it to somewhere else and try again!!`
      )
    );
    process.exit(1);
  }
  const empty = await fsExtra.emptyDir(tmpDir);
  return tmpDir;
};

export const getPackageRoot = () => {
  const packageJsonPath = getPackageJsonPath();

  return path.dirname(packageJsonPath ? packageJsonPath : '');
};

export const getPackageJsonPath = () => {
  return findClosestPackageJson(__dirname);
};

export const findClosestPackageJson = (file: string) => {
  // const res = findUpSync('package.json', { cwd: path.dirname(file) });
  return '';
  // return res;
};

export const updateCopyProjectName = async (
  name: string,
  projectPath: string
) => {
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
};

export const updateCompileCircuit = async (
  projectPath: string,
  contributionName: string,
  entropy: string
) => {
  try {
    const filePath = path.join(projectPath, `/scripts/compile-circuit.sh`);
    let fileContent: Buffer | string = await fsExtra.readFile(filePath);

    fileContent = fileContent
      .toString()
      .replace('1st Contributor Name', contributionName);

    fileContent = fileContent.toString().replace('random text', entropy);

    const res = await fsExtra.writeFile(filePath, fileContent);
    return res;
  } catch (e) {
    console.log(e);
    return null;
  }
};

import chalk from 'chalk';
import path from 'path';
import fsExtra from 'fs-extra';

export const getEmptyDir = async (name: string) => {
  const tmpDir = path.join(process.cwd(), `/${name}`);
  console.log({ tmpDir });
  const dir = await fsExtra.ensureDir(tmpDir);
  console.log({ dir });
  if (dir === undefined) {
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

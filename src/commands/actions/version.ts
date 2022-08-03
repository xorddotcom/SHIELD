import chalk from "chalk";
import { getPackageJson } from "../../../utils/packageInfo";

export const version = async () => {
  try {
    const packageJson = await getPackageJson();
    console.log(packageJson.version);
    return;
  } catch (error) {
    let errorMessage = "Aborted.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.log(chalk.red(errorMessage));
  }
};

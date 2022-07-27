import path from "path";
import { findUpSync } from "find-up";
import { fileURLToPath } from "url";
import fsExtra from "fs-extra";

const __filename = fileURLToPath(import.meta.url);


export function getPackageRoot() {
  const packageJsonPath = getPackageJsonPath();

  return path.dirname(packageJsonPath);
}

export function getPackageJsonPath() {
  return findClosestPackageJson(__filename);
}

export function findClosestPackageJson(file) {
  const res = findUpSync("package.json", { cwd: path.dirname(file) });
  return res;
}
export function getShieldVersion(){
  const packageJsonPath = getPackageJsonPath();

  if (packageJsonPath === null) {
    return null;
  }

  try {
    const packageJson = fsExtra.readJsonSync(packageJsonPath);
    return packageJson.version;
  } catch {
    return null;
  }
}
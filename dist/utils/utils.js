"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCompileCircuit = exports.updateCopyProjectName = exports.findClosestPackageJson = exports.getPackageJsonPath = exports.getPackageRoot = exports.getEmptyDir = exports.printNameValidationError = void 0;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
// import { findUpSync } from 'find-up';
const printNameValidationError = () => {
    console.log('');
    console.log(chalk_1.default.red('Kindly enter a valid name.'));
    console.log('');
    console.log(chalk_1.default.red('A valid name cannot have following attributes.'));
    console.log('');
    console.log(chalk_1.default.red(`The characters not allowed at the beginning or the end are:
- Blank space
- Dot (.)`));
    console.log('');
    console.log(chalk_1.default.red(`The characters not allowed in any place in the folder name are:
- Asterisk (*)
- Backslash ()
- Colon (:)
- Double quote (")
- Forward slash (/)
- Greater than (>)
- Less than (<)
- Question mark (?)
- Vertical bar or pipe (|)`));
};
exports.printNameValidationError = printNameValidationError;
const getEmptyDir = async (name) => {
    const tmpDir = path_1.default.join(process.cwd(), `/${name}`);
    console.log({ tmpDir });
    const dir = await fs_extra_1.default.ensureDir(tmpDir);
    if (dir === null) {
        console.log(chalk_1.default.red(`A folder named "${name}" already exist, delete or move it to somewhere else and try again!!`));
        process.exit(1);
    }
    const empty = await fs_extra_1.default.emptyDir(tmpDir);
    return tmpDir;
};
exports.getEmptyDir = getEmptyDir;
const getPackageRoot = () => {
    const packageJsonPath = (0, exports.getPackageJsonPath)();
    return path_1.default.dirname(packageJsonPath ? packageJsonPath : '');
};
exports.getPackageRoot = getPackageRoot;
const getPackageJsonPath = () => {
    return (0, exports.findClosestPackageJson)(__dirname);
};
exports.getPackageJsonPath = getPackageJsonPath;
const findClosestPackageJson = (file) => {
    // const res = findUpSync('package.json', { cwd: path.dirname(file) });
    return '';
    // return res;
};
exports.findClosestPackageJson = findClosestPackageJson;
const updateCopyProjectName = async (name, projectPath) => {
    try {
        const packageJsonPath = path_1.default.join(projectPath, `/package.json`);
        const packageJson = fs_extra_1.default.readJsonSync(packageJsonPath);
        packageJson.name = name;
        const res = await fs_extra_1.default.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 3));
        return res;
    }
    catch (e) {
        console.log(e);
        return null;
    }
};
exports.updateCopyProjectName = updateCopyProjectName;
const updateCompileCircuit = async (projectPath, contributionName, entropy) => {
    try {
        const filePath = path_1.default.join(projectPath, `/scripts/compile-circuit.sh`);
        let fileContent = await fs_extra_1.default.readFile(filePath);
        fileContent = fileContent
            .toString()
            .replace('1st Contributor Name', contributionName);
        fileContent = fileContent.toString().replace('random text', entropy);
        const res = await fs_extra_1.default.writeFile(filePath, fileContent);
        return res;
    }
    catch (e) {
        console.log(e);
        return null;
    }
};
exports.updateCompileCircuit = updateCompileCircuit;
//# sourceMappingURL=utils.js.map
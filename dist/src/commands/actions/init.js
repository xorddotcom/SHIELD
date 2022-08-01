"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const chalk_1 = __importDefault(require("chalk"));
const enquirer_1 = __importDefault(require("enquirer"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const child_process_1 = require("child_process");
const ora_1 = __importDefault(require("ora"));
const utils_1 = require("../../../utils/utils");
const { prompt } = enquirer_1.default;
const init = async () => {
    try {
        let projectName = '';
        let projectPath = '';
        let projectLanguage = '';
        let proofSystem = '';
        let contributionName = '';
        const response = await prompt([
            {
                type: 'input',
                name: 'folderName',
                message: 'Please enter the name of project?',
                initial: 'shield-demo',
                onSubmit: async (name, value) => {
                    value = value.trim();
                    if (value &&
                        /^[^\s^\x00-\x1f\\?*:"";<>|\/.][^\x00-\x1f\\?*:"";<>|\/]*[^\s^\x00-\x1f\\?*:"";<>|\/.]+$/.test(value)) {
                        console.log('');
                        const temp = await (0, utils_1.getEmptyDir)(value.trim());
                        projectName = value.trim();
                        return true;
                    }
                    else {
                        (0, utils_1.printNameValidationError)();
                        process.exit(1);
                    }
                },
            },
            {
                type: 'select',
                name: 'language',
                message: 'Please select the language for project.',
                choices: ['Javascript', 'Typescript'],
                result: async (value) => {
                    projectLanguage = value.toLowerCase();
                    return projectLanguage;
                },
            },
            {
                type: 'select',
                name: 'proofSystem',
                message: 'Please select the proof system for project.',
                choices: ['Groth16', 'Plonk'],
                result: async (value) => {
                    proofSystem = value;
                    const src = `${(0, utils_1.getPackageRoot)()}/template/${projectLanguage}/${value.toLowerCase()}`;
                    const dest = `${process.cwd()}/${projectName}`;
                    projectPath = dest;
                    if (value === 'Plonk') {
                        await fs_extra_1.default.copy(src, dest);
                        await (0, utils_1.updateCopyProjectName)(projectName, projectPath);
                        console.log(chalk_1.default.greenBright('Successfully generated the code.'));
                    }
                    return dest;
                },
            },
            {
                type: 'input',
                name: 'contributerName',
                message: 'Please enter the contribution name for groth16 setup?',
                initial: '1st Contributor Name',
                skip: () => proofSystem === 'Plonk',
                onSubmit: async (name, value) => {
                    if (proofSystem === 'Groth16') {
                        contributionName = value;
                    }
                    return true;
                },
            },
            {
                type: 'input',
                name: 'entropy',
                message: 'Please enter the entropy for groth16 setup?',
                initial: 'random text',
                skip: () => proofSystem === 'Plonk',
                onSubmit: async (name, value) => {
                    if (proofSystem === 'Groth16') {
                        const src = `${(0, utils_1.getPackageRoot)()}/template/${projectLanguage}/groth16`;
                        const dest = `${process.cwd()}/${projectName}`;
                        await fs_extra_1.default.copy(src, dest);
                        await (0, utils_1.updateCompileCircuit)(dest, contributionName, value);
                        await (0, utils_1.updateCopyProjectName)(projectName, dest);
                        console.log('');
                        console.log(chalk_1.default.greenBright('Successfully generated the code.'));
                    }
                    return true;
                },
            },
            {
                type: 'select',
                name: 'package',
                message: 'Please select the package manager for project.',
                choices: ['npm', 'yarn'],
                result: (val) => {
                    const spinner = (0, ora_1.default)(chalk_1.default.greenBright('Installing Dependencies...')).start();
                    const OS = /^win/.test(process.platform) ? 'win' : 'linux';
                    const command = val == 'npm'
                        ? OS === 'win'
                            ? 'npm.cmd'
                            : 'npm'
                        : OS === 'win'
                            ? 'yarn.cmd'
                            : 'yarn';
                    const args = val == 'npm' ? ['install'] : [];
                    const dependencies = (0, child_process_1.spawn)(command, args, { cwd: projectPath });
                    dependencies.stdout.on('data', (data) => {
                        console.log(data.toString());
                    });
                    dependencies.stderr.once('data', () => {
                        spinner.stopAndPersist();
                    });
                    dependencies.stderr.on('data', (data) => {
                        console.log(data.toString());
                    });
                    dependencies.stdout.once('close', () => {
                        spinner.succeed(chalk_1.default.greenBright('Dependencies succesfully installed.'));
                        console.log('');
                        console.log(chalk_1.default.greenBright('Happy coding :)'));
                    });
                    return 'Happy coding :)';
                },
            },
        ]);
    }
    catch (error) {
        let errorMessage = 'Aborted.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.log(chalk_1.default.red(errorMessage));
    }
};
exports.init = init;
//# sourceMappingURL=init.js.map
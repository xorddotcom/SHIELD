export declare const printNameValidationError: () => void;
export declare const getEmptyDir: (name: string) => Promise<string>;
export declare const getPackageRoot: () => string;
export declare const getPackageJsonPath: () => string;
export declare const findClosestPackageJson: (file: string) => string;
export declare const updateCopyProjectName: (name: string, projectPath: string) => Promise<void | null>;
export declare const updateCompileCircuit: (projectPath: string, contributionName: string, entropy: string) => Promise<void | null>;
//# sourceMappingURL=utils.d.ts.map
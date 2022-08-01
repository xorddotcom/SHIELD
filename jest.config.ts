module.exports = {
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  roots: ['<rootDir>/test'],
  preset: 'ts-jest',
  testEnvironment: 'node',
};

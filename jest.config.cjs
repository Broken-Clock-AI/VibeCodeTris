/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  setupFiles: ['raf/polyfill'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.m?tsx?$': [ // Added 'm' to handle .mts files if they appear
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  // This is the key change: It tells Jest how to resolve module paths.
  // We're telling it to look for .ts files when an import is encountered.
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Pointing Jest to the root of our source files
  roots: ['<rootDir>/src'],
  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    // This regex handles imports that end with '.js' and tells Jest to look for a corresponding '.ts' file instead.
    '(.+)\\.js$': '$1',
  },
};

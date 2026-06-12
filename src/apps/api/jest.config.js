/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  coverageDirectory: '../coverage',
  collectCoverageFrom: ['**/*.service.ts'],
  coverageReporters: ['text', 'lcov', 'html'],
};

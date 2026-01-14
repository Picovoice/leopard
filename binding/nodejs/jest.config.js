/** @type {import('jest').Config} */
module.exports = {
  rootDir: 'pre-compiled',
  testEnvironment: 'node',
  transform: {},
  testMatch: ['<rootDir>/test/*.test.js'],
};

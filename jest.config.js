/** @type {import('ts-jest').JestConfigWithTsJest} **/

export default {
  preset: 'jest-puppeteer',
  // testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['expect-puppeteer'],
  testTimeout: 100000,
  transform: {
    '^.+.(ts|tsx)?$': ['ts-jest', {}],
  },
};

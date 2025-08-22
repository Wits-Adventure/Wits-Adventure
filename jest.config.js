module.exports = {
  rootDir: './',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/react_components/Addition_test.js',
    '!**/node_modules/**',
    '!src/reportWebVitals.js',
    '!src/setupTests.js',
  ],
  coverageReporters: ['lcov', 'text'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: [
    '<rootDir>/src/tests/**/*.test.js',
    '<rootDir>/tests/**/*.test.js' 
  ],
};
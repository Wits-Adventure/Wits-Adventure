module.exports = {
  rootDir: './',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/react_components/PasswordValidator.js',
    'src/firebase/firebase.js',
    'src/firebase/profile_functions.js',
    'src/firebase/general_quest_functions.js',
    'src/react_components/protectedRoute.js',
    'src/react_components/LeaderboardAchievements.js',
     'src/react_components/QuestManager.js',
     'src/react_components/QuestBook.js',
     'src/react_components/unauthorized.js',
    
    '!**/node_modules/**',
    '!src/reportWebVitals.js',
    '!src/setupTests.js',
  ],
  coverageReporters: ['lcov', 'text'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: [
    '<rootDir>/src/tests/**/*.test.js',
    '<rootDir>/tests/**/*.test.js' 
  ],
};
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/unit/backend', '<rootDir>/integration', '<rootDir>/security', '<rootDir>/performance'],
  collectCoverageFrom: [
    '../functions/src/**/*.{ts,js}',
    '!../functions/src/**/*.d.ts',
    '!../functions/src/index.ts',
    '!../functions/lib/**/*'
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/__tests__/**/*.(ts|js)',
    '**/*.(test|spec).(ts|js)'
  ],
  setupFilesAfterEnv: ['<rootDir>/setup/jest.setup.js'],
  testTimeout: 30000,
  verbose: true,
  maxWorkers: '50%'
};
/** @type {import('jest').Config} */
export default {
  // Test environment
  testEnvironment: 'node',

  // File patterns - JavaScript test files only
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Coverage configuration with Istanbul
  collectCoverage: false, // Only when explicitly requested
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts',
    '!src/__tests__/**',
    '!src/index.{js,ts}',
    '!**/node_modules/**',
    '!**/dist/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Coverage reporters (Istanbul reporters)
  coverageReporters: [
    'text',           // Console output
    'text-summary',   // Brief summary
    'html',          // HTML report
    'lcov',          // For CI/CD integration
    'json',          // JSON for processing
    'cobertura'      // XML for CI/CD
  ],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Test timeout (30 seconds for integration tests)
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output for debugging
  verbose: true,

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // ES Module support
  extensionsToTreatAsEsm: ['.js'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // Watch mode configuration
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ]
};

/**
 * ESLint configuration (flat config format).
 *
 * Rules chosen to catch common bugs without being noisy.
 * Most rules are "warn" rather than "error" so they don't block your
 * workflow — fix them when convenient.
 */

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  // Apply ESLint's recommended rules as the baseline
  js.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      // Catch real bugs
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-console': 'off',
      'no-var': 'error',
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'always'],

      // Style consistency
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'semi': ['warn', 'always'],
      'comma-dangle': ['warn', 'never'],

      // Async/await safety
      'no-async-promise-executor': 'error',
      'require-await': 'warn'
    }
  },

  // Ignore generated files and dependencies
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'migrations/**'  // generated files have their own style
    ]
  }
];
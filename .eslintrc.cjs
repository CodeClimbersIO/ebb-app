module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  ignorePatterns: ['.eslintrc.cjs', 'supabase/functions/**/*.ts'],
  settings: {
    "import/resolver": {
      typescript: {
        project: './tsconfig.json',
        alwaysTryTypes: true
      }
    },
  },
  rules: {

    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    'prefer-arrow-callback': 'warn',
    'semi': ['error', 'never'],
    'quotes': ['error', 'single'],
    'eol-last': ['error', 'always'],
    'indent': ['error', 2],
    // Prefer @/ alias over relative paths (not auto-fixable)
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['../components/**', '../../components/**', '../../../components/**'],
          message: 'Use @/components/* instead of relative paths'
        },
        {
          group: ['../api/**', '../../api/**', '../../../api/**'],
          message: 'Use @/api/* instead of relative paths'
        },
        {
          group: ['../lib/**', '../../lib/**', '../../../lib/**'],
          message: 'Use @/lib/* instead of relative paths'
        },
        {
          group: ['../hooks/**', '../../hooks/**', '../../../hooks/**'],
          message: 'Use @/hooks/* instead of relative paths'
        },
        {
          group: ['../pages/**', '../../pages/**', '../../../pages/**'],
          message: 'Use @/pages/* instead of relative paths'
        }
      ]
    }],
  },
  overrides: [
    {
      files: ['packages/server/commands/**/*.ts'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
    {
      files: ["src/components/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": ["error", {
          "paths": [
            {
              "name": "@/db/ebb/notificationRepo",
              "message": "Architecture: Components must not import repos (`@/db/**`). Use `@/api/hooks/useNotifications` (Layer 1) or `@/api/ebbApi/notificationApi` (Layer 2)."
            }
          ],
          "patterns": [
            {
              "group": ["@/db/**"],
              "message": "Architecture: Components cannot import repositories (`@/db/**`). Use hooks under `@/api/hooks` or APIs under `@/api/ebbApi`."
            },
            {
              "group": ["../db/**", "../../db/**"],
              "message": "Architecture: No direct DB imports from components. Import a hook/API instead."
            }
          ]
        }]
      }
    },
    {

      files: ["src/api/hooks/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": ["error", {
          "paths": [
            {
              "name": "@/db/ebb/notificationRepo",
              "message": "Architecture: Hooks (Layer 1) must not import repos (Layer 3). Use `@/api/ebbApi/notificationApi` (Layer 2)."
            }
          ],
          "patterns": [
            {
              "group": ["@/db/**", "../db/**", "../../db/**"],
              "message": "Architecture: Hooks (Layer 1) must not import repos (Layer 3). Call APIs under `@/api/ebbApi` (Layer 2) instead."
            }
          ]
        }]
      }
    }
  ],
}

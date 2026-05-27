import js from '@eslint/js';
import neosEslintPlugin from '@neos21/neos-eslint-plugin';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import tailwindcss from 'eslint-plugin-tailwindcss';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      js,
      import: importPlugin
    },
    extends: ['js/recommended'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      
      'import/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'],
            ['internal'],
            ['parent', 'sibling', 'index'],
            ['type']
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }
      ]
    }
  },
  
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowIIFEs: true
      }]
    }
  },
  
  neosEslintPlugin.configs.recommended,
  
  {
    ...pluginReact.configs.flat.recommended,
    rules: {
      'react/react-in-jsx-scope': 'off'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  
  {
    plugins: {
      'react-hooks': pluginReactHooks as unknown as Plugin,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/immutability': 'error'
    }
  },
  
  ...tailwindcss.configs['flat/recommended'],  // Tailwind CSS のクラス名を検証する
  {
    settings: {
      tailwindcss: {
        config: false
      }
    },
    rules: {
      'tailwindcss/classnames-order': 'off'
    }
  },
  
  {
    ignores: [
      'node_modules/**',
      '.wrangler/**',
      '.react-router/**',
      'build/**',
      'worker-configuration.d.ts'
    ]
  }
]);

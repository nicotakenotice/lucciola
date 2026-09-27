import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
    { ignores: [ 'dist', 'coverage', 'test-results', 'playwright-report', 'log.js' ] },
    {
        files: [ '**/*.{ts,tsx,mjs}' ],
        extends: [ js.configs.recommended, ...tseslint.configs.recommended ],
        languageOptions: { ecmaVersion: 2022 }
    },
    {
        files: [ 'src/**/*.{ts,tsx}' ],
        languageOptions: { globals: globals.browser },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [ 'warn', { allowConstantExport: true } ]
        }
    },
    {
        files: [ 'e2e/**/*.ts', 'scripts/**/*.{ts,mjs}', '*.config.{ts,mjs}', 'vite/**/*.mjs' ],
        languageOptions: { globals: globals.node }
    }
);

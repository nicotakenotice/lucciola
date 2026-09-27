import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import stylistic from '@stylistic/eslint-plugin';

export default tseslint.config(
    { ignores: [ 'dist', 'coverage', 'test-results', 'playwright-report' ] },
    {
        files: [ '**/*.{ts,tsx,mjs}' ],
        extends: [ js.configs.recommended, ...tseslint.configs.recommended ],
        languageOptions: { ecmaVersion: 2022 },
        plugins: { '@stylistic': stylistic },
        // House style, inherited from the Phaser template: Allman braces, 4 spaces, spaced brackets
        rules: {
            '@stylistic/brace-style': [ 'error', 'allman', { allowSingleLine: true } ],
            '@stylistic/indent': [ 'error', 4, { SwitchCase: 1 } ],
            '@stylistic/quotes': [ 'error', 'single', { avoidEscape: true } ],
            '@stylistic/jsx-quotes': [ 'error', 'prefer-double' ],
            '@stylistic/semi': [ 'error', 'always' ],
            '@stylistic/comma-dangle': [ 'error', 'never' ],
            '@stylistic/comma-spacing': 'error',
            '@stylistic/key-spacing': 'error',
            '@stylistic/keyword-spacing': 'error',
            '@stylistic/space-infix-ops': 'error',
            '@stylistic/space-before-blocks': 'error',
            '@stylistic/space-before-function-paren': [ 'error', { anonymous: 'always', named: 'always', asyncArrow: 'always' } ],
            '@stylistic/object-curly-spacing': [ 'error', 'always' ],
            '@stylistic/array-bracket-spacing': [ 'error', 'always' ],
            '@stylistic/arrow-parens': [ 'error', 'always' ],
            '@stylistic/eol-last': 'error',
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/no-multiple-empty-lines': [ 'error', { max: 1, maxEOF: 0 } ],
            '@stylistic/padded-blocks': [ 'error', 'never' ]
        }
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

'use strict'

module.exports = {
    env: {
        commonjs: true,
        es6: true,
        node: true,
        mocha: true
    },
    extends: 'eslint:recommended',
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
    },
    parserOptions: {
        ecmaVersion: 2021
    },
    rules: {
        strict: ['error', 'safe']
    }
}

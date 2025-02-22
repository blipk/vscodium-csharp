/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check

// Import statements do not work outside of modules.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
/**@type {import('webpack').Configuration}*/
const config = {
    target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
    entry: './src/main.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    devtool: 'source-map',
    externals: {
        vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
        'applicationinsights-native-metrics': 'commonjs applicationinsights-native-metrics', // we're not native
        '@opentelemetry/tracing': 'commonjs @opentelemetry/tracing', // optional
    },
    resolve: { // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
        extensions: ['.ts', '.js'],
        exportsFields: [],
        alias: [
            {
                name: 'vscode-jsonrpc',
                alias: 'vscode-jsonrpc/lib/common/api',
                onlyModule: true
            },
            {
                name: 'vscode-jsonrpc/node',
                alias: 'vscode-jsonrpc/lib/node/main',
                onlyModule: true
            },
            {
                name: 'vscode-languageserver-protocol',
                alias: 'vscode-languageserver-protocol/lib/common/api',
                onlyModule: true
            },
            {
                name: 'vscode-languageserver-protocol/node',
                alias: 'vscode-languageserver-protocol/lib/node/main',
                onlyModule: true
            },
            {
                name: 'vscode-languageclient',
                alias: 'vscode-languageclient/lib/common/api',
                onlyModule: true
            },
            {
                name: 'vscode-languageclient/node',
                alias: 'vscode-languageclient/lib/node/main',
                onlyModule: true
            }
        ]
    },
    node: {
        __dirname: false //preserve the default node.js behavior for __dirname
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'ts-loader',
                }],
            },
            {
                test: /node_modules[\\|/](vscode-languageserver-types|vscode-languageserver-textdocument)/,
                use: "umd-compat-loader",
            },
        ]
    },
};

module.exports = config;

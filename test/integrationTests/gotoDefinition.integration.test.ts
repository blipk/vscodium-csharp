/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as path from 'path';
import testAssetWorkspace from './testAssets/testAssetWorkspace';
import { activateCSharpExtension, closeAllEditorsAsync, openFileInWorkspaceAsync } from './integrationHelpers';
import { describe, beforeAll, beforeEach, afterAll, test, expect, afterEach } from '@jest/globals';

describe(`[${testAssetWorkspace.description}] Test Go To Definition`, () => {
    beforeAll(async () => {
        await activateCSharpExtension();
    });

    beforeEach(async () => {
        await openFileInWorkspaceAsync(path.join('src', 'app', 'definition.cs'));
    });

    afterAll(async () => {
        await testAssetWorkspace.cleanupWorkspace();
    });

    afterEach(async () => {
        await closeAllEditorsAsync();
    });

    test('Navigates to definition in same file', async () => {
        const requestPosition = new vscode.Position(10, 31);
        const definitionList = <vscode.Location[]>(
            await vscode.commands.executeCommand(
                'vscode.executeDefinitionProvider',
                vscode.window.activeTextEditor!.document.uri,
                requestPosition
            )
        );
        expect(definitionList.length).toEqual(1);
        expect(definitionList[0].uri.path).toContain('definition.cs');
        expect(definitionList[0].range).toStrictEqual(new vscode.Range(6, 29, 6, 32));
    });

    test('Navigates to definition in different file', async () => {
        const requestPosition = new vscode.Position(16, 19);
        const definitionList = <vscode.Location[]>(
            await vscode.commands.executeCommand(
                'vscode.executeDefinitionProvider',
                vscode.window.activeTextEditor!.document.uri,
                requestPosition
            )
        );
        expect(definitionList.length).toEqual(1);
        expect(definitionList[0].uri.path).toContain('diagnostics.cs');
        expect(definitionList[0].range).toStrictEqual(new vscode.Range(4, 17, 4, 23));

        await navigate(requestPosition, definitionList, 'diagnostics.cs');
    });

    test('Navigates to definition in decompiled source', async () => {
        await openFileInWorkspaceAsync(path.join('test', 'UnitTest1.cs'));

        // Get definitions
        const requestPosition = new vscode.Position(13, 9);
        const definitionList = <vscode.Location[]>(
            await vscode.commands.executeCommand(
                'vscode.executeDefinitionProvider',
                vscode.window.activeTextEditor!.document.uri,
                requestPosition
            )
        );
        expect(definitionList.length).toEqual(1);
        const definitionPath = definitionList[0].uri;
        expect(definitionPath.fsPath).toContain('FactAttribute.cs');

        // Navigate
        await navigate(requestPosition, definitionList, 'FactAttribute.cs');
        expect(vscode.window.activeTextEditor?.document.getText()).toContain(
            '// Decompiled with ICSharpCode.Decompiler'
        );
    });

    test('Navigates to definition in metadata as source', async () => {
        // Get definitions
        const requestPosition = new vscode.Position(10, 25);
        const definitionList = <vscode.Location[]>(
            await vscode.commands.executeCommand(
                'vscode.executeDefinitionProvider',
                vscode.window.activeTextEditor!.document.uri,
                requestPosition
            )
        );
        expect(definitionList.length).toEqual(1);
        const definitionPath = definitionList[0].uri;
        expect(definitionPath.fsPath).toContain('Console.cs');

        // Navigate
        await navigate(requestPosition, definitionList, 'Console.cs');
        expect(vscode.window.activeTextEditor?.document.getText()).not.toContain(
            '// Decompiled with ICSharpCode.Decompiler'
        );
    });

    test('Returns multiple definitions for partial types', async () => {
        const definitionList = <vscode.Location[]>(
            await vscode.commands.executeCommand(
                'vscode.executeDefinitionProvider',
                vscode.window.activeTextEditor!.document.uri,
                new vscode.Position(4, 25)
            )
        );
        expect(definitionList.length).toEqual(2);
        expect(definitionList[0].uri.path).toContain('definition.cs');
        expect(definitionList[0].range).toStrictEqual(
            new vscode.Range(new vscode.Position(4, 25), new vscode.Position(4, 35))
        );
        expect(definitionList[1].uri.path).toContain('definition.cs');
        expect(definitionList[1].range).toStrictEqual(
            new vscode.Range(new vscode.Position(14, 25), new vscode.Position(14, 35))
        );
    });
});

async function navigate(
    originalPosition: vscode.Position,
    definitionLocations: vscode.Location[],
    expectedFileName: string
): Promise<void> {
    const windowChanged = new Promise<void>((resolve, _) => {
        vscode.window.onDidChangeActiveTextEditor((_e) => {
            if (_e?.document.fileName.includes(expectedFileName)) {
                resolve();
            }
        });
    });

    await vscode.commands.executeCommand(
        'editor.action.goToLocations',
        vscode.window.activeTextEditor!.document.uri,
        originalPosition,
        definitionLocations,
        'goto',
        'Failed to navigate'
    );

    // Navigation happens asynchronously when a different file is opened, so we need to wait for the window to change.
    await windowChanged;

    expect(vscode.window.activeTextEditor?.document.fileName).toContain(expectedFileName);
}

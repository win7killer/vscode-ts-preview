'use strict';

import * as vscode from 'vscode';
import { Main } from './main';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.tsPreview', () => {
        let acEditor = vscode.window.activeTextEditor;
        if (acEditor && acEditor.document.languageId === 'typescript') {
            new Main();
        } else {
            vscode.window.showInformationMessage('It‘s not a .ts(x) file');
        }
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

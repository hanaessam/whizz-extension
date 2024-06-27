import * as vscode from 'vscode';

export function replaceSelectedCode(newCode: string) {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    const selection = editor.selection;

    editor.edit(editBuilder => {
        editBuilder.replace(selection, newCode);
    }).then(success => {
        if (success) {
            vscode.window.showInformationMessage('Code replaced successfully!');
        } else {
            vscode.window.showErrorMessage('Failed to replace code.');
        }
    });
}

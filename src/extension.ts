// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';

import { SidebarProvider } from './panels/SidebarProvider';



// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"whizz-sidebar",
			sidebarProvider
		)
	);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "whizz" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('whizz.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from whizz!');
	});


	let highlight = vscode.commands.registerCommand('whizz.sendSelectedCode', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selectedCode = editor.document.getText(editor.selection);
            sendSelectedCodeToServer(selectedCode);
			vscode.window.showInformationMessage(selectedCode);
        } else {
            vscode.window.showErrorMessage('No text selected');
        }
    });


	context.subscriptions.push(disposable, highlight);
}

async function sendSelectedCodeToServer(selectedCode: string) {
    try {
        const response = await axios.post('http://localhost:8888/vscode/highlight', {
            highlightedCode: selectedCode
        });
        console.log(response.data);
        vscode.window.showInformationMessage('Selected code sent to server successfully');
    } catch (error) {
        console.error('Error sending selected code:', error);
        vscode.window.showErrorMessage('Error sending selected code to server');
    }
}


// This method is called when your extension is deactivated
export function deactivate() {}

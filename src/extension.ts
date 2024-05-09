// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SidebarProvider } from './panels/SidebarProvider';
import { authenticate } from './authentication/authenticate';
import { TokenManager } from './authentication/TokenManager';



// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	TokenManager.globalState = context.globalState;
	
	
	
	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"whizz-sidebar",
			sidebarProvider
		)
	);
	console.log('Congratulations, your extension "whizz" is now active!');
	
	let disposable = vscode.commands.registerCommand('whizz.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from whizz!');
	});


	context.subscriptions.push(
		vscode.commands.registerCommand('whizz.authenticate', () => {
			authenticate();
			vscode.window.showInformationMessage(`Authenticating with GitHub: token : ${TokenManager.getToken()}`);
		})
	);
		

	context.subscriptions.push(disposable);
}




// This method is called when your extension is deactivated
export function deactivate() {}

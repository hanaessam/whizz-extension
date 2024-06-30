// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SidebarProvider } from './panels/SidebarProvider';
import { authenticate } from './authentication/authenticate';
import { TokenManager } from './authentication/TokenManager';
import {trackFileChange, addAllFiles, setupFileDeletionWatcher} from './vscode-gateway/helper-functions';
import { summarize, writeSummaryFile } from './summary/summarize';
import { getProjectFileArch } from './vscode-gateway/file-architecture';
import axios, { get } from 'axios';
let extensionContext: vscode.ExtensionContext;
import { createFileWithCode } from "./vscode-gateway/create-file";


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	TokenManager.globalState = context.globalState;

	extensionContext = context;

  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("whizz-sidebar", sidebarProvider)
  );
  console.log('Congratulations, your extension "whizz" is now active!');

  let disposable = vscode.commands.registerCommand("whizz.helloWorld", () => {
    vscode.window.showInformationMessage("Hello World from whizz!");
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("whizz.authenticate", () => {
      authenticate();
      // vscode.window.showInformationMessage(`Authenticating with GitHub: token : ${TokenManager.getToken()}`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("whizz.getProjectFileArch", async () => {
      getProjectFileArch(context);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("whizz.createFileWithCode", async () => {
      createFileWithCode(context);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("whizz.signupWithEmail", async () => {
      signupWithEmail(context);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("whizz.loginWithEmail", async () => {
      loginWithEmail(context);
    })
  );

  context.subscriptions.push(disposable);

	setupFileDeletionWatcher(context);

	context.workspaceState.keys().forEach(key => context.workspaceState.update(key, undefined));
	
	addAllFiles(context);

	setInterval(async () => {
        summarize(context);
    }, 60000); // 60000 milliseconds = 1 minute

	setInterval(async () => {
		await writeSummaryFile(context);
	}, 300000); // 300000 milliseconds = 5 minutes

    // Listen for file changes
    vscode.workspace.onDidChangeTextDocument(event => {
        trackFileChange(event.document);
    });
}

export function getExtensionContext(): vscode.ExtensionContext {
    if (!extensionContext) {
        throw new Error('Extension context is not initialized.');
    }
    return extensionContext;
}
// This method is called when your extension is deactivated
export function deactivate() {}

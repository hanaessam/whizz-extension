import * as vscode from "vscode";
import { SidebarProvider } from "./panels/SidebarProvider";
import { authenticate } from "./authentication/authenticate";
import { TokenManager } from "./authentication/TokenManager";
import {
  trackFileChange,
  setupFileDeletionWatcher,
  setupFileAdditionWatcher,
  addAllFiles,
} from "./vscode-gateway/helper-functions";
import { summarize, writeSummaryFile } from "./summary/summarize";
import { getProjectFileArch } from "./vscode-gateway/file-architecture";
import axios, { get } from "axios";
let extensionContext: vscode.ExtensionContext;
import { createFileWithCode } from "./vscode-gateway/create-file";
import {
  signupWithEmail,
  loginWithEmail,
  logout,
} from "./authentication/emailauthentication";
import * as path from "path";
import { generateCodeDocumentation } from "./vscode-gateway/generate-code-doc";
import { handleWorkspaceChange } from "./summary/caching";
import { KeyManagementProvider } from "./panels/KeyManagementProvider";

// Store the sidebarProvider globally
let sidebarProvider: SidebarProvider;

export function activate(context: vscode.ExtensionContext) {
  TokenManager.globalState = context.globalState;
  extensionContext = context;

  sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("whizz-sidebar", sidebarProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("whizz.showKeyManagement", () => {
      KeyManagementProvider.createOrShow(context);
    })
  );

  console.log('Congratulations, your extension "whizz" is now active!');

  let disposable = vscode.commands.registerCommand(
    "whizz.helloWorld",
    async () => {
      vscode.window.showInformationMessage("Hello World from whizz!");
    }
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("whizz.authenticate", () => {
      authenticate();
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
      await signupWithEmail(context);
      sidebarProvider.updateWebviewContent(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("whizz.loginWithEmail", async () => {
      await loginWithEmail(context);
      sidebarProvider.updateWebviewContent(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("whizz.logout", async () => {
      logout(context);
      sidebarProvider.updateWebviewContent(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "whizz.generateCodeDocumentation",
      async () => {
        generateCodeDocumentation(context);
      }
    )
  );

  context.subscriptions.push(disposable);

  setupFileDeletionWatcher(context);
  setupFileAdditionWatcher(context);

  const workspaceChangeListener = vscode.workspace.onDidChangeWorkspaceFolders(
    (event) => {
      handleWorkspaceChange(context);
    }
  );
  context.subscriptions.push(workspaceChangeListener);

  if (vscode.workspace.workspaceFolders) {
    addAllFiles(context);
  }

  setInterval(async () => {
    summarize(context);
  }, 60000); // 60000 milliseconds = 1 minute

  setInterval(async () => {
    await writeSummaryFile(context);
  }, 300000); // 300000 milliseconds = 5 minutes

  vscode.workspace.onDidChangeTextDocument((event) => {
    trackFileChange(event.document);
  });
}

export function deactivate() {}

export function getExtensionContext(): vscode.ExtensionContext {
  if (!extensionContext) {
    throw new Error("Extension context is not initialized.");
  }
  return extensionContext;
}

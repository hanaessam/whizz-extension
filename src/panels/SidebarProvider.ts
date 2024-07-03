import * as vscode from "vscode";
import { getNonce } from "../getNonce";
import {
  getGithubProfileInfo,
  getSelectedCode,
  loginWithGithub,
  sendCodeToExplain,
  sendGeneralPrompt,
  sendSelectedCodeToServer,
  sendCodeToGenerateUnitTest
} from "../vscode-gateway/helper-functions";
import { fixSelectedCode } from "../vscode-gateway/fix-code";
import { getProjectFileArch } from "../vscode-gateway/file-architecture";
import { generateCodeDocumentation } from "../vscode-gateway/generate-code-doc";
import { createFileWithCode } from "../vscode-gateway/create-file";
import { getExtensionContext } from "../extension";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;


  constructor(private readonly _extensionUri: vscode.Uri) {

  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "fix-code": {
          vscode.window.showInformationMessage("will fix code now");
          let selectedCode = getSelectedCode();
          if (selectedCode) {
            let response = await fixSelectedCode(selectedCode);

            webviewView.webview.postMessage({
              type: "fix-code",
              value: response,
            });
            vscode.window.showInformationMessage(response);
          } else {
            vscode.window.showErrorMessage("No code is selected");
          }
          break;
        }

        case "explain-code": {
          let selectedCode = getSelectedCode();
          if (selectedCode) {
            let response = await sendCodeToExplain(selectedCode);
            webviewView.webview.postMessage({
              type: "explain-code",
              value: response,
            });
            vscode.window.showInformationMessage(response);
          } else {
            vscode.window.showErrorMessage("No code is selected");
          }
          break;
        }

        case "send-btn": {
          let selectedCode = getSelectedCode();
          let query = data.value;
          if (selectedCode) {
            query = selectedCode + "," + query;
          }

          if (query) {
            let response = await sendGeneralPrompt(selectedCode, query);
            webviewView.webview.postMessage({
              type: "send-query",
              value: response,
            });
            vscode.window.showInformationMessage(response);
          } else {
            vscode.window.showErrorMessage("No query to send");
          }
          break;
        }

        case "create-file-arch": {
          vscode.window.showInformationMessage("Creating file architecture");
          let context = getExtensionContext();
          getProjectFileArch(context).then(() => {
            vscode.window.showInformationMessage("File architecture creation complete.");
          }).catch((error) => {
            vscode.window.showErrorMessage("Failed to create file architecture: " + error.message);
          });
          break;
        }

        case "generate-unit-test": {
          vscode.window.showInformationMessage("Generating unit test");
          let selectedCode = getSelectedCode();
          if (selectedCode) {
            let response = await sendCodeToGenerateUnitTest(selectedCode);
            webviewView.webview.postMessage({
              type: "generate-unit-test",
              value: response,
            });
            vscode.window.showInformationMessage(response);
          } else {
            vscode.window.showErrorMessage("No code is selected");
          }
          break;
        }

        case "switch-code-lang": {
          vscode.window.showInformationMessage("Switching code language");
          let context = getExtensionContext();
          createFileWithCode(context).then(() => {
            vscode.window.showInformationMessage("File created successfully.");
          }).catch((error) => {
            vscode.window.showErrorMessage("Failed to create file: " + error.message);
          }
          );
          break;
        }

        case "generate-code-documentation": {
          vscode.window.showInformationMessage("Generating code documentation");
          let context = getExtensionContext();
          generateCodeDocumentation(context).then(() => {
            vscode.window.showInformationMessage("Code documentation generated successfully.");
          }).catch((error) => {
            vscode.window.showErrorMessage("Failed to generate code documentation: " + error.message);
          });
          break;
        }

        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }

        case "login-with-github": {
          let userInfo = await getGithubProfileInfo();
          webviewView.webview.postMessage({
            type: "github-user-info",
            value: userInfo,
          });
          break;
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );

    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

			</head>
      <body>

        <div class="whizz-body">

        <div class="github-auth">
         
        </div>

         <h1>Welcome to Whizz!</h1>
          <p> Meet Whizz, your code assistant, an AI-powered extension designed to simplify your workflow.
            With Whizz, expect quick fixes, code explaination, and enhanced productivity right within your IDE. 
          </p>
         
              
              <h2 class="head-h2">Features</h2>
              
              <div class="features">
                <a href="" class="fix-code"><i class="fa-solid fa-wrench"></i> Fix</a>
                <a href="" class="explain-code"><i class="fa-regular fa-lightbulb"></i> Explain</a>
                <a href="" class="generate-code-documentation"><i class="fa-solid fa-file-lines"></i> Generate Code Documentation</a>
                <a href="" class="unit-test"><i class="fa-solid fa-vial-circle-check"></i> Generate Unit Test</a>
                <a href="" class="create-file-arch"><i class="fa-solid fa-folder-tree"></i> Create Project File Architecture</a>
                <a href="" class="switch-code-lang"><i class="fa-regular fa-file-code"></i> Switch Code Language</a>
              </div>
              
              <h2 class="head-h2">Chat</h2>
              <div class="chat-box"> </div>
              
              <div class="chat-field">
                  <input type="text" placeholder="Ask me anything!" class="chat-input"/>
                  <div class="send-icon"><a class="send-btn fa-solid fa-paper-plane"></a></div>
              </div>

        </div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

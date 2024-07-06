import * as vscode from "vscode";
import { getNonce } from "../getNonce";
import {
  getGithubProfileInfo,
  getSelectedCode,
  loginWithGithub,
  sendCodeToExplain,
  sendCodeToGenerateUnitTest,
  sendGeneralPrompt,
  sendSelectedCodeToServer,
} from "../vscode-gateway/helper-functions";
import { fixSelectedCode } from "../vscode-gateway/fix-code";
import { generateUnitTest } from "../vscode-gateway/unit-test";
import { createFileWithCode } from "../vscode-gateway/create-file";
import { getExtensionContext } from "../extension";
import { getProjectFileArch } from "../vscode-gateway/file-architecture";
import { generateCodeDocumentation } from "../vscode-gateway/generate-code-doc";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) {}

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
            vscode.window.showInformationMessage(response);
            webviewView.webview.postMessage({
              type: "fix-code",
              value: response,
            });
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
          } else {
            vscode.window.showErrorMessage("No query to send");
          }
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
          if (data.message.includes("401") || data.message.includes("OpenAI key")){
            vscode.window.showInformationMessage("Invalid or Expired OpenAi key.");
          }
          else{ 
            vscode.window.showErrorMessage(data.value);
          }
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

        case "unit-test":{
          let selectedCode = getSelectedCode();
          if (selectedCode) {
            let response = await generateUnitTest(selectedCode);
            webviewView.webview.postMessage({
              type: "unit-test",
              value: response,
            });
          } else {
            vscode.window.showErrorMessage("No code is selected");
          }
          break;
        }

        case 'account-management': {
          vscode.commands.executeCommand('whizz.authenticationManagement');
          break;
        }

        
        
        }

        case "switch-code-lang": {
          await createFileWithCode(getExtensionContext());
          break;
        
        }

        case "file-arch": {
          await getProjectFileArch(getExtensionContext());
          break;
        }

        case "code-doc": {
          await generateCodeDocumentation(getExtensionContext());
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
    let context = getExtensionContext();
  
    const isAuthenticated = isAuth(context); // Check if user is authenticated
    if (!isAuthenticated)
      vscode.commands.executeCommand('whizz.authenticationManagement');
  
    const loginHtml = `
      <h1>Welcome to Whizz!</h1>
      <p>Meet Whizz, your code assistant, an AI-powered extension designed to simplify your workflow.
        With Whizz, expect quick fixes, code explanation, and enhanced productivity right within your IDE.
      </p>
      <h1>Login to Continue</h1>
    `;
  
    const mainHtml = `
      <div class="whizz-body">
        <div class="github-auth"></div>
        <div id="buttons"> 
          <i id="account-button" class="fa-solid fa-user-circle account-icon"></i>
          <i id="key-button" class="fa-solid fa-key key-icon"></i>
        </div>
        <h1>Welcome to Whizz!</h1>
        <p>Meet Whizz, your code assistant, an AI-powered extension designed to simplify your workflow.
          With Whizz, expect quick fixes, code explanation, and enhanced productivity right within your IDE.
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
        <div class="chat-box"></div>
        <div class="chat-field">
          <input type="text" placeholder="Ask me anything!" class="chat-input"/>
          <div class="send-icon"><a class="send-btn fa-solid fa-paper-plane"></a></div>
        </div>
      </div>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    `;
  
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <style>
          #buttons{
            display: flex;
            flex-direction: row;
            gap: 10px; 
          }
          .key-icon, .account-icon {
            
            cursor: pointer;
            border: 1px solid #ccc;
            padding: 5px;
            border-radius: 5px;
          }
          
          .whizz-body {
            position: relative;
            padding: 5px;
          }
          #login-form {
            display: flex;
            flex-direction: column;
            max-width: 300px;
            margin: auto;
            space-between: 25px;
          }
          #login-form input {
            margin-bottom: 10px;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          #login-form button {
            padding: 10px;
            background-color: #007acc;
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 4px;
          }
          #login-form button:hover {
            background-color: #005f7f;
          }
        </style>
      </head>
      <body>

        <div class="whizz-body">

        <div class="github-auth">
         
        </div>

         <h1>Welcome to Whizz!</h1>
          <p> Meet Whizz, your code assistant, an AI-powered extension designed to simplify your workflow.
            With Whizz, expect quick fixes, code explaination, and enhanced productivity right within your IDE. 
          </p>
          <div class="github-auth">
            <button id="github-login-button">Login with GitHub</button>
               <p id="github-user-info"></p>
                </div>
              
              <h2 class="head-h2">Features</h2>
              
              <div class="features">
                <a href="" class="fix-code"><i class="fa-solid fa-wrench"></i> Fix</a>
                <a href="" class="explain-code"><i class="fa-regular fa-lightbulb"></i> Explain</a>
                <a href="" class="unit-test"><i class="fa-regular fa-lightbulb"></i> Generate Unit Test</a>
                <a href="" class="switch-code-lang"><i class="fa-regular fa-lightbulb"></i> Switch Code Language</a>
                <a href="" class="file-arch"><i class="fa-regular fa-lightbulb"></i> Generate Project Architecture</a>
                <a href="" class="code-doc"><i class="fa-regular fa-lightbulb"></i> Generate Code Documentation</a>

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
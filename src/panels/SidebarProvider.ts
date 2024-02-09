import * as vscode from "vscode";
import { getNonce } from "../getNonce";
import { getSelectedCode, sendSelectedCodeToServer } from "../vscode-gateway/helper-functions";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) { }

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
          let selectedCode = getSelectedCode();
          if (selectedCode) {
            sendSelectedCodeToServer(selectedCode);
            vscode.window.showInformationMessage(selectedCode);
          }else {
            vscode.window.showErrorMessage('No code is selected');
          }
          break;
        }

        case "explain-code": {
          let selectedCode = getSelectedCode();
          if (selectedCode) {
            sendSelectedCodeToServer(selectedCode);
            vscode.window.showInformationMessage(selectedCode);
          }else {
            vscode.window.showErrorMessage('No code is selected');
          }
          break;
        }

        case "send-btn":
          {
            let selectedCode = getSelectedCode();
            let query = data.value + selectedCode;
            if(query){
              sendSelectedCodeToServer(query);
              webviewView.webview.postMessage({ type: "update-chatbox", value: query });
              vscode.window.showInformationMessage(query);
            }else {
              vscode.window.showErrorMessage('No query to send');
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
          vscode.window.showErrorMessage(data.value);
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
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  
       
			</head>
      <body>

        <div class="whizz-body">
         <h1>Welcome to Whizz!</h1>
          <p> Meet Whizz, your code assistant, an AI-powered extension designed to simplify your workflow.
            With Whizz, expect quick fixes, code explaination, and enhanced productivity right within your IDE. 
          </p>
              
              <h2>Features</h2>
              
              <ul>
                <li><a href="" class="fix-code">Fix</a></li>
                <li><a href="" class="explain-code">Explain</a></li>
                <li><a href="" class="generate-code-doc">Generate Code Documentation</a></li>
                <li><a href="" class="generate-unit-test">Generate Unit Tests</a> </li>
              </ul>
              
              
              
              <h2>Chat</h2>
              <div class="chat-box"> </div>
              
              <div class="chat-field">
                  <input type="text" placeholder="Ask me anything!" class="chat-input"/>
                  <div class="send-icon"><a class="send-btn fa fa-send"></a></div>
              </>

        </div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

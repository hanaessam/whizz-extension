import * as vscode from "vscode";
import { getNonce } from "../getNonce";

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
        case "btn-first": {
          vscode.window.showInformationMessage("Clicked");
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
  
       
			</head>
      <body>

        <div class="whizz-body">
         <h1>Welcome to Whizz!</h1>
          <p> Meet Whizz, your code assistant, an AI-powered extension designed to simplify your workflow.
            With Whizz, expect quick fixes, code explaination, and enhanced productivity right within your IDE. 
          </p>
              
              <h2>Features</h2>
              
              <ul>
                <li><a href="">Fix</a></li>
                <li><a href="">Explain</a></li>
                <li><a href="">Generate Code Documentation</a></li>
                <li><a href="">Generate Unit Tests</a> </li>
              </ul>
              
              
              
                  <h2>Chat</h2>
                <div class="chat-box">
                  <input type="text" placeholder="Ask me anything!"/>
                  <button>Send</button>
              </div>

        </div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

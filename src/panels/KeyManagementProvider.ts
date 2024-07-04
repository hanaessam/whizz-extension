import * as vscode from 'vscode';
import { getNonce } from '../getNonce';
import { KeyManager
 } from '../key-management/keymanager';
import { getUserId } from '../vscode-gateway/user'
import { get } from 'axios';

export class KeyManagementProvider implements vscode.WebviewPanelSerializer {
  deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: unknown): Thenable<void> {
    throw new Error('Method not implemented.');
  }

  private static readonly viewType = 'keyManagement';

  private static savedOpenAIKey: string | null = null;
  
  private static keyManager = new KeyManager();

  public static createOrShow(context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    const panel = vscode.window.createWebviewPanel(
      KeyManagementProvider.viewType,
      'OpenAI Key Management',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(context.extensionPath)],
      }
    );

    panel.webview.html = KeyManagementProvider.getHtmlForWebview(panel.webview);

    panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'addOpenAIKey':
            const newKey = message.key;
            if (newKey.trim().length > 0) {
                KeyManagementProvider.savedOpenAIKey = newKey;
                KeyManager.addKey(getUserId(), newKey);
                KeyManagementProvider.postMessage(panel.webview, { command: 'showMessage', text: 'OpenAI key added successfully.' });
            } else {
                KeyManagementProvider.postMessage(panel.webview, { command: 'showMessage', text: 'Invalid OpenAI key.' });
            }
            break;
          case 'removeOpenAIKey':
            KeyManagementProvider.savedOpenAIKey = null;
            KeyManager.removeKey(getUserId());
            KeyManagementProvider.postMessage(panel.webview, { command: 'showMessage', text: 'OpenAI key removed successfully.' });
            break;
          case 'displaySavedKey':
            try {
                const savedKey = KeyManager.getKey(getUserId());
                if (savedKey) {
                KeyManagementProvider.postMessage(panel.webview, { command: 'showMessage', text: `Saved OpenAI Key: ${savedKey}` });
                } else {
                KeyManagementProvider.postMessage(panel.webview, { command: 'showMessage', text: 'No OpenAI key saved.' });
                }
            } catch (error) {
                console.error('Error fetching saved key:', error);
                KeyManagementProvider.postMessage(panel.webview, { command: 'showMessage', text: 'Error fetching saved OpenAI key.' });
            }
            break;
        }
      },
      undefined,
      context.subscriptions
    );
  }

  public static getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OpenAI Key Management</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            padding: 20px;
            display: flex;
            justify-content: center; /* Center align horizontally */
            align-items: center; /* Center align vertically */
          }
          h1 {
            font-size: 1.5rem;
            margin-bottom: 20px;
            color: #333; /* Dark text color */
          }
          .button-container {
            top: 50px;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            width: 350; /* Adjusted width for button container */
            background-color: #fff; /* White background for buttons */
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1); /* Soft shadow */
            opacity: 0.8; /* Slightly transparent */
          }
          button {
            padding: 10px 20px; /* Increased padding for buttons */
            font-size: 1rem; /* Slightly larger font size */
            border: none;
            cursor: pointer;
            background-color: #007acc;
            color: white;
            margin-bottom: 10px;
            border-radius: 4px;
            transition: background-color 0.3s ease; /* Smooth hover effect */
          }
          button:hover {
            background-color: #005f99;
          }
          .key-input-container {
            display: none;
            margin-top: 10px;
          }
          .key-input-container.active {
            display: flex;
            flex-direction: column;
            align-items: stretch;
          }
          input[type='text'] {
            padding: 10px;
            font-size: 0.9rem;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin-bottom: 8px;
          }
          #submit-key-button {
            padding: 10px 20px;
            font-size: 1rem;
            border: none;
            cursor: pointer;
            background-color: #4CAF50;
            color: white;
            border-radius: 4px;
            transition: background-color 0.3s ease;
          }
          #submit-key-button:hover {
            background-color: #45a049;
          }
          .message {
            margin-top: 10px;
            padding: 10px;
            color: white;
            background-color: #333;
            display: none;
            font-size: 0.9rem;
            border-radius: 4px;
          }
          .message.show {
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="button-container">
          <div id = "title"> <h1>OpenAI Key Management</h1> </div>
          <button id="add-key-button">ADD OPENAI KEY</button>
          <button id="remove-key-button">REMOVE OPENAI KEY</button>
          <button id="display-key-button">SHOW SAVED KEY</button>
          <div id="key-input-div" class="key-input-container">
            <input type="text" id="openai-key-input" placeholder="Enter OpenAI key"/>
            <button id="submit-key-button">Save</button>
          </div>
          <div id="message-container" class="message"></div>
        </div>
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          const addKeyButton = document.getElementById("add-key-button");
          const removeKeyButton = document.getElementById("remove-key-button");
          const displayKeyButton = document.getElementById("display-key-button");
          const keyInputDiv = document.getElementById("key-input-div");
          const openaiKeyInput = document.getElementById("openai-key-input");
          const submitKeyButton = document.getElementById("submit-key-button");
          const messageContainer = document.getElementById("message-container");
  
          addKeyButton.addEventListener("click", () => {
            keyInputDiv.classList.toggle("active");
          });
  
          removeKeyButton.addEventListener("click", () => {
            vscode.postMessage({
              command: "removeOpenAIKey",
            });
          });
  
          displayKeyButton.addEventListener("click", () => {
            vscode.postMessage({
              command: "displaySavedKey",
            });
          });
  
          submitKeyButton.addEventListener("click", () => {
            const openaiKey = openaiKeyInput.value;
            vscode.postMessage({
              command: "addOpenAIKey",
              key: openaiKey,
            });
            openaiKeyInput.value = "";
            keyInputDiv.classList.remove("active");
          });
  
          // Close input box if clicked outside
          document.addEventListener("click", (event) => {
            if (!keyInputDiv.contains(event.target) && event.target !== addKeyButton) {
              keyInputDiv.classList.remove("active");
            }
          });
  
          function showMessage(message) {
            messageContainer.textContent = message;
            messageContainer.classList.add("show");
            setTimeout(() => {
              messageContainer.classList.remove("show");
            }, 3000); // Hide message after 3 seconds
          }
  
          window.addEventListener("message", (event) => {
            const message = event.data;
            if (message.command === 'showMessage') {
              showMessage(message.text);
            }
          });
        </script>
      </body>
      </html>
    `;
  }
  
  
  

  private static postMessage(webview: vscode.Webview, message: any) {
    // Use 'any' type for webview since TypeScript is not recognizing 'postMessage' properly
    (webview as any).postMessage(message);
  }
}

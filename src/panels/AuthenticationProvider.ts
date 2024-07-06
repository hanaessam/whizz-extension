import * as vscode from 'vscode';
import { login, logout, signup } from '../authentication/emailauthentication';
import { getNonce } from '../getNonce';
import { SidebarProvider } from './SidebarProvider';

export class AuthenticationProvider implements vscode.WebviewPanelSerializer {
  deserializeWebviewPanel(
    webviewPanel: vscode.WebviewPanel,
    state: unknown
  ): Thenable<void> {
    throw new Error("Method not implemented.");
  }

  private static readonly viewType = "authentication";

  public static async createOrShow(context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    const panel = vscode.window.createWebviewPanel(
      AuthenticationProvider.viewType,
      "Authentication",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(context.extensionPath)],
      }
    );

    panel.webview.html = AuthenticationProvider.getHtmlForWebview(panel.webview);

    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "login":
            const loginEmail = message.email;
            const loginPassword = message.password;
            await logout(context);
            await login(context, loginEmail, loginPassword);
            console.log("Login with", loginEmail, loginPassword);
            vscode.window.showInformationMessage("Login successful.");
            AuthenticationProvider.postMessage(panel.webview, {
              command: "showMessage",
              text: "Login successful.",
            });
            AuthenticationProvider.postMessage(panel.webview, {
              command: "clearFields",
            });
            const sidebarProvider = new SidebarProvider(context.extensionUri);
            //sidebarProvider.updateWebviewContent(context);
            
            vscode.commands.executeCommand('whizz.refresh');
            break;
          case "signup":
            const signupEmail = message.email;
            const signupPassword = message.password;
            await signup(context, signupEmail, signupPassword);
            console.log("Signup with", signupEmail, signupPassword);

            vscode.window.showInformationMessage("Signup successful.");
            AuthenticationProvider.postMessage(panel.webview, {
              command: "showMessage",
              text: "Signup successful.",
            });
            AuthenticationProvider.postMessage(panel.webview, {
              command: "clearFields",
            });
            AuthenticationProvider.postMessage(panel.webview, {
              command: "toggleForm",
            });

            // Show the login form after signup
            vscode.commands.executeCommand('workbench.view.extension.whizz-authentication-view');
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
        <title>Authentication</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          h1 {
            font-size: 2rem;
            margin-bottom: 20px;
            color: #007acc; /* Brighter title color */
          }
          .form-container {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            width: 100%;
            max-width: 400px;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .form-container input {
            margin-bottom: 10px;
            padding: 10px;
            font-size: 1rem;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          .form-container button {
            padding: 10px 20px;
            font-size: 1rem;
            border: none;
            cursor: pointer;
            background-color: #007acc;
            color: white;
            border-radius: 4px;
            transition: background-color 0.3s ease;
          }
          .form-container button:hover {
            background-color: #005f99;
          }
          .toggle-link {
            margin-top: 10px;
            cursor: pointer;
            color: #007acc;
            text-align: center;
          }
          .toggle-link:hover {
            text-decoration: underline;
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
        <h1 id="form-title">Login</h1>
        <div class="form-container">
          <input type="email" id="email" placeholder="Email" required />
          <input type="password" id="password" placeholder="Password" required />
          <button id="submit-button">Login</button>
          <div class="toggle-link" id="toggle-link">Don't have an account? Signup</div>
        </div>
        <div id="message-container" class="message"></div>

        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          const formTitle = document.getElementById('form-title');
          const submitButton = document.getElementById('submit-button');
          const toggleLink = document.getElementById('toggle-link');
          const messageContainer = document.getElementById('message-container');

          let isLogin = true;

          function toggleForm() {
            isLogin = !isLogin;
            formTitle.textContent = isLogin ? 'Login' : 'Signup';
            submitButton.textContent = isLogin ? 'Login' : 'Signup';
            toggleLink.textContent = isLogin ? "Don't have an account? Signup" : 'Already have an account? Login';
          }

          function showMessage(message) {
            messageContainer.textContent = message;
            messageContainer.classList.add('show');
            setTimeout(() => {
              messageContainer.classList.remove('show');
            }, 3000); // Hide message after 3 seconds
          }

          function clearFields() {
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
          }

          submitButton.addEventListener('click', () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            vscode.postMessage({
              command: isLogin ? 'login' : 'signup',
              email: email,
              password: password,
            });
          });

          toggleLink.addEventListener('click', toggleForm);

          window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.command === 'showMessage') {
              showMessage(message.text);
            } else if (message.command === 'clearFields') {
              clearFields();
            } else if (message.command === 'toggleForm') {
              toggleForm();
            }
          });
        </script>
      </body>
      </html>
    `;
  }

  private static postMessage(webview: vscode.Webview, message: any) {
    webview.postMessage(message);
  }
}

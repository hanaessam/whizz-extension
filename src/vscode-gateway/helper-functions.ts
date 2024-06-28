import axios from "axios";
import * as vscode from 'vscode';
import { baseUri } from "../constants";
import { TokenManager } from "../authentication/TokenManager";


export function getSelectedCode(): string | null {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const selectedCode = editor.document.getText(editor.selection);
      return selectedCode;
    } else {
      return null;
    }
  }


export async function sendSelectedCodeToServer(selectedCode: string) {
    try {
        const response = await axios.post(`${baseUri}/vscode/highlight`, {
            highlightedCode: selectedCode
        });
        vscode.window.showInformationMessage('Selected code sent to server successfully');
    } catch (error) {
        console.error('Error sending selected code:', error);
        vscode.window.showErrorMessage('Error sending selected code to server');
    }
}

export async function loginWithGithub() {
  try {
    const response = await axios.get(`${baseUri}/auth/github`);
    vscode.window.showInformationMessage('Logged in to GitHub successfully');
  } catch (error) {
    console.error('Error logging in to GitHub:', error);
    vscode.window.showErrorMessage('Error logging in to GitHub');
  }
}

export async function getGithubProfileInfo() {
    try {
        loginWithGithub();
        const response = await axios.get(`${baseUri}/me`, {headers: {Authorization: `Bearer ${TokenManager.getToken()}`}} );
        const data = response.data;
        return data;
    } catch (error) {
        console.error('Error retrieving GitHub profile info:', error);
        vscode.window.showErrorMessage('Error retrieving GitHub profile info');
    }
}


export async function sendCodeToFix(selectedCode: string) {
  try {
      const response = await axios.post(`${baseUri}/openai/prompt`, {
          type: 'fix',
          codesnippet: selectedCode
      });
      vscode.window.showInformationMessage('Code snippet sent to server successfully');
      return response.data; // This will be the output you can use in your webview
  } catch (error) {
      console.error('Error sending code snippet:', error);
      vscode.window.showErrorMessage('Error sending code snippet to server');
  }
}


export async function sendCodeToExplain(selectedCode: string) {
  try {
      const response = await axios.post(`${baseUri}/openai/prompt`, {
          type: 'explain',
          codesnippet: selectedCode
      });
      console.log(response.data);
      vscode.window.showInformationMessage('Code snippet sent to server successfully');
      return response.data; // This will be the output you can use in your webview
  } catch (error) {
      console.error('Error sending code snippet:', error);
      vscode.window.showErrorMessage('Error sending code snippet to server');
  }
}

export async function sendGeneralPrompt(codesnippet: string | null, query: string) {
  try {
      const response = await axios.post(`${baseUri}/openai/prompt`, {
          type: 'general',
          codesnippet: codesnippet,
          prompt: query
      });
      console.log(response.data);
      vscode.window.showInformationMessage('Prompt sent to server successfully');
      return response.data; // This will be the output you can use in your webview
  } catch (error) {
      console.error('Error sending prompt:', error);
      vscode.window.showErrorMessage('Error sending prompt to server');
  }
}


// for the summary and tracking part
let changedFiles: Set<string> = new Set();

export function trackFileChange(document: vscode.TextDocument) {
    const filePath = vscode.workspace.asRelativePath(document.uri);
    changedFiles.add(filePath);
}
export async function addAllFiles(context: vscode.ExtensionContext): Promise<void> {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            for (const folder of workspaceFolders) {
                const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, '**/*'));
                files.forEach(file => {
                    const filePath = vscode.workspace.asRelativePath(file);
                    changedFiles.add(filePath);
                });
            }
            vscode.window.showInformationMessage('All workspace files added to set.');
        }
    } catch (error) {
        console.error('Error adding all workspace files to set:', error);
        vscode.window.showErrorMessage('Failed to add all workspace files to set.');
    }
}
export async function processChangedFiles() {
    if (changedFiles.size > 0) {
        const filesData = Array.from(changedFiles).map(filePath => {
            const document = vscode.workspace.textDocuments.find(doc => vscode.workspace.asRelativePath(doc.uri) === filePath);
            if (document) {
                return {
                    name: document.fileName,
                    path: filePath,
                    content: document.getText()
                };
            }
        }).filter(Boolean);
        changedFiles.clear();
        return filesData;
    }
}

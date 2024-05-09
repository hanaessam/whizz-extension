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



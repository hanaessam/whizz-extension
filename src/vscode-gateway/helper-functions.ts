import axios from "axios";
import * as vscode from 'vscode';


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
        const response = await axios.post('http://localhost:8888/vscode/highlight', {
            highlightedCode: selectedCode
        });
        console.log(response.data);
        vscode.window.showInformationMessage('Selected code sent to server successfully');
    } catch (error) {
        console.error('Error sending selected code:', error);
        vscode.window.showErrorMessage('Error sending selected code to server');
    }
}
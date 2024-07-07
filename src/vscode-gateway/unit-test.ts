import * as vscode from "vscode";
import axios from "axios";
import { baseUri } from "../constants";
import { getUserId } from "./user";

export async function generateUnitTest(code: string) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor");
    return;
  }

  const document = editor.document;

  try {
    const response = await axios.post(`${baseUri}/vscode/unit-tests`, {
      codeSnippet: code,
      userId: getUserId(),
    });
    const unitTest = response.data.code;
    vscode.window.showInformationMessage(unitTest);

    return unitTest;
  } catch (error: any) {
    vscode.window.showErrorMessage(
      "Failed to generate unit test: " + error.message
    );
  }
}
module.exports = generateUnitTest;

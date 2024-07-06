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
  const fromLanguage = document.languageId;
  try {
    const response = await axios.post(`${baseUri}/vscode/unit-tests`, {
      codesnippet: code,
      userId: getUserId(),
    });
    const unitTest = response.data.code;
    vscode.window.showInformationMessage(unitTest);
    const languageExtensions: { [key: string]: string } = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      csharp: "cs",
      cpp: "cpp",
      go: "go",
      ruby: "rb",
      // Add other languages and their extensions here
    };

    const fileExtension = languageExtensions[fromLanguage.toLowerCase()];
    if (!fileExtension) {
      vscode.window.showErrorMessage("Unsupported target language");
      return;
    }

    const filePath = document.uri.fsPath;
    const fileName = filePath.substring(
      filePath.lastIndexOf("/") + 1,
      filePath.lastIndexOf(".")
    );
    const fileDirectory = filePath.substring(0, filePath.lastIndexOf("/") + 1);
    const newFilePath = `${fileDirectory}${fileName}-unit-test.${fileExtension}`;

    const uri = vscode.Uri.file(newFilePath);
    const writeData = Buffer.from(unitTest, "utf8");

    await vscode.workspace.fs.writeFile(uri, writeData);
    const newDocument = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(newDocument);
    vscode.window.showInformationMessage(unitTest);

    return unitTest;
  } catch (error: any) {
    vscode.window.showErrorMessage(
      "Failed to generate unit test: " + error.message
    );
  }
}
module.exports = generateUnitTest;

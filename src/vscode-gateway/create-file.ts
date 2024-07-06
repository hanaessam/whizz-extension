import * as vscode from "vscode";
import axios from "axios";
import { baseUri } from "../constants";
import { getUserId } from "./user";

export async function createFileWithCode(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor");
    return;
  }

  const document = editor.document;
  const code = document.getText();

  const fromLanguage = document.languageId;
  const toLanguage = await vscode.window.showInputBox({
    prompt: "Enter the target programming language",
  });
  if (!toLanguage) {
    vscode.window.showErrorMessage("No target language provided");
    return;
  }

  const url = `${baseUri}/vscode/switch-code-language`;

  try {
    const response = await axios.post(url, {
      fromLanguage: String(fromLanguage),
      toLanguage: String(toLanguage),
      codeSnippet: String(code),
      userId : getUserId()
    });

    if (response.status !== 200 || !response.data) {
      vscode.window.showInformationMessage(response.data);
      throw new Error("Invalid response from server");
    }

    const convertedCode = response.data.code;

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

    const fileExtension = languageExtensions[toLanguage.toLowerCase()];
    if (!fileExtension) {
      vscode.window.showErrorMessage("Unsupported target language");
      return;
    }

    const filePath = document.uri.fsPath;
    const newFilePath = filePath.replace(/(\.[^/.]+)?$/, `.${fileExtension}`);

    const uri = vscode.Uri.file(newFilePath);
    const writeData = Buffer.from(convertedCode, "utf8");

    await vscode.workspace.fs.writeFile(uri, writeData);
    const newDocument = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(newDocument);
    vscode.window.showInformationMessage(`File created: ${uri.fsPath}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to create file: ${error}`);
  }
}




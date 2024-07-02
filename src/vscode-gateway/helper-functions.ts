import axios from "axios";
import * as vscode from "vscode";
import { baseUri } from "../constants";
import { TokenManager } from "../authentication/TokenManager";
import * as fs from "fs";
import * as fsp from "fs/promises";
import path from "path";
import { getAllFileSummaries } from "../summary/caching";
import { getExtensionContext } from "../extension";

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
      highlightedCode: selectedCode,
    });
    vscode.window.showInformationMessage(
      "Selected code sent to server successfully"
    );
  } catch (error) {
    console.error("Error sending selected code:", error);
    vscode.window.showErrorMessage("Error sending selected code to server");
  }
}

export async function loginWithGithub() {
  try {
    const response = await axios.get(`${baseUri}/auth/github`);
    vscode.window.showInformationMessage("Logged in to GitHub successfully");
  } catch (error) {
    console.error("Error logging in to GitHub:", error);
    vscode.window.showErrorMessage("Error logging in to GitHub");
  }
}

export async function getGithubProfileInfo() {
  try {
    loginWithGithub();
    const response = await axios.get(`${baseUri}/me`, {
      headers: { Authorization: `Bearer ${TokenManager.getToken()}` },
    });
    const data = response.data;
    return data;
  } catch (error) {
    console.error("Error retrieving GitHub profile info:", error);
    vscode.window.showErrorMessage("Error retrieving GitHub profile info");
  }
}

export async function sendCodeToFix(selectedCode: string) {
  try {
    const response = await axios.post(`${baseUri}/openai/prompt`, {
      type: "fix",
      codesnippet: selectedCode,
    });
    vscode.window.showInformationMessage(
      "Code snippet sent to server successfully"
    );
    return response.data; // This will be the output you can use in your webview
  } catch (error) {
    console.error("Error sending code snippet:", error);
    vscode.window.showErrorMessage("Error sending code snippet to server");
  }
}

export async function sendCodeToExplain(selectedCode: string) {
  try {
    const summaries = getAllFileSummaries(getExtensionContext());
    const summariesAsString = JSON.stringify(summaries);
    const response = await axios.post(`${baseUri}/openai/prompt`, {
      type: "explain",
      codesnippet: selectedCode,
      summary: summariesAsString,
    });
    console.log(response.data.answer);
    vscode.window.showInformationMessage(
      "Code snippet sent to server successfully"
    );
    return response.data.answer; // This will be the output you can use in your webview
  } catch (error) {
    console.error("Error sending code snippet:", error);
    vscode.window.showErrorMessage("Error sending code snippet to server");
  }
}

export async function sendGeneralPrompt(
  codesnippet: string | null,
  query: string
) {
  try {
    const summaries = getAllFileSummaries(getExtensionContext());
    const summariesAsString = JSON.stringify(summaries);
    const response = await axios.post(`${baseUri}/openai/prompt`, {
      type: "general",
      codesnippet: codesnippet,
      prompt: query,
      summary: summariesAsString,
    });
    console.log(response.data);
    vscode.window.showInformationMessage("Prompt sent to server successfully");
    return response.data.answer; // This will be the output you can use in your webview
  } catch (error) {
    console.error("Error sending prompt:", error);
    vscode.window.showErrorMessage("Error sending prompt to server");
  }
}

function isMediaFile(filePath: string): boolean {
  const mediaExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".mp3",
    ".mp4",
    ".pdf",
    "jff",
    ".txt",
  ];
  const ext = path.extname(filePath).toLowerCase();
  return mediaExtensions.includes(ext);
}

// for the summary and tracking part
let changedFiles: Set<string> = new Set();

export function trackFileChange(document: vscode.TextDocument) {
  const filePath = vscode.workspace.asRelativePath(document.uri);
  if (!isMediaFile(filePath)) {
    changedFiles.add(filePath);
    vscode.window.showInformationMessage("ADDED: ", filePath);
  }
}

export async function addAllFiles(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      for (const folder of workspaceFolders) {
        const excludePattern = new vscode.RelativePattern(
          folder,
          "**/{node_modules,.git,dist,.vscode,*.png,*.jpg,*.jpeg,*.gif,*.bmp,*.svg}"
        );
        const includePattern = new vscode.RelativePattern(folder, "**/*");

        const files = await vscode.workspace.findFiles(
          includePattern,
          excludePattern
        );

        files.forEach((file) => {
          const filePath = vscode.workspace.asRelativePath(file);
          if (!isMediaFile(filePath)) {
            vscode.window.showInformationMessage("ADDED: ", filePath);
            changedFiles.add(filePath);
          }
        });
      }

      vscode.window.showInformationMessage("All workspace files added to set.");

      // Write file paths to files.txt
      const workspacePath = workspaceFolders[0].uri.fsPath;
      const filesFilePath = path.join(workspacePath, "files.txt");
      const fileStream = fs.createWriteStream(filesFilePath);

      changedFiles.forEach((filePath) => {
        fileStream.write(filePath + "\n");
      });

      fileStream.end();

      vscode.window.showInformationMessage(
        `File paths written to ${filesFilePath}`
      );
    }
  } catch (error) {
    console.error("Error adding all workspace files to set:", error);
    vscode.window.showErrorMessage("Failed to add all workspace files to set.");
  }
}
const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024 - 1024; // 1 MB in bytes

export async function processChangedFiles() {
  if (changedFiles.size > 0) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage("No workspace folder is open.");
      return [];
    }

    const workspaceFolder = workspaceFolders[0].uri.fsPath; // Assuming only one workspace folder

    const filesData = await Promise.all(
      Array.from(changedFiles).map(async (filePath) => {
        const absolutePath = path.join(workspaceFolder, filePath);

        try {
          // Read the file content directly using Node.js fs module with correct encoding
          const content = await fsp.readFile(absolutePath, "utf-8");
          vscode.window.showInformationMessage(
            `file size: `,
            Buffer.byteLength(content, "utf-8").toString()
          );
          // Check if content size exceeds the maximum allowed size
          if (Buffer.byteLength(content, "utf-8") > MAX_FILE_SIZE_BYTES) {
            // File content exceeds the size limit
            vscode.window.showWarningMessage(
              `${absolutePath} exceeds the maximum allowed size (1 MB). Skipping.`
            );
            return null; // Return null to filter out this file
          }

          return {
            name: absolutePath, // Use absolute path as name
            path: filePath, // Relative path in the workspace
            content: content,
          };
        } catch (error) {
          vscode.window.showErrorMessage(`Couldn't read ${absolutePath}`);
          console.error(`Error reading file ${filePath}:`, error);
          return null;
        }
      })
    );

    // Filter out any null values (files that couldn't be read or exceeded size)
    const validFilesData = filesData.filter((file) => file !== null);

    // Show the information message with changed files data (for debugging purposes)
    vscode.window.showInformationMessage(
      `Changed files: ${JSON.stringify(validFilesData)}`
    );

    // Clear the changed files set
    changedFiles.clear();

    // Return the valid files data
    return validFilesData;
  }
  return [];
}
// Function to set up the FileSystemWatcher
export function setupFileDeletionWatcher(context: vscode.ExtensionContext) {
  // Create a FileSystemWatcher to monitor all files in the workspace
  const watcher = vscode.workspace.createFileSystemWatcher("**/*");

  // Handle file deletions
  watcher.onDidDelete((uri) => handleFileDeletion(uri, context));

  // Add the watcher to the subscriptions to ensure it is cleaned up
  context.subscriptions.push(watcher);
}

// Function to handle file deletions
function handleFileDeletion(uri: vscode.Uri, context: vscode.ExtensionContext) {
  const filePath = vscode.workspace.asRelativePath(uri);

  // Remove the entry from workspace state
  context.workspaceState.update(filePath, undefined);

  // Optionally, show a message to the user
  vscode.window.showInformationMessage(
    `File ${filePath} has been deleted and its state has been removed.`
  );
}

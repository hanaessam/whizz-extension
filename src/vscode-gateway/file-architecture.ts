import * as vscode from "vscode";
import axios from "axios";
import { baseUri } from "../constants";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { getUserId } from "./user";

export async function getProjectFileArch(context: vscode.ExtensionContext) {
  const projectName = await vscode.window.showInputBox({
    placeHolder: "Enter project name",
  });
  const projectDescription = await vscode.window.showInputBox({
    placeHolder: "Enter project description",
  });
  const projectFramework = await vscode.window.showInputBox({
    placeHolder: "Enter project framework",
  });

  if (projectName && projectDescription && projectFramework) {
    try {
      const response = await axios.post(`${baseUri}/vscode/generate-project`, {
        projectDetails: {
          projectName: projectName,
          projectDescription: projectDescription,
          projectFramework: projectFramework,
        },
        userId: getUserId(),
      });
      const projectStructure = response.data.structure;
      const postCreationCommands = response.data.commands;

      console.log(postCreationCommands);

      await createProjectFiles(projectStructure, "", projectName).then(() => {
        vscode.window.showInformationMessage("Project created successfully!");
        vscode.window.showInformationMessage(
          `Execute the following commands:\n${postCreationCommands.join("\n")}`
        );

        executePostCreationCommands(projectName, postCreationCommands);
      });
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Failed to generate project: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }
}

async function createProjectFiles(
  structure: any[],
  basePath: string,
  projectName: string
) {
  let workspaceRoot: string;

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    workspaceRoot = workspaceFolders[0].uri.fsPath;
  } else {
    const defaultPath = path.join(os.homedir(), "Documents");
    workspaceRoot = path.join(defaultPath, projectName);
    try {
      fs.mkdirSync(workspaceRoot, { recursive: true });
      await vscode.commands.executeCommand(
        "vscode.openFolder",
        vscode.Uri.file(workspaceRoot),
        false
      );
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Failed to create project folder: ${error.message}`
      );
      return;
    }
  }

  for (const item of structure) {
    const itemPath = path.join(workspaceRoot, basePath, item.name);
    if (item.type === "folder") {
      fs.mkdirSync(itemPath, { recursive: true });
      if (item.children) {
        await createProjectFiles(
          item.children,
          path.join(basePath, item.name),
          projectName
        );
      }
    } else if (item.type === "file") {
      fs.writeFileSync(itemPath, item.content, "utf8");
    }
  }

  // Add the new project folder to the current workspace
  if (vscode.workspace.workspaceFolders) {
    vscode.workspace.updateWorkspaceFolders(
      vscode.workspace.workspaceFolders.length,
      0,
      { uri: vscode.Uri.file(workspaceRoot) }
    );
  }
}

async function executePostCreationCommands(
  projectName: string,
  commands: string[]
) {
  try {
    const terminal = vscode.window.createTerminal({
      name: `Setup ${projectName}`,
      cwd: path.join(
        vscode.workspace.workspaceFolders![0].uri.fsPath,
        projectName
      ),
    });
    terminal.show();

    for (const command of commands) {
      terminal.sendText(command, true);
    }
  } catch (error: any) {
    vscode.window.showErrorMessage(
      `Failed to execute post-creation commands: ${error.message}`
    );
  }
}

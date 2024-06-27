import * as vscode from 'vscode';
import axios from 'axios';
import { baseUri } from '../constants';
import * as fs from 'fs';
import * as path from 'path';

export async function getProjectFileArch(context: vscode.ExtensionContext) {
    const projectName = await vscode.window.showInputBox({ placeHolder: 'Enter project name' });
    const projectDescription = await vscode.window.showInputBox({ placeHolder: 'Enter project description' });
    const projectFramework = await vscode.window.showInputBox({ placeHolder: 'Enter project framework' });

    if (projectName && projectDescription && projectFramework) {
        try {
            const response = await axios.post(`${baseUri}/vscode/generate-project`, {
                projectName: projectName,
                projectDescription: projectDescription,
                projectFramework: projectFramework
            });
            const projectStructure = response.data.structure;
            const postCreationCommands = response.data.commands;

            console.log(postCreationCommands);
            
            // Wait for project files to be created
            await createProjectFiles(projectStructure, '', projectName);
            vscode.window.showInformationMessage('Project generated successfully!');

             // Execute commands after project creation
             executePostCreationCommands(projectName, postCreationCommands);
        } catch (error: any) {
            vscode.window.showErrorMessage('Failed to generate project: ' + error.message);
        }
    }
}



async function createProjectFiles(structure: any[], basePath: string, projectName: string) {
    let workspaceRoot: string;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        workspaceRoot = workspaceFolders[0].uri.fsPath;
    } else {
        // Define the path where the new project folder will be created. This can be adjusted as needed.
        const defaultPath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : path.join(require('os').homedir(), 'Documents');
        workspaceRoot = path.join(defaultPath, projectName);
        try {
            fs.mkdirSync(workspaceRoot, { recursive: true });
            await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(workspaceRoot), false);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to create project folder: ' + (error as any).message);
            return;
        }
    }

    for (const item of structure) {
        const itemPath = path.join(workspaceRoot, basePath, item.name);
        if (item.type === 'folder') {
            fs.mkdirSync(itemPath, { recursive: true });
            if (item.children) {
                await createProjectFiles(item.children, path.join(basePath, item.name), projectName);
            }
        } else if (item.type === 'file') {
            fs.writeFileSync(itemPath, item.content, 'utf8');
        }
    }
}


async function executePostCreationCommands(projectName: string, commands: string[]) {
    const terminal = vscode.window.createTerminal({ cwd: path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, projectName) });
    terminal.show();

    // Execute each command from the commands array
    for (const command of commands) {
        terminal.sendText(command, true);
    }
}
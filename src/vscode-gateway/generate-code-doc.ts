import * as vscode from 'vscode';
import axios from 'axios';
import { baseUri } from '../constants';
import { getAllFileSummaries } from '../summary/caching';
import { summarize } from '../summary/summarize';
import { getUserId } from './user';

export async function generateCodeDocumentation(context: vscode.ExtensionContext) {
    try {
        await summarize(context);
        const projectSummary =  getAllFileSummaries(context);
        // Use file picker for project path
        const folderUris = await vscode.window.showOpenDialog({
            canSelectFiles: true, 
            canSelectFolders: true, 
            canSelectMany: false, // Can only select one folder
            openLabel: 'Select Project Folder'
        });

        if (!folderUris || folderUris.length === 0) {
            vscode.window.showErrorMessage('No folder selected.');
            return;
        }

        // Assuming the user selects a folder, extract the path
        const projectPath = folderUris[0].fsPath;
        const fieldsInput = await vscode.window.showInputBox({
            placeHolder: 'Enter the fields separated by commas (e.g., Overview,Installation,Usage)'
        });

        if (!fieldsInput) {
            vscode.window.showErrorMessage('No fields entered.');
            return;
        }

        const format = await vscode.window.showQuickPick(['pdf', 'docx', 'md'], {
            placeHolder: 'Select the documentation format',
        });

        if (!format) {
            vscode.window.showErrorMessage('No format selected.');
            return;
        }

        const fields = fieldsInput.split(',').map(field => field.trim());

        try {
            const response = await axios.post(`${baseUri}/vscode/generate-documentation`, {
                projectPath: projectPath,
                fields: fields,
                format: format,
                projectSummary: projectSummary,
                userId : getUserId()
            });

            const message = response.data.message;
            vscode.window.showInformationMessage(message);
        } catch (error: any) {
            console.error('Failed to generate documentation:', error);
            vscode.window.showErrorMessage('Failed to generate documentation: ' + error.message);
        }
    } catch (error: any) {
        console.error('Error in generating documentation:', error);
        vscode.window.showErrorMessage('Error in generating documentation: ' + error.message);
    }
}


import * as vscode from 'vscode';
import axios from 'axios';
import { baseUri } from '../constants';
import { getAllFileSummaries } from '../summary/caching';
import { summarize } from '../summary/summarize';
import { getUserId } from './user';
import CodeDocumentationManager, { DocumentationDetails } from '../code-documentation/CodeDocumentationManager';

export async function generateCodeDocumentation(context: vscode.ExtensionContext) {
    try {
        await summarize(context);
        const projectSummary = getAllFileSummaries(context);
        const folderUris = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Project Folder'
        });

        if (!folderUris || folderUris.length === 0) {
            vscode.window.showErrorMessage('No folder selected.');
            return;
        }

        const projectPath = folderUris[0].fsPath;
        const fieldsInput = await vscode.window.showInputBox({
            placeHolder: 'Enter the fields separated by commas (e.g., Overview,Installation,Usage)',
            prompt: 'Enter the fields separated by commas (e.g., Overview,Installation,Usage)'
        });

        if (!fieldsInput) {
            vscode.window.showErrorMessage('No fields entered.');
            return;
        }

        const format = await vscode.window.showQuickPick(['md'], {
            placeHolder: 'Select the documentation format: Markdown, Word, or PDF',
        });

        if (!format) {
            vscode.window.showErrorMessage('No format selected.');
            return;
        }

        const fields = fieldsInput.split(',').map(field => field.trim());
        const documentationDetails: DocumentationDetails = {
            fields: fields,
            format: format,
            projectPath: projectPath,
            projectSummary: JSON.stringify(projectSummary)
        };

        const codeDocumentationManager = new CodeDocumentationManager();
        const { message } = await codeDocumentationManager.generateDocumentation(documentationDetails);
        vscode.window.showInformationMessage(message);
    } catch (error: any) {
        console.error('Failed to generate documentation:', error);
        vscode.window.showErrorMessage('Failed to generate documentation: ' + error.message);
    }
}

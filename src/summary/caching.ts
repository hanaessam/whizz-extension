import path from 'path';
import * as vscode from 'vscode';

// Function to generate the key for storing file summary
function getFileSummaryKey(folderPath: string, fileName: string): string {
    const key = `${folderPath}_${fileName}_summary`;
    return key;
}

// Function to store file summary in workspaceState
function storeFileSummary(context: vscode.ExtensionContext, folderPath: string, fileName: string, summary: any): void {
    const key = getFileSummaryKey(folderPath, fileName);
    context.workspaceState.update(key, summary);
    let sum = context.workspaceState.get(key);
    vscode.window.showInformationMessage(`saved summary for ${key}`, getFileSummary(context, key));
}

// Function to retrieve file summary from workspaceState
function getFileSummary(context: vscode.ExtensionContext, key: string): any {
    return context.workspaceState.get(key);
}

// Function to retrieve all file summaries from workspaceState
function getAllFileSummaries(context: vscode.ExtensionContext): { file: string; content: string }[] {
    const allKeys = context.workspaceState.keys();
    const fileSummaries: { file: string; content: string }[] = [];

    for (let key of allKeys) {
        if (key.endsWith('_summary')) {
            const summary = context.workspaceState.get(key);
            if (typeof summary === 'string') { // Check if summary is a string
                // Extract file name from the key (assuming key is in format 'file_summary')
                const file = key.replace('_summary', '');
                fileSummaries.push({ file, content: summary });
            }
        }
    }

    return fileSummaries;
}

// Exporting functions for use in other modules
export { storeFileSummary, getFileSummary, getAllFileSummaries, getFileSummaryKey };


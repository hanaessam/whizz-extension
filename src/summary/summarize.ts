import * as vscode from 'vscode';
import axios, { get } from 'axios';
import path from 'path';
import { processChangedFiles } from '../vscode-gateway/helper-functions';
import { baseUri } from '../constants';
import * as fs from 'fs';
import { storeFileSummary, getFileSummary, getFileSummaryKey, getAllFileSummaries } from './caching';

// Interface for the summary object
interface Summary {
    name: string;
    path: string;
    content: string; // Assuming content is a string
}
const MAX_FILES_PER_REQUEST = 1;

export async function summarize(context: vscode.ExtensionContext) {
    try {
        let changedFiles = await processChangedFiles(); // Wait for processChangedFiles to complete
        
        if (changedFiles && changedFiles.length > 0) {
            // vscode.window.showInformationMessage('Sending files to backend for summarization.');

            const numBatches = Math.ceil(changedFiles.length / MAX_FILES_PER_REQUEST);

            for (let i = 0; i < numBatches; i++) {
                const batch = changedFiles.slice(i * MAX_FILES_PER_REQUEST, (i + 1) * MAX_FILES_PER_REQUEST);

                if (batch.length > 0) {
                    // vscode.window.showInformationMessage(`Sending batch ${i + 1} to backend.`);

                    try {
                        const response = await axios.post(`${baseUri}/openai/summarize`, batch);
                        // vscode.window.showInformationMessage(`Received updated summaries for batch ${i + 1}: ${JSON.stringify(response.data)}`);

                        await updateSummaries(context, response.data);
                    } catch (error) {
                        console.error(`Error processing batch ${i + 1}:`, error);
                        // vscode.window.showWarningMessage(`Failed to process batch ${i + 1}.`);
                        // You can handle the error as per your requirement, like logging, retrying, or ignoring
                    }
                }
            }

            // vscode.window.showInformationMessage('Summarization for all files completed.');

        } else {
            vscode.window.showInformationMessage('No files to summarize.');
        }
    } catch (error) {
        console.error('Error summarizing files:', error);
        vscode.window.showErrorMessage('Failed to summarize files.');
    }
}

async function updateSummaries(context: vscode.ExtensionContext, updatedSummaries: Summary[]) {
    try {
        // Iterate through each updated summary
        for (const updatedSummary of updatedSummaries) {
            const { name, path: filePath, content } = updatedSummary;
            // Store or update the summary for each file
            await storeFileSummary(context, filePath, name, content);
        }
        // vscode.window.showInformationMessage('Summaries updated successfully.');

        
    } catch (error) {
        console.error('Error updating summaries:', error);
        // vscode.window.showErrorMessage('Failed to update summaries.');
    }
}

export function writeSummaryFile(context: vscode.ExtensionContext) {
    // Retrieve all file summaries
    const summaries = getAllFileSummaries(context);
    
    // Convert summaries to a string for writing to the file
    const summariesString = JSON.stringify(summaries, null, 2);

    // Get the path to the workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        const workspaceFolder = workspaceFolders[0].uri.fsPath;

        // Define the path for the summary file
        const summaryDir = path.join(workspaceFolder, 'whizz');
        const summaryFilePath = path.join(summaryDir, 'summary.txt');

        // Create the directory if it doesn't exist
        if (!fs.existsSync(summaryDir)) {
            fs.mkdirSync(summaryDir, { recursive: true });
        }

        // Write summaries to the file
        fs.writeFileSync(summaryFilePath, summariesString, 'utf8');
        vscode.window.showInformationMessage(`Summaries written to ${summaryFilePath}`);
    } else {
        vscode.window.showErrorMessage('No workspace folder found.');
    }
}
import * as vscode from 'vscode';
import axios, { get } from 'axios';
import path from 'path';
import { processChangedFiles } from '../vscode-gateway/helper-functions';
import { baseUri } from '../constants';
import { storeFileSummary, getFileSummary, getFileSummaryKey, getAllFileSummaries } from './caching';
// Interface for the summary object
interface Summary {
    name: string;
    path: string;
    content: string; // Assuming content is a string
}
const MAX_FILES_PER_REQUEST = 10;

export async function summarize(context: vscode.ExtensionContext) {
    try {
        let changedFiles = await processChangedFiles(); // Wait for processChangedFiles to complete

        if (changedFiles && changedFiles.length > 0) {
            vscode.window.showInformationMessage('Sending files to backend for summarization.');

            // Calculate number of batches
            const numBatches = Math.ceil(changedFiles.length / MAX_FILES_PER_REQUEST);

            // Array to hold promises for each batch of file summary requests
            const requests = [];

            for (let i = 0; i < numBatches; i++) {
                const batch = changedFiles.slice(i * MAX_FILES_PER_REQUEST, (i + 1) * MAX_FILES_PER_REQUEST);

                // Make sure batch is not empty before sending
                if (batch.length > 0) {
                    const response = await axios.post(`${baseUri}/openai/summarize`, batch);

                    vscode.window.showInformationMessage(`Received updated summaries for batch ${i + 1}: ${JSON.stringify(response.data)}`);

                    // Update the summaries 
                    await updateSummaries(context, response.data); // Implement this function as per your requirements

                    requests.push(response); // Store response or handle as needed
                }
            }

            vscode.window.showInformationMessage('Summarization for all files completed.');

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
            const { name, path, content } = updatedSummary;
            const key = getFileSummaryKey(path, name);

            // Store or update the summary for each file
            await storeFileSummary(context, path, name, content);
        }
        vscode.window.showInformationMessage('Summaries updated successfully.');
        const summaries = getAllFileSummaries(context);
        vscode.window.showInformationMessage(`All summaries: ${JSON.stringify(summaries)}`);
    } catch (error) {
        console.error('Error updating summaries:', error);
        vscode.window.showErrorMessage('Failed to update summaries.');
    }
}

async function getAllFiles(context: vscode.ExtensionContext): Promise<Summary[]> {
    let allFiles: Summary[] = [];

    try {
        // Get all workspace folders
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            // Iterate through each workspace folder
            for (const folder of workspaceFolders) {
                // Find all files in the current workspace folder
                const folderFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, '**/*'));

                // Iterate through each file in the folder
                for (const file of folderFiles) {
                    const fileName = vscode.workspace.asRelativePath(file, false);
                    const filePath = vscode.workspace.asRelativePath(file);
                    // Optionally, read file content if needed
                    const content = ''; // Adjust this to read file content

                    // Create a summary object and add it to the allFiles array
                    const fileSummary: Summary = {
                        name: fileName,
                        path: filePath,
                        content: content // Optional, include if you need file content
                    };
                    allFiles.push(fileSummary);
                }
            }
        }
    } catch (error) {
        console.error('Error fetching all files:', error);
        vscode.window.showErrorMessage('Failed to fetch all files.');
    }

    return allFiles;
}
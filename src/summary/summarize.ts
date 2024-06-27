import * as vscode from 'vscode';
import axios from 'axios';
const axiosInstance = axios.create({
    timeout: 20000, // Timeout of 5 seconds
});
import { processChangedFiles } from '../vscode-gateway/helper-functions';

const baseUri = 'https://localhost:8888'; // Replace with your actual backend URL

export async function summarize() {
    try {
        const changedFiles = await processChangedFiles(); // Wait for processChangedFiles to complete

        if (changedFiles && changedFiles.length > 0) {
            vscode.window.showInformationMessage('Sending files to backend for summary:', JSON.stringify(changedFiles));
            
            const response = await axiosInstance.post(`${baseUri}/summarize`, {
                files: changedFiles
            });

            vscode.window.showInformationMessage('Received updated summaries:', response.data);

            // Update the summary in Redis or handle the response as needed
            updateSummaryInRedis(response.data);

        } else {

            vscode.window.showInformationMessage('Files up to date.');
        }
    } catch (error) {
        console.error('Error summarizing files:', error);
    }
}

function updateSummaryInRedis(updatedSummaries: any[]) {
    // Implement your logic to update Redis with the updated summaries
    console.log('Updating Redis with:', updatedSummaries);
}

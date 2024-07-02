import * as vscode from 'vscode';
import axios, { get } from 'axios';
import { baseUri  } from '../constants';

export async function testOpenAiKey(openAiKey: string): Promise<boolean> {
  try {
    const response = await axios.post(`${baseUri}/openai/test`, {
      openAiKey: openAiKey,
    });

    // Check if the response status is OK (200)
    if (response.status === 200) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error testing OpenAI key:', error);
    return false;
  }
}

export async function addKey(openAiKey: string, context: vscode.ExtensionContext): Promise<boolean> {
  try {
    // Validate the OpenAI key before updating
    const isValid = await testOpenAiKey(openAiKey);
    if (isValid) {
      context.globalState.update('openAiKey', openAiKey);
      vscode.window.showInformationMessage('OpenAI key saved successfully.');
      return true;
    } else {
      vscode.window.showWarningMessage('Invalid OpenAI key. Please try again.');
      return false;
    }
  } catch (error) {
    console.error('Error adding OpenAI key:', error);
    vscode.window.showErrorMessage('Failed to add OpenAI key.');
    return false;
  }
}
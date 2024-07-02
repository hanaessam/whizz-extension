import * as vscode from 'vscode';
import axios, { get } from 'axios';
import { baseUri  } from '../constants';
import { testOpenAiKey } from '../openAiKey/Functions';

export async function showInitialForm(context: vscode.ExtensionContext): Promise<void> {
    let userMadeSelection = false;
  
    while (!userMadeSelection) {
      const choice = await vscode.window.showQuickPick(
        ['Use Free Trial', 'Enter OpenAI Key'],
        {
          placeHolder: 'Choose an option to start using the extension'
        }
      );
  
      if (!choice) {
        continue; // Force the user to make a selection
      }
  
      if (choice === 'Enter OpenAI Key') {
        let openAiKeyValid = false;
  
        while (!openAiKeyValid) {
          const openAiKey = await vscode.window.showInputBox({
            prompt: 'Enter your OpenAI key',
            placeHolder: 'OpenAI key'
          });
  
          if (openAiKey) {
            const isValid = await testOpenAiKey(openAiKey);
            if (isValid) {
              context.globalState.update('openAiKey', openAiKey);
              vscode.window.showInformationMessage('OpenAI key saved successfully.');
              openAiKeyValid = true;
              userMadeSelection = true;
              // Perform actions based on the user entering the OpenAI key
              // For example, you could initialize something with the key here
              // initializeWithOpenAiKey(openAiKey);
              
            } else {
              vscode.window.showWarningMessage('Invalid OpenAI key. Please try again.');
            }
          } else {
            vscode.window.showWarningMessage('You must enter an OpenAI key to proceed.');
          }
        }
      } else {
        const trialKey = 'YOUR_FREE_TRIAL_KEY'; // Replace with your actual trial key logic
        const trialExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        context.globalState.update('openAiKey', trialKey);
        context.globalState.update('openAiKeyExpiry', trialExpiry);
        vscode.window.showInformationMessage('Free trial activated successfully.');
        userMadeSelection = true;
        // Perform actions based on the user choosing the free trial
        // For example, you could initialize something with the trial key here
        // initializeWithTrialKey(trialKey);
      }
    }
  }
  
import * as vscode from 'vscode';
import { TOKEN_KEY, LOGIN_TIME_KEY, USER_ID } from '../constants';
import { getExtensionContext } from '../extension';

export function getUserId() {

    const context = getExtensionContext();
    const globalState = context.globalState; 

    const userId = globalState.get<string>(USER_ID);
    return userId;
}

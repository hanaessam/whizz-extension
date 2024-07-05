import * as vscode from "vscode";
import axios from "axios";
import { baseUri, TOKEN_KEY, LOGIN_TIME_KEY, USER_ID } from "../constants";
import { TokenManager } from "./TokenManager";
import { SidebarProvider } from "../panels/SidebarProvider";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function setToken(context: vscode.ExtensionContext, token: string) {
  context.globalState.update(TOKEN_KEY, token);
  context.globalState.update(LOGIN_TIME_KEY, Date.now());
}

function setUserId(context: vscode.ExtensionContext, id: string) {
  context.globalState.update(USER_ID, id);
  context.globalState.update(LOGIN_TIME_KEY, Date.now());
}

function getToken(context: vscode.ExtensionContext): string | undefined {
  const loginTime = context.globalState.get<number>(LOGIN_TIME_KEY, 0);
  if (Date.now() - loginTime > ONE_DAY_MS) {
    context.globalState.update(TOKEN_KEY, undefined);
    return undefined;
  }
  return context.globalState.get<string>(TOKEN_KEY);
}

export async function signupWithEmail(context: vscode.ExtensionContext) {
  const email = await vscode.window.showInputBox({
    prompt: "Enter your email",
  });
  const password = await vscode.window.showInputBox({
    prompt: "Enter your password",
    password: true,
  });
  const username = await vscode.window.showInputBox({
    prompt: "Enter your username",
  });

  if (email && password && username) {
    const url = `${baseUri}/signup`;
    try {
      const response = await axios.post(url, {
        email: email,
        password: password,
        username: username,
      });

      const token = response.data.token;
      setToken(context, token);
      vscode.window.showInformationMessage("Signed up successfully.");
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to signup: ${error}`);
    }
  } else {
    vscode.window.showErrorMessage("Please fill in all fields.");
  }
}
export async function login(
  context: vscode.ExtensionContext,
  email: string,
  password: string
) {
  if(email && password){
    const url = `${baseUri}/login`;
    try {
      const response = await axios.post(url, {
        email: email,
        password: password,
      });

      const token = response.data.token;
      const user_id = response.data.userId;
      await setToken(context, token);
      await setUserId(context, user_id);
      vscode.window.showInformationMessage("Logged in successfully.");
      vscode.window.showInformationMessage("Refreshing view");
      if(isAuth(context)){
        vscode.window.showInformationMessage("User is authenticated.");
      }
      else{
        vscode.window.showInformationMessage("User is not authenticated.");
      }
      // Refresh sidebar
      const sidebarProvider = new SidebarProvider(context.extensionUri);
      await sidebarProvider.updateWebviewContent(context);

      vscode.window.showInformationMessage("Exiting Login Function.")
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to login: ${error}`);
    }
  }
  else{
    vscode.window.showErrorMessage("Please fill in all fields.");
  
  }
}

export async function signup(
  context: vscode.ExtensionContext,
  email: string,
  password: string,
) {
  if (email && password) {
    const url = `${baseUri}/signup`;
    try {
      const response = await axios.post(url, {
        email: email,
        password: password,
      });

      const token = response.data.token;
      setToken(context, token);
      vscode.window.showInformationMessage("Signed up successfully.");
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to signup: ${error}`);
    }
  } else {
    vscode.window.showErrorMessage("Please fill in all fields.");
  }
}

export async function loginWithEmail(context: vscode.ExtensionContext) {
  const email = await vscode.window.showInputBox({
    prompt: "Enter your email",
  });
  const password = await vscode.window.showInputBox({
    prompt: "Enter your password",
    password: true,
  });

  if (email && password) {
    await login(context, email, password);
  } else {
    vscode.window.showErrorMessage("Please enter both email and password.");
  }
}

export function logout(context: vscode.ExtensionContext) {
  context.globalState.update(TOKEN_KEY, undefined);
  context.globalState.update(LOGIN_TIME_KEY, undefined);
  context.globalState.update(USER_ID, undefined);

  vscode.window.showInformationMessage("Logged out successfully.");

  // Refresh sidebar
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  sidebarProvider.updateWebviewContent(context);
}

export function isAuth(context: vscode.ExtensionContext): boolean {
  const userId = context.globalState.get<string>(USER_ID);
  return !!userId;
}

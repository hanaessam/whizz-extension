import * as vscode from "vscode";
import axios from "axios";
import { baseUri } from "../constants";
import { getSelectedCode } from "./helper-functions";
import { replaceSelectedCode } from "./replace-selected-code";

export async function fixSelectedCode(code: string) {
  try {
    const response = await axios.post(`${baseUri}/openai/prompt`, {
      type: "fix",
      codesnippet: code,
    });
    const fixedcode = response.data.code;
    vscode.window.showInformationMessage(fixedcode);
    replaceSelectedCode(fixedcode);
    return fixedcode;
  } catch (error: any) {
    vscode.window.showErrorMessage("Failed to fix code " + error.message);
  }
}

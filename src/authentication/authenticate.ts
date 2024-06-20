import * as vscode from 'vscode';
import { baseUri } from '../constants';
import  polka from 'polka';
import { TokenManager } from './TokenManager';

export const authenticate = () => {
  const app = polka();
  app.get(`/auth/:token`, async (req, res)=>{
    const {token} = req.params;
    if(!token) {
      res.end('Invalid token');
      return;
    }
    console.log(token);

    await TokenManager.setToken(token);
    res.end('Authenticated successfully');
    (app as any).server.close();
  });
  app.listen(54321, (err: Error) => {
    if (err) {
      vscode.window.showErrorMessage(err.message);
      return;
    } else {
      vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(`${baseUri}/auth/github`));
    }
  });

}


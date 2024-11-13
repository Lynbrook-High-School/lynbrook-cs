import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { readdirSync } from 'fs';
import { join } from 'path';

import * as vscode from 'vscode';

const GITIGNORE = `\
*.class
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar
GridWorld\
`;

export function activate(context: vscode.ExtensionContext) {

    const M_SECS = 3 * 60 * 1000;
    const CHARS = 200;

    vscode.workspace.onDidSaveTextDocument(
        (doc: vscode.TextDocument) => {
            const dirs = readdirSync('/workspaces').filter((dir) => dir[0] != '.');
            const token = vscode.workspace.getConfiguration().get('lynbrookCS.ghToken', '');
            const opts = { cwd: `/workspaces/${dirs[0]}`, env: { 'GITHUB_TOKEN': token } };
            if (!existsSync(join(opts.cwd, '.gitignore'))) {
                execSync(`echo "${GITIGNORE}" > ${opts.cwd}/.gitignore`, opts);
            }
            let state = context.globalState;
            if (state.get("chars") == undefined) {
                state.update("chars", 0);
            }
            if (state.get("time") == undefined) {
                state.update("time", 0);
            }
            const cChars = doc.getText().length;
            const cTime = (new Date()).getTime();
            const pChars = state.get("chars") as number;
            const pTime = state.get("time") as number;
            let upd = false;
            if (Math.abs(cChars - pChars) >= CHARS) {
                execSync('git add -A', opts);
                execSync(`git commit -m "${cChars - pChars} chars"`, opts);
                upd = true;
            } else if (cTime - pTime >= M_SECS) {
                execSync('git add -A', opts);
                execSync(`git commit -m "${(cTime - pTime)} ms"`, opts);
                upd = true;
            }
            if (upd) {
                if (token === '') {
                    vscode.window.showWarningMessage("Please set your Lynbrook CS token.");
                    return;
                }
                execSync('git push origin main', opts);
                state.update("chars", cChars);
                state.update("time", cTime);
            }
        }
    );

}

export function deactivate() {}

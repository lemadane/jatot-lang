import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    console.log('Activating Jatot VS Code extension...');

    // 1. Find the language server executable
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    let serverPath = '';
    if (workspaceRoot) {
        // Try the Gradle installDist distribution directory
        const scriptName = process.platform === 'win32' ? 'jatot-language-server.bat' : 'jatot-language-server';
        const candidate = path.join(workspaceRoot, 'tools', 'jatot-language-server', 'build', 'install', 'jatot-language-server', 'bin', scriptName);
        if (fs.existsSync(candidate)) {
            serverPath = candidate;
        }
    }

    // Default configuration fallback
    const configPath = vscode.workspace.getConfiguration('jatot').get<string>('languageServer.path');
    if (configPath && fs.existsSync(configPath)) {
        serverPath = configPath;
    }

    if (!serverPath) {
        // If not found, look at system path or suggest running gradle installDist
        vscode.window.showWarningMessage('Jatot Language Server not found. Please run "./gradlew :tools:jatot-language-server:installDist" in your workspace root.');
        return;
    }

    // 2. Start the Language Server process
    const serverOptions: ServerOptions = {
        command: serverPath,
        args: []
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'jatot' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.jatot')
        }
    };

    client = new LanguageClient(
        'jatotLanguageServer',
        'Jatot Language Server',
        serverOptions,
        clientOptions
    );

    client.start();

    // 3. Register showGeneratedJava command
    const disposable = vscode.commands.registerCommand('jatot.showGeneratedJava', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || activeEditor.document.languageId !== 'jatot') {
            vscode.window.showErrorMessage('No active Jatot file selected.');
            return;
        }

        const uri = activeEditor.document.uri.toString();
        try {
            // Execute the custom command registered in the Language Server
            const generatedJava = await vscode.commands.executeCommand<string>('jatot.showGeneratedJava', uri);
            if (generatedJava) {
                const doc = await vscode.workspace.openTextDocument({
                    content: generatedJava,
                    language: 'java'
                });
                await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside, true);
            } else {
                vscode.window.showWarningMessage('Could not retrieve generated Java.');
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to show generated Java: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

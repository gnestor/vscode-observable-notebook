import * as vscode from 'vscode';
import { Controller } from './executor';
import { NotebookProvider, providerOptions } from './provider';

export function activate(context: vscode.ExtensionContext) {
	const provider = new NotebookProvider();
	const controller = new Controller()
	context.subscriptions.push(
		vscode.workspace.registerNotebookSerializer('observable-notebook', provider, providerOptions),
		vscode.commands.registerCommand('observable-notebook.newNotebook', async () => {
			const activeEditor =  vscode.window.activeTextEditor;
			if (activeEditor ) {
				for (const selection of activeEditor.selections ?? []) {
					const selectedCode = activeEditor.document.getText(new vscode.Range(selection.start, selection.end));
					const selectedLang = activeEditor.document.languageId;
					provider.setLastSelection({ code: selectedCode, lang: selectedLang });
				}
			}
			await vscode.commands.executeCommand('workbench.action.files.newUntitledFile', { "viewType": "observable-notebook" });
		}),
		vscode.commands.registerTextEditorCommand('observable-notebook.openNotebook', async (textEditor) => {
			await vscode.commands.executeCommand("vscode.openWith", textEditor.document.uri, "observable-notebook");
		}),
		controller
	);
}

export function deactivate() { }

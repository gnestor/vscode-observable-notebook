import * as vscode from 'vscode';
import { Runtime, Library, Inspector } from '@observablehq/runtime';
import { Interpreter } from '@alex.garcia/unofficial-observablehq-compiler';
import { spawn } from 'child_process';
import { dirname } from 'path';

const runtime = new Runtime();
const interpret = new Interpreter();

export class Controller {
	readonly controllerId = 'observable-runtime';
	readonly notebookType = 'observable-notebook';
	readonly label = 'Observable Runtime';
	readonly supportedLanguages = ['javascript'];
	private readonly _controller: vscode.NotebookController;
	private main = runtime.module();
	private variables = {};

	constructor() {
		this._controller = vscode.notebooks.createNotebookController(
			this.controllerId,
			this.notebookType,
			this.label
		);
		this._controller.supportedLanguages = this.supportedLanguages;
		this._controller.supportsExecutionOrder = false;
		this._controller.executeHandler = this._execute.bind(this);
	}

	dispose(): void {
		this._controller.dispose();
	}

	private _execute(
		cells: vscode.NotebookCell[],
		_notebook: vscode.NotebookDocument,
		_controller: vscode.NotebookController
	): void {
		for (let cell of cells) {
			this.execueCell(cell);
		}
	}

	private async execueCell(cell: vscode.NotebookCell): Promise<void> {
		const execution = this._controller.createNotebookCellExecution(cell);
		try {
			execution.start(Date.now());
			const source: string = cell.document.getText();
			interpret.cell(source, this.main, (name: string) => {
				return {
					pending() {
						console.log(`${name}: pending`);
					},
					fulfilled(value: string) {
						console.log(`${name}: fullfilled`, value);
						execution.replaceOutput([
							new vscode.NotebookCellOutput([
								vscode.NotebookCellOutputItem.text(value),
							]),
						]);
						execution.end(true, Date.now());
					},
					rejected(error: Error) {
						throw error;
					},
				};
			});
		} catch (error: Error | any) {
			execution.replaceOutput([
				new vscode.NotebookCellOutput([
					vscode.NotebookCellOutputItem.error(error),
				]),
			]);
			execution.end(false, Date.now());
		}
	}
}

import * as vscode from 'vscode';
import { TextDecoder, TextEncoder } from 'util';

export const providerOptions: vscode.NotebookDocumentContentOptions = {
	transientOutputs: true
};

export class NotebookProvider implements vscode.NotebookSerializer {
	private lastSelections: { code: string; lang: string }[] = [];

	setLastSelection(selection: { code: string; lang: string }) {
		this.lastSelections.push(selection);
	}

	deserializeNotebook(
		content: Uint8Array,
		token: vscode.CancellationToken
	): vscode.NotebookData | Thenable<vscode.NotebookData> {
		if (content.length === 0) {
			if (this.lastSelections.length === 0) {
				this.lastSelections.push({
					code: '',
					lang: 'javascript',
				});
			}
			const cells = this.lastSelections.map(
				(cell) =>
					new vscode.NotebookCellData(
						vscode.NotebookCellKind.Code,
						cell.code,
						cell.lang
					)
			);
			this.lastSelections = [];
			return new vscode.NotebookData(cells);
		}
		// const str = Buffer.from(content).toString();
    const str = new TextDecoder().decode(content);
    const json = JSON.parse(str);
		const cells = json.nodes.map(
			(cell: ObservableNotebookCell) =>
				new vscode.NotebookCellData(vscode.NotebookCellKind.Code, cell.value, 'javascript')
		);
		return new vscode.NotebookData(cells);
	}

	serializeNotebook(
		data: vscode.NotebookData,
		token: vscode.CancellationToken
	): Uint8Array | Thenable<Uint8Array> {
		const { cells } = data;
		const json = { nodes: cells.map(({ value }) => ({ value })) };
		// return Buffer.from(json);
    return new TextEncoder().encode(JSON.stringify(json));
	}
}

export interface ObservableNotebookCell {
  id: number;
	value: string;
	pinned: boolean;
	mode: 'js'|'md'|'tex';
  data: Object;
}

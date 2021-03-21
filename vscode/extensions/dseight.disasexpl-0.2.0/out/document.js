'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsmDocument = void 0;
const vscode_1 = require("vscode");
const asm_1 = require("./asm");
class AsmDocument {
    constructor(uri, emitter) {
        this.lines = [];
        this.sourceToAsmMapping = new Map();
        this._uri = uri;
        // The AsmDocument has access to the event emitter from
        // the containg provider. This allows it to signal changes
        this._emitter = emitter;
        // Watch for underlying assembly file and reload it on change
        this._watcher = vscode_1.workspace.createFileSystemWatcher(uri.path);
        this._watcher.onDidChange(_ => this.updateLater());
        this._watcher.onDidCreate(_ => this.updateLater());
        this._watcher.onDidDelete(_ => this.updateLater());
        this.update();
    }
    updateLater() {
        // Workarond for https://github.com/Microsoft/vscode/issues/72831
        setTimeout(_ => this.update(), 100);
    }
    update() {
        const useBinaryParsing = vscode_1.workspace.getConfiguration('', this._uri.with({ scheme: 'file' }))
            .get('disasexpl.useBinaryParsing', false);
        vscode_1.workspace.openTextDocument(this._uri.with({ scheme: 'file' })).then(doc => {
            const filter = new asm_1.AsmFilter();
            filter.binary = useBinaryParsing;
            this.lines = new asm_1.AsmParser().process(doc.getText(), filter).asm;
        }, _err => {
            this.lines = [new asm_1.AsmLine(`Failed to load file '${this._uri.path}'`, undefined, [])];
        }).then(_ => this._emitter.fire(this._uri));
    }
    get value() {
        return this.lines.reduce((result, line) => result += line.value, '');
    }
    dispose() {
        this._watcher.dispose();
    }
}
exports.AsmDocument = AsmDocument;
//# sourceMappingURL=document.js.map
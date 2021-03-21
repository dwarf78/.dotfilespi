'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeAsmUri = exports.AsmProvider = void 0;
const vscode_1 = require("vscode");
const Path = require("path");
const document_1 = require("./document");
class AsmProvider {
    constructor() {
        this._documents = new Map();
        this._onDidChange = new vscode_1.EventEmitter();
    }
    provideTextDocumentContent(uri) {
        const document = this.provideAsmDocument(uri);
        return document.value;
    }
    provideAsmDocument(uri) {
        let document = this._documents.get(uri.path);
        if (!document) {
            document = new document_1.AsmDocument(uri, this._onDidChange);
            this._documents.set(uri.path, document);
        }
        return document;
    }
    // Expose an event to signal changes of _virtual_ documents
    // to the editor
    get onDidChange() {
        return this._onDidChange.event;
    }
    dispose() {
        this._documents.clear();
        this._onDidChange.dispose();
    }
}
exports.AsmProvider = AsmProvider;
AsmProvider.scheme = 'disassembly';
function encodeAsmUri(uri) {
    const configuration = vscode_1.workspace.getConfiguration('', uri);
    const associations = configuration.get('disasexpl.associations');
    // by default just replace file extension with '.S'
    let defaultUri = uri.with({
        scheme: AsmProvider.scheme,
        path: pathWithoutExtension(uri.path) + '.S'
    });
    if (associations === undefined) {
        return defaultUri;
    }
    for (let key in associations) {
        // that's a nasty way to get the doc...
        let doc = vscode_1.workspace.textDocuments.find(doc => doc.uri === uri);
        if (doc === undefined) {
            continue;
        }
        let match = vscode_1.languages.match({ pattern: key }, doc);
        if (match > 0) {
            let associated = associations[key];
            return uri.with({
                scheme: AsmProvider.scheme,
                path: resolvePath(uri.fsPath, associated)
            });
        }
    }
    return defaultUri;
}
exports.encodeAsmUri = encodeAsmUri;
/**
 * Remove extension from provided path.
 */
function pathWithoutExtension(path) {
    return path.slice(0, path.lastIndexOf('.')) || path;
}
// Resolve path with almost all variable substitution that supported in
// Debugging and Task configuration files
function resolvePath(path, associated) {
    if (vscode_1.workspace.workspaceFolders === undefined) {
        return path;
    }
    let parsedFilePath = Path.parse(path);
    let workspacePath = vscode_1.workspace.workspaceFolders[0].uri.fsPath;
    let variables = {
        // the path of the folder opened in VS Code
        'workspaceFolder': workspacePath,
        // the name of the folder opened in VS Code without any slashes (/)
        'workspaceFolderBasename': Path.parse(workspacePath).name,
        // the current opened file
        'file': path,
        // the current opened file relative to workspaceFolder
        'relativeFile': Path.relative(workspacePath, path),
        // the current opened file's basename
        'fileBasename': parsedFilePath.base,
        // the current opened file's basename with no file extension
        'fileBasenameNoExtension': parsedFilePath.name,
        // the current opened file's dirname
        'fileDirname': parsedFilePath.dir,
        // the current opened file's extension
        'fileExtname': parsedFilePath.ext,
        // the relative directory, so one can use it in settings as:
        // "**/*.c": "${workspaceFolder}/.o/${relativeFileDir}/${fileBasenameNoExtension}.s"
        'relativeFileDir': Path.relative(workspacePath, parsedFilePath.dir),
    };
    const variablesRe = /\$\{(.*?)\}/g;
    const resolvedPath = associated.replace(variablesRe, (match, name) => {
        const value = variables[name];
        if (value !== undefined) {
            return value;
        }
        else {
            // leave original (unsubstituted) value if there is no such variable
            return match;
        }
    });
    // normalize a path, reducing '..' and '.' parts
    return Path.normalize(resolvedPath);
}
//# sourceMappingURL=provider.js.map
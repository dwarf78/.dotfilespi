'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode_1 = require("vscode");
const provider_1 = require("./provider");
const decorator_1 = require("./decorator");
function activate(context) {
    const provider = new provider_1.AsmProvider();
    // register content provider for scheme `disassembly`
    const providerRegistration = vscode_1.workspace.registerTextDocumentContentProvider(provider_1.AsmProvider.scheme, provider);
    // register command that crafts an uri with the `disassembly` scheme,
    // open the dynamic document, and shows it in the next editor
    const commandRegistration = vscode_1.commands.registerTextEditorCommand('disasexpl.show', srcEditor => {
        const asmUri = provider_1.encodeAsmUri(srcEditor.document.uri);
        const options = {
            viewColumn: srcEditor.viewColumn + 1,
            preserveFocus: true,
        };
        vscode_1.window.showTextDocument(asmUri, options).then(asmEditor => {
            const decorator = new decorator_1.AsmDecorator(srcEditor, asmEditor, provider);
            // dirty way to get decorations work after showing disassembly
            setTimeout(_ => decorator.updateSelection(srcEditor), 500);
        });
    });
    context.subscriptions.push(provider, commandRegistration, providerRegistration);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map
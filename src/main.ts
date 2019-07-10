/**
 * @file main js
 * @author fe_bean
 */

import * as vscode from 'vscode';
import {transpileModule, ModuleKind, ScriptTarget} from 'typescript';

let {
    window,
    Position,
    Range,
    workspace,

} = vscode;

let previewColumn: number = 2;

class Main {
    doc: any;
    tsDoc: any; // 展示 preview 的 document
    text: string;
    newText: string;
    panel: any;
    themeSource: any;
    scriptSource: any;
    constructor() {
        // 当前窗口document
        this.tsDoc = undefined;
        this.text = '';
        this.newText = '';
        this.themeSource = '';
        this.scriptSource = '';
    }
    init(editor: vscode.TextEditor): void {
        this.doc = editor.document;
        this.handleTrans();
        this.bindEvn();
    }
    handleTrans(): void {
        this.newText = tsTrans.takeTrans(this.doc);
        this.previewOnDoc();
    }
    bindEvn(): void {
        let timer: any;
        workspace.onDidChangeTextDocument(e => {
            clearTimeout(timer);
            if (window.visibleTextEditors.length < 1 || !this.tsDoc || e.document !== this.doc) {
                return;
            }
            timer = setTimeout(() => {
                // 触发 ts 编译
                this.handleTrans();
            }, 100);
        });

        workspace.onDidCloseTextDocument(e => {
            this.tsDoc = undefined;
        });
    }

    getPreviewDoc(): void {
        window.showTextDocument(this.tsDoc, {
            viewColumn: previewColumn,
            preserveFocus: true,
            preview: true,
        }).then((textEditor) => {
            if (textEditor.document === this.tsDoc) {
                this.writeFile(textEditor);
                return;
            }
        });
    }
    previewOnDoc(): void {
        if (this.tsDoc) {
            this.getPreviewDoc();
        } else {
            workspace.openTextDocument({
                content: this.newText,
                language: 'javascript',
            }).then(doc => {
                this.tsDoc = doc;
                window.showTextDocument(this.tsDoc, {
                    viewColumn: previewColumn,
                    preserveFocus: true,
                    preview: true,
                });
            });
        }
    }
    /**
     * 更新已有的 js preview 内容
     * @param tarEditor
     */
    writeFile(tarEditor: vscode.TextEditor): void {
        // 行数
        let lineCount: number = tarEditor.document.lineCount || 0;
        let start: vscode.Position = new Position(0, 0);
        let end: vscode.Position = new Position(lineCount + 1, 0);
        let range: vscode.Range = new Range(start, end);
        void tarEditor.edit((editBuilder: vscode.TextEditorEdit) => {
            editBuilder.replace(range, this.newText);
        });

    }
}

let tsTrans = {
    takeTrans(doc: vscode.TextDocument): string {
        // 内容
        let text: string = doc.getText();
        // ts 转化 js
        return this.tsTpJsContent(text);

    },
    tsTpJsContent(text: string): string {
        let oContent: any = transpileModule(text, {
            // compilerOptions?: CompilerOptions;
            // fileName?: string;
            // reportDiagnostics?: boolean;
            // moduleName?: string;
            // renamedDependencies?: MapLike<string>;
            // transformers?: CustomTransformers;
            compilerOptions: {
                module: ModuleKind.CommonJS,
                target: ScriptTarget.ES2016,
            },
            reportDiagnostics: true,
        });
        return oContent.outputText;
    }
};

export default new Main();

// function getConfig() : any {
//     let configMode = workspace.getConfiguration('ts-preview').get('mode');
//     console.log(configMode);
//     return {
//         mode: configMode
//     };
// }


/**
 * @file 格式化 单vue组件 文件
 * @author fe_bean
 */

import * as vscode from 'vscode';
import * as ts from 'typescript';
let {
    window,
    Position,
    Range,
    workspace,
    // StatusBarAlignment
} = vscode;

let editor: any;
let previewColumn: number = 2;

export class Main {
    doc: vscode.TextDocument;
    tsDoc: any; // 展示 preview 的 document
    text: string;
    newText: string;
    constructor() {
        // 活动窗口
        editor = window.activeTextEditor;
        // 当前窗口document
        this.doc = editor.document;
        this.tsDoc = undefined;
        this.text = '';
        this.newText = '';
        this.init();
    }
    init(): void {
        // 获取配置
        // let conf = this.getConfig();
        this.takeTrans(0);
        this.bindEvn();
    }
    bindEvn(): void {
        let that = this;
        let timer: any;
        workspace.onDidChangeTextDocument(function(e) {
            clearTimeout(timer);
            if (window.visibleTextEditors.length < 2) {
                return;
            }
            let lineStart: number = 0;
            timer = setTimeout(() => {
                if (e.contentChanges.length > 0) {
                    lineStart = e.contentChanges[0].range.start.line;
                }
                if (e.document === that.doc) {
                    // 触发 ts 编译
                    that.takeTrans(lineStart);
                }
            }, 302);
        });
    }
    takeTrans(lineStart: number): void {
        // 内容
        this.text = this.doc.getText();
        // ts 转化 js
        this.tsTpJsContent();
        // 新窗口展示 js preview | 编辑器形式
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
        // webview 形式预览 ? 只支持html?
        // let panel: any = window.createWebviewPanel('js.preview', 'ts-preview.js', 2, {});
        // panel.webview.html = oContent.outputText;
    }
    tsTpJsContent(): void {
        let oContent: any = ts.transpileModule(this.text, {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2016,
            },
            reportDiagnostics: true,
        });
        this.newText = oContent.outputText;
    }
    getPreviewDoc(): void {
        window.visibleTextEditors.forEach(item => {
            if (item.document === this.tsDoc) {
                this.writeFile(item);
                return;
            }
        });
        window.showTextDocument(this.tsDoc, {
            viewColumn: previewColumn,
            preserveFocus: true,
            preview: true,
        });
        this.writeFile(window.visibleTextEditors[previewColumn - 1]);
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
    getConfig() {
        return {};
    }
}


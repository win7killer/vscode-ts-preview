/**
 * @file 格式化 单vue组件 文件
 * @author fe_bean
 */

import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as hightLight from 'highlight.js';
import {rHtml} from './read_file';
let {
    window,
    Position,
    Range,
    workspace,
    // StatusBarAlignment
} = vscode;

let editor: any;
let previewColumn: number = 2;
let tplStr = rHtml('../template.html', {mini: true});
let isShowWebview: boolean = false;
export class Main {
    doc: vscode.TextDocument;
    tsDoc: any; // 展示 preview 的 document
    text: string;
    newText: string;
    panel: any;
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
        workspace.onDidChangeTextDocument(function (e) {
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
            }, 100);
        });
    }
    takeTrans(lineStart: number): void {
        // 内容
        this.text = this.doc.getText();
        // ts 转化 js
        this.tsTpJsContent();
        //****************** 计划加入 markdown.preview 形式，可能会有性能提升 */
        if (isShowWebview) {
            // webview 展示
            this.previewOnWebview();
        } else {
            // 新窗口展示 js preview | 编辑器形式
            this.previewOnDoc();
        }
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
    previewOnWebview(): void {
        // webview 形式预览 ? 只支持html?
        if (isShowWebview && !this.panel) {
            this.panel = window.createWebviewPanel(
                'js.preview',
                'ts-preview',
                previewColumn,
                {}
            );
        }
        let str: string = hightLight.highlightAuto(this.newText).value;
        let code = `<code class="js">${str}</code>`;
        let tplStr1 : string = tplStr.replace(/\$\{code\}/, code).trim();
        this.panel.webview.html = tplStr1;
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


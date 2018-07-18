/**
 * @file main js
 * @author fe_bean
 */

import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as path from 'path';

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
let tplStr: string = '';

export class Main {
    doc: vscode.TextDocument;
    tsDoc: any; // 展示 preview 的 document
    text: string;
    newText: string;
    panel: any;
    previewMode: string;
    themeSource: any;
    scriptSource: any;
    context: vscode.ExtensionContext;
    constructor(context: vscode.ExtensionContext) {
        // 活动窗口
        editor = window.activeTextEditor;
        // 当前窗口document
        this.doc = editor.document;
        this.tsDoc = undefined;
        this.text = '';
        this.newText = '';
        this.previewMode = this.getConfig().mode || 'editor';
        this.context = context;
        this.themeSource = '';
        this.scriptSource = '';
        this.init();
    }
    init(): void {
        // 获取配置
        // let conf = this.getConfig();
        // vscode.window.showInformationMessage('gogo');

        this.takeTrans(0);
        this.bindEvn();

    }
    bindEvn(): void {
        let that = this;
        let timer: any;
        workspace.onDidChangeTextDocument(function (e) {
            clearTimeout(timer);
            if (window.visibleTextEditors.length < 1) {
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
        this.newText = this.tsTpJsContent();

        //****************** 计划加入 markdown.preview 形式，可能会有性能提升 */
        if (this.previewMode === 'webview') {
            // webview 展示
            if (!tplStr) {
                tplStr = rHtml('../resource/template.html', {mini: true});
            }
            if (!this.scriptSource) {
                this.scriptSource = this.getScript();
            }
            if (!this.themeSource) {
                this.themeSource = this.getThemes();
            }
            this.previewOnWebview();
        } else if (this.previewMode === 'editor') {
            // 新窗口展示 js preview | 编辑器形式
            this.previewOnDoc();
        }
    }
    getThemes () {
        const onDiskPath = vscode.Uri.file(path.join(this.context.extensionPath, 'resource', 'theme.css'));
        return onDiskPath.with({ scheme: 'vscode-resource' });
    }
    getScript() {
        const onDiskPath = vscode.Uri.file(path.join(this.context.extensionPath, 'resource', 'highlight.pack.js'));
        return onDiskPath.with({ scheme: 'vscode-resource' });
    }
    tsTpJsContent(): string {
        let oContent: any = ts.transpileModule(this.text, {
            // compilerOptions?: CompilerOptions;
            // fileName?: string;
            // reportDiagnostics?: boolean;
            // moduleName?: string;
            // renamedDependencies?: MapLike<string>;
            // transformers?: CustomTransformers;
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2016,
            },
            reportDiagnostics: true,
        });
        return oContent.outputText;
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
        if (!this.panel) {
            this.panel = window.createWebviewPanel(
                'js.preview',
                'ts-preview',
                previewColumn,
                {
                    enableScripts: true
                }
            );
        }
        let code = `<code class="javascript">${this.newText}</code>`;
        let tplStr1 : string = tplStr
            .replace(/\$\{code\}/, code)
            .replace(/\$\{themeSource\}/, `${this.themeSource.scheme}:${this.themeSource.path}`)
            .replace(/\$\{scriptSource\}/, `${this.scriptSource.scheme}:${this.scriptSource.path}`)

            .trim();
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
    getConfig() : any {
        let configMode = workspace.getConfiguration('ts-preview').get('mode');
        console.log(configMode);
        return {
            mode: configMode
        };
    }
}


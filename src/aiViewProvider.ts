import * as vscode from "vscode";
import { askAzureGPT ,gptForRAG} from "./chatbotService";
import * as path from "path";
import * as fs from "fs";

export function getUri(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
    pathList: string[]
  ) {
    return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
  }
  
export class AiViewProvider implements vscode.WebviewViewProvider {
    
    public static readonly viewType = "webviewExample.view";
    private history: { role: string, content: string }[] = [];
    constructor(private readonly context: vscode.ExtensionContext) {}
    private mode = false;
    public resolveWebviewView(webviewView: vscode.WebviewView) {

        
        console.log("getWebviewContent2");
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this.getWebviewContent();
        webviewView.webview.postMessage({ type: "resetStorage" });
        webviewView.webview.postMessage({ type: "loadHistory", history: this.history });
        
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.type === "toggle_switch") {
                this.mode = message.mode;
                console.log("Mode: ", this.mode);
            }
            else if (message.type  === "ask") {
                
                const editor = vscode.window.activeTextEditor;
                let fileContent = "";
                let selectedText = "";
                let fileName = "";
                if (editor) {
                    fileContent = editor.document.getText();
                    selectedText = editor.document.getText(editor.selection);
                    fileName = editor.document.fileName;
                }
                
                
                let fullQuestion = "";
                const recentHistory = this.history.slice(-5); // Chỉ lấy 5 tin nhắn cuối  
                fullQuestion = recentHistory.map(msg => `${msg.role}: ${msg.content}`).join("\n");
                this.history.push({ role: "user", content: message.question });
                if (message.question.includes("/review")) {
                    fullQuestion += "Tên file:\n" + fileName + "\n";
                    fullQuestion += "Code của tôi:\n" + fileContent + "\n";
                }
                else if (message.question.includes("/section")) {
                    fullQuestion += "Tên file:\n" + fileName + "\n";
                    fullQuestion += "Code của tôi:\n" + selectedText + "\n";
                }

                fullQuestion += "Câu hỏi:\n" + message.question + "\n";
                let answer: string;
                
                console.log("chatGPT here");
                answer = await askAzureGPT(fullQuestion,this.mode);
                
                console.log("Answer: ", answer);
                this.history.push({ role: "assistant", content: answer });

                
                webviewView.webview.postMessage({ type: "response", response: answer });

                /*
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const content = editor.document.getText();
                    const fileName = editor.document.fileName;
                    console.log("Content: ", content);
                    console.log("File Name: ", fileName);
                    const selection = editor.selection;
                    const selectedText = editor.document.getText(selection); 
                    console.log("Selected Text: ", selectedText);
                }
                const answer = await askAzureGPT(message.text);
                webviewView.webview.postMessage({ command: "response", text: answer });
                */
            }
            else if (message.type  === "search-ask") {
                
                let fullQuestion = "";
                this.history.push({ role: "user", content: message.question });
                let answer: string;
                let context: string;
                console.log("RAG here____________");
                const response = await fetch('http://127.0.0.1:8000/query', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ question: message.question })
                            });
                            const result = await response.json() as { answer: string };
                            context = result.answer;
                
                fullQuestion += context;
                console.log(fullQuestion);
                answer = await gptForRAG(fullQuestion);
                
                console.log("Answer: ", answer);
                
                this.history.push({ role: "assistant", content: answer });

                
                webviewView.webview.postMessage({ type: "response", response: answer });

                /*
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const content = editor.document.getText();
                    const fileName = editor.document.fileName;
                    console.log("Content: ", content);
                    console.log("File Name: ", fileName);
                    const selection = editor.selection;
                    const selectedText = editor.document.getText(selection); 
                    console.log("Selected Text: ", selectedText);
                }
                const answer = await askAzureGPT(message.text);
                webviewView.webview.postMessage({ command: "response", text: answer });
                */
            }
        });
    }

    private getWebviewContent() {
        
        const filePath = path.join(__dirname, "..", "media", "index.html"); // Điều chỉnh đường dẫn tùy theo cấu trúc thư mục
        return fs.readFileSync(filePath, "utf8");

    
    }
}

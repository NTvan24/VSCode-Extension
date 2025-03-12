import * as vscode from "vscode";
import { askAzureGPT } from "./chatbotService";


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

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        console.log("getWebviewContent2");
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this.getWebviewContent();
        
        webviewView.webview.postMessage({ type: "loadHistory", history: this.history });
        
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.type  === "ask") {
                const editor = vscode.window.activeTextEditor;
                let fileContent = "";
                let selectedText = "";
                let fileName = "";
                if (editor) {
                    fileContent = editor.document.getText();
                    selectedText = editor.document.getText(editor.selection);
                    fileName = editor.document.fileName;
                }
                
                
                this.history.push({ role: "user", content: message.question });

                
                let fullQuestion = "";
                const recentHistory = this.history.slice(-10); // Chỉ lấy 10 tin nhắn cuối  
                fullQuestion = recentHistory.map(msg => `${msg.role}: ${msg.content}`).join("\n");
                
                if (message.question.includes("/review")) {
                    fullQuestion += "Tên file:\n" + fileName + "\n";
                    fullQuestion += "Code của tôi:\n" + fileContent + "\n";
                }
                if (message.question.includes("/section")) {
                    fullQuestion += "Tên file:\n" + fileName + "\n";
                    fullQuestion += "Code của tôi:\n" + selectedText + "\n";
                }

                fullQuestion += "Câu hỏi:\n" + message.question + "\n";
                
                const answer = await askAzureGPT(fullQuestion);
                
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
        
        return `
            <!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat AI</title>
    <style>
        

        #chat-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            padding: 10px;
            background: #0078D7; /* Màu nền tiêu đề */
            color: white; /* Màu chữ */
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        }
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 10px;
            background-color: #f4f4f4;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        
        #chat-container {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            border-radius: 8px;
            background: white;
            box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        #chat-history {
            padding: 10px;
            overflow-y: auto;
            flex-grow: 1;
            max-height: 80vh;
        }

        .message {
            padding: 8px 12px;
            margin: 5px;
            border-radius: 10px;
            max-width: 80%;
        }

        .user-message {
            background-color: #0078D7;
            color: white;
            align-self: flex-end;
        }

        .ai-message {
            background-color: #e0e0e0; /* Nền xám đậm hơn */
            color: black;  /* Chữ đen */
            align-self: flex-start;
            white-space: pre-wrap;
        }

        #input-container {
            display: flex;
            border-top: 1px solid #ddd;
            padding: 10px;
            background: white;
        }

        input {
            flex-grow: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }

        button {
            margin-left: 10px;
            padding: 10px 15px;
            border: none;
            background: #0078D7;
            color: white;
            cursor: pointer;
            border-radius: 4px;
            font-size: 14px;
        }

        button:hover {
            background: #005ea6;
        }
                .loading-spinner {
            display: none;
            width: 24px;
            height: 24px;
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-left-color: #0078D7;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-left: 10px;
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }


    </style>
</head>
<body>
    <div id="chat-title">AI Assistant</div>
    <div id="chat-container">
        
        <div id="chat-history"></div>
        <div id="loading-spinner" class="loading-spinner"></div>
        <div id="input-container">
            <input type="text" id="user-input" placeholder="Nhập câu hỏi...">
            <button id="send-btn">Gửi</button>
        </div>
        
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        document.getElementById("send-btn").addEventListener("click", sendMessage);
        document.getElementById("user-input").addEventListener("keypress", function(event) {
            if (event.key === "Enter") sendMessage();
        });

        function sendMessage() {
            const inputField = document.getElementById("user-input");
            const message = inputField.value.trim();
            if (message === "") return;

            addMessage("user-message", message);
            vscode.postMessage({ type: "ask", question: message });
            inputField.value = "";
            document.getElementById("loading-spinner").style.display = "inline-block";
            inputField.value = "";
        }

        function addMessage(className, text) {
            const chatHistory = document.getElementById("chat-history");
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message", className);
            messageDiv.innerHTML  = text.replace(/\\n/g, "<br>");
            chatHistory.appendChild(messageDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }

        

        window.addEventListener("message", event => {
            const message = event.data;
            if (message.type === "response") {
                addMessage("ai-message", message.response);
                console.log(message.response);
                document.getElementById("loading-spinner").style.display = "none";
            }
            if (message.type === "loadHistory") {
                message.history.forEach(msg => {
                    if (msg.role === "user") addMessage("user-message", msg.content);
                    if (msg.role === "assistant") addMessage("ai-message", msg.content);
                });
            }
        });
        
    </script>
</body>
</html>

        `;
    }
}

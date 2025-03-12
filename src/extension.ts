import * as vscode from "vscode";
import { AiViewProvider } from "./aiViewProvider";
import { askAzureGPT } from "./chatbotService";

export function activate(context: vscode.ExtensionContext) {
    //Đăng kí SideBar
    const aiViewProvider = new AiViewProvider(
        
        context
      );
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("aiAssistantView",aiViewProvider)
    );

    //Đăng kí Command
    let disposable = vscode.commands.registerCommand("ai-assistant.start", async () => {
        const panel = vscode.window.createWebviewPanel(
            "chatGptAssistant",
            "ChatGPT Assistant",
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === "ask") {
                const answer = await askAzureGPT(message.text);
                panel.webview.postMessage({ text: answer });
            }
        });
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent() {
    console.log("getWebviewContent1");
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Chatbot Assistant</title>
            <script>
                function sendMessage() {
                    const input = document.getElementById("question").value;
                    vscode.postMessage({ command: "ask", text: input });
                }
            </script>
            <style>
    body {
        font-family: Arial, sans-serif;
        background-color: #222; /* Màu nền tối */
        color: #fff; /* Chữ màu trắng */
        text-align: center;
        padding: 20px;
    }

    input {
        padding: 10px;
        width: 60%;
        font-size: 16px;
        margin-bottom: 10px;
    }

    button {
        padding: 10px 20px;
        font-size: 16px;
        background-color: #007acc;
        color: white;
        border: none;
        cursor: pointer;
    }

    button:hover {
        background-color: #005f99;
    }

    #response {
        margin-top: 20px;
        padding: 10px;
        background-color: #333; /* Màu nền của phần phản hồi */
        color: #00ffcc; /* Chữ màu sáng */
        border-radius: 5px;
        display: inline-block;
        min-width: 60%;
    }
</style>
        </head>
        <body>
            <h1>ChatAI Assistant</h1>
            <input type="text" id="question" placeholder="Nhập câu hỏi..."/>
            <button onclick="sendMessage()">Gửi</button>
            <div id="response"></div>
            <script>
                const vscode = acquireVsCodeApi();
                window.addEventListener('message', event => {
                    document.getElementById("response").innerText = event.data.text;
                });
            </script>
        </body>
        </html>
    `;
}

export function deactivate() {}

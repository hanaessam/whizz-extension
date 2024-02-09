// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    const fixCode = document.querySelector('.fix-code');
    const explainCode = document.querySelector('.explain-code');
    const generateCodeDocument = document.querySelector('.generate-code-doc');
    const generateUnitTest = document.querySelector('.generate-unit-test');
    const chatInput = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.send-btn');
    const chatbox = document.querySelector('.chat-box');
  
    fixCode.addEventListener('click', fixClicked);
    explainCode.addEventListener('click', explainClicked);
    generateCodeDocument.addEventListener('click', generateCodeDocumentClicked);
    generateUnitTest.addEventListener('click', generateUnitTestClicked);
   
    sendButton.addEventListener('click', ()=>{
        sendChatInput();
        updateChatbox();
    });

    function appendMessageToChatbox(message) {
        const newMessageElement = document.createElement('p');
        newMessageElement.className = 'chat-message';
        newMessageElement.textContent = message;
        chatbox.appendChild(newMessageElement);
    }

    function updateChatbox() {
        const chatboxContent = chatbox.innerHTML; // Get the current content of the chatbox
        // Manipulate the content
        const newContent = chatboxContent;
        // Set the new content
        chatbox.innerHTML = newContent;
    }

    function fixClicked() {
        vscode.postMessage({
            type: 'fix-code',
            value: 'fix-code clicked'
        });
    }

    function explainClicked() {
        vscode.postMessage({
            type: 'explain-code',
            value: 'explain-code clicked'
        });
    }

    function generateCodeDocumentClicked() {
        vscode.postMessage({
            type: 'generate-code-document',
            value: 'generate-code-document clicked'
        });
    }

    function generateUnitTestClicked() {
        vscode.postMessage({
            type: 'generate-unit-test',
            value: 'generate-unit-test clicked'
        });
    }

    function sendChatInput() {
        let chatInputValue = chatInput.value;
        vscode.postMessage({
            type: 'send-btn',
            value: chatInputValue
        });
        chatInput.value = '';
    }

    window.addEventListener("message", async (event) => {
        const message = event.data;
        switch (message.type) {
            case "transferDataFromTsToUi":
                txtbox.value = message.data;
                break;
            case "update-chatbox":
                appendMessageToChatbox(message.value);
                break;
        }
    });

}());
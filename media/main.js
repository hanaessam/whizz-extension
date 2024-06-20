// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  const vscode = acquireVsCodeApi();

  const fixCode = document.querySelector(".fix-code");
  const explainCode = document.querySelector(".explain-code");

  const chatInput = document.querySelector(".chat-input");
  const sendButton = document.querySelector(".send-btn");
  const chatbox = document.querySelector(".chat-box");

  const loginWithGithubButton = document.getElementById("github-login-button");
  const githubUserInfo = document.getElementById("github-user-info");

  fixCode.addEventListener("click", fixClicked);
  explainCode.addEventListener("click", explainClicked);

  sendButton.addEventListener("click", () => {
    sendChatInput();
    updateChatbox();
  });

  loginWithGithubButton.addEventListener("click", loginWithGithub);

  function appendMessageToChatbox(message) {
    const newMessageElement = document.createElement("p");
    newMessageElement.className = "chat-message";
    newMessageElement.textContent = `Whizz: ${message}`;
    chatbox.appendChild(newMessageElement);
  }

  function appendMessageUserToChatbox(message) {
    const newMessageElement = document.createElement("p");
    newMessageElement.className = "chat-message-user";
    newMessageElement.textContent = `You: ${message}`;
    chatbox.appendChild(newMessageElement);
  }
  function updateChatbox() {
    const chatboxContent = chatbox.innerHTML;
    const newContent = chatboxContent;
    chatbox.innerHTML = newContent;
  }

  function fixClicked() {
    vscode.postMessage({
      type: "fix-code",
      value: "fix-code clicked",
    });
  }

  function explainClicked() {
    vscode.postMessage({
      type: "explain-code",
      value: "explain-code clicked",
    });
  }

  function generateCodeDocumentClicked() {
    vscode.postMessage({
      type: "generate-code-document",
      value: "generate-code-document clicked",
    });
  }

  function generateUnitTestClicked() {
    vscode.postMessage({
      type: "generate-unit-test",
      value: "generate-unit-test clicked",
    });
  }

  function sendChatInput() {
    let chatInputValue = chatInput.value;
    vscode.postMessage({
      type: "send-btn",
      value: chatInputValue,
    });
    appendMessageUserToChatbox(chatInputValue);
    chatInput.value = "";
  }

  function loginWithGithub() {
    vscode.postMessage({
      type: "login-with-github",
      value: "login-with-github clicked",
    });
  }

  function getGithubUserInfo(message) {
    githubUserInfo.innerHTML = `Github User Info: <br/>Username - ${message.user.username} <br/>Display Name - ${message.user.name}`;
  }

  window.addEventListener("message", async (event) => {
    const message = event.data;
    switch (message.type) {
      case "transferDataFromTsToUi":
        txtbox.value = message.data;
        break;
      case "send-query":
        appendMessageToChatbox(message.value);
        break;
      case "fix-code":
        appendMessageToChatbox(message.value);
        break;
      case "explain-code":
        appendMessageToChatbox(message.value);
        break;
      case "login-with-github":
        loginWithGithub();
        break;

      case "github-user-info": {
        getGithubUserInfo(message.value);
        break;
      }
    }
  });
})();

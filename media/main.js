// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  const vscode = acquireVsCodeApi();

  const fixCode = document.querySelector(".fix-code");
  const explainCode = document.querySelector(".explain-code");
  const generateCodeDocument = document.querySelector(".generate-code-documentation");
  const generateUnitTest = document.querySelector(".unit-test");
  const createFileArch = document.querySelector(".create-file-arch");
  const switchCodeLanguage = document.querySelector(".switch-code-lang");

  const chatInput = document.querySelector(".chat-input");
  const sendButton = document.querySelector(".send-btn");
  const chatbox = document.querySelector(".chat-box");

  const loginWithGithubButton = document.getElementById("github-login-button");
  const githubUserInfo = document.getElementById("github-user-info");

  const keyButton = document.getElementById("key-button");

  fixCode.addEventListener("click", fixClicked);
  explainCode.addEventListener("click", explainClicked);
  generateCodeDocument.addEventListener("click", generateCodeDocumentClicked);
  generateUnitTest.addEventListener("click", generateUnitTestClicked);
  createFileArch.addEventListener("click", createFileArchClicked);
  switchCodeLanguage.addEventListener("click", switchCodeLanguageClicked);


  sendButton.addEventListener("click", () => {
    sendChatInput();
    updateChatbox();
  });


  keyButton.addEventListener("click", () => {
    vscode.postMessage({
      type: "open-key-management",
    });
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
      type: "generate-code-documentation",
      value: "generate-code-documentation clicked",
    });
  }

  function generateUnitTestClicked() {
    vscode.postMessage({
      type: "generate-unit-test",
      value: "generate-unit-test clicked",
    });
  }

  function createFileArchClicked() {
    vscode.postMessage({
      type: "create-file-arch",
      value: "create-file-arch clicked",
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
  function switchCodeLanguageClicked() {
    vscode.postMessage({
      type: "switch-code-lang",
      value: "switch-code-lang clicked",
    });
  };


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

      case "generate-code-documentation":
        generateCodeDocumentClicked();
        break;

      case "generate-unit-test":
        generateUnitTestClicked();
        break;

      case "create-file-arch":
        createFileArchClicked();
        break;

      case "github-user-info": {
        getGithubUserInfo(message.value);
        break;
      }

      case "switch-code-lang":
        switchCodeLanguageClicked();
        break;
    }
  });
})();
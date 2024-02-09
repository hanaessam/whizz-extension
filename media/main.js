// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    const fixCode = document.querySelector('.fix-code');
  
    fixCode.addEventListener('click', fixClicked);
   

    function fixClicked() {
        vscode.postMessage({
            type: 'fix-code',
            value: 'fix-code clicked'
        });
    }

    window.addEventListener("message", async (event) => {
        const message = event.data;
        switch (message.type) {
            case "transferDataFromTsToUi":
                txtbox.value = message.data;
                break;
        }
    });

}());
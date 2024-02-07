// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    const btnfirst = document.querySelector('.btn-first');
  
    btnfirst.addEventListener('click', firstBtnClicked);
   

    function firstBtnClicked() {
        vscode.postMessage({
            type: 'btn-first',
            value: 'btn-first clicked'
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
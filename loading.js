var loadingProgress = 0;
var loadingProgressEvent = false
const progressBar = document.getElementById('progress-bar');
const startButton = document.getElementById('start-button');
const progressBarContainer = document.getElementById('progress-bar-container');


var loadingInterval = setInterval(() => {
    if (!loadingProgressEvent) {
        if (loadingProgress < 90) {
            loadingProgress += 10;
            progressBar.style.width = `${loadingProgress}%`;
        }
    } else {
        clearInterval(loadingInterval)
        startButton.style.display = "inline-block"
        progressBarContainer.style.display = "none"
    }

}, 200);

window.addEventListener("load", () => {
    // loaded
    loadingProgress = 100
    progressBar.style.width = `${loadingProgress}%`;
    loadingProgressEvent = true;

});
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


// Create a new Image object
var image = new Image();

// Set the source of the image
image.src = "./resources/Rescued_Friend_UI/bust/Kid1_bust-min.png";
image.src = "./resources/Rescued_Friend_UI/bust/Kid2_bust-min.png";
image.src = "./resources/Rescued_Friend_UI/bust/Kid3_bust-min.png";
image.src = "./resources/Rescued_Friend_UI/bust/Kid4_bust-min.png";
image.src = "./resources/Rescued_Friend_UI/bust/Kid5_bust-min.png";




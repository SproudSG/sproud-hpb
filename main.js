import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/stats.js/src/Stats.js'
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js"

import { player } from './world_objects/player.js';
import { shoogaGlider } from './world_objects/monster/shoogaGlider.js';
import { trolliumChloride } from './world_objects/monster/trolliumChloride.js';
import { pitfall } from './world_objects/obstacle/pitfall.js';
import { wallrun } from './world_objects/obstacle/wallrun.js';

import { cloud } from './world_objects/cloud.js';
import { sky } from './world_objects/sky.js';
import { stg1sky } from './world_objects/stage1_sky.js';

import { progression } from './world_objects/progression.js';
import { water } from './world_objects/drinks/water.js';
import { waterGrade } from './world_objects/drinks/water_grade.js';
import { fruitDrinkGrade } from './world_objects/drinks/fruitDrink_grade.js';
import { sodaGrade } from './world_objects/drinks/soda_grade.js';

import { soda } from './world_objects/drinks/soda.js';
import { fruitDrink } from './world_objects/drinks/fruitDrink.js';
import { hpbLogo } from './world_objects/logo_box/boxHPB.js';
import { hpbWrongLogo1 } from './world_objects/logo_box/boxWrong1.js';
import { hpbWrongLogo2 } from './world_objects/logo_box/boxWrong2.js';
import { oilSlik } from './world_objects/monster/OilSlik.js';
import { carbs } from './world_objects/food/carbs.js';
import { meat } from './world_objects/food/meat.js';
import { vege } from './world_objects/food/vege.js';

const _VS = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;


const _FS = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
varying vec3 vWorldPosition;
void main() {
  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}`;



class BasicWorldDemo {
  constructor() {

    //game end & you win & after video count down
    this.countdown2_ = 6;
    this.countdown1_ = 6;
    this.countdown0_ = 6;

    this.totalStamina = 0;
    this.stopTime = true;
    this.resumeCountdown_ = 3;
    this.intervalId_ = null;

    //first load
    this.firstLoad = true;
    this.showChase = true;
    this.cameraX = 15;
    this.cameraY = 5.5;
    this.cameraZ = -10;

    //pause
    this.allowPause = false;

    //load assets & world variables 
    this.loaded = false;
    this.gender_ = null;
    this.stage = 1;
    this.wallPosition = [];
    // this.oilSlikCatch = false

    //init
    this._gameStarted = false;
    this._Initialize();
    this.checkStartGame = false;
    this._showGender = false;
    this.failedStage = false;
    //loading bars
    this.progressBarContainer = document.getElementById('loading-bar-container');


    //on load music 
    this.splashScreenMusic = document.getElementById("splash-screen-music");
    this.stage1Music = document.getElementById("stage1-music")
    this.stage2Music = document.getElementById("stage2-music")
    this.stage3Music = document.getElementById("stage3-music")

    this.splashScreenMusicToggle = false;
    window.addEventListener('touchstart', () => {
      if ((/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) && !this.splashScreenMusicToggle) {
        // code to execute if the platform is iOS
        this._playSplashScreenMusic();
      }

    })



    //start game event listeners
    document.addEventListener('keydown', () => {
      if (!this._gameStarted) {
        this.splashScreenMusic.pause()
        var progressBarContainer = document.getElementById('progress-bar-container');
        if (window.getComputedStyle(progressBarContainer).display === 'none') {
          if (!this._showGender) {
            this._showGender = true;
            document.getElementById('game-menu').style.display = 'none';
            this.playNextStageVideo1()
            document.getElementById('video-container').style.display = 'block';
          }
        }
      }
    });

    document.addEventListener('click', () => {
      this.splashScreenMusic.pause()
      var progressBarContainer = document.getElementById('progress-bar-container');
      if (window.getComputedStyle(progressBarContainer).display === 'none') {
        if (!this._showGender) {
          this._showGender = true;
          document.getElementById('game-menu').style.display = 'none';
          this.playNextStageVideo1()
          document.getElementById('video-container').style.display = 'block';
        }
      }

    });




    //handle gender selection
    document.getElementById('boy-unselected').addEventListener('click', () => {
      this.gender_ = "male"
      document.getElementById("select-gender").classList.remove("unselected");
      document.getElementById('boy-unselected').style.display = 'none';
      document.getElementById('boy-selected').style.display = 'inline-block';

      if (document.getElementById('girl-selected').style.display == 'inline-block') {
        document.getElementById('girl-unselected').style.display = 'inline-block';
        document.getElementById('girl-selected').style.display = 'none'
      }

    });

    document.getElementById('girl-unselected').addEventListener('click', () => {
      this.gender_ = "female"
      document.getElementById("select-gender").classList.remove("unselected");
      document.getElementById('girl-unselected').style.display = 'none';
      document.getElementById('girl-selected').style.display = 'inline-block';
      if (document.getElementById('boy-selected').style.display == 'inline-block') {
        document.getElementById('boy-unselected').style.display = 'inline-block';
        document.getElementById('boy-selected').style.display = 'none'

      }
    });

    //handle start game (male)
    document.getElementById('select-gender').addEventListener('click', () => {
      if (this.gender_ === 'male' || this.gender_ === 'female') {
        this.splashScreenMusic.pause();
        this.splashScreenMusicToggle = true;
        document.getElementById('video-container').style.display = 'block';
        document.getElementById('player-ui').style.display = 'block';

        document.getElementById('gender-selection').style.display = 'none';
        this.player_ = new player.Player({ gender: this.gender_, scene: this.scene_, stage: this.stage, water: this.water_, waterGrade: this.waterGrade_, soda: this.soda_, sodaGrade: this.sodaGrade_, fruitDrink: this.fruitDrink_, fruitDrinkGrade: this.fruitDrinkGrade_, pitfall: this.pitfall_, trolliumChloride: this.trolliumChloride_, shoogaGlider: this.shoogaGlider_, box1: this.hpbLogo_, box2: this.hpbWrongLogo1_, box3: this.hpbWrongLogo2_, meat: this.meat_, carbs: this.carbs_, vege: this.vege_ });
        if (this.firstLoad) {
          this.firstLoad = false;
          this.closeNextStageVideo1();
          document.getElementById('loading-1').style.display = 'block';

          // text type writer 
          var textElement = document.getElementById('stage1-intro1-text1');
          var textElement1 = document.getElementById('stage1-intro1-text2');
          var textElement2 = document.getElementById('stage1-intro1-text3');

          textElement.textContent = '';
          var textToType = "HEY THERE, I'M AGENT SOFIA.";
          var typingSpeed = 10;
          var i = 0;
          var intervalId = setInterval(function () {
            textElement.textContent += textToType.charAt(i);
            i++;
            if (i >= textToType.length) {
              i = 0
              clearInterval(intervalId);
              textToType = "LOOKS LIKE YOU AND YOUR FRIENDS ACCIDENTALLY WENT THROUGH A MULTIVERSE PORTAL TO GLYKOS!";
              intervalId = setInterval(function () {
                textElement1.textContent += textToType.charAt(i);
                i++;
                if (i >= textToType.length) {
                  i = 0

                  clearInterval(intervalId);
                  textToType = "EVERYTHING MIGHT LOOK SWEET AND APPETISING BUT IT'S MORE DANGEROUS THAN IT SEEMS.";
                  intervalId = setInterval(function () {
                    textElement2.textContent += textToType.charAt(i);
                    i++;
                    if (i >= textToType.length) {
                      clearInterval(intervalId);
                      document.getElementById('loading1-next').style.display = 'block';
                    }
                  }, typingSpeed);
                }
              }, typingSpeed);
            }
          }, typingSpeed);


          // start loading variables
          this.stopTime = false
          this.RAF_()
          this.progressBarContainer.style.display = 'block';
          const progressBar = document.getElementById('loading-bar-stage-1');
          var loadingProgress = 0

          var loadingInterval = setInterval(() => {
            if (loadingProgress < 74) {
              // Calculate the loading progress as a percentage of the maximum value
              const progressPercentage = (loadingProgress / 74) * 100;
              progressBar.style.width = `${progressPercentage}%`;
              loadingProgress = this.scene_.children.length;
            } else {
              clearInterval(loadingInterval)
              progressBar.style.width = `100%`;
              this.startGame = true;
              this.stopTime = true;

              document.dispatchEvent(new CustomEvent('score-over'));
              if (this.gender_ == "male") {
                document.getElementById('boyHUD').style.display = 'block'
              } else if (this.gender_ == "female") {
                document.getElementById('girlHUD').style.display = 'block'
              }
            }

          }, 50);

        }
      }
    });



    // swipe gesture variables and event listeners
    this.swipeLeft = false;
    this.swipeRight = false;
    this.swipeUp = false;
    this.swipeDown = false;
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    this.minDistance = 100;
    this.isSwiping = false;
    this.isPaused = false;

    document.addEventListener('touchstart', (event) => {
      this.handleTouchStart(event);
    }, { passive: false });

    document.addEventListener('touchmove', (event) => {
      this.handleTouchMove(event);
    }, { passive: false });



    //next stage cut scenes
    this.nextStageVideo1_ = document.getElementById("nextStage1");
    this.nextStageVideo2_ = document.getElementById("nextStage2");
    this.nextStageVideo3_ = document.getElementById("nextStage3");
    this.nextStageVideo4_ = document.getElementById("nextStage4");
    this.nextStageVideo5_ = document.getElementById("nextStage5");



    // if next stage video ends, then unpause everything
    this.nextStageVideo1_.addEventListener("ended", () => {
      if (!this._gameStarted) {
        document.getElementById('gender-selection').style.display = 'block';
        document.getElementById('video-container').style.display = 'none';

      } else {

        this.closeNextStageVideo1();

        document.getElementById('loading-1').style.display = 'block';
        document.getElementById('stage1-intro1').style.display = 'block';
        document.getElementById('loading-bar-container').style.display = 'block';
        document.getElementById('loading-text-stage-1').style.display = 'block';
        // text type writer 
        var textElement = document.getElementById('stage1-intro1-text1');
        var textElement1 = document.getElementById('stage1-intro1-text2');
        var textElement2 = document.getElementById('stage1-intro1-text3');

        textElement.textContent = '';
        textElement1.textContent = '';
        textElement2.textContent = '';

        var textToType = "HEY THERE, I'M AGENT SOFIA.";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(function () {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            i = 0
            clearInterval(intervalId);
            textToType = "LOOKS LIKE YOU AND YOUR FRIENDS ACCIDENTALLY WENT THROUGH A MULTIVERSE PORTAL TO GLYKOS!";
            intervalId = setInterval(function () {
              textElement1.textContent += textToType.charAt(i);
              i++;
              if (i >= textToType.length) {
                i = 0

                clearInterval(intervalId);
                textToType = "EVERYTHING MIGHT LOOK SWEET AND APPETISING BUT IT'S MORE DANGEROUS THAN IT SEEMS.";
                intervalId = setInterval(function () {
                  textElement2.textContent += textToType.charAt(i);
                  i++;
                  if (i >= textToType.length) {
                    clearInterval(intervalId);
                    document.getElementById('loading1-next').style.display = 'block';
                  }
                }, typingSpeed);
              }
            }, typingSpeed);
          }
        }, typingSpeed);

        while (this.scene_.children.length > 0) {
          this.scene_.remove(this.scene_.children[0]);
        }

      }
      this.closeNextStageVideo1();
    });

    // if next stage video ends, then unpause everything
    this.nextStageVideo2_.addEventListener("ended", () => {
      this.closeNextStageVideo2();
      document.getElementById('loading1-next').style.display = 'none';
      document.getElementById('loading-2').style.display = 'block';
      document.getElementById('stage2-intro1').style.display = 'block';
      document.getElementById('loading2-next').style.display = 'none';
      document.getElementById('loading-button-container').style.display = 'block';

      document.getElementById('loading-bar-container-2').style.display = 'block';
      document.getElementById('loading-text-stage-2').style.display = 'block';
      // text type writer 
      var textElement = document.getElementById('stage2-intro1-text1');
      var textElement1 = document.getElementById('stage2-intro1-text2');
      var textElement2 = document.getElementById('stage2-intro1-text3');
      var textElement3 = document.getElementById('stage2-intro1-text4');
      var textElement4 = document.getElementById('stage2-intro1-text5');
      var textElement5 = document.getElementById('stage2-intro1-text6');
      var textElement6 = document.getElementById('stage2-intro1-text7');
      var textElement7 = document.getElementById('stage2-intro1-text8');

      textElement.textContent = '';
      textElement1.textContent = '';
      textElement2.textContent = '';
      textElement3.textContent = '';
      textElement4.textContent = '';
      textElement5.textContent = '';
      textElement6.textContent = '';
      textElement7.textContent = '';

      var textToType = "NICE WORK! NOW THAT YOU HAVE THE NUTRI-SHIELD, YOU CAN PROTECT YOURSELF AGAINST ATTACKS AND OBSTACLES. ";
      var typingSpeed = 10;
      var i = 0;
      var intervalId = setInterval(() => {
        textElement.textContent += textToType.charAt(i);
        i++;
        if (i >= textToType.length) {
          i = 0
          clearInterval(intervalId);
          textToType = "TO CHARGE IT, FOLLOW THE 'MY HEALTHY PLATE' FORMULA:"
          intervalId = setInterval(() => {
            textElement1.textContent += textToType.charAt(i);
            i++;
            if (i >= textToType.length) {
              i = 0

              clearInterval(intervalId);
              textToType = "¼ GRAINS";
              intervalId = setInterval(() => {
                textElement2.textContent += textToType.charAt(i);
                i++;
                if (i >= textToType.length) {
                  clearInterval(intervalId);
                  i = 0
                  textToType = ",";
                  intervalId = setInterval(() => {
                    textElement3.textContent += textToType.charAt(i);
                    i++;
                    if (i >= textToType.length) {
                      clearInterval(intervalId);
                      i = 0

                      textToType = "¼ PROTEIN";
                      intervalId = setInterval(() => {
                        textElement4.textContent += textToType.charAt(i);
                        i++;
                        if (i >= textToType.length) {
                          clearInterval(intervalId);
                          i = 0
                          textToType = ",";
                          intervalId = setInterval(() => {
                            textElement5.textContent += textToType.charAt(i);
                            i++;
                            if (i >= textToType.length) {
                              clearInterval(intervalId);
                              i = 0
                              textToType = "½ FRUIT AND VEG";
                              intervalId = setInterval(() => {
                                textElement6.textContent += textToType.charAt(i);
                                i++;
                                if (i >= textToType.length) {
                                  i = 0
                                  clearInterval(intervalId);
                                  textToType = "!";
                                  intervalId = setInterval(() => {
                                    textElement7.textContent += textToType.charAt(i);
                                    i++;
                                    if (i >= textToType.length) {
                                      clearInterval(intervalId);
                                      document.getElementById('loading2-next').style.display = 'block';
                                    }
                                  }, typingSpeed);
                                }
                              }, typingSpeed);
                            }
                          }, typingSpeed);
                        }
                      }, typingSpeed);
                    }
                  }, typingSpeed);
                }
              }, typingSpeed);
            }
          }, typingSpeed);
        }
      }, typingSpeed);

      while (this.scene_.children.length > 0) {
        this.scene_.remove(this.scene_.children[0]);
      }

    });

    // if next stage video ends, then unpause everything
    this.nextStageVideo3_.addEventListener("ended", () => {
      this.closeNextStageVideo3();
      document.getElementById('loading2-next').style.display = 'none';
      document.getElementById('loading-3').style.display = 'block';
      document.getElementById('stage3-intro1').style.display = 'block';
      document.getElementById('loading3-next').style.display = 'none';
      document.getElementById('loading-button-container').style.display = 'block';
      document.getElementById('loading-bar-container-3').style.display = 'block';
      document.getElementById('loading-text-stage-3').style.display = 'block';
      // text type writer 
      var textElement = document.getElementById('stage3-intro1-text1');
      var textElement1 = document.getElementById('stage3-intro1-text2');
      var textElement2 = document.getElementById('stage3-intro1-text3');

      textElement.textContent = '';
      textElement1.textContent = '';
      textElement2.textContent = '';

      var textToType = "UH OH! SEEMS LIKE TAKING THE PORTAL KEY ACTIVATED SOME SORT OF SELF-DESTRUCT SEQUENCE.";
      var typingSpeed = 10;
      var i = 0;
      var intervalId = setInterval(function () {
        textElement.textContent += textToType.charAt(i);
        i++;
        if (i >= textToType.length) {
          i = 0
          clearInterval(intervalId);
          textToType = "YOU'LL NEED TO HURRY!";
          intervalId = setInterval(function () {
            textElement1.textContent += textToType.charAt(i);
            i++;
            if (i >= textToType.length) {
              i = 0

              clearInterval(intervalId);
              textToType = "JUMP AND MOVE LEFT OR RIGHT TO WALL RUN TO AVOID FALLING DOWN THE CRUMBLING PATHS!";
              intervalId = setInterval(function () {
                textElement2.textContent += textToType.charAt(i);
                i++;
                if (i >= textToType.length) {
                  i = 0
                  clearInterval(intervalId);
                  document.getElementById('loading3-next').style.display = 'block';
                }
              }, typingSpeed);
            }
          }, typingSpeed);
        }
      }, typingSpeed);


      while (this.scene_.children.length > 0) {
        this.scene_.remove(this.scene_.children[0]);
      }

    });

    // if next stage video ends, then unpause everything
    this.nextStageVideo4_.addEventListener("ended", () => {
      this.closeNextStageVideo4();
      this.stopTime = true
      this.Pause()
      document.getElementById('loading3-next').style.display = 'none';

      //  document.getElementById('score').textContent = Math.ceil(this.totalStamina * 1) / 1;
      document.getElementById("volume-container").style.display = 'none';
      document.getElementById('final-score-good-ending').classList.toggle('active');
      if (this.gender_ == "male") {
        document.getElementById('boyHUDstg3').style.display = 'none'
      } else if (this.gender_ == "female") {
        document.getElementById('girlHUDstg3').style.display = 'none'
      }
      while (this.scene_.children.length > 0) {
        this.scene_.remove(this.scene_.children[0]);
      }

    });


    // if next stage video ends, then unpause everything
    this.nextStageVideo5_.addEventListener("ended", () => {
      this.closeNextStageVideo5();
      this.stopTime = true
      this.Pause()
      document.getElementById('loading3-next').style.display = 'none';

      // document.getElementById('score').textContent = Math.ceil(this.totalStamina * 1) / 1;
      document.getElementById("volume-container").style.display = 'none';
      document.getElementById('final-score-bad-ending').classList.toggle('active');
      if (this.gender_ == "male") {
        document.getElementById('boyHUDstg3').style.display = 'none'
      } else if (this.gender_ == "female") {
        document.getElementById('girlHUDstg3').style.display = 'none'
      }
      while (this.scene_.children.length > 0) {
        this.scene_.remove(this.scene_.children[0]);
      }

    });
  }

  //stage 1 cutscene
  playNextStageVideo1() {
    this.nextStageVideo1_.style.display = "block";
    this.nextStageVideo1_.play();
    if (this.checkRestart || this.failedStage) {
      this.nextStageVideo1_.currentTime = this.nextStageVideo1_.duration;
    }
  }

  closeNextStageVideo1() {
    this.nextStageVideo1_.style.display = "none";
    this.nextStageVideo1_.currentTime = 0;
    this.nextStageVideo1_.pause();
  }


  //stage 2 cutscene
  playNextStageVideo2() {
    this.nextStageVideo2_.style.display = "block";
    pauseButton.style.display = 'none'
    this.nextStageVideo2_.play()
    if (this.checkRestart || this.failedStage) {
      this.nextStageVideo2_.currentTime = this.nextStageVideo2_.duration;
    }
  }

  closeNextStageVideo2() {
    this.nextStageVideo2_.style.display = "none";
    this.nextStageVideo2_.currentTime = 0;
    this.nextStageVideo2_.pause();
  }

  //stage 3 cutscene
  playNextStageVideo3() {
    this.nextStageVideo3_.style.display = "block";
    pauseButton.style.display = 'none'
    this.nextStageVideo3_.play();
    if (this.checkRestart || this.failedStage) {
      this.nextStageVideo3_.currentTime = this.nextStageVideo3_.duration;
    }
  }

  closeNextStageVideo3() {
    this.nextStageVideo3_.style.display = "none";
    this.nextStageVideo3_.currentTime = 0;
    this.nextStageVideo3_.pause();
  }


  //victory videos or defeat videos
  playVictoryVid() {
    pauseButton.style.display = 'none'
    this.nextStageVideo4_.style.display = "block";
    this.nextStageVideo4_.play();
  }

  closeNextStageVideo4() {
    this.nextStageVideo4_.style.display = "none";
    this.nextStageVideo4_.currentTime = 0;
    this.nextStageVideo4_.pause();
  }

  playDefeatVid() {
    pauseButton.style.display = 'none'
    this.nextStageVideo5_.style.display = "block";
    this.nextStageVideo5_.play();
  }

  closeNextStageVideo5() {
    this.nextStageVideo5_.style.display = "none";
    this.nextStageVideo5_.currentTime = 0;
    this.nextStageVideo5_.pause();
  }
  //music player
  _playSplashScreenMusic() {
    this.splashScreenMusic.play();
  }

  //start the game
  _OnStart() {
    this._gameStarted = true;
    this.stage1Music.play();
  }


  //swipe gestures, properties: swipe atleast 100 pixels to activate, cannot execute if user holds down on the swipe.


  handleTouchStart(event) {
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
  }

  handleTouchMove(event) {
    if (this.isSwiping) {
      return;
    }
    if (this.showChase) {
      return;
    }
    this.endX = event.changedTouches[0].clientX;
    this.endY = event.changedTouches[0].clientY;

    const deltaX = this.endX - this.startX;
    const deltaY = this.endY - this.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > this.minDistance || absDeltaY > this.minDistance) {
      if (absDeltaX > absDeltaY) {
        if (deltaX > 0) {
          this.swipeRight = true;
        } else {
          this.swipeLeft = true;
        }
      } else {
        if (deltaY > 0 && !this.player_.inAir_) {
          this.swipeDown = true;
        } else if (!this.player_.inAir_) {
          this.swipeUp = true;
        }
      }
    }

  }


  //initialize the game
  _Initialize() {
    //speed variables
    this.speed_ = 0.2;
    this.box_ = "";
    this.objSpeed = 12;
    this.monSpeed = 52;
    this.speedz = 3;
    this.speedy = 12;
    this.buffspeed = false;
    this.animationId;
    this.startstage = false;

    // renderer
    this.threejs_ = new THREE.WebGLRenderer({
      powerPreference: "high-performance",
      antialias: true,
      alpha: false,
      precision: 'lowp',
    });
    this.threejs_.outputEncoding = THREE.sRGBEncoding;
    // this.threejs_.gammaFactor = 0.7;
    this.threejs_.shadowMap.enabled = false;
    this.threejs_.setPixelRatio(window.devicePixelRatio);
    this.threejs_.setSize(window.innerWidth, window.innerHeight);

    document.getElementById('container').appendChild(this.threejs_.domElement);
    window.addEventListener('orientationchange', () => {
      if (window.orientation === 0 || window.orientation === 180) {
        this.OnWindowResize_();
      } else if (window.orientation === 90 || window.orientation === -90) {
        this.OnWindowResize_();
      } else {
        this.OnWindowResize_();

      }
    });

    window.addEventListener('resize', () => {
      this.OnWindowResize_();
    }, false);


    //camera
    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 10000;


    // Define the shake parameters
    this.shakeIntensity = 0.2; // The maximum displacement amount
    this.shakeDuration = 0.5; // The duration of the shake in seconds
    this.shakeTime = 0; // The current time of the shake effect
    this.shakeInterval = 0; // The interval timer for the shake effect


    this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);

    this.camera_.position.set(this.cameraX, this.cameraY, this.cameraZ);
    this.camera_.lookAt(0, this.cameraY, 0);




    //scene
    this.scene_ = new THREE.Scene();

    this.beamTexture = new THREE.TextureLoader()

    let light = new THREE.DirectionalLight(0xffffff, 1);

    this.scene_.add(light);

    light = new THREE.HemisphereLight(0x202020, 0x004080, 1.5);
    this.scene_.add(light);

    light = new THREE.PointLight(0xb6bfcc, 1.5, 200, 4);
    light.position.set(-7, 20, 0);
    this.scene_.add(light);

    this.scene_.background = new THREE.Color(0x808080);
    // this.scene_.fog = new THREE.FogExp2(0x89b2eb, 0.00125);

    //load map
    const loader = new GLTFLoader();
    loader.setPath('./resources/Map/Stage1/');
    loader.load('stg1_A.gltf', (gltf) => {
      this.mesh = gltf.scene;

      gltf.castShadow = true;
      gltf.receiveShadow = true;
      this.mesh.position.set(-10, 0, 0);
      this.mesh.rotation.set(0, -Math.PI / 2, 0);
      this.mesh.scale.setScalar(0.01);
      this.scene_.add(this.mesh);

    });

    loader.load('stg1_B.gltf', (gltf) => {
      this.mesh1 = gltf.scene;

      gltf.castShadow = true;
      gltf.receiveShadow = true;
      this.mesh1.position.set(200, 0, 0);
      this.mesh1.rotation.set(0, -Math.PI / 2, 0);
      this.mesh1.scale.setScalar(0.01);


      this.scene_.add(this.mesh1);

    });
    loader.load('stg1_B.gltf', (gltf) => {
      this.mesh2 = gltf.scene;

      gltf.castShadow = true;
      gltf.receiveShadow = true;
      this.mesh2.position.set(410, 0, 0);
      this.mesh2.rotation.set(0, -Math.PI / 2, 0);
      this.mesh2.scale.setScalar(0.01);


      this.scene_.add(this.mesh2);

    });
    loader.load('stg1_exit.gltf', (gltf) => {
      this.mesh3 = gltf.scene;
      this.mesh3.position.set(620, 0, 0);
      this.mesh3.rotation.set(0, -Math.PI / 2, 0);
      this.mesh3.scale.setScalar(0.01);

      // this.mesh3.traverse((object) => {
      //   if (object.name === "stg1_exit_GEOShape_13") {
      //     object.material.opacity = 1;
      //     object.material.map = this.beamTexture.load('./resources/Map/Stage1/stg1_beam_reverse_color.jpg');
      //   }
      // });

      this.scene_.add(this.mesh3);
    });

    loader.load('stg1_gloomsky.gltf', (gltf) => {
      this.mesh4 = gltf.scene;
      this.mesh4.position.set(1100, 0, 0);
      this.mesh4.rotation.set(0, Math.PI / 2, 0);
      this.mesh4.scale.setScalar(0.04);

      this.mesh4.traverse(n => {
        if (n.isMesh) {
          n.material.opacity = 0.8;
          n.material.transparent = true;
        }
      });

      this.scene_.add(this.mesh4);

    });

    //pause DOM elements
    var pauseButton = document.getElementById("pauseButton");
    var volumeButton = document.getElementById("volumeButton");
    var muteButton = document.getElementById("muteButton");
    var quitButton = document.getElementById("quitBtn");
    var restartButton = document.getElementById("restartBtn");
    var continueButton = document.getElementById("continueBtn");
    var retryStage3 = document.getElementById("retry-stage-3");
    var continueEnding = document.getElementById("continue-ending");
    var nextEnding = document.getElementById("final-score-next");
    var nextRestart = document.getElementById("final-score-restart");
    var loading1Next = document.getElementById('loading1-next')
    var loading2Next = document.getElementById('loading2-next')
    var loading3Next = document.getElementById('loading3-next')

    var nextButtonCounter = 0;
    var loading1nextButtonCounter = 0;
    var loading2nextButtonCounter = 0;
    var loading3nextButtonCounter = 0;

    // Add event listeners to the buttons
    loading1Next.addEventListener("click", () => {
      loading1Next.style.display = 'none'

      if (loading1nextButtonCounter == 0) {
        document.getElementById('stage1-intro1').style.display = 'none'
        document.getElementById('stage1-intro2').style.display = 'block'
        loading1nextButtonCounter++

        var textElement = document.getElementById('stage1-intro2-text1')

        textElement.textContent = '';
        var textToType = "YOU'LL HAVE TO OUTRUN THOSE PESKY GLYKONOS WHO ARE GONNA TRY AND CATCH YOU!";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(function () {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            clearInterval(intervalId);
            document.getElementById('loading1-next').style.display = 'block';
          }
        }, typingSpeed);
      } else if (loading1nextButtonCounter == 1) {
        loading1nextButtonCounter++
        document.getElementById('stage1-intro2').style.display = 'none'
        document.getElementById('stage1-intro3').style.display = 'block'


        var textElement = document.getElementById('stage1-intro3-text1')

        textElement.textContent = '';
        var textToType = "TO PROTECT YOURSELVES AND SAVE YOUR FRIENDS YOU MUST FIRST RETRIEVE THE NUTRI-SHEILD. IT'LL BE A DANGEROUS JOURNEY BUT I THINK YOU HAVE WHAT IT TAKES!";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(function () {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            clearInterval(intervalId);
            document.getElementById('loading1-next').style.display = 'block';
          }
        }, typingSpeed);

      } else if (loading1nextButtonCounter == 2) {
        loading1nextButtonCounter++
        document.getElementById('stage1-intro3').style.display = 'none'
        document.getElementById('stage1-intro4').style.display = 'block'


        var textElement = document.getElementById('stage1-intro4-text1')
        var textElement1 = document.getElementById('stage1-intro4-text2')

        textElement.textContent = '';
        textElement1.textContent = '';

        var textToType = "• USE THE [ARROW KEYS] TO MOVE LEFT AND RIGHT AND AVOID OBSTACLES!";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(function () {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            clearInterval(intervalId);
            i = 0;
            textToType = "• PRESS [SPACEBAR] TO JUMP!"
            intervalId = setInterval(function () {
              textElement1.textContent += textToType.charAt(i);
              i++;
              if (i >= textToType.length) {
                clearInterval(intervalId);
                document.getElementById('loading1-next').style.display = 'block';

              }
            }, typingSpeed);
          }
        }, typingSpeed);

      } else if (loading1nextButtonCounter == 3) {
        loading1nextButtonCounter++
        document.getElementById('stage1-intro4').style.display = 'none'
        document.getElementById('stage1-intro5').style.display = 'block'


        var textElement = document.getElementById('stage1-intro5-text1')

        textElement.textContent = '';

        var textToType = "WATER IS ALWAYS THE BEST CHOICE SO AVOID SWEETENED BEVERAGES!";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(function () {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            clearInterval(intervalId);
            document.getElementById('loading1-next').style.display = 'block';
          }
        }, typingSpeed);

      } else if (loading1nextButtonCounter == 4) {
        loading1nextButtonCounter++
        document.getElementById('stage1-intro5').style.display = 'none'
        document.getElementById('stage1-recap').style.display = 'block'


        var textElement = document.getElementById('stage1-recap-text1')
        var textElement1 = document.getElementById('stage1-recap-text2')
        var textElement2 = document.getElementById('stage1-recap-text3')
        var textElement3 = document.getElementById('stage1-recap-text4')

        textElement.textContent = '';
        textElement1.textContent = '';
        textElement2.textContent = '';
        textElement3.textContent = '';

        var textToType = "• REMEMBER WATER IS ALWAYS THE BEST CHOICE SO AVOID SWEETENED BEVERAGES!";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(() => {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            clearInterval(intervalId);
            i = 0;
            textToType = "• FILL YOUR WATER BOTTLES UP FROM SCHOOL WATER COOLERS."
            intervalId = setInterval(() => {
              textElement1.textContent += textToType.charAt(i);
              i++;
              if (i >= textToType.length) {
                clearInterval(intervalId);
                i = 0;
                textToType = "• IF YOU ARE PURCHASING DRINKS, CHOOSE BEVERAGES WHICH HAVE BEEN GRADED A OR B ONLY."
                intervalId = setInterval(() => {
                  textElement2.textContent += textToType.charAt(i);
                  i++;
                  if (i >= textToType.length) {
                    clearInterval(intervalId);
                    i = 0;
                    textToType = "•  HYDRATE YOURSELF WITH AT LEAST 8 GLASSES EVERYDAY!"
                    intervalId = setInterval(() => {
                      textElement3.textContent += textToType.charAt(i);
                      i++;
                      if (i >= textToType.length) {
                        clearInterval(intervalId);
                        document.getElementById('click-start').style.display = 'block';
                        document.getElementById('loading-bar-container').style.display = 'none';
                        document.getElementById('loading-text-stage-1').style.display = 'none';

                        this.allowStart = true;
                        loading1nextButtonCounter = 0
                        i = 0;
                      }
                    }, typingSpeed);
                  }
                }, typingSpeed);
              }
            }, typingSpeed);
          }
        }, typingSpeed);
      }

    });

    loading2Next.addEventListener("click", () => {
      loading2Next.style.display = 'none'
      if (loading2nextButtonCounter == 0) {
        loading2nextButtonCounter++
        document.getElementById('stage2-intro1').style.display = 'none'
        document.getElementById('stage2-intro2').style.display = 'block'


        var textElement = document.getElementById('stage2-intro2-text1')

        textElement.textContent = '';
        var textToType = "TO ACTIVATE THE PORTAL TO GO BACK TO EARTH, YOU NEED TO GET THE PORTAL KEY INSIDE THIS GLYKOS DUNGEON.";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(function () {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            clearInterval(intervalId);
            document.getElementById('loading2-next').style.display = 'block';
          }
        }, typingSpeed);
      } else if (loading2nextButtonCounter == 1) {
        loading2nextButtonCounter++
        document.getElementById('stage2-intro2').style.display = 'none'
        document.getElementById('stage2-intro3').style.display = 'block'

        var textElement = document.getElementById('stage2-intro3-text1')
        var textElement1 = document.getElementById('stage2-intro3-text2')
        var textElement2 = document.getElementById('stage2-intro3-text3')

        textElement.textContent = '';
        textElement1.textContent = '';
        textElement2.textContent = '';

        var textToType = "BUT BE CAREFUL, THE FLYING GLYKONOS LIVE HERE.";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(function () {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            i = 0;
            textToType = "PRESS [DOWN ARROW] TO SLIDE AND AVOID THEIR ATTACKS."
            clearInterval(intervalId);
            intervalId = setInterval(function () {
              textElement1.textContent += textToType.charAt(i);
              i++;
              if (i >= textToType.length) {
                i = 0;
                textToType = "GOOD LUCK!"
                clearInterval(intervalId);
                intervalId = setInterval(function () {
                  textElement2.textContent += textToType.charAt(i);
                  i++;
                  if (i >= textToType.length) {
                    clearInterval(intervalId);
                    document.getElementById('loading2-next').style.display = 'block';
                  }
                }, typingSpeed);
              }
            }, typingSpeed);
          }
        }, typingSpeed);
      } else if (loading2nextButtonCounter == 2) {
        loading2nextButtonCounter++
        document.getElementById('stage2-intro3').style.display = 'none'
        document.getElementById('stage2-intro4').style.display = 'block'

        var textElement = document.getElementById('stage2-intro4-text1')
        var textElement1 = document.getElementById('stage2-intro4-text2')

        textElement.textContent = '';
        textElement1.textContent = '';

        var textToType = "• FILL YOUR PLATE WITH QUARTER-QUARTER HALF; WHOLEGRAINS, MEAT & OTHERS, FRUIT AND VEGETABLES.";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(function () {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            i = 0;
            textToType = "• GO FOR 2 SERVINGS OF FRUIT AND 2 SERVINGS OF VEGETABLES EVERYDAY!"
            clearInterval(intervalId);
            intervalId = setInterval(function () {
              textElement1.textContent += textToType.charAt(i);
              i++;
              if (i >= textToType.length) {
                clearInterval(intervalId);
                document.getElementById('loading2-next').style.display = 'block';
              }
            }, typingSpeed);
          }
        }, typingSpeed);
      } else if (loading2nextButtonCounter == 3) {
        loading2nextButtonCounter++
        document.getElementById('stage2-intro4').style.display = 'none'
        document.getElementById('stage2-intro5').style.display = 'block'

        var textElement = document.getElementById('stage2-intro5-text1')
        var textElement1 = document.getElementById('stage2-intro5-text2')

        textElement.textContent = '';
        textElement1.textContent = '';

        var textToType = "• CHOOSE FRESH OVER PROCESSED OR PRESERVED FOOD AND AVOID FRIED FOOD.";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(function () {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            i = 0;
            textToType = "• TAKE TIME TO CHEW YOUR FOOD WHEN EATING AND AVOID ANY DISTRACTIONS LIKE SCREEN TIME. THIS ALLOWS FOR YOUR FOOD TO DIGEST BETTER."
            clearInterval(intervalId);
            intervalId = setInterval(function () {
              textElement1.textContent += textToType.charAt(i);
              i++;
              if (i >= textToType.length) {
                clearInterval(intervalId);
                loading2nextButtonCounter = 0;
                i = 0
                document.getElementById('click-start').style.display = 'block';
                document.getElementById('loading-bar-container-2').style.display = 'none';
                document.getElementById('loading-text-stage-2').style.display = 'none';
                document.querySelector('.wrapper').style.display = 'block';
                document.getElementById('shieldContainer').style.display = 'block';
              }
            }, typingSpeed);
          }
        }, typingSpeed);
      }
    });


    loading3Next.addEventListener("click", () => {
      loading3Next.style.display = 'none'

      if (loading3nextButtonCounter == 0) {
        document.getElementById('stage3-intro1').style.display = 'none'
        document.getElementById('stage3-intro2').style.display = 'block'
        loading3nextButtonCounter++

        var textElement = document.getElementById('stage3-intro2-text1')

        textElement.textContent = '';
        var textToType = "PICK THE CORRECT HEALTHIER CHOICE SYMBOL TO FREE YOUR TRAPPED FRIENDS WITH A HEALTHY MEAL BEFORE ACTIVATING THE PORTAL AND GOING BACK HOME!";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(function () {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            clearInterval(intervalId);
            document.getElementById('loading3-next').style.display = 'block';
          }
        }, typingSpeed);
      } else if (loading3nextButtonCounter == 1) {
        loading3nextButtonCounter++
        document.getElementById('stage3-intro2').style.display = 'none'
        document.getElementById('stage3-intro3').style.display = 'block'


        var textElement = document.getElementById('stage3-intro3-text1')
        var textElement1 = document.getElementById('stage3-intro3-text2')
        var textElement2 = document.getElementById('stage3-intro3-text3')
        var textElement3 = document.getElementById('stage3-intro3-text4')

        textElement.textContent = '';
        textElement1.textContent = '';
        textElement2.textContent = '';
        textElement3.textContent = '';

        var textToType = "CHOOSE FOOD WITH HEALTHIER CHOICE SYMBOL (HCS)";
        var typingSpeed = 10;
        var i = 0;
        var intervalId = setInterval(function () {
          textElement.textContent += textToType.charAt(i);
          i++;
          if (i >= textToType.length) {
            clearInterval(intervalId);
            i = 0
            textToType = '• FOOD WITH HCS ARE HEALTHIER THAN OTHER FOOD IN THE SAME CATEGORY E.G. BISCUITS WITH HCS CAN BE HEATHLIER THAN BISCUITS WITHOUT HCS.';
            intervalId = setInterval(function () {
              textElement1.textContent += textToType.charAt(i);
              i++;

              if (i >= textToType.length) {
                i = 0
                clearInterval(intervalId);
                textToType = '• EXERCISE VARIETY, BALANCE AND MODERATION WHEN EATING HCS PRODUCTS AND DO NOT OVER-EAT.';

                intervalId = setInterval(function () {
                  textElement2.textContent += textToType.charAt(i);
                  i++;

                  if (i >= textToType.length) {
                    i = 0
                    clearInterval(intervalId);
                    textToType = '• WHEN EATING OUT WITH YOUR FAMILIES, CHOOSE FOOD ITEMS WITH HCS';

                    intervalId = setInterval(function () {
                      textElement3.textContent += textToType.charAt(i);
                      i++;

                      if (i >= textToType.length) {
                        clearInterval(intervalId);
                        document.getElementById("rescuedContainer").style.display = 'block';
                        document.getElementById('click-start').style.display = 'block';
                        document.getElementById('loading-bar-container-3').style.display = 'none';
                        document.getElementById('loading-text-stage-3').style.display = 'none';
                        loading3nextButtonCounter = 0;
                        i = 0;
                      }
                    }, typingSpeed);
                  }
                }, typingSpeed);
              }
            }, typingSpeed);
          }
        }, typingSpeed);

      }
    });

    retryStage3.addEventListener("click", () => {
      this.playNextStageVideo3()
      this.nextStageVideo3_.currentTime = this.nextStageVideo3_.duration;
      this.eventAdded1 = false;
      this.NotFirstTry = true;

      document.getElementById("food1").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food2").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food3").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food4").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById('loading3-next').style.display = 'none';
      document.getElementById('stage3-intro1').style.display = 'none'
      document.getElementById('stage3-intro2').style.display = 'none'
      document.getElementById('stage3-intro3').style.display = 'none'
      document.getElementById("food1").style.bottom = "7.5vw"
      document.getElementById("food2").style.bottom = "7.5vw"
      document.getElementById("food3").style.bottom = "7.5vw"
      document.getElementById("food4").style.bottom = "7.5vw"
      if (this.gender_ == "male") {
        document.getElementById('boyHUDstg3').style.display = 'block'
      } else if (this.gender_ == "female") {
        document.getElementById('girlHUDstg3').style.display = 'block'
      }
      document.getElementById('final-score-bad-ending').classList.toggle('active');
      this.checkRestart = false;
    });

    continueEnding.addEventListener("click", () => {
      retryStage3.style.display = "none"
      continueEnding.style.display = "none"

      if (this.player_.friendsSaved == 9) {
        document.getElementById("final-score-badges").src = " ./resources/Well_Done/Well_Done_Shield badges_3 of 3 complete.png"
      } else if (this.player_.friendsSaved >= 6) {
        document.getElementById("final-score-badges").src = " ./resources/Well_Done/Well_Done_Shield badges_2 of 3 complete.png"
      } else if (this.player_.friendsSaved >= 3) {
        document.getElementById("final-score-badges").src = " ./resources/Well_Done/Well_Done_Shield badges_1 of 3 complete.png"
      } else {
        document.getElementById("final-score-badges").src = " ./resources/Well_Done/Well_Done_Shield badges_0 of 3 complete.png"
      }
      document.getElementById('final-score').classList.toggle('active');

    });

    nextEnding.addEventListener("click", () => {
      document.getElementById("well-done-text").style.display = "none"
      document.getElementById("final-score-badges").style.display = "none"

      if (nextButtonCounter == 0) {
        nextButtonCounter = 1
        document.getElementById("final-score-recap-1").style.display = "block"
      } else {
        document.getElementById("final-score-recap-1").style.display = "none"

        document.getElementById("final-score-recap-2").style.display = "block"
        nextEnding.style.display = "none"
        nextRestart.style.display = "block"

      }

    });

    nextRestart.addEventListener("click", () => {
      location.reload();
    });


    // Add event listeners to the buttons
    restartButton.addEventListener("click", () => {
      this.stopTime = false
      this.RAF_()

      this.restartStage = true;
    });

    // Add event listeners to the buttons
    continueButton.addEventListener("click", () => {
      if (this.allowPause) {
        if (this.isPaused) {
          startPauseCountdown()
        }
      }
    });

    // Add event listeners to the buttons
    quitButton.addEventListener("click", () => {
      location.reload(true);

    });


    // Add event listeners to the buttons
    pauseButton.addEventListener("click", () => {
      if (this.allowPause) {
        if (!this.isPaused) {
          startPause()
        }
      }
    });

    // Add event listeners to the buttons
    volumeButton.addEventListener("click", () => {
      const mediaElements = document.querySelectorAll('video, audio');

      // Loop through each element and set its volume to 0
      mediaElements.forEach(element => {
        element.volume = 0;
      });
        
        
        volumeButton.style.display = 'none'
        muteButton.style.display = 'block'



    });

    // Add event listeners to the buttons
    muteButton.addEventListener("click", () => {
      const mediaElements = document.querySelectorAll('video, audio');

      // Loop through each element and set its volume to 0
      mediaElements.forEach(element => {
        element.volume = 1;
      });
        
        volumeButton.style.display = 'block'
        muteButton.style.display = 'none'
  
     

    });


    //key down event listener
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if (this.allowPause && !this.isPaused) {
          if (this.isPaused && !this.pauseCountdownActive) {
            startPauseCountdown()
          } else if (!this.pauseCountdownActive) {
            startPause()

          }
        }
      }
    });

    //pause the game
    const startPause = () => {
      this.objSpeed = 0
      this.monSpeed = 0
      this.speedy = 0
      this.speedz = 0
      this.stopTime = true;
      cancelAnimationFrame(this.animationId);
      this.isPaused = true;
      document.querySelector('#pauseDiv').style.display = 'block'
      pauseButton.style.display = 'none'
      volumeButton.style.display = 'none'

    }

    //count down after unpause
    const startPauseCountdown = () => {
      this.pauseCountdownActive = true
      document.querySelector('#pauseDiv').style.display = 'none'
      document.getElementById('countdown').classList.toggle('active');
      this.intervalId_ = setInterval(() => {
        this.resumeCountdown_--;
        document.getElementById('power-countdown-text').textContent = this.resumeCountdown_;
        if (this.resumeCountdown_ === 0) {
          this.animationId = requestAnimationFrame(animate);
          this.objSpeed = 12
          this.monSpeed = 52
          this.speedy = 12
          this.speedz = 3
          this.stopTime = false;
          this.RAF_()
          this.isPaused = false;

          pauseButton.style.display = 'block'
          volumeButton.style.display = 'block'


          clearInterval(this.intervalId_);
          document.getElementById('countdown').classList.toggle('active');

          // Start another countdown
          document.getElementById('power-countdown-text').textContent = 3;
          this.resumeCountdown_ = 3;
          this.pauseCountdownActive = false



        }
      }, 1000)
    }

    //detect alt tabs
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        if (this.allowPause && !this.pauseCountdownActive) {
          startPause()
        }
      }
    });


    //handle "click to continue" after game is won for IOS devices
    document.getElementById('click-end').addEventListener('click', () => {
      if (this.stage == 2) {
        document.getElementById('click-end').style.display = 'none';
        this.playNextStageVideo2()
      } else if (this.stage == 3) {
        document.getElementById('click-end').style.display = 'none';
        this.playNextStageVideo3()
      } else if (this.stage == 4) {
        document.getElementById('click-end').style.display = 'none';
        if (this.player_.friendsSaved >= 6) {
          this.playVictoryVid()
        } else {
          this.playDefeatVid()
        }
      }

    });

    //handle "click to continue" after video has ended and stage has loaded
    document.getElementById('click-start').addEventListener('click', () => {
      if (this.startstage) {
        if (this.stage == 1) {
          this.stage1Music.play()
          document.getElementById('loading-button-container').style.display = 'none';
          document.getElementById('loading-1').style.display = 'none';
        } else if (this.stage == 2) {
          this.stage2Music.play()
          this.RAF_();
          document.getElementById('loading-2').style.display = 'none';
          document.getElementById('loading-button-container').style.display = 'none';
        } else if (this.stage == 3) {
          this.stage3Music.play()
          this.RAF_();
          document.getElementById('loading-3').style.display = 'none';
          document.getElementById('loading-button-container').style.display = 'none';
        }
        this.stopTime = false;
        this.animationId = requestAnimationFrame(animate);
        this.objSpeed = 12
        this.monSpeed = 52
        this.speedy = 12
        this.speedz = 3
        this.isPaused = false;
        this.startstage = false;
        this.allowPause = true;
        pauseButton.style.display = 'block'
        this.player_.position_.z = 0
        document.getElementById('click-start').style.display = 'none';

      } else if (this.startGame && !this.checkStartGame) {
        this.stopTime = false;
        this.RAF_()
        this.checkStartGame = true;
        this._OnStart()
        this.allowPause = true;
        document.getElementById('stage1-recap').style.display = 'none'
        document.getElementById('stage1-intro1').style.display = 'none'
        document.getElementById('stage1-intro2').style.display = 'none'
        document.getElementById('stage1-intro3').style.display = 'none'
        document.getElementById('stage1-intro4').style.display = 'none'
        document.getElementById('stage1-intro5').style.display = 'none'
        document.getElementById('loading-1').style.display = 'none';
        document.getElementById('click-start').style.display = 'none';

      }

    });


    document.addEventListener('keydown', () => {
      if (this.startstage) {
        if (this.stage == 1) {
          this.stage1Music.play()
          document.getElementById('loading-button-container').style.display = 'none';
          document.getElementById('loading-1').style.display = 'none';
        } else if (this.stage == 2) {
          this.stage2Music.play()
          document.getElementById('loading-2').style.display = 'none';
          document.getElementById('loading-button-container').style.display = 'none';
        } else if (this.stage == 3) {
          this.stage3Music.play()
          document.getElementById('loading-3').style.display = 'none';
          document.getElementById('loading-button-container').style.display = 'none';
        }
        this.stopTime = false;
        this.RAF_();
        this.animationId = requestAnimationFrame(animate);
        this.objSpeed = 12
        this.monSpeed = 52
        this.speedy = 12
        this.speedz = 3
        this.isPaused = false;
        this.startstage = false;
        this.allowPause = true;
        pauseButton.style.display = 'block'
        this.player_.position_.z = 0
        document.getElementById('click-start').style.display = 'none';
      } else if (this.startGame && !this.checkStartGame) {
        if (this.allowStart) {
          this.stopTime = false;
          this.RAF_()
          this.checkStartGame = true;
          this._OnStart()
          this.allowPause = true;
          pauseButton.style.display = 'block'
          document.getElementById('stage1-recap').style.display = 'none'
          document.getElementById('stage1-intro1').style.display = 'none'
          document.getElementById('stage1-intro2').style.display = 'none'
          document.getElementById('stage1-intro3').style.display = 'none'
          document.getElementById('stage1-intro4').style.display = 'none'
          document.getElementById('stage1-intro5').style.display = 'none'
          document.getElementById('loading-1').style.display = 'none';
          document.getElementById('click-start').style.display = 'none';
        }
      }
    });



    //handle map position 
    const animate = () => {

      if (this._gameStarted && !this.isPaused) {
        const speed = this.speed_
        this.mesh.position.x -= speed;
        this.mesh1.position.x -= speed;
        this.mesh2.position.x -= speed;
        this.mesh3.position.x -= speed;
        if (this.mesh4) {
          this.mesh4.position.x -= speed;
        }

      }
      this.animationId = requestAnimationFrame(animate);

    }

    animate();





    // set random positoin for drinks
    let arrDrinks1 = [];
    let arrDrinks2 = [];
    let arrDrinks3 = [];

    for (let i = 0; i < 6; i++) {
      let value1 = Math.floor(Math.random() * 3) - 1;
      let value2 = Math.floor(Math.random() * 3) - 1;
      let value3 = Math.floor(Math.random() * 3) - 1;

      while (value1 === value2) {
        value2 = Math.floor(Math.random() * 3) - 1;
      }

      while (value1 === value3 || value2 === value3) {
        value3 = Math.floor(Math.random() * 3) - 1;
      }

      arrDrinks1.push(value1 * 3);
      arrDrinks2.push(value2 * 3);
      arrDrinks3.push(value3 * 3);
    }


    // set random positoin for box logos
    let arrLogo1 = [];
    let arrLogo2 = [];
    let arrLogo3 = [];

    for (let i = 0; i < 5; i++) {
      let value1 = Math.floor(Math.random() * 3) - 1;
      let value2 = Math.floor(Math.random() * 3) - 1;
      let value3 = Math.floor(Math.random() * 3) - 1;

      while (value1 === value2) {
        value2 = Math.floor(Math.random() * 3) - 1;
      }

      while (value1 === value3 || value2 === value3) {
        value3 = Math.floor(Math.random() * 3) - 1;
      }

      arrLogo1.push(value1 * 3);
      arrLogo2.push(value2 * 3);
      arrLogo3.push(value3 * 3);
    }

    //set random position for food
    let food1 = [];
    let food2 = [];
    let food3 = [];

    for (let i = 0; i < 4; i++) {
      let value1 = Math.floor(Math.random() * 3) - 1;
      let value2 = Math.floor(Math.random() * 3) - 1;
      let value3 = Math.floor(Math.random() * 3) - 1;

      while (value1 === value2) {
        value2 = Math.floor(Math.random() * 3) - 1;
      }

      while (value1 === value3 || value2 === value3) {
        value3 = Math.floor(Math.random() * 3) - 1;
      }

      food1.push(value1 * 3);
      food2.push(value2 * 3);
      food3.push(value3 * 3);
    }


    //initiate all the game objects
    this.shoogaGlider_ = new shoogaGlider.ShoogaGliderManager({ scene: this.scene_ });
    this.trolliumChloride_ = new trolliumChloride.TrolliumChlorideManager({ scene: this.scene_ });
    this.pitfall_ = new pitfall.PitfallManager({ scene: this.scene_, firstChase: this.showChase, stage: this.stage });
    this.wallrun_ = new wallrun.WallManager({ scene: this.scene_ });
    this.water_ = new water.DrinksManager({ scene: this.scene_, position: arrDrinks1, firstChase: this.showChase });
    this.waterGrade_ = new waterGrade.DrinksManager({ scene: this.scene_, position: arrDrinks1, firstChase: this.showChase });
    this.soda_ = new soda.DrinksManager({ scene: this.scene_, position: arrDrinks2, firstChase: this.showChase });
    this.sodaGrade_ = new sodaGrade.DrinksManager({ scene: this.scene_, position: arrDrinks2, firstChase: this.showChase });
    this.fruitDrink_ = new fruitDrink.DrinksManager({ scene: this.scene_, position: arrDrinks3, firstChase: this.showChase });
    this.fruitDrinkGrade_ = new fruitDrinkGrade.DrinksManager({ scene: this.scene_, position: arrDrinks3, firstChase: this.showChase });
    this.stage1sky_ = new stg1sky.Sky({ scene: this.scene_ });
    this.hpbLogo_ = new hpbLogo.BoxManager({ scene: this.scene_, position: arrLogo1 });
    this.hpbWrongLogo1_ = new hpbWrongLogo1.BoxManager({ scene: this.scene_, position: arrLogo2 });
    this.hpbWrongLogo2_ = new hpbWrongLogo2.BoxManager({ scene: this.scene_, position: arrLogo3 });
    this.carbs_ = new carbs.FoodManager({ scene: this.scene_, position: food1 });
    this.meat_ = new meat.FoodManager({ scene: this.scene_, position: food2 });
    this.vege_ = new vege.FoodManager({ scene: this.scene_, position: food3 });
    this.oilSlik_ = new oilSlik.OilSlik({ scene: this.scene_, stage: this.stage, firstChase: this.showChase });
    this.cloud_ = new cloud.Cloud({ scene: this.scene_ });
    this.progression_ = new progression.ProgressionManager();

    //final variables 
    this.gameOver_ = false;
    this.previousRAF_ = null;
    this.RAF_();
    this.OnWindowResize_();
  }

  //pause all moving objects
  Pause() {
    this.objSpeed = 0
    this.monSpeed = 0
    this.speedy = 0
    this.speedz = 0
    cancelAnimationFrame(this.animationId);
    this.isPaused = true;
  }

  shakeCamera() {
    clearInterval(this.shakeInterval); // Clear any existing shake interval
    this.shakeTime = 0; // Reset the shake time
    this.shakeInterval = setInterval(() => {
      this.shakeTime += 0.01; // Increase the shake time by a small amount
      var shakeX = (Math.sin(this.shakeTime * 50) * this.shakeIntensity) - 10; // Calculate the X displacement
      var shakeY = (Math.sin(this.shakeTime * 80) * this.shakeIntensity) + 5; // Calculate the Y displacement
      this.camera_.position.set(shakeX, shakeY, 0); // Apply the displacement to the camera position
      if (this.shakeTime >= this.shakeDuration) { // Stop the shake effect after the duration has elapsed
        clearInterval(this.shakeInterval);
        this.camera_.position.set(-10, 5, 0); // Reset the camera position
        this.player_.playerHit = false;
        this.checkHit = false;

      }
    }, 20);
  }

  //handle window resize to maintain aspect ratio
  OnWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();
    this.threejs_.setSize(window.innerWidth, window.innerHeight);
  }

  //start the animation 
  RAF_() {
    requestAnimationFrame((t) => {

      if (!this.stopTime) {
        if (this.previousRAF_ === null) {
          this.previousRAF_ = t;
        }

        if ((t - this.previousRAF_ > 200)) {
          this.previousRAF_ = t
        }
        this.RAF_();
        this.Step_((t - this.previousRAF_) / 1000.0, this.isPaused);
        this.threejs_.render(this.scene_, this.camera_);
        this.previousRAF_ = t;
      }
    });


  }


  //what the animation does

  Step_(timeElapsed, pause) {
    //pan the camera
    if (this.showChase && this._gameStarted) {
      if (this.cameraX > -10) {
        this.cameraX = this.cameraX - 0.1
      }
      if (this.cameraY > 5) {
        this.cameraY = this.cameraY - 0.02

      }
      if (this.cameraZ < 0) {
        this.cameraZ = this.cameraZ + 0.04

      }
      if (this.cameraZ > -3) {
        this.oilSlik_.mesh_.scale.set(0.2, 0.2, 0.2)
      }

      if (this.cameraX <= -10 && this.cameraY <= 5 && this.cameraZ >= 0) {
        pauseButton.style.display = 'block'
        this.showChase = false;
      }
      this.camera_.lookAt(0, 2, 0)

      this.camera_.position.set(this.cameraX, this.cameraY, this.cameraZ);

    }

    //if he loses stage 1
    if (!this.eventAdded3 && this.stage == 1) {
      document.addEventListener('score-over', () => {
        this.nextStageVideo1_.addEventListener("ended", () => {
          this.showChase = false;
          this.gameOver_ = true;
          this.failedStage = false;
          this.NotFirstTry = false;
          this.allowPause = false;
          this.stopTime = true
          this.Pause()

          this.intervalId_ = setInterval(() => {
            this.countdown_--;
            if (this.scene_.children.length === 0) {

              // set randon positoin for drinks
              let arrDrinks1 = [];
              let arrDrinks2 = [];
              let arrDrinks3 = [];

              for (let i = 0; i < 6; i++) {
                let value1 = Math.floor(Math.random() * 3) - 1;
                let value2 = Math.floor(Math.random() * 3) - 1;
                let value3 = Math.floor(Math.random() * 3) - 1;

                while (value1 === value2) {
                  value2 = Math.floor(Math.random() * 3) - 1;
                }

                while (value1 === value3 || value2 === value3) {
                  value3 = Math.floor(Math.random() * 3) - 1;
                }

                arrDrinks1.push(value1 * 3);
                arrDrinks2.push(value2 * 3);
                arrDrinks3.push(value3 * 3);
              }


              // set randonm positoin for box logos
              let arrLogo1 = [];
              let arrLogo2 = [];
              let arrLogo3 = [];

              for (let i = 0; i < 5; i++) {
                let value1 = Math.floor(Math.random() * 3) - 1;
                let value2 = Math.floor(Math.random() * 3) - 1;
                let value3 = Math.floor(Math.random() * 3) - 1;

                while (value1 === value2) {
                  value2 = Math.floor(Math.random() * 3) - 1;
                }

                while (value1 === value3 || value2 === value3) {
                  value3 = Math.floor(Math.random() * 3) - 1;
                }

                arrLogo1.push(value1 * 3);
                arrLogo2.push(value2 * 3);
                arrLogo3.push(value3 * 3);
              }

              // set randonm position for box logos
              let food1 = [];
              let food2 = [];
              let food3 = [];

              for (let i = 0; i < 4; i++) {
                let value1 = Math.floor(Math.random() * 3) - 1;
                let value2 = Math.floor(Math.random() * 3) - 1;
                let value3 = Math.floor(Math.random() * 3) - 1;

                while (value1 === value2) {
                  value2 = Math.floor(Math.random() * 3) - 1;
                }

                while (value1 === value3 || value2 === value3) {
                  value3 = Math.floor(Math.random() * 3) - 1;
                }

                food1.push(value1 * 3);
                food2.push(value2 * 3);
                food3.push(value3 * 3);
              }


              //initiate all the game objects
              this.pitfall_ = new pitfall.PitfallManager({ scene: this.scene_, firstChase: this.showChase, stage: this.stage });
              this.water_ = new water.DrinksManager({ scene: this.scene_, position: arrDrinks1, firstChase: this.showChase });
              this.waterGrade_ = new waterGrade.DrinksManager({ scene: this.scene_, position: arrDrinks1, firstChase: this.showChase });
              this.soda_ = new soda.DrinksManager({ scene: this.scene_, position: arrDrinks2, firstChase: this.showChase });
              this.sodaGrade_ = new sodaGrade.DrinksManager({ scene: this.scene_, position: arrDrinks2, firstChase: this.showChase });
              this.fruitDrink_ = new fruitDrink.DrinksManager({ scene: this.scene_, position: arrDrinks3, firstChase: this.showChase });
              this.fruitDrinkGrade_ = new fruitDrinkGrade.DrinksManager({ scene: this.scene_, position: arrDrinks3, firstChase: this.showChase });
              this.stage1sky_ = new stg1sky.Sky({ scene: this.scene_ });
              this.oilSlik_ = new oilSlik.OilSlik({ scene: this.scene_, stage: this.stage, firstChase: this.showChase });
              this.cloud_ = new cloud.Cloud({ scene: this.scene_ });
              this.progression_ = new progression.ProgressionManager();
              this.player_ = new player.Player({ gender: this.gender_, scene: this.scene_, stage: this.stage, water: this.water_, waterGrade: this.waterGrade_, soda: this.soda_, sodaGrade: this.sodaGrade_, fruitDrink: this.fruitDrink_, fruitDrinkGrade: this.fruitDrinkGrade_, pitfall: this.pitfall_, trolliumChloride: this.trolliumChloride_, shoogaGlider: this.shoogaGlider_, box1: this.hpbLogo_, box2: this.hpbWrongLogo1_, box3: this.hpbWrongLogo2_, meat: this.meat_, carbs: this.carbs_, vege: this.vege_ });


              let light = new THREE.DirectionalLight(0xffffff, 1);

              this.scene_.add(light);

              light = new THREE.HemisphereLight(0x202020, 0x004080, 1.5);
              this.scene_.add(light);

              light = new THREE.PointLight(0xb6bfcc, 1.5, 200, 4);
              light.position.set(-7, 20, 0);
              this.scene_.add(light);

              // this.scene_.background = new THREE.Color(0x808080);
              // this.scene_.fog = new THREE.FogExp2(0x89b2eb, 0.00125);

              //load map
              const loader = new GLTFLoader();
              loader.setPath('./resources/Map/Stage1/');
              loader.load('stg1_A.gltf', (gltf) => {
                this.mesh = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh.position.set(-5, 0, 0);
                this.mesh.rotation.set(0, -Math.PI / 2, 0);
                this.mesh.scale.setScalar(0.01);
                this.scene_.add(this.mesh);

              });

              loader.load('stg1_B.gltf', (gltf) => {
                this.mesh1 = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh1.position.set(192, 0, 0);
                this.mesh1.rotation.set(0, -Math.PI / 2, 0);
                this.mesh1.scale.setScalar(0.01);


                this.scene_.add(this.mesh1);

              });
              loader.load('stg1_B.gltf', (gltf) => {
                this.mesh2 = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh2.position.set(389, 0, 0);
                this.mesh2.rotation.set(0, -Math.PI / 2, 0);
                this.mesh2.scale.setScalar(0.01);


                this.scene_.add(this.mesh2);

              });
              loader.load('stg1_exit.gltf', (gltf) => {
                this.mesh3 = gltf.scene;
                this.mesh3.position.set(620, 0, 0);
                this.mesh3.rotation.set(0, -Math.PI / 2, 0);
                this.mesh3.scale.setScalar(0.01);

                // this.mesh3.traverse((object) => {
                //   if (object.name === "stg1_exit_GEOShape_13") {
                //     object.material.opacity = 1;
                //     object.material.map = this.beamTexture.load('./resources/Map/Stage1/stg1_beam_reverse_color.jpg');
                //   }
                // });

                this.scene_.add(this.mesh3);
              });

              loader.load('stg1_gloomsky.gltf', (gltf) => {
                this.mesh4 = gltf.scene;
                this.mesh4.position.set(1100, 0, 0);
                this.mesh4.rotation.set(0, Math.PI / 2, 0);
                this.mesh4.scale.setScalar(0.04);

                this.mesh4.traverse(n => {
                  if (n.isMesh) {
                    n.material.opacity = 0.8;
                    n.material.transparent = true;
                  }
                });

                this.scene_.add(this.mesh4);
              })


              // const uniforms = {
              //   topColor: { value: new THREE.Color(0x0c1445) },
              //   bottomColor: { value: new THREE.Color(0x89b2eb) },
              //   offset: { value: 33 },
              //   exponent: { value: 0.6 }
              // };

              // const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
              // const skyMat = new THREE.ShaderMaterial({
              //   uniforms: uniforms,
              //   vertexShader: _VS,
              //   fragmentShader: _FS,
              //   side: THREE.BackSide,
              // });


              // this.scene_.add(new THREE.Mesh(skyGeo, skyMat));


              this.gameOver_ = false;
              this.stopTime = false;
              this.RAF_();
            } else if (this.countdown_ === 0) {
              if (this.scene_.children.length < 74) {
                this.countdown_ = 3
              }
            }
          }, 1000);

          const progressBar = document.getElementById('loading-bar-stage-1');
          var loadingProgress = 0

          var loadingInterval = setInterval(() => {
            if (loadingProgress < 74) {
              console.log(this.scene_.children.length)
              const progressPercentage = (loadingProgress / 74) * 100;
              progressBar.style.width = `${progressPercentage}%`;
              loadingProgress = this.scene_.children.length;
            } else {
              clearInterval(loadingInterval)
              progressBar.style.width = `100%`;
              this.previousRAF_ = null;
              this.startstage = true;
              this.Pause();
              clearInterval(this.intervalId_);
              document.getElementById('loading-bar-container').style.display = 'none';
              document.getElementById('loading-text-stage-1').style.display = 'none';
              document.getElementById('click-start').style.display = 'block';
            }

          }, 100);


        })
      })
      this.eventAdded3 = true;
    }

    //stage 1 won
    if (!this.eventAdded && this.stage == 1) {
      document.addEventListener('score-over1', () => {
        this.stage1Music.pause()
        this.showChase = false;
        this.gameOver_ = true;
        this.failedStage = false;
        this.NotFirstTry = false;
        this.allowPause = false;
        this.stopTime = true
        this.Pause()
        this.stage = 2;

        if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) {
          document.getElementById('click-end').style.display = 'block';
        } else {
          this.playNextStageVideo2()
        }

        this.player_.getStamina(result => {
          this.totalStamina = this.totalStamina + result
        });

        this.nextStageVideo2_.addEventListener("ended", () => {
          this.intervalId_ = setInterval(() => {
            this.countdown1_--;
            if (this.scene_.children.length === 0) {

              // set randon positoin for drinks
              let arrDrinks1 = [];
              let arrDrinks2 = [];
              let arrDrinks3 = [];

              for (let i = 0; i < 6; i++) {
                let value1 = Math.floor(Math.random() * 3) - 1;
                let value2 = Math.floor(Math.random() * 3) - 1;
                let value3 = Math.floor(Math.random() * 3) - 1;

                while (value1 === value2) {
                  value2 = Math.floor(Math.random() * 3) - 1;
                }

                while (value1 === value3 || value2 === value3) {
                  value3 = Math.floor(Math.random() * 3) - 1;
                }

                arrDrinks1.push(value1 * 3);
                arrDrinks2.push(value2 * 3);
                arrDrinks3.push(value3 * 3);
              }



              // set randonm position for food
              let food1 = [];
              let food2 = [];
              let food3 = [];

              for (let i = 0; i < 6; i++) {
                let value1 = Math.floor(Math.random() * 3) - 1;
                let value2 = Math.floor(Math.random() * 3) - 1;
                let value3 = Math.floor(Math.random() * 3) - 1;

                while (value1 === value2) {
                  value2 = Math.floor(Math.random() * 3) - 1;
                }

                while (value1 === value3 || value2 === value3) {
                  value3 = Math.floor(Math.random() * 3) - 1;
                }

                food1.push(value1 * 3);
                food2.push(value2 * 3);
                food3.push(value3 * 3);
              }


              //initiate all the game objects
              this.shoogaGlider_ = new shoogaGlider.ShoogaGliderManager({ scene: this.scene_ });
              this.trolliumChloride_ = new trolliumChloride.TrolliumChlorideManager({ scene: this.scene_ });
              this.pitfall_ = new pitfall.PitfallManager({ scene: this.scene_, stage: this.stage });
              this.water_ = new water.DrinksManager({ scene: this.scene_, position: arrDrinks1 })
              this.soda_ = new soda.DrinksManager({ scene: this.scene_, position: arrDrinks2 })
              this.fruitDrink_ = new fruitDrink.DrinksManager({ scene: this.scene_, position: arrDrinks3 })
              this.sodaGrade_ = new sodaGrade.DrinksManager({ scene: this.scene_, position: arrDrinks2, firstChase: this.showChase });
              this.fruitDrinkGrade_ = new fruitDrinkGrade.DrinksManager({ scene: this.scene_, position: arrDrinks3, firstChase: this.showChase });
              this.waterGrade_ = new waterGrade.DrinksManager({ scene: this.scene_, position: arrDrinks1, firstChase: this.showChase });
              this.carbs_ = new carbs.FoodManager({ scene: this.scene_, position: food1 })
              this.meat_ = new meat.FoodManager({ scene: this.scene_, position: food2 })
              this.vege_ = new vege.FoodManager({ scene: this.scene_, position: food3 })
              this.player_ = new player.Player({ gender: this.gender_, scene: this.scene_, stage: this.stage, water: this.water_, waterGrade: this.waterGrade_, soda: this.soda_, sodaGrade: this.sodaGrade_, fruitDrink: this.fruitDrink_, fruitDrinkGrade: this.fruitDrinkGrade_, pitfall: this.pitfall_, trolliumChloride: this.trolliumChloride_, shoogaGlider: this.shoogaGlider_, box1: this.hpbLogo_, box2: this.hpbWrongLogo1_, box3: this.hpbWrongLogo2_, meat: this.meat_, carbs: this.carbs_, vege: this.vege_ });
              this.oilSlik_ = new oilSlik.OilSlik({ scene: this.scene_, stage: this.stage });
              this.progression_ = new progression.ProgressionManager();



              let light = new THREE.DirectionalLight(0xffffff, 1);

              this.scene_.add(light);

              light = new THREE.HemisphereLight(0x202020, 0x004080, 1.5);
              this.scene_.add(light);

              light = new THREE.PointLight(0xb6bfcc, 1.5, 200, 4);
              light.position.set(-7, 20, 0);
              this.scene_.add(light);

              this.scene_.background = new THREE.Color(0x808080);
              this.scene_.fog = new THREE.FogExp2(0x89b2eb, 0.00125);

              const loader = new GLTFLoader();
              loader.setPath('./resources/Map/Stage2/');
              loader.load('stg2_A.gltf', (gltf) => {
                this.mesh = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh.position.set(-5, 0, 0);
                this.mesh.rotation.set(0, -Math.PI / 2, 0);
                this.mesh.scale.setScalar(0.01);


                this.scene_.add(this.mesh);

              });
              loader.load('stg2_A.gltf', (gltf) => {
                this.mesh1 = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh1.position.set(205.2, 0, 0);
                this.mesh1.rotation.set(0, -Math.PI / 2, 0);
                this.mesh1.scale.setScalar(0.01);


                this.scene_.add(this.mesh1);

              });
              loader.load('stg2_B.gltf', (gltf) => {
                this.mesh2 = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh2.position.set(415, 0, 0);
                this.mesh2.rotation.set(0, -Math.PI / 2, 0);
                this.mesh2.scale.setScalar(0.01);


                this.scene_.add(this.mesh2);

              });
              loader.load('stg2_C.gltf', (gltf) => {
                this.mesh3 = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh3.position.set(625, 0, 0);
                this.mesh3.rotation.set(0, -Math.PI / 2, 0);
                this.mesh3.scale.setScalar(0.01);


                this.scene_.add(this.mesh3);

              });
              loader.load('stg2_exit.gltf', (gltf) => {
                this.mesh4 = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh4.position.set(727, 0, 0);
                this.mesh4.rotation.set(0, -Math.PI / 2, 0);
                this.mesh4.scale.setScalar(0.01);


                this.scene_.add(this.mesh4);

              });

              this.gameOver_ = false;
              this.stopTime = false;
              this.RAF_();
            } else if (this.countdown1_ === 0) {
              if (this.scene_.children.length < 72) {
                this.countdown1_ = 3
              }
            }
          }, 1000);

          const progressBar = document.getElementById('loading-bar-stage-2');
          var loadingProgress = 0

          var loadingInterval = setInterval(() => {
            if (loadingProgress < 72) {
              console.log(this.scene_.children.length)
              const progressPercentage = (loadingProgress / 72) * 100;
              progressBar.style.width = `${progressPercentage}%`;
              loadingProgress = this.scene_.children.length;
            } else {
              clearInterval(loadingInterval)
              progressBar.style.width = `100%`;
              this.stopTime = true
              this.previousRAF_ = null;
              this.startstage = true;
              this.Pause();
              clearInterval(this.intervalId_);

              this.player_.propArray = []
              if (this.NotFirstTry) {
                document.getElementById('loading-bar-container-2').style.display = 'none';
                document.getElementById('loading-text-stage-2').style.display = 'none';
                document.getElementById('click-start').style.display = 'block';
              }
            }

          }, 100);

        })

      });
      this.eventAdded = true;

    }

    //stage 2 won
    if (!this.eventAdded1 && this.stage == 2) {

      document.addEventListener('score-over2', () => {
        this.stage2Music.pause()
        this.gameOver_ = true;
        this.failedStage = false;
        this.stopTime = true
        this.allowPause = false;
        this.Pause()
        this.NotFirstTry = false;
        pauseButton.style.display = 'none'
        document.getElementById("food1").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
        document.getElementById("food2").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
        document.getElementById("food3").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
        document.getElementById("food4").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
        this.stage = 3;

        if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) {
          document.getElementById('click-end').style.display = 'block';
        } else {
          this.playNextStageVideo3()
        }

        this.player_.getStamina(result => {
          this.totalStamina = this.totalStamina + result
        });

        this.nextStageVideo3_.addEventListener("ended", () => {
          this.intervalId_ = setInterval(() => {
            this.countdown2_--;
            if (this.scene_.children.length === 0) {

              // set randon position for drinks
              let arrDrinks1 = [];
              let arrDrinks2 = [];
              let arrDrinks3 = [];

              for (let i = 0; i < 6; i++) {
                let value1 = Math.floor(Math.random() * 3) - 1;
                let value2 = Math.floor(Math.random() * 3) - 1;
                let value3 = Math.floor(Math.random() * 3) - 1;

                while (value1 === value2) {
                  value2 = Math.floor(Math.random() * 3) - 1;
                }

                while (value1 === value3 || value2 === value3) {
                  value3 = Math.floor(Math.random() * 3) - 1;
                }

                arrDrinks1.push(value1 * 3);
                arrDrinks2.push(value2 * 3);
                arrDrinks3.push(value3 * 3);
              }


              // set randonm positoin for box logos
              let arrLogo1 = [];
              let arrLogo2 = [];
              let arrLogo3 = [];

              for (let i = 0; i < 5; i++) {
                let value11 = Math.floor(Math.random() * 3) - 1;
                let value22 = Math.floor(Math.random() * 3) - 1;
                let value33 = Math.floor(Math.random() * 3) - 1;

                while (value11 === value22) {
                  value22 = Math.floor(Math.random() * 3) - 1;
                }

                while (value11 === value33 || value22 === value33) {
                  value33 = Math.floor(Math.random() * 3) - 1;
                }

                arrLogo1.push(value11 * 3);
                arrLogo2.push(value22 * 3);
                arrLogo3.push(value33 * 3);
              }

              // set randonm position for food
              let food1 = [];
              let food2 = [];
              let food3 = [];

              for (let i = 0; i < 6; i++) {
                let value111 = Math.floor(Math.random() * 3) - 1;
                let value222 = Math.floor(Math.random() * 3) - 1;
                let value333 = Math.floor(Math.random() * 3) - 1;

                while (value111 === value222) {
                  value222 = Math.floor(Math.random() * 3) - 1;
                }

                while (value111 === value333 || value222 === value333) {
                  value333 = Math.floor(Math.random() * 3) - 1;
                }

                food1.push(value111 * 3);
                food2.push(value222 * 3);
                food3.push(value333 * 3);
              }


              //initiate all the game objects
              this.shoogaGlider_ = new shoogaGlider.ShoogaGliderManager({ scene: this.scene_ });
              this.trolliumChloride_ = new trolliumChloride.TrolliumChlorideManager({ scene: this.scene_ });
              this.pitfall_ = new pitfall.PitfallManager({ scene: this.scene_, stage: this.stage });
              this.water_ = new water.DrinksManager({ scene: this.scene_, position: arrDrinks1 })
              this.soda_ = new soda.DrinksManager({ scene: this.scene_, position: arrDrinks2 })
              this.fruitDrink_ = new fruitDrink.DrinksManager({ scene: this.scene_, position: arrDrinks3 })
              this.hpbLogo_ = new hpbLogo.BoxManager({ scene: this.scene_, position: arrLogo1 })
              this.sodaGrade_ = new sodaGrade.DrinksManager({ scene: this.scene_, position: arrDrinks2, firstChase: this.showChase });
              this.fruitDrinkGrade_ = new fruitDrinkGrade.DrinksManager({ scene: this.scene_, position: arrDrinks3, firstChase: this.showChase });
              this.waterGrade_ = new waterGrade.DrinksManager({ scene: this.scene_, position: arrDrinks1, firstChase: this.showChase });
              this.hpbWrongLogo1_ = new hpbWrongLogo1.BoxManager({ scene: this.scene_, position: arrLogo2 })
              this.hpbWrongLogo2_ = new hpbWrongLogo2.BoxManager({ scene: this.scene_, position: arrLogo3 })
              this.carbs_ = new carbs.FoodManager({ scene: this.scene_, position: food1 })
              this.meat_ = new meat.FoodManager({ scene: this.scene_, position: food2 })
              this.vege_ = new vege.FoodManager({ scene: this.scene_, position: food3 })
              this.player_ = new player.Player({ gender: this.gender_, scene: this.scene_, stage: this.stage, water: this.water_, waterGrade: this.waterGrade_, soda: this.soda_, sodaGrade: this.sodaGrade_, fruitDrink: this.fruitDrink_, fruitDrinkGrade: this.fruitDrinkGrade_, pitfall: this.pitfall_, trolliumChloride: this.trolliumChloride_, shoogaGlider: this.shoogaGlider_, box1: this.hpbLogo_, box2: this.hpbWrongLogo1_, box3: this.hpbWrongLogo2_, meat: this.meat_, carbs: this.carbs_, vege: this.vege_ });
              this.oilSlik_ = new oilSlik.OilSlik({ scene: this.scene_, stage: this.stage });
              this.sky_ = new sky.Sky({ scene: this.scene_ });

              this.progression_ = new progression.ProgressionManager();
              this.wallrun_ = new wallrun.WallManager({ scene: this.scene_ });

              let light = new THREE.DirectionalLight(0xffffff, 1);

              this.scene_.add(light);

              light = new THREE.HemisphereLight(0x202020, 0x004080, 1.5);
              this.scene_.add(light);

              light = new THREE.PointLight(0xb6bfcc, 1.5, 200, 4);
              light.position.set(-7, 20, 0);
              this.scene_.add(light);

              this.scene_.background = new THREE.Color(0x3C6090);
              // this.scene_.fog = new THREE.FogExp2(0x89b2eb, 0.00125);

              const loader = new GLTFLoader();
              loader.setPath('./resources/Map/Stage3/');
              loader.load('stg3_Start.gltf', (gltf) => {
                this.mesh = gltf.scene;

                this.mesh.position.set(110, 0, -0.5);
                this.mesh.rotation.set(0, -Math.PI / 2, 0);
                this.mesh.scale.setScalar(0.01);


                this.scene_.add(this.mesh);

              });
              loader.load('stg3_D.gltf', (gltf) => {
                this.mesh1 = gltf.scene;

                this.mesh1.position.set(318, 0, -0.5);
                this.mesh1.rotation.set(0, -Math.PI / 2, 0);
                this.mesh1.scale.setScalar(0.01);


                this.scene_.add(this.mesh1);

              });
              loader.load('stg3_B.gltf', (gltf) => {
                this.mesh2 = gltf.scene;

                this.mesh2.position.set(526, 0, -0.5);
                this.mesh2.rotation.set(0, -Math.PI / 2, 0);
                this.mesh2.scale.setScalar(0.01);


                this.scene_.add(this.mesh2);

              });
              loader.load('stg3_B.gltf', (gltf) => {
                this.mesh3 = gltf.scene;

                this.mesh3.position.set(731, 0, -0.5);
                this.mesh3.rotation.set(0, -Math.PI / 2, 0);
                this.mesh3.scale.setScalar(0.01);


                this.scene_.add(this.mesh3);

              });
              loader.load('st3_exit.gltf', (gltf) => {
                this.mesh4 = gltf.scene.children[0];

                this.mesh4.position.set(833, 12, 5.5);
                this.mesh4.rotation.set(0, -Math.PI / 2, 0);
                this.mesh4.scale.setScalar(0.01);


                this.scene_.add(this.mesh4);

              });

              this.gameOver_ = false;
              this.stopTime = false;
              this.RAF_();
            } else if (this.countdown2_ === 0) {
              if (this.scene_.children.length < 65) {
                this.countdown2_ = 3
              }
            }
          }, 1000);


          const progressBar = document.getElementById('loading-bar-stage-3');
          var loadingProgress = 0

          var loadingInterval = setInterval(() => {
            if (loadingProgress < 89) {
              console.log(this.scene_.children.length)

              // Calculate the loading progress as a percentage of the maximum value
              const progressPercentage = (loadingProgress / 89) * 100;
              progressBar.style.width = `${progressPercentage}%`;
              loadingProgress = this.scene_.children.length;
            } else {
              clearInterval(loadingInterval)
              progressBar.style.width = `100%`;
              this.stopTime = true;
              this.previousRAF_ = null;
              this.startstage = true;
              this.Pause();
              this.player_.propArray = []
              if (this.NotFirstTry) {
                document.getElementById('loading-bar-container-3').style.display = 'none';
                document.getElementById('loading-text-stage-3').style.display = 'none';
                document.getElementById('click-start').style.display = 'block';
              }
              clearInterval(this.intervalId_);
              if (this.gender_ == "male") {
                document.getElementById('boyHUD').style.display = 'none'
                document.getElementById('boyHUDstg3').style.display = 'block'
              } else if (this.gender_ == "female") {
                document.getElementById('girlHUD').style.display = 'none'
                document.getElementById('girlHUDstg3').style.display = 'block'
              }
            }

          }, 50);


        })
      });
      this.eventAdded1 = true;

    }


    //if player wins stage 3
    if (!this.eventAdded2 && this.stage == 3) {
      document.addEventListener('score-over3', () => {
        this.stage3Music.pause()
        this.allowPause = false;
        this.gameOver_ = true;
        this.stopTime = true;
        pauseButton.style.display = 'none'
        this.player_.getStamina(result => {
          this.totalStamina = this.totalStamina + result
        });

        if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) {
          document.getElementById('click-end').style.display = 'block';
        } else {
          if (this.player_.friendsSaved >= 3) {
            this.playVictoryVid()
          } else {
            this.playDefeatVid()
          }
        }


      });
      this.eventAdded2 = true;
    }

    console.log(this.player_.propArray)
    //preload the game assets
    if (this.gameOver_ || !this._gameStarted) {

      if (!this.loaded) {
        this.water_.Update(timeElapsed, this.objSpeed)
        this.waterGrade_.Update(timeElapsed, this.objSpeed)
        this.soda_.Update(timeElapsed, this.objSpeed)
        this.sodaGrade_.Update(timeElapsed, this.objSpeed)
        this.fruitDrink_.Update(timeElapsed, this.objSpeed)
        this.fruitDrinkGrade_.Update(timeElapsed, this.objSpeed)
        this.pitfall_.Update(timeElapsed, this.objSpeed)
        this.cloud_.Update(timeElapsed);
        this.stage1sky_.Update()
        this.loaded = true;

      }
      return;
    }

    if (this._gameStarted) {
      //load the game assets and animations
      if (this.stage == 1) {
        this.water_.Update(timeElapsed, this.objSpeed)
        this.waterGrade_.Update(timeElapsed, this.objSpeed)
        this.fruitDrinkGrade_.Update(timeElapsed, this.objSpeed)
        this.sodaGrade_.Update(timeElapsed, this.objSpeed)
        this.soda_.Update(timeElapsed, this.objSpeed)
        this.fruitDrink_.Update(timeElapsed, this.objSpeed)
        this.pitfall_.Update(timeElapsed, this.objSpeed)
        this.cloud_.Update(timeElapsed);
        this.stage1sky_.Update()

      } else if (this.stage == 2) {
        this.water_.Update(timeElapsed, this.objSpeed)
        this.waterGrade_.Update(timeElapsed, this.objSpeed)
        this.fruitDrinkGrade_.Update(timeElapsed, this.objSpeed)
        this.sodaGrade_.Update(timeElapsed, this.objSpeed)
        this.soda_.Update(timeElapsed, this.objSpeed)
        this.fruitDrink_.Update(timeElapsed, this.objSpeed)
        this.pitfall_.Update(timeElapsed, this.objSpeed)
        this.shoogaGlider_.Update(timeElapsed, this.monSpeed, this.speedz, this.speedy);
        this.vege_.Update(timeElapsed, this.objSpeed)
        this.meat_.Update(timeElapsed, this.objSpeed)
        this.carbs_.Update(timeElapsed, this.objSpeed)
        this.trolliumChloride_.Update(timeElapsed, this.objSpeed)
      } else if (this.stage == 3) {
        this.wallrun_.Update(timeElapsed, this.objSpeed)
        this.waterGrade_.Update(timeElapsed, this.objSpeed)
        this.fruitDrinkGrade_.Update(timeElapsed, this.objSpeed)
        this.sodaGrade_.Update(timeElapsed, this.objSpeed)
        this.hpbLogo_.Update(timeElapsed, this.objSpeed)
        this.hpbWrongLogo1_.Update(timeElapsed, this.objSpeed)
        this.hpbWrongLogo2_.Update(timeElapsed, this.objSpeed)
        this.water_.Update(timeElapsed, this.objSpeed)
        this.soda_.Update(timeElapsed, this.objSpeed)
        this.fruitDrink_.Update(timeElapsed, this.objSpeed)
        this.pitfall_.Update(timeElapsed, this.objSpeed)
        this.shoogaGlider_.Update(timeElapsed, this.monSpeed, this.speedz, this.speedy);
        this.vege_.Update(timeElapsed, this.objSpeed)
        this.meat_.Update(timeElapsed, this.objSpeed)
        this.carbs_.Update(timeElapsed, this.objSpeed)
        this.sky_.Update();
        this.trolliumChloride_.Update(timeElapsed, this.objSpeed)
      }

      //get position of wall from wallrun.js
      this.wallrun_.GetPosition(result => {
        this.wallPosition = result
      });

      this.player_.Update(timeElapsed, pause, this.wallPosition, this.swipeLeft, this.swipeRight, this.showChase);
      this.oilSlik_.Update(timeElapsed, pause, this.showChase);
      this.progression_.Update(timeElapsed, pause, this.stage, this.gameOver_, this.buffspeed);


      //if player gets hit bruh 
      if (this.player_.playerHit == true && !this.checkHit) {
        this.checkHit = true;
        this.shakeCamera()
      }
      this.player_.getSpeed(result => {
        this.speed_ = result
        //if speed is not default, meaning the player has a speed buff/debuff
        if (this.speed_ != 0.2 && !pause) {
          this.objSpeed = 12 * (this.speed_ / 0.2)
          this.buffspeed = true;

        } else {
          this.buffspeed = false;

        }
      });

      //check if player collides with the pit
      this.player_.getPitCollide(result => {
        if (result) {
          setTimeout(() => {
            this.Pause()
            this.player_.position_.y = this.player_.position_.y - timeElapsed * 2
          }, 200);

        }
      });

      //check if player runs out of stamina
      this.player_.getCollapse(result => {
        if (result) {
          if (this.player_.position_.y > 0) {
            this.player_.position_.y = this.player_.position_.y - timeElapsed * 6

          }
          if (this.player_.position_.x < 3) {
            this.player_.position_.x = this.player_.position_.x + timeElapsed * 6

          }
          this.progression_.progress_ += timeElapsed * 20.0;

          const scoreText1 = (Math.round((this.progression_.progress_ * 10) / 10)).toLocaleString('en-US', { minimumIntegerDigits: 5, useGrouping: false }) / 60;

          document.getElementById('monster').style.left = scoreText1 + 'vw';
          this.objSpeed = 0
          this.monSpeed = 0
          this.speedy = 0
          this.speedz = 0
          this.isPaused = true
          setTimeout(() => {
            if (this.oilSlik_.mesh_.position.x < 0) {
              this.oilSlik_.mesh_.position.x += timeElapsed * 6
              this.oilSlik_.mesh_.scale.set(0.3, 0.3, 0.3)
            }
          }, 400);

        }
      });

      //check if player fails wall jump
      if (this.player_.wallFail) {
        setTimeout(() => {
          this.Pause()
          this.player_.position_.y = this.player_.position_.y - timeElapsed * 6
        }, 200);
      }


      //checks for swipe gestures
      if (!this.player_.collapse && !this.player_.pitCollide && !this.player_.wallFail) {

        if (this.swipeLeft) {
          if (!this.player_.onWall) {
            this.player_.SwipeLeft();
            this.isSwiping = true
          }

          if (this.player_.onWall) {
            if (this.player_.position_.z == -3) {
              this.swipeLeft = false;
              this.isSwiping = false;
            }
          } else {
            if (this.player_.position_.z == -3 || this.player_.position_.z == 0) {
              this.swipeLeft = false;
              this.isSwiping = false;
            }
          }
        }
        if (this.swipeRight) {
          if (!this.player_.onWall) {
            this.player_.SwipeRight();
            this.isSwiping = true
          }
          if (this.player_.onWall) {
            if (this.player_.position_.z == 3) {
              this.swipeRight = false;
              this.isSwiping = false;
            }
          } else {
            if (this.player_.position_.z == 3 || this.player_.position_.z == 0) {
              this.swipeRight = false;
              this.isSwiping = false;
            }
          }
        }
        if (this.swipeUp && !this.swipeDown) {
          this.player_.SwipeUp(timeElapsed);
          this.swipeUp = false;

        }
        if (this.swipeDown) {

          this.player_.SwipeDown(timeElapsed);
          this.swipeDown = false;

        }
      }
    }

    //restart stage
    if (this.restartStage && !this.checkRestart) {
      this.checkRestart = true;
      this.camera_.position.set(-10, 5, 0)
      this.allowPause = false;
      this.restartStage = false;
      this.gameOver_ = true;
      pauseButton.style.display = 'none'
      document.getElementById("shieldTimer").style.zIndex = "-1";
      document.querySelector('#pauseDiv').style.display = 'none'
      document.getElementById("food1").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food2").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food3").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food4").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food1").style.bottom = "7.5vw"
      document.getElementById("food2").style.bottom = "7.5vw"
      document.getElementById("food3").style.bottom = "7.5vw"
      document.getElementById("food4").style.bottom = "7.5vw"
      document.getElementById('video-container').style.backgroundColor = 'transparent';
      document.getElementById('loading-button-container').style.display = 'block';

      if (this.stage == 2) {
        this.playNextStageVideo2();
        this.eventAdded = false;
        this.countdown1_ = 6;
        this.checkRestart = false;
        this.NotFirstTry = true;
        document.getElementById('loading2-next').style.display = 'none';
        document.getElementById('stage2-intro1').style.display = 'none'
        document.getElementById('stage2-intro2').style.display = 'none'
        document.getElementById('stage2-intro3').style.display = 'none'
        document.getElementById('stage2-intro4').style.display = 'none'
        document.getElementById('stage2-intro5').style.display = 'none'
      } else if (this.stage == 3 || this.stage == 4) {
        this.playNextStageVideo3();
        this.eventAdded1 = false;
        this.countdown2_ = 6;
        this.checkRestart = false;
        this.NotFirstTry = true;
        document.getElementById('loading3-next').style.display = 'none';
        document.getElementById('stage3-intro1').style.display = 'none'
        document.getElementById('stage3-intro2').style.display = 'none'
        document.getElementById('stage3-intro3').style.display = 'none'
      } else if (this.stage == 1) {
        this.playNextStageVideo1();
        this.eventAdded3 = false;
        this.countdown_ = 6;
        this.checkRestart = false;
        document.getElementById('loading1-next').style.display = 'none';
        document.getElementById('stage1-recap').style.display = 'none'
        document.getElementById('stage1-intro1').style.display = 'none'
        document.getElementById('stage1-intro2').style.display = 'none'
        document.getElementById('stage1-intro3').style.display = 'none'
        document.getElementById('stage1-intro4').style.display = 'none'
        document.getElementById('stage1-intro5').style.display = 'none'
      }

      this.stopTime = true
      this.Pause()
    }

    //if game is over (lost)
    if (this._gameStarted && this.player_.gameOver && !this.gameOver_) {
      this.showChase = false;
      this.allowPause = false;
      this.gameOver_ = true;
      this.failedStage = true;
      this.resumeCountdown_ = 3;
      pauseButton.style.display = 'none'

      document.getElementById("shieldTimer").style.zIndex = "-1";
      document.getElementById('game-over').classList.toggle('active');
      document.getElementById("food1").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food2").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food3").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food4").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      document.getElementById("food1").style.bottom = "7.5vw"
      document.getElementById("food2").style.bottom = "7.5vw"
      document.getElementById("food3").style.bottom = "7.5vw"
      document.getElementById("food4").style.bottom = "7.5vw"
      document.getElementById('video-container').style.backgroundColor = 'transparent';

      document.getElementById('try-again-button').addEventListener('click', () => {

        document.getElementById('game-over').classList.remove('active');
        document.getElementById('loading-button-container').style.display = 'block';

        if (this.stage == 2) {
          this.playNextStageVideo2();
          this.eventAdded = false;
          this.countdown1_ = 6;
          this.NotFirstTry = true;
          document.getElementById('loading2-next').style.display = 'none';
          document.getElementById('stage2-intro1').style.display = 'none'
          document.getElementById('stage2-intro2').style.display = 'none'
          document.getElementById('stage2-intro3').style.display = 'none'
          document.getElementById('stage2-intro4').style.display = 'none'
          document.getElementById('stage2-intro5').style.display = 'none'
        } else if (this.stage == 3) {
          this.playNextStageVideo3();
          this.eventAdded1 = false;
          this.countdown2_ = 6;
          this.NotFirstTry = true;
          document.getElementById('loading3-next').style.display = 'none';
          document.getElementById('stage3-intro1').style.display = 'none'
          document.getElementById('stage3-intro2').style.display = 'none'
          document.getElementById('stage3-intro3').style.display = 'none'
        } else if (this.stage == 1) {
          this.playNextStageVideo1();
          this.eventAdded3 = false;
          this.countdown_ = 6;
          this.NotFirstTry = true;
          document.getElementById('loading1-next').style.display = 'none';
          document.getElementById('stage1-recap').style.display = 'none'
          document.getElementById('stage1-intro1').style.display = 'none'
          document.getElementById('stage1-intro2').style.display = 'none'
          document.getElementById('stage1-intro3').style.display = 'none'
          document.getElementById('stage1-intro4').style.display = 'none'
          document.getElementById('stage1-intro5').style.display = 'none'
        }

        this.stopTime = true
        this.Pause()
      });

    }
  }
}

//fps stats
var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

function animate() {
  stats.begin();
  // monitored code goes here
  stats.end();
  requestAnimationFrame(animate);

}

requestAnimationFrame(animate);

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new BasicWorldDemo();

});


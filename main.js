import * as THREE from './node_modules/three/build/three.module.js';
import Stats from './node_modules/stats.js/src/Stats.js'
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";

// import * as THREE from 'https://storage.googleapis.com/sproud-hpb/node_modules/three/build/three.module.js';
// import { GLTFLoader } from "https://storage.googleapis.com/sproud-hpb/node_modules/three/examples/jsm/loaders/GLTFLoader.js";


import { player } from './world_objects/player.js';
import { shoogaGlider } from './world_objects/monster/shoogaGlider.js';
import { trolliumChloride } from './world_objects/monster/trolliumChloride.js';
import { pitfall } from './world_objects/obstacle/pitfall.js';
import { wallrun } from './world_objects/obstacle/wallrun.js';

import { background } from './world_objects/background.js';
import { progression } from './world_objects/progression.js';
import { water } from './world_objects/drinks/water.js';
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
    this.powerCountdown_ = false;
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

    //on load music 
    // this.menuMusic = document.getElementById("menu-music");
    // this._playMenuMusic();
    // document.addEventListener('DOMContentLoaded', () => {
    //   this._playMenuMusic();

    // });
    


    //handle gender selection
    document.getElementById('start-button').addEventListener('click', () => {

      document.getElementById('gender-selection').style.display = 'block';

    });

    //handle start game (male)
    document.getElementById('male-button').addEventListener('click', () => {
      this.playNextStageVideo1()
      document.getElementById('video-container').style.display = 'block';
      document.getElementById('gender-selection').style.display = 'none';
      this.gender_ = "male"
      this.player_ = new player.Player({ gender: this.gender_, scene: this.scene_, water: this.water_, soda: this.soda_, fruitDrink: this.fruitDrink_, pitfall: this.pitfall_, trolliumChloride: this.trolliumChloride_, shoogaGlider: this.shoogaGlider_, box1: this.hpbLogo_, box2: this.hpbWrongLogo1_, box3: this.hpbWrongLogo2_, meat: this.meat_, carbs: this.carbs_, vege: this.vege_ });

    });

    //handle start game (female)
    document.getElementById('female-button').addEventListener('click', () => {
      this.playNextStageVideo1()
      document.getElementById('video-container').style.display = 'block';
      document.getElementById('gender-selection').style.display = 'none';
      this.gender_ = "female"
      this.player_ = new player.Player({ gender: this.gender_, scene: this.scene_, water: this.water_, soda: this.soda_, fruitDrink: this.fruitDrink_, pitfall: this.pitfall_, trolliumChloride: this.trolliumChloride_, shoogaGlider: this.shoogaGlider_, box1: this.hpbLogo_, box2: this.hpbWrongLogo1_, box3: this.hpbWrongLogo2_, meat: this.meat_, carbs: this.carbs_, vege: this.vege_ });

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

    //power up 
    this.playedVideo_ = false;
    this.powerupVideo_ = document.getElementById("powerup");
    this.powerdownVideo_ = document.getElementById("powerdown");
    this.videoContainer = document.getElementById("video-container");


    //next stage cut scenes
    this.nextStageVideo1_ = document.getElementById("nextStage1");
    this.nextStageVideo2_ = document.getElementById("nextStage2");
    this.nextStageVideo3_ = document.getElementById("nextStage3");
    this.nextStageVideo4_ = document.getElementById("nextStage4");



    // if next stage video ends, then unpause everything
    this.nextStageVideo1_.addEventListener("ended", () => {
      if (this.firstLoad) {
        this.firstLoad = false;
        this.closeNextStageVideo1();
        document.getElementById('loading-1').style.display = 'block';
        this.stopTime = false
        document.getElementById('game-menu').style.display = 'none';
        // 
        this.RAF_()

        let newCountdown = 7;
        let newIntervalId = setInterval(() => {
          newCountdown--;
          if (newCountdown === 0) {
            if (this.scene_.children.length >= 56) {
              clearInterval(newIntervalId);
              this.startGame = true;
              document.getElementById('loading-1').style.display = 'none';
              document.getElementById('click-start').style.display = 'block';


              document.dispatchEvent(new CustomEvent('score-over'));
            } else {
              newCountdown = 3
            }

          }
        }, 1000);



      } else {
        this.closeNextStageVideo1();

        document.getElementById('loading-1').style.display = 'block';

        while (this.scene_.children.length > 0) {
          this.scene_.remove(this.scene_.children[0]);
        }

      }
    });

    // if next stage video ends, then unpause everything
    this.nextStageVideo2_.addEventListener("ended", () => {
      this.closeNextStageVideo2();

      document.getElementById('loading-2').style.display = 'block';

      while (this.scene_.children.length > 0) {
        this.scene_.remove(this.scene_.children[0]);
      }

    });

    // if next stage video ends, then unpause everything
    this.nextStageVideo3_.addEventListener("ended", () => {
      this.closeNextStageVideo3();

      document.getElementById('loading-3').style.display = 'block';


      while (this.scene_.children.length > 0) {
        this.scene_.remove(this.scene_.children[0]);
      }

    });

    // if next stage video ends, then unpause everything
    this.nextStageVideo4_.addEventListener("ended", () => {
      this.closeNextStageVideo4();

      document.getElementById('score').textContent = Math.ceil(this.totalStamina * 1) / 1;
      this.stopTime = false

      this.RAF_();
      document.getElementById('final-score').classList.toggle('active');

      while (this.scene_.children.length > 0) {
        this.scene_.remove(this.scene_.children[0]);
      }

    });
  }



  //HPB boxes video handler functions
  playPowerupVideo() {
    this.powerupVideo_.style.display = "block";
    this.powerupVideo_.play();
  }

  closePowerupVideo() {
    this.powerupVideo_.style.display = "none";
    this.powerupVideo_.currentTime = 0;
  }

  playPowerdownVideo() {
    this.powerdownVideo_.style.display = "block";
    this.powerdownVideo_.play();
  }

  closePowerdownVideo() {
    this.powerdownVideo_.style.display = "none";
    this.powerdownVideo_.currentTime = 0;
  }

  //stage 1 cutscene
  playNextStageVideo1() {
    this.nextStageVideo1_.style.display = "block";
    this.nextStageVideo1_.play();
  }

  closeNextStageVideo1() {
    this.nextStageVideo1_.style.display = "none";
    this.nextStageVideo1_.currentTime = 0;
    this.nextStageVideo1_.pause();
  }


  //stage 2 cutscene
  playNextStageVideo2() {
    this.nextStageVideo2_.style.display = "block";
    if (this.nextStageVideo2_.paused) {
      this.nextStageVideo2_.play()
      console.log('Video is no tplaying.');

      if (/iPad|iPhone|iPod/.test(navigator.platform)) {
        // code to execute if the platform is iOS
        console.log("This device is running iOS.");
      } else {
        // code to execute if the platform is not iOS
        console.log("This device is not running iOS.");
      }
    } else {
      console.log('Video is playing.');
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
    this.nextStageVideo3_.play();
  }

  closeNextStageVideo3() {
    this.nextStageVideo3_.style.display = "none";
    this.nextStageVideo3_.currentTime = 0;
    this.nextStageVideo3_.pause();
  }


  //victory videos
  playVictoryVid() {
    this.nextStageVideo4_.style.display = "block";
    this.nextStageVideo4_.play();
  }

  closeNextStageVideo4() {
    this.nextStageVideo4_.style.display = "none";
    this.nextStageVideo4_.currentTime = 0;
    this.nextStageVideo4_.pause();
  }
  //music player
  _playMenuMusic() {
    // this.menuMusic.play();
  }

  //start the game
  _OnStart() {
    // this.menuMusic.pause();
    this._gameStarted = true;
    var gameMusic = document.getElementById("game-music");
    gameMusic.play();
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
        if (deltaY > 0) {
          this.swipeDown = true;
        } else {
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
    this.animationId;
    this.startstage = false;

    // renderer
    this.threejs_ = new THREE.WebGLRenderer({
      antialias: true,
    });

    this.threejs_.outputEncoding = THREE.sRGBEncoding;
    this.threejs_.gammaFactor = 0.1;
    this.threejs_.shadowMap.enabled = true;
    this.threejs_.setPixelRatio(window.devicePixelRatio);
    this.threejs_.setSize(window.innerWidth, window.innerHeight);

    document.getElementById('container').appendChild(this.threejs_.domElement);

    window.addEventListener('resize', () => {
      this.OnWindowResize_();
    }, false);


    //camera
    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1300;

    this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);

    this.camera_.position.set(this.cameraX, this.cameraY, this.cameraZ);
    this.camera_.lookAt(0, this.cameraY, 0);

    //scene
    this.scene_ = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xffffff, 1);

    this.scene_.add(light);

    light = new THREE.HemisphereLight(0x202020, 0x004080, 1.5);
    this.scene_.add(light);

    light = new THREE.PointLight(0xb6bfcc, 1.5, 200, 4);
    light.position.set(-7, 20, 0);
    this.scene_.add(light);

    this.scene_.background = new THREE.Color(0x808080);
    this.scene_.fog = new THREE.FogExp2(0x89b2eb, 0.00125);

    //load map
    const loader = new GLTFLoader();
    loader.setPath('./resources/Map/Stage1/');
    loader.load('stage1a.gltf', (gltf) => {
      this.mesh = gltf.scene;

      gltf.castShadow = true;
      gltf.receiveShadow = true;
      this.mesh.position.set(-5, 0, -0.5);
      this.mesh.rotation.set(0, -Math.PI / 2, 0);
      this.mesh.scale.setScalar(0.0095);


      this.scene_.add(this.mesh);

    });
    loader.setPath('./resources/Map/Stage1/');
    loader.load('stage1b.gltf', (gltf) => {
      this.mesh1 = gltf.scene;

      gltf.castShadow = true;
      gltf.receiveShadow = true;
      this.mesh1.position.set(192, 0, -0.5);
      this.mesh1.rotation.set(0, -Math.PI / 2, 0);
      this.mesh1.scale.setScalar(0.0095);


      this.scene_.add(this.mesh1);

    });
    loader.load('stage1b.gltf', (gltf) => {
      this.mesh2 = gltf.scene;

      gltf.castShadow = true;
      gltf.receiveShadow = true;
      this.mesh2.position.set(389, 0, -0.5);
      this.mesh2.rotation.set(0, -Math.PI / 2, 0);
      this.mesh2.scale.setScalar(0.0095);


      this.scene_.add(this.mesh2);

    });
    loader.load('stage1a.gltf', (gltf) => {
      this.mesh3 = gltf.scene;

      gltf.castShadow = true;
      gltf.receiveShadow = true;
      this.mesh3.position.set(581, 0, -0.5);
      this.mesh3.rotation.set(0, -Math.PI / 2, 0);
      this.mesh3.scale.setScalar(0.0095);


      this.scene_.add(this.mesh3);

    });
    loader.load('stage1b.gltf', (gltf) => {
      this.mesh4 = gltf.scene;

      gltf.castShadow = true;
      gltf.receiveShadow = true;
      this.mesh4.position.set(773, 0, -0.5);
      this.mesh4.rotation.set(0, -Math.PI / 2, 0);
      this.mesh4.scale.setScalar(0.0095);


      this.scene_.add(this.mesh4);

    });

    //pause DOM elements
    var playButton = document.getElementById("playButton");
    var pauseButton = document.getElementById("pauseButton");
    var quitButton = document.getElementById("quitBtn");
    var restartButton = document.getElementById("restartBtn");
    var continueButton = document.getElementById("continueBtn");
    var optionsButton = document.getElementById("optionsBtn");

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
    playButton.addEventListener("click", () => {
      if (this.allowPause) {
        if (this.isPaused) {
          startPauseCountdown()
        }
      }
    });

    // Add event listeners to the buttons
    pauseButton.addEventListener("click", () => {
      if (this.allowPause) {
        if (!this.isPaused) {
          startPause()
        }
      }
    });

    //key down event listener
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if (this.allowPause) {
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
      document.querySelector('#video-container').style.backgroundColor = 'rgba(128, 128, 128, 0.5) '
      document.querySelector('#pauseDiv').style.display = 'block'
      playButton.style.display = 'block'
      pauseButton.style.display = 'none'
    }

    //count down after power up video has been played
    const startPauseCountdown = () => {
      this.pauseCountdownActive = true
      playButton.style.display = 'none'
      document.querySelector('#video-container').style.backgroundColor = 'transparent'
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

          playButton.style.display = 'none'
          pauseButton.style.display = 'block'

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

    //handle second stage "click to continue"
    document.getElementById('click-start').addEventListener('click', () => {
      if (this.startstage) {
        this.animationId = requestAnimationFrame(animate);

        this.objSpeed = 12
        this.monSpeed = 52
        this.speedy = 12
        this.speedz = 3
        this.isPaused = false;
        document.getElementById('click-start').style.display = 'none';
        this.startstage = false;
        this.allowPause = true;
        pauseButton.style.display = 'block'
        this.player_.position_.z = 0
      } else if (this.startGame && !this.checkStartGame) {
        this.checkStartGame = true;
        this._OnStart()
        this.allowPause = true;
        pauseButton.style.display = 'block'
        document.getElementById('click-start').style.display = 'none';
      }

    });


    document.addEventListener('keydown', () => {
      if (this.startstage) {
        this.animationId = requestAnimationFrame(animate);
        this.objSpeed = 12
        this.monSpeed = 52
        this.speedy = 12
        this.speedz = 3
        this.isPaused = false;
        document.getElementById('click-start').style.display = 'none';
        this.startstage = false;
        this.allowPause = true;
        pauseButton.style.display = 'block'
        this.player_.position_.z = 0

      } else if (this.startGame && !this.checkStartGame) {
        this.checkStartGame = true;
        pauseButton.style.display = 'block'
        this._OnStart()
        document.getElementById('click-start').style.display = 'none';
        this.allowPause = true;

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

    // if power up video ends, then unpause everything
    document.getElementById("powerup").addEventListener("ended", () => {
      this.closePowerupVideo();
      this.powerCountdown_ = true
      startCountdown();
    });

    // if power down video ends, then unpause everything
    document.getElementById("powerdown").addEventListener("ended", () => {
      this.closePowerdownVideo();
      this.powerCountdown_ = true
      startCountdown();

    });


    //count down after power up video has been played
    const startCountdown = () => {
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
          this.isPaused = false;
          this.stopTime = false;
          this.allowPause = true;
          pauseButton.style.display = 'block'

          this.RAF_()
          clearInterval(this.intervalId_);
          document.getElementById('countdown').classList.toggle('active');

          // Start another countdown
          let newCountdown = 5;
          let newIntervalId = setInterval(() => {
            newCountdown--;
            if (newCountdown === 0) {
              clearInterval(newIntervalId);
              if (this.box_ == "") {
                this.playedVideo_ = false
                document.getElementById('power-countdown-text').textContent = 3;
                this.resumeCountdown_ = 3;
              }

            }
          }, 1000);
        }
      }, 1000)
    }


    //for the sky
    const uniforms = {
      topColor: { value: new THREE.Color(0x0077FF) },
      bottomColor: { value: new THREE.Color(0x89b2eb) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
    };

    const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: _VS,
      fragmentShader: _FS,
      side: THREE.BackSide,
    });


    this.scene_.add(new THREE.Mesh(skyGeo, skyMat));


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

    for (let i = 0; i < 3; i++) {
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
    this.pitfall_ = new pitfall.PitfallManager({ scene: this.scene_, firstChase: this.showChase });
    this.wallrun_ = new wallrun.WallManager({ scene: this.scene_ });
    this.water_ = new water.DrinksManager({ scene: this.scene_, position: arrDrinks1, firstChase: this.showChase });
    this.soda_ = new soda.DrinksManager({ scene: this.scene_, position: arrDrinks2, firstChase: this.showChase });
    this.fruitDrink_ = new fruitDrink.DrinksManager({ scene: this.scene_, position: arrDrinks3, firstChase: this.showChase });
    this.hpbLogo_ = new hpbLogo.BoxManager({ scene: this.scene_, position: arrLogo1 });
    this.hpbWrongLogo1_ = new hpbWrongLogo1.BoxManager({ scene: this.scene_, position: arrLogo2 });
    this.hpbWrongLogo2_ = new hpbWrongLogo2.BoxManager({ scene: this.scene_, position: arrLogo3 });
    this.carbs_ = new carbs.FoodManager({ scene: this.scene_, position: food1 });
    this.meat_ = new meat.FoodManager({ scene: this.scene_, position: food2 });
    this.vege_ = new vege.FoodManager({ scene: this.scene_, position: food3 });
    this.oilSlik_ = new oilSlik.OilSlik({ scene: this.scene_ });
    this.background_ = new background.Background({ scene: this.scene_ });
    this.progression_ = new progression.ProgressionManager();


    //for shield 
    if (this.stage == 1) {
      document.querySelector('.wrapper').style.display = 'none';
    }

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

      if (this.cameraX <= -10 && this.cameraY <= 5 && this.cameraZ >= 0) {
        this.showChase = false;
      }
      this.camera_.lookAt(0, 2, 0)

      this.camera_.position.set(this.cameraX, this.cameraY, this.cameraZ);

    }

    //if he loses stage 1
    if (!this.eventAdded3 && this.stage == 1) {
      document.addEventListener('score-over', () => {
        this.nextStageVideo1_.addEventListener("ended", () => {
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

              for (let i = 0; i < 3; i++) {
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
              this.shoogaGlider_ = new shoogaGlider.ShoogaGliderManager({ scene: this.scene_ });
              this.trolliumChloride_ = new trolliumChloride.TrolliumChlorideManager({ scene: this.scene_ });
              this.pitfall_ = new pitfall.PitfallManager({ scene: this.scene_ });
              this.water_ = new water.DrinksManager({ scene: this.scene_, position: arrDrinks1 })
              this.soda_ = new soda.DrinksManager({ scene: this.scene_, position: arrDrinks2 })
              this.fruitDrink_ = new fruitDrink.DrinksManager({ scene: this.scene_, position: arrDrinks3 })
              this.hpbLogo_ = new hpbLogo.BoxManager({ scene: this.scene_, position: arrLogo1 })
              this.hpbWrongLogo1_ = new hpbWrongLogo1.BoxManager({ scene: this.scene_, position: arrLogo2 })
              this.hpbWrongLogo2_ = new hpbWrongLogo2.BoxManager({ scene: this.scene_, position: arrLogo3 })
              this.carbs_ = new carbs.FoodManager({ scene: this.scene_, position: food1 })
              this.meat_ = new meat.FoodManager({ scene: this.scene_, position: food2 })
              this.vege_ = new vege.FoodManager({ scene: this.scene_, position: food3 })
              this.player_ = new player.Player({ gender: this.gender_, scene: this.scene_, water: this.water_, soda: this.soda_, fruitDrink: this.fruitDrink_, pitfall: this.pitfall_, trolliumChloride: this.trolliumChloride_, shoogaGlider: this.shoogaGlider_, box1: this.hpbLogo_, box2: this.hpbWrongLogo1_, box3: this.hpbWrongLogo2_, meat: this.meat_, carbs: this.carbs_, vege: this.vege_ });
              this.oilSlik_ = new oilSlik.OilSlik({ scene: this.scene_ });
              this.background_ = new background.Background({ scene: this.scene_ });
              this.progression_ = new progression.ProgressionManager();
              this.wallrun_ = new wallrun.WallManager({ scene: this.scene_ });


              let light = new THREE.DirectionalLight(0xffffff, 1);

              this.scene_.add(light);

              light = new THREE.HemisphereLight(0x202020, 0x004080, 1.5);
              this.scene_.add(light);

              light = new THREE.PointLight(0xb6bfcc, 1.5, 200, 4);
              light.position.set(-7, 20, 0);
              this.scene_.add(light);

              this.scene_.background = new THREE.Color(0x808080);
              this.scene_.fog = new THREE.FogExp2(0x89b2eb, 0.00125);

              //load map
              const loader = new GLTFLoader();
              loader.setPath('./resources/Map/Stage1/');
              loader.load('stage1a.gltf', (gltf) => {
                this.mesh = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh.position.set(-5, 0, -0.5);
                this.mesh.rotation.set(0, -Math.PI / 2, 0);
                this.mesh.scale.setScalar(0.0095);


                this.scene_.add(this.mesh);

              });
              loader.setPath('./resources/Map/Stage1/');
              loader.load('stage1b.gltf', (gltf) => {
                this.mesh1 = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh1.position.set(192, 0, -0.5);
                this.mesh1.rotation.set(0, -Math.PI / 2, 0);
                this.mesh1.scale.setScalar(0.0095);


                this.scene_.add(this.mesh1);

              });
              loader.load('stage1b.gltf', (gltf) => {
                this.mesh2 = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh2.position.set(389, 0, -0.5);
                this.mesh2.rotation.set(0, -Math.PI / 2, 0);
                this.mesh2.scale.setScalar(0.0095);


                this.scene_.add(this.mesh2);

              });
              loader.load('stage1a.gltf', (gltf) => {
                this.mesh3 = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh3.position.set(581, 0, -0.5);
                this.mesh3.rotation.set(0, -Math.PI / 2, 0);
                this.mesh3.scale.setScalar(0.0095);


                this.scene_.add(this.mesh3);

              });


              const uniforms = {
                topColor: { value: new THREE.Color(0x0c1445) },
                bottomColor: { value: new THREE.Color(0x89b2eb) },
                offset: { value: 33 },
                exponent: { value: 0.6 }
              };

              const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
              const skyMat = new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: _VS,
                fragmentShader: _FS,
                side: THREE.BackSide,
              });


              this.scene_.add(new THREE.Mesh(skyGeo, skyMat));


              this.gameOver_ = false;
              this.stopTime = false;
              this.RAF_();
            } else if (this.countdown_ === 0) {
              if (this.scene_.children.length >= 55) {
                clearInterval(this.intervalId_);
                this.previousRAF_ = null;
                this.startstage = true;
                document.getElementById('loading-1').style.display = 'none';
                document.getElementById('click-start').style.display = 'block';
              } else {
                this.countdown_ = 3
              }

            }

          }, 1000);

        })
      })
      this.eventAdded3 = true;
    }

    //stage 1 won
    if (!this.eventAdded && this.stage == 1) {
      document.addEventListener('score-over1', () => {
        this.showChase = false;
        this.gameOver_ = true;
        this.allowPause = false;
        this.stopTime = true
        this.Pause()
        pauseButton.style.display = 'none'
        this.stage = 2;
        this.playNextStageVideo2()
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


              // set randonm positoin for box logos
              let arrLogo1 = [];
              let arrLogo2 = [];
              let arrLogo3 = [];

              for (let i = 0; i < 3; i++) {
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
              this.pitfall_ = new pitfall.PitfallManager({ scene: this.scene_ });
              this.water_ = new water.DrinksManager({ scene: this.scene_, position: arrDrinks1 })
              this.soda_ = new soda.DrinksManager({ scene: this.scene_, position: arrDrinks2 })
              this.fruitDrink_ = new fruitDrink.DrinksManager({ scene: this.scene_, position: arrDrinks3 })
              this.hpbLogo_ = new hpbLogo.BoxManager({ scene: this.scene_, position: arrLogo1 })
              this.hpbWrongLogo1_ = new hpbWrongLogo1.BoxManager({ scene: this.scene_, position: arrLogo2 })
              this.hpbWrongLogo2_ = new hpbWrongLogo2.BoxManager({ scene: this.scene_, position: arrLogo3 })
              this.carbs_ = new carbs.FoodManager({ scene: this.scene_, position: food1 })
              this.meat_ = new meat.FoodManager({ scene: this.scene_, position: food2 })
              this.vege_ = new vege.FoodManager({ scene: this.scene_, position: food3 })
              this.player_ = new player.Player({ gender: this.gender_, scene: this.scene_, water: this.water_, soda: this.soda_, fruitDrink: this.fruitDrink_, pitfall: this.pitfall_, trolliumChloride: this.trolliumChloride_, shoogaGlider: this.shoogaGlider_, box1: this.hpbLogo_, box2: this.hpbWrongLogo1_, box3: this.hpbWrongLogo2_, meat: this.meat_, carbs: this.carbs_, vege: this.vege_ });
              this.oilSlik_ = new oilSlik.OilSlik({ scene: this.scene_ });
              this.background_ = new background.Background({ scene: this.scene_ });
              this.progression_ = new progression.ProgressionManager();
              this.wallrun_ = new wallrun.WallManager({ scene: this.scene_ });




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
              loader.load('stage2a.gltf', (gltf) => {
                this.mesh = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh.position.set(-5, 0, 0);
                this.mesh.rotation.set(0, -Math.PI / 2, 0.03);
                this.mesh.scale.setScalar(0.0095);


                this.scene_.add(this.mesh);

              });
              loader.load('stage2a.gltf', (gltf) => {
                this.mesh1 = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh1.position.set(192, 0, 0);
                this.mesh1.rotation.set(0, -Math.PI / 2, 0.03);
                this.mesh1.scale.setScalar(0.0095);


                this.scene_.add(this.mesh1);

              });
              loader.load('stage2b.gltf', (gltf) => {
                this.mesh2 = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh2.position.set(389, 0, 0);
                this.mesh2.rotation.set(0, -Math.PI / 2, 0.03);
                this.mesh2.scale.setScalar(0.0095);


                this.scene_.add(this.mesh2);

              });
              loader.load('stage2c.gltf', (gltf) => {
                this.mesh3 = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh3.position.set(581, 0, 0);
                this.mesh3.rotation.set(0, -Math.PI / 2, 0.03);
                this.mesh3.scale.setScalar(0.0095);


                this.scene_.add(this.mesh3);

              });



              const uniforms = {
                topColor: { value: new THREE.Color(0x00008B) },
                bottomColor: { value: new THREE.Color(0x89b2eb) },
                offset: { value: 33 },
                exponent: { value: 0.6 }
              };

              const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
              const skyMat = new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: _VS,
                fragmentShader: _FS,
                side: THREE.BackSide,
              });


              this.scene_.add(new THREE.Mesh(skyGeo, skyMat));


              this.gameOver_ = false;
              this.stopTime = false;
              this.RAF_();
            } else if (this.countdown1_ === 0) {
              if (this.scene_.children.length >= 73) {
                this.previousRAF_ = null;
                this.startstage = true;
                document.querySelector('.wrapper').style.display = 'block';
                document.getElementById('loading-2').style.display = 'none';
                document.getElementById('click-start').style.display = 'block';
                this.player_.propArray = []
                clearInterval(this.intervalId_);
              } else {
                this.countdown1_ = 3
              }

            }
          }, 1000);

        })

      });
      this.eventAdded = true;

    }

    //stage 2 won
    if (!this.eventAdded1 && this.stage == 2) {

      document.addEventListener('score-over2', () => {
        this.gameOver_ = true;
        this.stopTime = true
        this.allowPause = false;
        this.Pause()
        pauseButton.style.display = 'none'

        this.stage = 3;
        this.playNextStageVideo3()
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

              for (let i = 0; i < 3; i++) {
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
              this.pitfall_ = new pitfall.PitfallManager({ scene: this.scene_ });
              this.water_ = new water.DrinksManager({ scene: this.scene_, position: arrDrinks1 })
              this.soda_ = new soda.DrinksManager({ scene: this.scene_, position: arrDrinks2 })
              this.fruitDrink_ = new fruitDrink.DrinksManager({ scene: this.scene_, position: arrDrinks3 })
              this.hpbLogo_ = new hpbLogo.BoxManager({ scene: this.scene_, position: arrLogo1 })
              this.hpbWrongLogo1_ = new hpbWrongLogo1.BoxManager({ scene: this.scene_, position: arrLogo2 })
              this.hpbWrongLogo2_ = new hpbWrongLogo2.BoxManager({ scene: this.scene_, position: arrLogo3 })
              this.carbs_ = new carbs.FoodManager({ scene: this.scene_, position: food1 })
              this.meat_ = new meat.FoodManager({ scene: this.scene_, position: food2 })
              this.vege_ = new vege.FoodManager({ scene: this.scene_, position: food3 })
              this.player_ = new player.Player({ gender: this.gender_, scene: this.scene_, water: this.water_, soda: this.soda_, fruitDrink: this.fruitDrink_, pitfall: this.pitfall_, trolliumChloride: this.trolliumChloride_, shoogaGlider: this.shoogaGlider_, box1: this.hpbLogo_, box2: this.hpbWrongLogo1_, box3: this.hpbWrongLogo2_, meat: this.meat_, carbs: this.carbs_, vege: this.vege_ });
              this.oilSlik_ = new oilSlik.OilSlik({ scene: this.scene_ });
              this.progression_ = new progression.ProgressionManager();
              this.wallrun_ = new wallrun.WallManager({ scene: this.scene_ });

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
              loader.setPath('./resources/Map/Stage3/');
              loader.load('stage3start.gltf', (gltf) => {
                this.mesh = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh.position.set(-5, 0, -0.5);
                this.mesh.rotation.set(0, -Math.PI / 2, 0);
                this.mesh.scale.setScalar(0.0095);


                this.scene_.add(this.mesh);

              });
              loader.load('stage3wallrun2.gltf', (gltf) => {
                this.mesh1 = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh1.position.set(192, 0, -0.5);
                this.mesh1.rotation.set(0, -Math.PI / 2, 0);
                this.mesh1.scale.setScalar(0.0095);


                this.scene_.add(this.mesh1);

              });
              loader.load('stage3b.gltf', (gltf) => {
                this.mesh2 = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh2.position.set(389, 0, -0.5);
                this.mesh2.rotation.set(0, -Math.PI / 2, 0);
                this.mesh2.scale.setScalar(0.0095);


                this.scene_.add(this.mesh2);

              });
              loader.load('stage3a.gltf', (gltf) => {
                this.mesh3 = gltf.scene;

                gltf.castShadow = true;
                gltf.receiveShadow = true;
                this.mesh3.position.set(581, 0, -0.5);
                this.mesh3.rotation.set(0, -Math.PI / 2, 0);
                this.mesh3.scale.setScalar(0.0095);


                this.scene_.add(this.mesh3);

              });



              const uniforms = {
                topColor: { value: new THREE.Color(0x0c1445) },
                bottomColor: { value: new THREE.Color(0x38285c) },
                offset: { value: 33 },
                exponent: { value: 0.6 }
              };

              const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
              const skyMat = new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: _VS,
                fragmentShader: _FS,
                side: THREE.BackSide,
              });


              this.scene_.add(new THREE.Mesh(skyGeo, skyMat));


              this.gameOver_ = false;
              this.stopTime = false;
              this.RAF_();
            } else if (this.countdown2_ === 0) {
              if (this.scene_.children.length >= 59) {
                this.previousRAF_ = null;
                this.startstage = true;
                document.getElementById("keyContainer").style.display = 'block';
                document.getElementById('loading-3').style.display = 'none';
                document.getElementById('click-start').style.display = 'block';
                this.player_.propArray = []
                clearInterval(this.intervalId_);
              } else {
                this.countdown2_ = 3
              }
            }
          }, 1000);



        })
      });
      this.eventAdded1 = true;

    }


    //if player wins stage 3
    if (!this.eventAdded2 && this.stage == 3) {
      document.addEventListener('score-over3', () => {
        this.allowPause = false;
        this.gameOver_ = true;
        this.stopTime = true;
        pauseButton.style.display = 'none'

        this.player_.getStamina(result => {
          this.totalStamina = this.totalStamina + result
        });
        this.playVictoryVid()

      });
      this.eventAdded2 = true;
    }


    //preload the game assets
    if (this.gameOver_ || !this._gameStarted) {

      if (!this.loaded) {

        this.water_.Update(timeElapsed, this.objSpeed)
        this.soda_.Update(timeElapsed, this.objSpeed)
        this.fruitDrink_.Update(timeElapsed, this.objSpeed)
        this.pitfall_.Update(timeElapsed, this.objSpeed)

        this.loaded = true;

      }
      return;
    }

    if (this._gameStarted) {
      //load the game assets and animations
      if (this.stage == 1) {
        this.water_.Update(timeElapsed, this.objSpeed)
        this.soda_.Update(timeElapsed, this.objSpeed)
        this.fruitDrink_.Update(timeElapsed, this.objSpeed)
        this.pitfall_.Update(timeElapsed, this.objSpeed)

      } else if (this.stage == 2) {
        this.water_.Update(timeElapsed, this.objSpeed)
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
        this.trolliumChloride_.Update(timeElapsed, this.objSpeed)
      }

      //get position of wall from wallrun.js
      this.wallrun_.GetPosition(result => {
        this.wallPosition = result
      });

      this.player_.Update(timeElapsed, pause, this.wallPosition, this.swipeLeft, this.swipeRight, this.showChase);
      this.oilSlik_.Update(timeElapsed, pause, this.showChase);
      this.background_.Update(timeElapsed);
      this.progression_.Update(timeElapsed, pause, this.stage);



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
          setTimeout(() => {

            this.objSpeed = 0
            this.monSpeed = 0
            this.speedy = 0
            this.speedz = 0
            this.isPaused = true
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

      //check stamina level for oil slik catching up
      // this.player_.getStamina(result => {
      //   if (result < 60) {

      //     this.oilSlikCatch = true;

      //   } else if (result > 60) {
      //     this.oilSlikCatch = false;

      //   }
      // });


      //checks whether player collides with box from player.js
      this.player_.getBoxCollide(result => {
        this.box_ = result

        if (this.box_ == "powerup" && !this.playedVideo_) {
          this.box_ = ""
          this.playedVideo_ = true;
          this.allowPause = false;
          pauseButton.style.display = 'none'

          this.Pause()
          this.stopTime = true;
          this.playPowerupVideo()
        } else if (this.box_ == "powerdown" && !this.playedVideo_) {
          this.box_ = ""
          this.playedVideo_ = true;
          this.allowPause = false;
          pauseButton.style.display = 'none'

          this.Pause()
          this.stopTime = true;
          this.playPowerdownVideo()

        }


      });


      //checks for swipe gestures
      if (this.swipeLeft) {
        if (!this.player_.collapse) {
          if (!this.player_.pitCollide) {
            if (!this.player_.wallFail) {
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
          }
        }
      }
      if (this.swipeRight) {
        if (!this.player_.collapse) {

          if (!this.player_.pitCollide) {
            if (!this.player_.wallFail) {

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
          }
        }
      }

      if (this.swipeUp) {
        if (!this.player_.collapse) {
          if (!this.player_.pitCollide) {
            if (!this.player_.wallFail) {
              this.player_.SwipeUp(timeElapsed);
              this.swipeUp = false;
            }
          }
        }

      }
      if (this.swipeDown) {
        if (!this.player_.collapse) {
          if (!this.player_.pitCollide) {
            if (!this.player_.wallFail) {
              this.player_.SwipeDown(timeElapsed);
              this.swipeDown = false;
            }
          }
        }
      }
    }


    if(this.restartStage && !this.checkRestart){
      this.checkRestart = true;
      this.allowPause = false;
      this.restartStage = false;
      this.gameOver_ = true;
      this.playedVideo_ = false
      pauseButton.style.display = 'none'
      playButton.style.display = 'none'

      document.getElementById("fullShield").style.zIndex = "0";
      document.querySelector('#video-container').style.backgroundColor = 'transparent'
      document.querySelector('#pauseDiv').style.display = 'none'

      if (this.stage == 2) {
        this.playNextStageVideo2()
        this.eventAdded = false;
        this.countdown1_ = 6
        this.checkRestart = false;

      } else if (this.stage == 3) {
        this.playNextStageVideo3()
        this.eventAdded1 = false;
        this.countdown2_ = 6
        this.checkRestart = false;

      } else if (this.stage == 1) {
        this.playNextStageVideo1()
        this.eventAdded3 = false;
        this.countdown_ = 6
        this.checkRestart = false;
      }

      this.stopTime = true
      this.Pause()
    }

    //if game is over (lost)
    if (this._gameStarted && this.player_.gameOver && !this.gameOver_) {
      this.showChase = false;
      this.allowPause = false;
      this.gameOver_ = true;
      this.resumeCountdown_ = 3;
      this.playedVideo_ = false
      pauseButton.style.display = 'none'

      document.getElementById("fullShield").style.zIndex = "0";
      document.querySelector('#video-container').style.backgroundColor = 'transparent'
      document.getElementById('game-over').classList.toggle('active');
      document.getElementById('try-again-button').addEventListener('click', () => {

        document.getElementById('game-over').classList.remove('active');

        if (this.stage == 2) {
          this.playNextStageVideo2()
          this.eventAdded = false;
          this.countdown1_ = 6

        } else if (this.stage == 3) {
          this.playNextStageVideo3()
          this.eventAdded1 = false;
          this.countdown2_ = 6

        } else if (this.stage == 1) {
          this.playNextStageVideo1()
          this.eventAdded3 = false;
          this.countdown_ = 6

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


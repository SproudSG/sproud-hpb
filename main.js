import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import Stats from 'https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js'
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/GLTFLoader.js";

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


const _PCSS = `
#define LIGHT_WORLD_SIZE 0.05
#define LIGHT_FRUSTUM_WIDTH 3.75
#define LIGHT_SIZE_UV (LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH)
#define NEAR_PLANE 1.0

#define NUM_SAMPLES 17
#define NUM_RINGS 11
#define BLOCKER_SEARCH_NUM_SAMPLES NUM_SAMPLES
#define PCF_NUM_SAMPLES NUM_SAMPLES

vec2 poissonDisk[NUM_SAMPLES];

void initPoissonSamples( const in vec2 randomSeed ) {
  float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );
  float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );

  // jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
  float angle = rand( randomSeed ) * PI2;
  float radius = INV_NUM_SAMPLES;
  float radiusStep = radius;

  for( int i = 0; i < NUM_SAMPLES; i ++ ) {
    poissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );
    radius += radiusStep;
    angle += ANGLE_STEP;
  }
}

float penumbraSize( const in float zReceiver, const in float zBlocker ) { // Parallel plane estimation
  return (zReceiver - zBlocker) / zBlocker;
}

float findBlocker( sampler2D shadowMap, const in vec2 uv, const in float zReceiver ) {
  // This uses similar triangles to compute what
  // area of the shadow map we should search
  float searchRadius = LIGHT_SIZE_UV * ( zReceiver - NEAR_PLANE ) / zReceiver;
  float blockerDepthSum = 0.0;
  int numBlockers = 0;

  for( int i = 0; i < BLOCKER_SEARCH_NUM_SAMPLES; i++ ) {
    float shadowMapDepth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[i] * searchRadius));
    if ( shadowMapDepth < zReceiver ) {
      blockerDepthSum += shadowMapDepth;
      numBlockers ++;
    }
  }

  if( numBlockers == 0 ) return -1.0;

  return blockerDepthSum / float( numBlockers );
}

float PCF_Filter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius ) {
  float sum = 0.0;
  for( int i = 0; i < PCF_NUM_SAMPLES; i ++ ) {
    float depth = unpackRGBAToDepth( texture2D( shadowMap, uv + poissonDisk[ i ] * filterRadius ) );
    if( zReceiver <= depth ) sum += 1.0;
  }
  for( int i = 0; i < PCF_NUM_SAMPLES; i ++ ) {
    float depth = unpackRGBAToDepth( texture2D( shadowMap, uv + -poissonDisk[ i ].yx * filterRadius ) );
    if( zReceiver <= depth ) sum += 1.0;
  }
  return sum / ( 2.0 * float( PCF_NUM_SAMPLES ) );
}

float PCSS ( sampler2D shadowMap, vec4 coords ) {
  vec2 uv = coords.xy;
  float zReceiver = coords.z; // Assumed to be eye-space z in this code

  initPoissonSamples( uv );
  // STEP 1: blocker search
  float avgBlockerDepth = findBlocker( shadowMap, uv, zReceiver );

  //There are no occluders so early out (this saves filtering)
  if( avgBlockerDepth == -1.0 ) return 1.0;

  // STEP 2: penumbra size
  float penumbraRatio = penumbraSize( zReceiver, avgBlockerDepth );
  float filterRadius = penumbraRatio * LIGHT_SIZE_UV * NEAR_PLANE / zReceiver;

  // STEP 3: filtering
  //return avgBlockerDepth;
  return PCF_Filter( shadowMap, uv, zReceiver, filterRadius );
}
`;

const _PCSSGetShadow = `
return PCSS( shadowMap, shadowCoord );
`;


class BasicWorldDemo {
  constructor() {

    //game end & you win & after video count down
    this.countdown_ = 10;
    this.countdown1_ = 16;
    this.totalStamina = 0;
    this.stopTime = false;


    this.resumeCountdown_ = 3;
    this.powerCountdown_ = false;
    this.intervalId_ = null;

    //load assets & world variables 
    this.loaded = false;
    this.gender_ = null;
    this.stage = 1;
    this.wallPosition = [];

    //init
    this._gameStarted = false;

    this._Initialize();

    //on load music 
    this.menuMusic = document.getElementById("menu-music");
    this._playMenuMusic();
    document.addEventListener('DOMContentLoaded', () => {
      this._playMenuMusic();

    });


    //handle gender selection
    document.getElementById('start-button').addEventListener('click', () => {

      document.getElementById('gender-selection').style.display = 'block';

    });

    //handle start game (male)
    document.getElementById('male-button').addEventListener('click', () => {
      this._OnStart();
      document.getElementById('video-container').style.display = 'block';
      document.getElementById('gender-selection').style.display = 'none';
      this.gender_ = "male"
      this.player_ = new player.Player({ gender: this.gender_, scene: this.scene_, water: this.water_, soda: this.soda_, fruitDrink: this.fruitDrink_, pitfall: this.pitfall_, trolliumChloride: this.trolliumChloride_, shoogaGlider: this.shoogaGlider_, box1: this.hpbLogo_, box2: this.hpbWrongLogo1_, box3: this.hpbWrongLogo2_, meat: this.meat_, carbs: this.carbs_, vege: this.vege_ });

    });

    //handle start game (female)
    document.getElementById('female-button').addEventListener('click', () => {
      this._OnStart();
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
    this.nextStageVideo_ = document.getElementById("nextStage");


    // if power up video ends, then unpause everything
    this.powerupVideo_.addEventListener("ended", () => {
      this.closePowerupVideo();
      this.powerCountdown_ = true

    });

    // if power down video ends, then unpause everything
    this.powerdownVideo_.addEventListener("ended", () => {
      this.closePowerdownVideo();
      this.powerCountdown_ = true

    });

    // if next stage video ends, then unpause everything
    this.nextStageVideo_.addEventListener("ended", () => {
      this.closeNextStageVideo();

      if (this.stage === 1) {
        document.getElementById('loading-2').style.display = 'block';
        this.stage1VideoPlayed = true

      } else if (this.stage === 2) {
        document.getElementById('loading-3').style.display = 'block';

      } else if (this.stage === 3) {
        document.getElementById('score').textContent = Math.ceil(this.totalStamina * 1) / 1;

        document.getElementById('final-score').classList.toggle('active');
      }
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

  playNextStageVideo() {
    this.nextStageVideo_.style.display = "block";
    this.nextStageVideo_.play();
  }

  closeNextStageVideo() {
    this.nextStageVideo_.style.display = "none";
    this.nextStageVideo_.currentTime = 0;
  }

  //music player
  _playMenuMusic() {
    this.menuMusic.play();
  }

  //start the game
  _OnStart() {
    this.menuMusic.pause();
    document.getElementById('game-menu').style.display = 'none';
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
    this.buffspeed = false;

    // overwrite shadowmap code
    // let shadowCode = THREE.ShaderChunk.shadowmap_pars_fragment;

    // shadowCode = shadowCode.replace(
    //   '#ifdef USE_SHADOWMAP',
    //   '#ifdef USE_SHADOWMAP' +
    //   _PCSS
    // );

    // shadowCode = shadowCode.replace(
    //   '#if defined( SHADOWMAP_TYPE_PCF )',
    //   _PCSSGetShadow +
    //   '#if defined( SHADOWMAP_TYPE_PCF )'
    // );

    // THREE.ShaderChunk.shadowmap_pars_fragment = shadowCode;

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

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    let far;
    if (this.stage === 1) {
      far = 20000.0;

    } else {
      far = 2000
    }
    this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera_.position.set(-7, 3, 0);
    this.camera_.lookAt(0, 3, 0);

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



    //key down event listener
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if (this.isPaused) {
          this.animationId = requestAnimationFrame(animate);

          this.objSpeed = 12
          this.monSpeed = 52
          this.speedy = 12
          this.speedz = 3
          this.isPaused = false;
        } else {
          this.objSpeed = 0
          this.monSpeed = 0
          this.speedy = 0
          this.speedz = 0
          cancelAnimationFrame(this.animationId);
          this.isPaused = true;
        }
      }
    });


    //handle second stage "click to continue"
    document.getElementById('click-start').addEventListener('click', () => {

      if (this.isPaused) {
        this.animationId = requestAnimationFrame(animate);

        this.objSpeed = 12
        this.monSpeed = 52
        this.speedy = 12
        this.speedz = 3
        this.isPaused = false;
        document.getElementById('click-start').style.display = 'none';

      }

    });


    //detect shit
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        console.log("User has tabbed out of the page");

        this.objSpeed = 0
        this.monSpeed = 0
        this.speedy = 0
        this.speedz = 0
        cancelAnimationFrame(this.animationId);
        this.isPaused = true;

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

      }
      this.animationId = requestAnimationFrame(animate);

    }



    animate();

    //checker for game over
    setInterval(() => {
      if (this.gameOver_) {
        cancelAnimationFrame(this.animationId);
      } else if (this.powerCountdown_) {
        //check if power up video is done playing then executes this
        startCountdown();
        this.powerCountdown_ = false;
      }
    }, 10);

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

    // set random position for food
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
    this.wallrun_ = new wallrun.WallManager({ scene: this.scene_ });

    this.water_ = new water.DrinksManager({ scene: this.scene_, position: arrDrinks1 });
    this.soda_ = new soda.DrinksManager({ scene: this.scene_, position: arrDrinks2 });
    this.fruitDrink_ = new fruitDrink.DrinksManager({ scene: this.scene_, position: arrDrinks3 });
    this.hpbLogo_ = new hpbLogo.BoxManager({ scene: this.scene_, position: arrLogo1 });
    this.hpbWrongLogo1_ = new hpbWrongLogo1.BoxManager({ scene: this.scene_, position: arrLogo2 });
    this.hpbWrongLogo2_ = new hpbWrongLogo2.BoxManager({ scene: this.scene_, position: arrLogo3 });
    this.carbs_ = new carbs.FoodManager({ scene: this.scene_, position: food1 });
    this.meat_ = new meat.FoodManager({ scene: this.scene_, position: food2 });
    this.vege_ = new vege.FoodManager({ scene: this.scene_, position: food3 });
    this.oilSlik_ = new oilSlik.OilSlik({ scene: this.scene_ });
    this.background_ = new background.Background({ scene: this.scene_ });
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

  //handle window resize to maintain aspect ratio
  OnWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();
    this.threejs_.setSize(window.innerWidth, window.innerHeight);
  }

  //start the animation 
  RAF_() {
    requestAnimationFrame((t) => {
      if (this.previousRAF_ === null) {
        this.previousRAF_ = t;
      }
      this.RAF_();
      this.Step_((t - this.previousRAF_) / 1000.0, this.isPaused);
      this.threejs_.render(this.scene_, this.camera_);
      this.previousRAF_ = t;
    });
  }


  //what the animation does

  Step_(timeElapsed, pause) {
    //if game is won
    if (!this.eventAdded && this.stage == 1) {
      document.addEventListener('score-over', () => {
        this.gameOver_ = true;
        this.playNextStageVideo()
        this.Pause()
        this.player_.getStamina(result => {
          this.totalStamina = this.totalStamina + result
          console.log(this.totalStamina)
        });


        // Remove any references to the objects

        this.nextStageVideo_.addEventListener("ended", () => {
          if (this.stage === 1) {
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

                const loader = new GLTFLoader();
                loader.setPath('./resources/Map/Stage2/');
                loader.load('stage2a.gltf', (gltf) => {
                  this.mesh = gltf.scene;

                  gltf.castShadow = true;
                  gltf.receiveShadow = true;
                  this.mesh.position.set(-5, 0, 0);
                  this.mesh.rotation.set(0, -Math.PI / 2, 0);
                  this.mesh.scale.setScalar(0.0095);


                  this.scene_.add(this.mesh);

                });
                loader.load('stage2a.gltf', (gltf) => {
                  this.mesh1 = gltf.scene;

                  gltf.castShadow = true;
                  gltf.receiveShadow = true;
                  this.mesh1.position.set(192, 0, 0);
                  this.mesh1.rotation.set(0, -Math.PI / 2, 0);
                  this.mesh1.scale.setScalar(0.0095);


                  this.scene_.add(this.mesh1);

                });
                loader.load('stage2b.gltf', (gltf) => {
                  this.mesh2 = gltf.scene;

                  gltf.castShadow = true;
                  gltf.receiveShadow = true;
                  this.mesh2.position.set(389, 0, 0);
                  this.mesh2.rotation.set(0, -Math.PI / 2, 0);
                  this.mesh2.scale.setScalar(0.0095);


                  this.scene_.add(this.mesh2);

                });
                loader.load('stage2c.gltf', (gltf) => {
                  this.mesh3 = gltf.scene;

                  gltf.castShadow = true;
                  gltf.receiveShadow = true;
                  this.mesh3.position.set(581, 0, -0.5);
                  this.mesh3.rotation.set(0, -Math.PI / 2, 0);
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
                this.stage = 2
              } else if (this.countdown_ === 0) {
                this.previousRAF_ = null;
                document.getElementById('loading-2').style.display = 'none';
                document.getElementById('click-start').style.display = 'block';
                clearInterval(this.intervalId_);
              }
            }, 1000);



          }
        })

      });
      this.eventAdded = true;

    }


    if (!this.eventAdded1 && this.stage == 2) {

      document.addEventListener('score-over1', () => {
        this.gameOver_ = true;
        this.playNextStageVideo()

        this.player_.getStamina(result => {
          this.totalStamina = this.totalStamina + result
          console.log(this.totalStamina)
        });

        this.Pause()

        this.intervalId_ = setInterval(() => {
          this.countdown1_--;
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
            loader.load('stage3a.gltf', (gltf) => {
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


            this.gameOver_ = false;
            this.stage = 3
          } else if (this.countdown1_ === 0) {
            this.previousRAF_ = null;
            document.getElementById('click-start').style.display = 'block';
            document.getElementById('loading-3').style.display = 'none';
            clearInterval(this.intervalId_);
          }
        }, 1000);
      });
      this.eventAdded1 = true;

    }


    //if player wins stage 3
    if (!this.eventAdded2 && this.stage == 3) {
      document.addEventListener('score-over2', () => {
        this.gameOver_ = true;
        this.player_.getStamina(result => {
          this.totalStamina = this.totalStamina + result
          console.log(this.totalStamina)
        });
        this.playNextStageVideo()

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
      this.shoogaGlider_.Update(timeElapsed, this.monSpeed, this.speedz, this.speedy, pause);
      this.vege_.Update(timeElapsed, this.objSpeed)
      this.meat_.Update(timeElapsed, this.objSpeed)
      this.carbs_.Update(timeElapsed, this.objSpeed)
      this.trolliumChloride_.Update(timeElapsed, this.objSpeed, pause)
    } else if (this.stage == 3) {
      this.wallrun_.Update(timeElapsed, this.objSpeed)
      this.hpbLogo_.Update(timeElapsed, this.objSpeed)
      this.hpbWrongLogo1_.Update(timeElapsed, this.objSpeed)
      this.hpbWrongLogo2_.Update(timeElapsed, this.objSpeed)
      this.water_.Update(timeElapsed, this.objSpeed)
      this.soda_.Update(timeElapsed, this.objSpeed)
      this.fruitDrink_.Update(timeElapsed, this.objSpeed)
      this.pitfall_.Update(timeElapsed, this.objSpeed)
      this.shoogaGlider_.Update(timeElapsed, this.monSpeed, this.speedz, this.speedy, pause);
      this.vege_.Update(timeElapsed, this.objSpeed)
      this.meat_.Update(timeElapsed, this.objSpeed)
      this.carbs_.Update(timeElapsed, this.objSpeed)
      this.trolliumChloride_.Update(timeElapsed, this.objSpeed, pause)
    }

    if (!this.gameOver_) {
      //get position of wall from wallrun.js
      this.wallrun_.GetPosition(result => {
        this.wallPosition = result
      });

      this.player_.Update(timeElapsed, pause, this.wallPosition, this.swipeLeft, this.swipeRight);
      this.oilSlik_.Update(timeElapsed);
      this.background_.Update(timeElapsed);
      this.progression_.Update(timeElapsed, pause, this.buffspeed, this.speed_, this.stage);



      //get speed of player from player.js
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

      //checks whether player collides with box from player.js
      this.player_.getBoxCollide(result => {
        this.box_ = result

        if (this.box_ == "powerup" && !this.playedVideo_) {
          this.box_ = ""
          this.playedVideo_ = true;
          this.Pause()
          this.playPowerupVideo()
        } else if (this.box_ == "powerdown" && !this.playedVideo_) {
          this.box_ = ""
          this.playedVideo_ = true;
          this.Pause()
          this.playPowerdownVideo()

        }


      });


      //checks for swipe gestures
      if (this.swipeLeft) {
        if (this.player_.position_.y != 0) {
          if (this.player_.position_.z <= -3) {
            this.swipeLeft = false;
          }

          return

        }
        this.player_.SwipeLeft();
        this.isSwiping = true

        if (this.player_.position_.z == -3 || this.player_.position_.z == 0) {
          this.swipeLeft = false;
          this.isSwiping = false;

        }


      }
      if (this.swipeRight) {

        if (this.player_.position_.y != 0) {
          if (this.player_.position_.z >= 3) {
            this.swipeRight = false;
          }

          return

        }
        this.player_.SwipeRight();
        this.isSwiping = true

        if (this.player_.position_.z == 3 || this.player_.position_.z == 0) {
          this.swipeRight = false;
          this.isSwiping = false;

        }
      }
      if (this.swipeUp) {
        this.player_.SwipeUp(timeElapsed);
        this.swipeUp = false;
      }
      if (this.swipeDown) {

        this.player_.SwipeDown(timeElapsed);
        this.swipeDown = false;
      }

    }

    //if game is over (lost)
    if (this.player_.gameOver && !this.gameOver_) {
      this.gameOver_ = true;
      document.getElementById('game-over').classList.toggle('active');
      this.intervalId_ = setInterval(() => {
        this.countdown_--;
        document.getElementById('countdown-text').textContent = this.countdown_ + ' seconds to main screen';
        if (this.countdown_ === 0) {
          clearInterval(this.intervalId_);
          location.assign(location.href);
        }
      }, 1000);
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


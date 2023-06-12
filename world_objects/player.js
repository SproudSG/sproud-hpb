// import * as THREE from 'https://storage.googleapis.com/sproud-hpb/node_modules/three/build/three.module.js';

// import { GLTFLoader } from "https://storage.googleapis.com/sproud-hpb/node_modules/three/examples/jsm/loaders/GLTFLoader.js";


import * as THREE from './../node_modules/three/build/three.module.js';

import { GLTFLoader } from "./../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

export const player = (() => {

  class Player {
    constructor(params) {
      //player properties
      this.position_ = new THREE.Vector3(0, 0, 0);
      this.positionShield_ = new THREE.Vector3(0, 0, 0)
      this.velocity_ = 0.0;
      this.leftMovementSpeed = -0.5;
      this.rightMovementSpeed = 0.5;
      this.jumping_ = false;
      this.inAir_ = false;
      this.sliding_ = false;
      this.slideAnimation_ = false;
      this.slideTimer_ = 0;
      this.playerBox_ = new THREE.Box3();
      this.playerHit = false;
      this.soundDash = document.getElementById("sound-dash");
      this.soundRunning = document.getElementById("sound-running");
      this.soundRunning.volume = 0.5
      this.soundShield = document.getElementById("sound-shield");

      //monster variables
      this.shoogaGliderID = null;
      this.processedshoogaGliderIDs = [];
      this.trolliumChlorideID = null;
      this.processedtrolliumChlorideIDs = [];
      this.collapse = false;


      //pitfall variables
      this.pitfallID = null;
      this.processedPitfallIDs = [];
      this.pitCollide = false;

      //drink variables
      this.drink = "";
      this.waterID = null;
      this.processedWaterIDs = [];
      this.sodaID = null;
      this.processedSodaIDs = [];
      this.fruitID = null;
      this.processedFruitIDs = [];

      //food variables
      this.food = "";
      this.meatID = null;
      this.processedMeatIDs = [];
      this.vegeID = null;
      this.processedVegeIDs = [];
      this.carbsID = null;
      this.processedCarbsIDs = [];
      this.meatProp = 0;
      this.vegeProp = 0;
      this.carbProp = 0;
      this.propArray = [];

      //wall variables
      this.onWall = false;
      this.wallArray = []
      this.wallLoaded = false;
      this.toggleJumpAnimation = false;
      this.wallFail = false;
      this.wallEnd = false;

      //sheild variables
      this.immunitiy = false;
      this.shieldTime = 100;
      this.minValue = 0.35;
      this.maxValue = 0.85;
      this.mappedCosValue = 0;
      this.mappedSinValue = 0;
      this.angle = 0;
      this.timefactor = 0;
      //HPB box logo variables
      this.box = "";
      this.box1ID = null;
      this.processedbox1IDs = [];
      this.box2ID = null;
      this.processedbox2IDs = [];
      this.box3ID = null;
      this.processedbox3IDs = [];
      this.friendsSaved = 0;

      //map speed
      this.speed = 0.2
      this.debuff = false;

      //sugarcrash variables
      this.stamina_ = 100;
      this.sugarDrinks = 0;

      //key controls
      this.downPressed_ = false;

      //death
      this.death = ""

      //model
      this.container = new THREE.Object3D();

      //init
      this.params_ = params;
      this.LoadModel_();
      this.InitInput_();

    }

    LoadModel_() {
      let model;

      if (this.params_.gender === "male") {
        model = 'BoyAll.gltf';
      } else {
        model = 'GirlAll.gltf';
      }


      const textureLoader = new THREE.TextureLoader();
      textureLoader.setPath('./resources/Player/');

      const textureShield1 = textureLoader.load('ShieldGlowA.png', () => {
        textureShield1.encoding = THREE.sRGBEncoding; // Set the texture encoding if needed
        textureShield1.flipY = false; // Adjust the texture's Y-axis orientation if needed
        textureShield1.minFilter = THREE.LinearFilter; // Set the texture's minification filter if needed
        textureShield1.magFilter = THREE.LinearFilter; // Set the texture's magnification filter if needed
        textureShield1.channel = 0; // Set the desired texture channel (in this case, channel 0)
      });;

      const textureShield2 = textureLoader.load('ShieldGlowB.png', () => {
        textureShield2.encoding = THREE.sRGBEncoding; // Set the texture encoding if needed
        textureShield2.flipY = false; // Adjust the texture's Y-axis orientation if needed
        textureShield2.minFilter = THREE.LinearFilter; // Set the texture's minification filter if needed
        textureShield2.magFilter = THREE.LinearFilter; // Set the texture's magnification filter if needed
        textureShield2.channel = 0; // Set the desired texture channel (in this case, channel 0)
      });

      // Instantiate a loader
      const loader = new GLTFLoader();
      loader.setPath('./resources/Player/');
      loader.load(
        model,
        (gltf) => {
          this.gltf = gltf

          this.mesh_ = gltf.scene.children[0]

          this.mesh_.traverse((child) => {
            if (child.isMesh) {
              child.receiveShadow = false;
            }
          });

          this.mesh_.traverse((object) => {

            if (object.name === 'quarter_meat_GEO') {
              object.visible = false;

            }
            if (object.name === 'half_vegetable_GEO') {
              object.visible = false;

            }
            if (object.name === 'quarter_rice_GEO') {
              object.visible = false;

            }

            if (this.params_.gender === "male") {
              if (object.name === 'Boy_GEO_low_G') {
                object.visible = false;
              }
            } else {
              if (object.name === 'girl_GEO_G') {
                object.visible = false;
              }
            }


            if (this.params_.stage == 1) {
              if (object.name === 'shield_GEO') {
                object.visible = false;

              }
            } else {
              if (object.name === 'shield_GEO') {
                object.visible = true;

              }
            }
          });

          // add the model to the scene

          this.container.add(this.mesh_);

          this.mesh_.scale.set(0.013, 0.013, 0.013);
          this.mesh_.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);

          this.mixer_ = new THREE.AnimationMixer(this.mesh_);
          const clip = THREE.AnimationClip.findByName(gltf.animations, 'Run');
          this.action = this.mixer_.clipAction(clip);
          this.action.play();

        },
        // called while loading is progressing
        function (xhr) {

          console.log((xhr.loaded / xhr.total * 100) + '% loaded');

        },
        // called when loading has errors
        function (error) {
          console.log(error);
        }
      );


      loader.load('shieldglow.gltf', (gltf) => {
        this.gltfShield = gltf
        this.meshShield_ = gltf.scene;
        this.meshShield_.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);

        this.meshShield_.children[0].traverse(function (node) {
          if (node.isMesh) {
            const material = new THREE.MeshBasicMaterial({
              map: textureShield1, blending: THREE.AdditiveBlending,

              depthWrite: false
            });
            material.opacity = 0.45

            material.needsUpdate = true;
            node.material = material;
          }
        });

        this.meshShield_.children[1].traverse(function (node) {
          if (node.isMesh) {
            const material = new THREE.MeshBasicMaterial({
              map: textureShield2, blending: THREE.AdditiveBlending,
              depthWrite: false
            });
            material.opacity = 0.15
            material.needsUpdate = true;

            node.material = material;
          }
        });
        this.meshShield_.visible = false;
        this.container.add(this.meshShield_);


        this.mixerShield_ = new THREE.AnimationMixer(this.meshShield_);
      });

      this.params_.scene.add(this.container);

    }

    //Shield Animation
    SlideShieldAnimation_() {
      if (!this.mixerShield_) {
        return;
      }
      if (this.actionShield) {
        this.actionShield.stop();

      }
      const clip = THREE.AnimationClip.findByName(this.gltfShield.animations, 'squash');
      this.actionShield = this.mixerShield_.clipAction(clip);
      this.actionShield.setLoop(THREE.LoopOnce);

      this.actionShield.play();


    }



    //player model animations
    SlideAnimation_() {
      if (!this.mixer_) {
        return;
      }
      this.action.stop();
      const clip = THREE.AnimationClip.findByName(this.gltf.animations, 'SlideToRun');
      this.action = this.mixer_.clipAction(clip);
      this.action.setLoop(THREE.LoopOnce);

      this.action.play();


    }


    FallAnimation_() {
      if (!this.mixer_) {
        return;
      }
      var highestTimeoutId = setTimeout(";");
      for (var i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
      }
      this.action.stop();
      const clip = THREE.AnimationClip.findByName(this.gltf.animations, 'FallFlat');
      this.action = this.mixer_.clipAction(clip);
      this.action.setLoop(THREE.LoopOnce);
      this.action.play();
      setTimeout(() => {
        this.gameOver = true;
      }, this.action.getClip().duration * 1000);

    }

    RightWallRunAnimation_() {
      if (!this.mixer_) {
        return;
      }
      this.action.stop();
      const clip = THREE.AnimationClip.findByName(this.gltf.animations, "WallRunRightStart");
      this.action = this.mixer_.clipAction(clip);
      this.action.play();


      setTimeout(() => {
        this.action.stop();

        const clip = THREE.AnimationClip.findByName(this.gltf.animations, "WallRunRightCycle");
        this.action = this.mixer_.clipAction(clip);
        this.action.play();
      }, this.action.getClip().duration * 970);

    }

    LeftWallRunAnimation_() {
      if (!this.mixer_) {
        return;

      }
      this.action.stop();
      const clip = THREE.AnimationClip.findByName(this.gltf.animations, "WallRunLeftStart");
      this.action = this.mixer_.clipAction(clip);
      this.action.play();


      setTimeout(() => {
        this.action.stop();

        const clip = THREE.AnimationClip.findByName(this.gltf.animations, "WallRunLeftCycle");
        this.action = this.mixer_.clipAction(clip);
        this.action.play();
      }, this.action.getClip().duration * 970);
    }

    RunAnimation_() {
      if (!this.mixer_) {
        return;

      }
      this.action.stop();
      const clip = THREE.AnimationClip.findByName(this.gltf.animations, 'Run');
      this.action = this.mixer_.clipAction(clip);
      this.action.play();
    }


    JumpAnimation_() {
      if (!this.mixer_) {
        return;

      }
      if (this.actionShield) {
        this.actionShield.stop();

      }
      this.wallEnd = false;
      this.action.stop();
      const clip = THREE.AnimationClip.findByName(this.gltf.animations, 'RunJump');
      this.action = this.mixer_.clipAction(clip);
      this.action.play();
    }

    BigJumpAnimation_() {
      if (!this.mixer_) {
        return;

      }
      this.action.stop();
      const clip = THREE.AnimationClip.findByName(this.gltf.animations, 'BigJump');
      this.action = this.mixer_.clipAction(clip);
      this.action.setLoop(THREE.LoopOnce);
      this.action.time = 0.5;
      this.action.timeScale = 1.5;
      this.action.play();


    }



    //event listener for keyboard controls
    InitInput_() {
      this.keys_ = {
        left: false,
        right: false,
        space: false,
        down: false,
      };

      document.addEventListener('keydown', (event) => {
        if (!this.collapse && !this.pitCollide && !this.wallFail) {

          if (event.keyCode === 37) {
            this.keys_.left = true;
          } else if (event.keyCode === 39) {
            this.keys_.right = true;
          } else if (event.keyCode === 32 || event.keyCode == 38) {
            this.keys_.space = true;
          } else if (event.keyCode === 40) {
            this.keys_.down = true;
          }


        }
      });

      document.addEventListener('keyup', (event) => {
        if (event.keyCode === 32 || event.keyCode == 38) {
          this.keys_.space = false;
        } else if (event.keyCode === 40) {
          this.keys_.down = false;
        }
      });
    }

    //checks if player collides with any other mesh
    CheckCollisions_() {
      const shoogaGlider = this.params_.shoogaGlider.GetColliders();
      const water = this.params_.water.GetColliders();
      const fruitDrink = this.params_.fruitDrink.GetColliders();
      const soda = this.params_.soda.GetColliders();
      const box1 = this.params_.box1.GetColliders();
      const box2 = this.params_.box2.GetColliders();
      const box3 = this.params_.box3.GetColliders();
      const meat = this.params_.meat.GetColliders();
      const vege = this.params_.vege.GetColliders();
      const carbs = this.params_.carbs.GetColliders();
      const trolliumChloride = this.params_.trolliumChloride.GetColliders();
      const pitfall = this.params_.pitfall.GetColliders();

      this.playerBox_.setFromObject(this.mesh_);

      //check for shooga glider monster collision
      for (let c of shoogaGlider) {
        const cur = c.collider;
        if (c.mesh) {
          this.shoogaGliderID = c.mesh.id;

        }

        if (!this.processedshoogaGliderIDs.includes(this.shoogaGliderID) && cur.intersectsBox(this.playerBox_) && !this.sliding_) {
          this.processedshoogaGliderIDs.push(this.shoogaGliderID);
          if (!this.immunitiy) {
            var soundHit = document.getElementById("sound-hit");
            soundHit.play();


            var soundSogias1 = document.getElementById("sound-hit-pagato1");
            var soundSogias2 = document.getElementById("sound-hit-pagato2");

            // Generate a random number between 0 and 1
            var randomNumber = Math.random();

            // Choose which sound to play based on the random number
            if (randomNumber < 0.5) {
              soundSogias1.play(); // Play soundEat1
            } else {
              soundSogias2.play(); // Play soundEat2
            }


            newStamina = this.stamina_ - 10
            this.stamina_ = newStamina;
            if (newStamina <= 0) {
              this.death = "bird"
            }
            this.playerHit = true;
            this.speed = 0.15;
            this.debuff = true;

            document.querySelector('#stamina').src = "./resources/HUD/Water_React_Level.gif"
            document.querySelector('#video-container').style.background = "radial-gradient(circle at center, transparent 0%, rgba(255, 0, 0, 0) 60%, rgba(255, 0, 0, 0.8) 100%)"
            setTimeout(() => {
              // Reset the background color to the original color
              document.querySelector('#stamina').src = "./resources/HUD/Water_Level.gif"
              document.querySelector('#video-container').style.background = ""
            }, 1400)
          }
        }
      }

      //check for trollium chloride monster collision
      for (let c of trolliumChloride) {
        const cur = c.collider;
        if (c.mesh) {
          this.trolliumChlorideID = c.mesh.id;
        }

        if (!this.processedtrolliumChlorideIDs.includes(this.trolliumChlorideID) && cur.intersectsBox(this.playerBox_)) {
          this.processedtrolliumChlorideIDs.push(this.trolliumChlorideID);


          if (!this.immunitiy) {
            var soundHit = document.getElementById("sound-hit");
            soundHit.play();

            var soundSogias1 = document.getElementById("sound-hit-sogias1");
            var soundSogias2 = document.getElementById("sound-hit-sogias2");

            // Generate a random number between 0 and 1
            var randomNumber = Math.random();

            if (randomNumber < 0.5) {
              soundSogias1.play();
            } else {
              soundSogias2.play();
            }


            newStamina = this.stamina_ - 10
            this.stamina_ = newStamina;
            if (newStamina <= 0) {
              this.death = "slap"
            }
            this.playerHit = true;
            this.speed = 0.15
            this.debuff = true;

            document.querySelector('#stamina').src = "./resources/HUD/Water_React_Level.gif"
            document.querySelector('#video-container').style.background = "radial-gradient(circle at center, transparent 0%, rgba(255, 0, 0, 0) 60%, rgba(255, 0, 0, 0.8) 100%)"
            setTimeout(() => {
              // Reset the background color to the original color
              document.querySelector('#stamina').src = "./resources/HUD/Water_Level.gif"
              document.querySelector('#video-container').style.background = ""

            }, 1400)

          }
        }
      }

      //if player collides with pitfall
      for (let c of pitfall) {

        const cur = c.collider;
        if (c.mesh) {
          this.pitfallID = c.mesh.uuid;
          if (!this.processedPitfallIDs.includes(this.pitfallID) && cur.intersectsBox(this.playerBox_)) {
            this.processedPitfallIDs.push(this.pitfallID);

            if (!this.immunitiy) {
              this.soundRunning.volume = 0

              var soundFall = document.getElementById("sound-fall");
              soundFall.play();
              this.FallAnimation_()
              this.death = "pit"
              this.inAir_ = false;
              this.pitCollide = true;
            }
          }
        } else {
          return;
        }
      }

      //if player collides with water
      for (let c of water) {

        const cur = c.collider;
        if (c.mesh) {
          this.waterID = c.mesh.uuid;
          if (!this.processedWaterIDs.includes(this.waterID) && cur.intersectsBox(this.playerBox_)) {


            var soundRightChoice = document.getElementById("sound-correctitem");
            soundRightChoice.play();

            this.processedWaterIDs.push(this.waterID);

            var soundDrink1 = document.getElementById("sound-drink1");
            var soundDrink2 = document.getElementById("sound-drink2");
            var randomNumber = Math.random();


            for (var i = 0; i < this.processedWaterIDs.length; i++) {
              if ((this.processedWaterIDs.length) % 3 === 0) {
                if (randomNumber < 0.5) {
                  soundDrink1.play();
                } else {
                  soundDrink2.play();
                }
              }
            }

            var newStamina = this.stamina_ + 15;
            newStamina = Math.min(newStamina, 100)
            this.stamina_ = newStamina;
            c.mesh.visible = false;
            this.params_.waterGrade.ToggleVisible(water.indexOf(c));

          }
        } else {
          return;
        }
      }

      //if player collides with soda
      for (let c of soda) {
        const cur = c.collider;
        if (c.mesh) {
          this.sodaID = c.mesh.uuid;
          if (!this.processedSodaIDs.includes(this.sodaID) && cur.intersectsBox(this.playerBox_)) {

            if (this.drink === "drank") {
              this.drink = ""
              this.processedSodaIDs.push(this.sodaID);
            } else {
              var soundWrongChoice = document.getElementById("sound-wrongdrink");
              soundWrongChoice.play();
              this.processedSodaIDs.push(this.sodaID);
              var newStamina = this.stamina_ + 20;
              newStamina = Math.min(newStamina, 100)
              this.stamina_ = newStamina;
              this.params_.soda.ToggleVisible();
              this.params_.sodaGrade.ToggleVisible();

              this.sugarDrinks++

              if (this.sugarDrinks == 3) {
                newStamina = this.stamina_ / 2
                this.stamina_ = newStamina;
                this.sugarDrinks = 0
              }


            }


          }
        } else {
          return;
        }
      }

      //if player collides with fruit drink
      for (let c of fruitDrink) {
        const cur = c.collider;
        if (c.mesh) {
          this.fruitID = c.mesh.uuid;
          if (!this.processedFruitIDs.includes(this.fruitID) && cur.intersectsBox(this.playerBox_)) {
            if (this.drink === "drank") {
              this.drink = ""
              this.processedFruitIDs.push(this.fruitID);
            } else {
              // this.drink = "drank"
              this.processedFruitIDs.push(this.fruitID);
              var newStamina = this.stamina_ + 20;
              newStamina = Math.min(newStamina, 100)
              this.stamina_ = newStamina;
              this.params_.fruitDrink.ToggleVisible();
              this.params_.fruitDrinkGrade.ToggleVisible();

              var soundWrongChoice = document.getElementById("sound-wrongdrink");
              soundWrongChoice.play();

              this.sugarDrinks++
              // setTimeout(() => {
              //   this.drink = ""
              // }, 1000);
              if (this.sugarDrinks == 3) {
                newStamina = this.stamina_ / 2
                this.stamina_ = newStamina;
                this.sugarDrinks = 0
              }


            }



          }
        } else {
          return;
        }
      }

      //if player collides with right hpb logo
      for (let c of box1) {

        const cur = c.collider;
        if (c.mesh) {
          this.box1ID = c.mesh.uuid;
          if (!this.processedbox1IDs.includes(this.box1ID) && cur.intersectsBox(this.playerBox_)) {
            if (this.box === "powerdown") {
              this.processedbox1IDs.push(this.box1ID);
            } else {
              var soundRightChoice = document.getElementById("sound-correctitem");
              soundRightChoice.play();
              this.processedbox1IDs.push(this.box1ID);
              this.box = "powerup"
              this.friendsSaved++
              this.RescueUI()
              this.params_.box1.ToggleVisible();
              setTimeout(() => {
                this.box = ""
              }, 1000);
            }
          }
        } else {
          return;
        }
      }

      //if player collides with wrong box 1
      for (let c of box2) {

        const cur = c.collider;
        if (c.mesh) {
          this.box2ID = c.mesh.uuid;
          if (!this.processedbox2IDs.includes(this.box2ID) && cur.intersectsBox(this.playerBox_)) {

            if (this.box === "powerup" || this.box === "powerdown") {
              this.processedbox2IDs.push(this.box2ID);
            } else {
              var soundWrongChoice = document.getElementById("sound-wrongitem");
              soundWrongChoice.play();
              this.processedbox2IDs.push(this.box2ID);
              this.box = "powerdown"
              this.params_.box2.ToggleVisible();
              setTimeout(() => {
                this.box = ""
              }, 1000);
            }



          }
        } else {
          return;
        }
      }

      //if player collides with wrong box 2
      for (let c of box3) {

        const cur = c.collider;
        if (c.mesh) {
          this.box3ID = c.mesh.uuid;
          if (!this.processedbox3IDs.includes(this.box3ID) && cur.intersectsBox(this.playerBox_)) {
            if (this.box === "powerup" || this.box === "powerdown") {
              this.processedbox3IDs.push(this.box3ID);
            } else {
              var soundWrongChoice = document.getElementById("sound-wrongitem");
              soundWrongChoice.play();
              this.processedbox3IDs.push(this.box3ID);
              this.box = "powerdown"
              this.params_.box3.ToggleVisible();
              setTimeout(() => {
                this.box = ""
              }, 1000);
            }


          }
        } else {
          return;
        }
      }

      //if player collides with meat
      for (let c of meat) {

        const cur = c.collider;
        if (c.mesh) {
          this.meatID = c.mesh.uuid;
          if (!this.processedMeatIDs.includes(this.meatID) && cur.intersectsBox(this.playerBox_)) {

            if (this.food === "ate") {
              this.processedMeatIDs.push(this.meatID);
            } else if (!this.immunitiy) {
              this.processedMeatIDs.push(this.meatID);
              this.food = "ate"
              this.meatProp = this.meatProp + 1


              if (this.propArray.length < 4) {
                if (this.meatProp >= 1) {
                  document.getElementById("sheildHUD-blue").style.zIndex = "1"
                  this.mesh_.traverse((object) => {
                    if (object.name === 'quarter_meat_GEO') {
                      object.visible = true;
                    }
                  });
                } else {
                  document.getElementById("sheildHUD-blue").style.zIndex = "-1"
                  this.mesh_.traverse((object) => {
                    if (object.name === 'quarter_meat_GEO') {
                      object.visible = false;
                    }
                  });
                }
              }
              var soundEat1 = document.getElementById("sound-eat1");
              var soundEat2 = document.getElementById("sound-eat2");

              // Generate a random number between 0 and 1
              var randomNumber = Math.random();

              // Choose which sound to play based on the random number
              if (randomNumber < 0.5) {
                soundEat1.play(); // Play soundEat1
              } else {
                soundEat2.play(); // Play soundEat2
              }

              this.AddFood('meat')
              this.GetFood()
              c.mesh.visible = false;

              setTimeout(() => {
                this.food = ""
              }, 1000);
            }


          }
        } else {
          return;
        }

        //if player collides with vege
        for (let c of vege) {

          const cur = c.collider;
          if (c.mesh) {
            this.vegeID = c.mesh.uuid;
            if (!this.processedVegeIDs.includes(this.vegeID) && cur.intersectsBox(this.playerBox_)) {

              if (this.food === "ate") {
                this.processedVegeIDs.push(this.vegeID);
              } else if (!this.immunitiy) {
                this.processedVegeIDs.push(this.vegeID);
                this.food = "ate"
                this.vegeProp = this.vegeProp + 1


                if (this.propArray.length < 4) {
                  if (this.vegeProp == 2) {
                    document.getElementById("sheildHUD-green").style.zIndex = "1"
                    this.mesh_.traverse((object) => {
                      if (object.name === 'half_vegetable_GEO') {
                        object.visible = true;
                      }
                    });


                  } else {
                    document.getElementById("sheildHUD-green").style.zIndex = "-1"
                    this.mesh_.traverse((object) => {
                      if (object.name === 'half_vegetable_GEO') {
                        object.visible = false;
                      }
                    });

                  }
                }

                var soundEat1 = document.getElementById("sound-eat1");
                var soundEat2 = document.getElementById("sound-eat2");

                var randomNumber = Math.random();

                if (randomNumber < 0.5) {
                  soundEat1.play(); // Play soundEat1
                } else {
                  soundEat2.play(); // Play soundEat2
                }

                this.AddFood('vege')
                this.GetFood()
                c.mesh.visible = false;

                setTimeout(() => {
                  this.food = ""
                }, 1000);
              }
            }
          } else {
            return;
          }
        }
        //if player collides with carbs
        for (let c of carbs) {

          const cur = c.collider;
          if (c.mesh) {
            this.carbsID = c.mesh.uuid;
            if (!this.processedCarbsIDs.includes(this.carbsID) && cur.intersectsBox(this.playerBox_)) {



              if (this.food === "ate") {
                this.processedCarbsIDs.push(this.carbsID);
              } else if (!this.immunitiy) {

                this.processedCarbsIDs.push(this.carbsID);
                this.food = "ate"
                this.carbProp = this.carbProp + 1

                if (this.propArray.length < 4) {

                  if (this.carbProp >= 1) {
                    document.getElementById("sheildHUD-yellow").style.zIndex = "1"

                    this.mesh_.traverse((object) => {

                      if (object.name === 'quarter_rice_GEO') {
                        object.visible = true;

                      }
                    });


                  } else {
                    sheildHUD
                    this.mesh_.traverse((object) => {

                      if (object.name === 'quarter_rice_GEO') {
                        object.visible = false;

                      }
                    });

                  }
                }
                var soundEat1 = document.getElementById("sound-eat1");
                var soundEat2 = document.getElementById("sound-eat2");

                var randomNumber = Math.random();

                if (randomNumber < 0.5) {
                  soundEat1.play(); // Play soundEat1
                } else {
                  soundEat2.play(); // Play soundEat2
                }
                this.AddFood('carbs')
                this.GetFood()
                c.mesh.visible = false;


                setTimeout(() => {
                  this.food = ""
                }, 1000);
              }


            }
          } else {
            return;
          }
        }
      }
    }
    getSpeed(callback) {
      const result = this.speed;
      callback(result);
    }

    AddFood(food) {
      if (this.propArray.length >= 4) {
        this.propArray.shift(); // Remove the first (oldest) item


      }
      this.propArray.push(food); // Add the new item to the end of the array
    }

    GetFood() {
      let vegePortion = 0;
      let meatPortion = 0;
      let carbsPortion = 0;

      if (!this.immunitiy) {

        for (let i = 0; i < this.propArray.length; i++) {
          if (this.propArray[i] === "vege") {
            vegePortion = vegePortion + 1

          } else if (this.propArray[i] === "meat") {
            meatPortion = meatPortion + 1

          } else if (this.propArray[i] === "carbs") {
            carbsPortion = carbsPortion + 1

          }
        }

        if (this.propArray.length == 1) {
          if (this.propArray[0] == 'vege') {
            document.getElementById("food1").src = "./resources/Shield/Vegtable_shield_UI.png"
            document.getElementById("food1").style.bottom = "24vw"

          }
          else if (this.propArray[0] == 'meat') {
            document.getElementById("food1").src = "./resources/Shield/Meat_shield_UI.png"
          }
          else if (this.propArray[0] == 'carbs') {
            document.getElementById("food1").src = "./resources/Shield/Rice_shield_UI.png"
            document.getElementById("food1").style.bottom = "24vw"

          }
        } else if (this.propArray.length == 2) {
          if (this.propArray[1] == 'vege') {
            document.getElementById("food2").src = "./resources/Shield/Vegtable_shield_UI.png"
            document.getElementById("food2").style.bottom = "24vw"

          }
          else if (this.propArray[1] == 'meat') {
            document.getElementById("food2").src = "./resources/Shield/Meat_shield_UI.png"
          }
          else if (this.propArray[1] == 'carbs') {
            document.getElementById("food2").src = "./resources/Shield/Rice_shield_UI.png"
            document.getElementById("food2").style.bottom = "24vw"


          }
        } else if (this.propArray.length == 3) {
          if (this.propArray[2] == 'vege') {
            document.getElementById("food3").src = "./resources/Shield/Vegtable_shield_UI.png"
            document.getElementById("food3").style.bottom = "24vw"

          }
          else if (this.propArray[2] == 'meat') {
            document.getElementById("food3").src = "./resources/Shield/Meat_shield_UI.png"
          }
          else if (this.propArray[2] == 'carbs') {
            document.getElementById("food3").src = "./resources/Shield/Rice_shield_UI.png"
            document.getElementById("food3").style.bottom = "24vw"
          }
        } else if (this.propArray.length == 4 && !this.firstFour) {
          if (!this.firstFour) {
            this.mesh_.traverse((object) => {
              if (object.name === 'quarter_meat_GEO') {
                object.visible = false;
              }
              if (object.name === 'half_vegetable_GEO') {
                object.visible = false;
              }
              if (object.name === 'quarter_rice_GEO') {
                object.visible = false;
              }
            })
            document.getElementById("sheildHUD-yellow").style.zIndex = "-1"
            document.getElementById("sheildHUD-green").style.zIndex = "-1"
            document.getElementById("sheildHUD-blue").style.zIndex = "-1"

            this.firstFour = true;
            if (this.propArray[3] == 'vege') {
              document.getElementById("food4").src = "./resources/Shield/Vegtable_shield_UI.png"
              document.getElementById("food4").style.bottom = "24vw"

            }
            else if (this.propArray[3] == 'meat') {
              document.getElementById("food4").src = "./resources/Shield/Meat_shield_UI.png"
            }
            else if (this.propArray[3] == 'carbs') {
              document.getElementById("food4").src = "./resources/Shield/Rice_shield_UI.png"
              document.getElementById("food4").style.bottom = "24vw"


            }
          }

        } else if (this.propArray.length == 4 && this.firstFour) {
          var id = "";
          for (var i = 0; i < this.propArray.length; i++) {
            if (i == 0) {
              id = "food1"
            } else if (i == 1) {
              id = "food2"
            } else if (i == 2) {
              id = "food3"
            } else if (i == 3) {
              id = "food4"
            }
            if (this.propArray[i] == 'vege') {
              document.getElementById(id).src = "./resources/Shield/Vegtable_shield_UI.png"
              document.getElementById(id).style.bottom = "24vw"

            }
            else if (this.propArray[i] == 'meat') {
              document.getElementById(id).src = "./resources/Shield/Meat_shield_UI.png"
              document.getElementById(id).style.bottom = "24vw"

            }
            else if (this.propArray[i] == 'carbs') {
              document.getElementById(id).src = "./resources/Shield/Rice_shield_UI.png"
              document.getElementById(id).style.bottom = "24vw"

            }
          }

        }

      }


      if (this.propArray.length == 4) {
        if (vegePortion == 2 && meatPortion == 1 && carbsPortion == 1) {
          this.immunitiy = true;
          this.soundShield.play();

          this.mesh_.traverse((object) => {
            if (object.name === 'quarter_meat_GEO') {
              object.visible = true;
            }
            if (object.name === 'half_vegetable_GEO') {
              object.visible = true;
            }
            if (object.name === 'quarter_rice_GEO') {
              object.visible = true;
            }
          })
          document.getElementById("sheildHUD-yellow").style.zIndex = "1"
          document.getElementById("sheildHUD-green").style.zIndex = "1"
          document.getElementById("sheildHUD-blue").style.zIndex = "1"

          this.mesh_.traverse((object) => {

            if (this.params_.gender === "male") {

              if (object.name === 'Boy_GEO_low') {
                object.visible = false;
              }
              if (object.name === 'Boy_GEO_low_G') {
                object.visible = true;
              }
            } else {
              if (object.name === 'girl_GEO') {
                object.visible = false;
              }
              if (object.name === 'girl_GEO_G') {
                object.visible = true;
              }
            }


          })
          this.meshShield_.visible = true;

          document.getElementById("shieldTimer").style.zIndex = "1";
        } else {
          this.mesh_.traverse((object) => {
            if (object.name === 'quarter_meat_GEO') {
              if (meatPortion) {
                object.visible = true;
                document.getElementById("sheildHUD-blue").style.zIndex = "1"

              } else {
                document.getElementById("sheildHUD-blue").style.zIndex = "-1"

                object.visible = false;
              }
            }
            if (object.name === 'half_vegetable_GEO') {
              if (vegePortion >= 2) {
                object.visible = true;
                document.getElementById("sheildHUD-green").style.zIndex = "1"

              } else {
                object.visible = false;
                document.getElementById("sheildHUD-green").style.zIndex = "-1"

              }
            }
            if (object.name === 'quarter_rice_GEO') {
              if (carbsPortion) {
                object.visible = true;
                document.getElementById("sheildHUD-yellow").style.zIndex = "1"

              } else {
                object.visible = false;
                document.getElementById("sheildHUD-yellow").style.zIndex = "-1"

              }
            }


          })
        }
      }
    }

    //RESCUED UI

    RescueUI() {
      var textID = "";
      var slideImgSrc = "rescuebust" + this.friendsSaved;
      for (var i = 0; i < this.friendsSaved; i++) {

        textID = 'rescue' + (i + 1)
        document.getElementById(textID).src = "./resources/Rescued_Friend_UI/Friend" + (i + 1) + ".png";

      }
      // Get the slide image element
      var slideImage = document.getElementById(slideImgSrc);
      // Start the animation
      slideImage.style.display = 'block'
      slideImage.style.animationPlayState = 'running';

      // Reset the animation after 1 second (1000 milliseconds)
      setTimeout(function () {
        slideImage.style.animationPlayState = 'paused';
        slideImage.style.right = '-100%';
        slideImage.style.display = 'none'

      }, 2000);
    }



    //send back callbacks for speed and collision
    getPitCollide(callback) {
      const result = this.pitCollide
      callback(result);
    }

    getStamina(callback) {
      const result = this.stamina_;
      callback(result);
    }

    getCollapse(callback) {
      const result = this.collapse
      callback(result);
    }


    //player movement with swipe gestures
    SwipeLeft(timeElapsed) {
      if (this.keys_.right) {
        this.keys_.left = false;

        if (this.position_.z >= 0) {
          this.position_.z = (Math.round(this.positionShield_.z * 10) / 10) + (timeElapsed * 2.5)
          if (this.position_.z >= 3) {
            this.position_.z = 3
            this.positionShield_.z = -0.5

            this.keys_.right = false;
          }
        } else if (this.position_.z >= -3) {
          this.position_.z = (Math.round(this.position_.z * 10) / 10) + (timeElapsed * 2.5)
          if (this.position_.z >= 0) {
            this.keys_.right = false;
            this.position_.z = 0
            this.positionShield_.z = 0
          }
        } else if (this.position_.z >= 3) {
          this.positionShield_.z = -0.5
          this.position_.z = 3
          return;
        }
        this.soundDash.currentTime = 0
        this.soundDash.play();
      } else {
        if (this.position_.z <= 0) {
          this.position_.z = (Math.round(this.position_.z * 10) / 10) + (timeElapsed * -2.5);
          if (this.position_.z <= -3) {
            this.positionShield_.z = 0.2

            this.position_.z = -3
            this.keys_.left = false;
          }

        } else if (this.position_.z <= 3) {
          this.position_.z = (Math.round(this.position_.z * 10) / 10) + (timeElapsed * -2.5);
          if (this.position_.z <= 0) {
            this.keys_.left = false;
            this.positionShield_.z = 0

            this.position_.z = 0
          }
        } else if (this.position_.z <= -3) {
          this.positionShield_.z = 0.2

          this.position_.z = -3

          return;
        }
        this.soundDash.currentTime = 0
        this.soundDash.play();
      }


    }

    SwipeFullLeft(timeElapsed) {

      if (this.position_.z <= 3) {
        this.position_.z = (Math.round(this.position_.z * 10) / 10) + ((timeElapsed * -2.5) / 1.5);
        this.position_.z = (Math.round(this.position_.z * 10) / 10)

        if (this.position_.z <= -3) {
          this.position_.z = -3;

          this.keys_.left = false;
        }
      } else if (this.position_.z == -3) {
        return;
      }
      this.soundDash.currentTime = 0
      this.soundDash.play();
    }

    SwipeFullRight(timeElapsed) {

      if (this.position_.z >= -3) {
        this.position_.z = (Math.round(this.position_.z * 10) / 10) + ((timeElapsed * 2.5) / 1.5);
        this.position_.z = (Math.round(this.position_.z * 10) / 10)
        if (this.position_.z >= 3) {
          this.position_.z = 3
          this.keys_.right = false;
        }
      } else if (this.position_.z == 3) {
        return;
      }
      this.soundDash.currentTime = 0
      this.soundDash.play();
    }

    SwipeRight(timeElapsed) {
      if (this.keys_.left) {
        this.keys_.right = false;
        if (this.position_.z <= 0) {
          this.position_.z = (Math.round(this.position_.z * 10) / 10) + (timeElapsed * -2.5);

          if (this.position_.z <= -3) {
            this.position_.z = -3
            this.positionShield_.z = 0.2

            this.keys_.left = false;
          }

        } else if (this.position_.z <= 3) {
          this.position_.z = (Math.round(this.position_.z * 10) / 10) + (timeElapsed * -2.5);

          if (this.position_.z <= 0) {
            this.keys_.left = false;
            this.position_.z = 0
            this.positionShield_.z = 0
          }
        } else if (this.position_.z <= -3) {
          this.position_.z = -3
          this.positionShield_.z = 0.2

          return;
        }
        this.soundDash.currentTime = 0
        this.soundDash.play();
      } else {
        if (this.position_.z >= 0) {
          this.position_.z = (Math.round(this.position_.z * 10) / 10) + (timeElapsed * 2.5)
          if (this.position_.z >= 3) {
            this.position_.z = 3
            this.positionShield_.z = -0.5
            this.keys_.right = false;
          }
        } else if (this.position_.z >= -3) {

          this.position_.z = (Math.round(this.position_.z * 10) / 10) + (timeElapsed * 2.5)

          if (this.position_.z >= 0) {
            this.keys_.right = false;
            this.position_.z = 0
            this.positionShield_.z = 0
          }
        } else if (this.position_.z >= 3) {
          this.position_.z = 3
          this.positionShield_.z = -0.5

          return;
        }
        this.soundDash.currentTime = 0
        this.soundDash.play();
      }

    }


    SwipeUp() {
      if (this.position_.y == 0.0) {
        if (this.position_.z == 0 || this.position_.z == -3 || this.position_.z == 3) {
          this.velocity_ = 30;
          this.inAir_ = true;

        }

      }
      if (this.inAir_) {
        this.JumpAnimation_()
        this.sliding_ = false;
        this.downPressed_ = false
        this.soundJump1 = document.getElementById("sound-jump1");
        this.soundJump2 = document.getElementById("sound-jump2");
        this.soundJump3 = document.getElementById("sound-jump3");

        var randomNumber = Math.random();
        this.soundRunning.volume = 0
        if (randomNumber < 0.34) {
          this.soundJump1.play();
        } else if (randomNumber < 0.66) {
          this.soundJump2.play();
        } else {
          this.soundJump3.play();
        }

      }
    }

    SwipeDown() {
      if (!this.downPressed_) {
        if (this.position_.y == 0.0) {
          this.velocity_ = 10;
          this.sliding_ = true;
        }
        if (this.sliding_) {
          this.SlideAnimation_()
          this.SlideShieldAnimation_()
          this.downPressed_ = true
          var soundSlide1 = document.getElementById("sound-slide1");
          var soundSlide2 = document.getElementById("sound-slide2");
          var soundSlide3 = document.getElementById("sound-slide3");
          var randomNumber = Math.random();
          this.soundRunning.volume = 0

          if (randomNumber < 0.34) {
            soundSlide1.play(); // Play soundEat1
          } else if (randomNumber < 0.66) {
            soundSlide2.play(); // Play soundEat2
          } else {
            soundSlide3.play(); // Play soundEat2
          }
        }
      }
    }


    Update(timeElapsed, pause, wallPosition, swipeLeft, swipeRight, showChase) {

      if (showChase) {
        this.keys_.left = false;
        this.keys_.right = false;
        this.keys_.space = false;
        this.keys_.down = false;
      }
      this.timefactor += timeElapsed

      this.angle = this.timefactor * 0.2
      // Calculate the sine value within the desired range
      const sinValue = Math.sin(this.angle);
      this.mappedSinValue = (sinValue + 1) * (this.maxValue - this.minValue) / 2 + this.minValue;

      // Calculate the cosine value within the desired range
      const cosValue = Math.cos(this.angle);
      this.mappedCosValue = (cosValue + 1) * (this.maxValue - this.minValue) / 2 + this.minValue;


      //if shield is active
      if (this.immunitiy) {
        this.shieldTime -= timeElapsed * 0.83;

        this.meshShield_.children[1].traverse((node) => {
          if (node.isMesh) {
            node.material.opacity = this.mappedSinValue
            node.needsUpdate = true;

          }
        });

        this.meshShield_.children[0].traverse((node) => {
          if (node.isMesh) {
            node.material.opacity = this.mappedCosValue
            node.needsUpdate = true;
          }
        });

        document.getElementById("fullShield").style.height = this.shieldTime + "%"
        if (this.shieldTime <= 0) {
          document.getElementById("sheildHUD-blue").style.zIndex = "-1"
          document.getElementById("sheildHUD-green").style.zIndex = "-1"
          document.getElementById("sheildHUD-yellow").style.zIndex = "-1"
          document.getElementById("shieldTimer").style.zIndex = "-1";
          document.getElementById("food1").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
          document.getElementById("food2").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
          document.getElementById("food3").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
          document.getElementById("food4").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
          document.getElementById("food1").style.bottom = "24vw"
          document.getElementById("food2").style.bottom = "24vw"
          document.getElementById("food3").style.bottom = "24vw"
          document.getElementById("food4").style.bottom = "24vw"
          this.propArray = []
          this.immunitiy = false;
          this.shieldTime = 100;
          this.soundShield.pause();
          this.soundShield.currentTime = 0;


          this.meatProp = 0;
          this.vegeProp = 0;
          this.carbProp = 0;

          this.mesh_.traverse((object) => {
            if (object.name === 'quarter_meat_GEO') {
              object.visible = false;

            }
            if (object.name === 'half_vegetable_GEO') {
              object.visible = false;

            }
            if (object.name === 'quarter_rice_GEO') {
              object.visible = false;

            }
            if (this.params_.gender === "male") {

              if (object.name === 'Boy_GEO_low') {
                object.visible = true;
              }
              if (object.name === 'Boy_GEO_low_G') {
                object.visible = false;
              }
            } else {
              if (object.name === 'girl_GEO') {
                object.visible = true;
              }
              if (object.name === 'girl_GEO_G') {
                object.visible = false;
              }
            }
          });
          this.meshShield_.visible = false;

        }
      }


      if (!this.wallLoaded) {
        this.wallArray = wallPosition
        this.wallLoaded = true;
      }
      // wall running sheesh hard coded
      if (this.wallArray.length != 0) {
        if (this.wallArray.length <= 4) {
          //wall running right wall mechanics
          if (this.wallArray[0].z > 0) {
            if (this.wallArray[0].x < 18 && this.wallArray[0].x > -14 && !this.wallFail) {
              //dont jump u die 
              if (this.position_.y == 0 && this.wallArray[1].x > 15 && this.wallArray[0].x > 0 && !this.wallFail) {
                this.wallFail = true;
                this.inAir_ = false;
                this.FallAnimation_()
                this.death = "pit"
              }

              //click left way too early
              if (this.onWall && (this.keys_.left || swipeLeft) && this.wallArray[1].x > 16) {
                this.SwipeLeft(timeElapsed)
                this.onWall = false;
                this.wallFail = true;
                this.inAir_ = false;
                this.FallAnimation_()
                this.death = "pit"

              }

              //right wall first -> if u jump and go to right , u will stay in that y position.
              if (this.inAir_ && (this.keys_.right || swipeRight) && !this.wallFail) {
                this.SwipeRight(timeElapsed)
                if (this.position_.z >= 2.5 && !this.wallFail) {

                  this.position_.z = 3
                  if (this.position_.y != 3) {
                    if (this.position_.y > 3) {
                      this.position_.y = this.position_.y - (timeElapsed * 0.083)
                      if (this.position_.y < 3.1) {
                        this.position_.y = 3
                      }
                    } else {
                      this.position_.y = this.position_.y + (timeElapsed * 0.083)
                      if (this.position_.y > 2.9) {
                        this.position_.y = 3
                      }
                    }

                  }
                  this.inAir_ = false;
                  this.onWall = true;
                  this.RightWallRunAnimation_()
                  this.soundRunning.play()
                }
              }

              if (this.onWall) {

                if (this.position_.y != 3) {
                  if (this.position_.y > 3) {
                    this.position_.y = this.position_.y - (timeElapsed * 0.083)
                    if (this.position_.y < 3.1) {
                      this.position_.y = 3
                    }
                  } else {
                    this.position_.y = this.position_.y + (timeElapsed * 0.083)
                    if (this.position_.y > 2.9) {
                      this.position_.y = 3
                    }
                  }

                }
              }



            }
            //fall down when wall ends
            if (this.wallArray[0].x < -13 && this.position_.z == 3 && !this.wallFail) {
              this.wallFail = true;
              this.FallAnimation_()
              this.death = "pit"

            }



            //wall running left wall mechanics
            if (this.wallArray[1].x < 18 && this.wallArray[1].x > -14 && !this.wallFail) {

              //left wall
              if (!this.inAir_ && (this.keys_.left || swipeLeft) && this.position_.z != -3 && !this.wallFail) {

                this.SwipeFullLeft(timeElapsed)


                if (this.position_.z != 3 || this.position_.z != -3) {
                  if (!this.toggleJumpAnimation) {
                    this.toggleJumpAnimation = true;
                    this.JumpAnimation_()
                  }
                }
                if (this.position_.z <= -2.6) {
                  this.toggleJumpAnimation = false;
                  this.onWall = true;
                  this.LeftWallRunAnimation_()
                  this.soundRunning.play()

                }

              }

            }
            //fall down when wall ends
            if (this.wallArray[1].x < -11) {
              this.inAir_ = true;
              this.onWall = false;
              this.wallArray.splice(0, 2);
              this.BigJumpAnimation_()
              this.wallEnd = true;
            }

          } else {

            //wall start left first
            if (this.wallArray[0].x < 16 && this.wallArray[0].x > -14 && !this.wallFail) {
              //dont jump u die 
              if (this.position_.y == 0 && this.wallArray[1].x > 15 && this.wallArray[0].x > 0 && !this.wallFail) {
                this.wallFail = true;
                this.inAir_ = false;
                this.FallAnimation_()
                this.death = "pit"

              }

              //click right way too early
              if (this.onWall && (this.keys_.right || swipeRight) && this.wallArray[1].x > 15) {
                this.SwipeRight(timeElapsed)
                this.onWall = false;
                this.wallFail = true;
                this.inAir_ = false;
                this.FallAnimation_()
                this.death = "pit"


              }

              //left wall first -> if u jump and go to left , u will stay in that y position.
              if (this.inAir_ && (this.keys_.left || swipeLeft) && !this.wallFail) {
                this.SwipeLeft(timeElapsed)
                if (this.position_.z <= -2.5 && !this.wallFail) {

                  this.position_.z = -3
                  if (this.position_.y != -3) {
                    if (this.position_.y > 3) {
                      this.position_.y = this.position_.y - (timeElapsed * 0.083)
                      if (this.position_.y < 3.1) {
                        this.position_.y = 3
                      }
                    } else {
                      this.position_.y = this.position_.y + (timeElapsed * 0.083)
                      if (this.position_.y > 2.9) {
                        this.position_.y = 3
                      }
                    }

                  }
                  this.inAir_ = false;
                  this.onWall = true;
                  this.LeftWallRunAnimation_()
                  this.soundRunning.play()

                }
              }

              if (this.onWall) {

                if (this.position_.y != 3) {
                  if (this.position_.y > 3) {
                    this.position_.y = this.position_.y - (timeElapsed * 0.083)
                    if (this.position_.y < 3.1) {
                      this.position_.y = 3
                    }
                  } else {
                    this.position_.y = this.position_.y + (timeElapsed * 0.083)
                    if (this.position_.y > 2.9) {
                      this.position_.y = 3
                    }
                  }

                }
              }



            }
            //fall down when wall ends
            if (this.wallArray[0].x < -13 && this.position_.z == -3 && !this.wallFail) {

              this.wallFail = true;
              this.FallAnimation_()
              this.death = "pit"

            }

            //wall running right wall mechanics
            if (this.wallArray[1].x < 18 && this.wallArray[1].x > -14 && !this.wallFail) {


              //right wall
              if (!this.inAir_ && (this.keys_.right || swipeRight) && this.position_.z != 3 && !this.wallFail) {

                this.SwipeFullRight(timeElapsed)


                if (this.position_.z != 3 || this.position_.z != -3) {
                  if (!this.toggleJumpAnimation) {
                    this.toggleJumpAnimation = true;
                    this.JumpAnimation_()
                  }
                }
                if (this.position_.z >= 2.6) {
                  this.toggleJumpAnimation = false;
                  this.onWall = true;
                  this.RightWallRunAnimation_()
                  this.soundRunning.play()

                }

              }

            }
            //fall down when wall ends
            if (this.wallArray[1].x < -11) {
              this.inAir_ = true;
              this.onWall = false;
              this.wallArray.splice(0, 2);
              this.BigJumpAnimation_()
              this.wallEnd = true;
            }

          }
        } else if (this.wallArray.length > 4) {
          //wall running right wall mechanics
          if (this.wallArray[0].x < 13 && this.wallArray[0].x > -14 && !this.wallFail) {
            //dont jump u die 
            if (this.position_.y == 0 && this.wallArray[0].x > 0 && !this.wallFail) {
              this.wallFail = true;
              this.inAir_ = false;
              this.FallAnimation_()
              this.death = "pit"

            }

            //right wall first -> if u jump and go to right , u will stay in that y position.
            if (this.inAir_ && (this.keys_.right || swipeRight) && !this.wallFail) {
              this.SwipeRight(timeElapsed)
              if (this.position_.z >= 2.5 && !this.wallFail) {

                this.position_.z = 3
                if (this.position_.y != 3) {
                  if (this.position_.y > 3) {
                    this.position_.y = this.position_.y - (timeElapsed * 0.083)
                    if (this.position_.y < 3.1) {
                      this.position_.y = 3
                    }
                  } else {
                    this.position_.y = this.position_.y + (timeElapsed * 0.083)
                    if (this.position_.y > 2.9) {
                      this.position_.y = 3
                    }
                  }

                }
                this.inAir_ = false;
                this.onWall = true;
                this.RightWallRunAnimation_()
                this.soundRunning.play()

              }
            }

            if (this.onWall) {

              if (this.position_.y != 3) {
                if (this.position_.y > 3) {
                  this.position_.y = this.position_.y - (timeElapsed * 0.083)
                  if (this.position_.y < 3.1) {
                    this.position_.y = 3
                  }
                } else {
                  this.position_.y = this.position_.y + (timeElapsed * 0.083)
                  if (this.position_.y > 2.9) {
                    this.position_.y = 3
                  }
                }

              }
            }

          }
          //fall down when wall ends
          if (this.wallArray[0].x < - 8 && this.position_.z == 3 && !this.wallFail) {
            this.inAir_ = true;
            this.onWall = false;
            this.wallArray.splice(0, 1);
            this.BigJumpAnimation_()
            this.wallEnd = true;
          }
        }
      }


      //player movement with keyboard controls
      if (this.keys_.space && this.position_.y == 0.0) {
        this.SwipeUp(timeElapsed * 0.083 / 5)

      }

      if (this.keys_.down && this.position_.y == 0.0 && !this.downPressed_ && !this.inAir_) {
        this.SwipeDown()

      }

      if (this.keys_.left && !this.onWall) {

        this.SwipeLeft(timeElapsed)


      } else if (this.onWall && this.position_.z == -3) {
        this.keys_.left = false;

      }

      if (this.keys_.right && !this.onWall) {

        this.SwipeRight(timeElapsed)


      } else if (this.onWall && this.position_.z == 3) {
        this.keys_.right = false;

      }

      //jump and slide calculation.
      if (this.inAir_) {

        const acceleration = -115 * ((timeElapsed * 0.083) / 1.6);
        this.position_.y += ((timeElapsed * 0.083) / 1.6) * (this.velocity_ + acceleration * 0.5);


        this.position_.y = Math.max(this.position_.y, 0.0);

        this.velocity_ += acceleration;
        this.velocity_ = Math.max(this.velocity_, -100);

        if (this.position_.y == 0.0) {
          this.soundJump1.pause();
          this.soundJump1.currentTime = 0;
          this.soundJump2.pause();
          this.soundJump2.currentTime = 0;
          this.soundJump3.pause();
          this.soundJump3.currentTime = 0;
          this.soundRunning.volume = 0.5

        }

        if (this.position_.y == 0) {
          if (!this.wallEnd) {
            this.RunAnimation_();
          } else {
            setTimeout(() => {
              this.RunAnimation_()
            }, 900);
          }
        }
      }

      if (this.sliding_) {
        const acceleration = -8.8 * (timeElapsed * 0.083);

        this.slideTimer_ -= (timeElapsed * 0.083) * (this.velocity_ + acceleration * 0.5);
        this.slideTimer_ = Math.min(this.slideTimer_, 0.0);
        this.slideTimer_ = Math.max(this.slideTimer_, -1.0);

        this.velocity_ += acceleration;
        this.velocity_ = Math.max(this.velocity_, -100);

      }


      if (this.position_.y == 0.0) {
        this.inAir_ = false;

      }



      if (this.position_.y <= 0.0 && this.sliding_ == true) {
        if (this.slideTimer_ == 0) {
          this.downPressed_ = false;
          this.sliding_ = false;
          this.RunAnimation_();
          this.soundRunning.volume = 0.5

        }
      }


      //update player animation, position and check collision
      if (this.mesh_) {
        this.mixer_.update(timeElapsed * 0.083);
        this.mixerShield_.update(timeElapsed * 0.083);

        this.container.position.copy(this.position_);
        this.meshShield_.position.copy(this.positionShield_)

        this.CheckCollisions_();
      }

      //update stamina
      this.UpdateStamina_(timeElapsed * 0.083, pause);

      //check speed decay

      if (!pause) {
        if (this.debuff) {
          if (this.speed > 0.2) {
            this.speed = 0.2
            this.debuff = false
          }
          if (this.speed < 0.2) {
            this.speed += (timeElapsed / 30)

          }
        }
      }
    }

    // Stamina
    UpdateStamina_(timeElapsed, pause) {
      var time = timeElapsed
      if (!pause && time < 0.1) {

        this.stamina_ -= time * 3.5
        const staminaText = (16.55 * Math.round((this.stamina_ * 10)) / 1000)
        const staminaText2 = 26.2 - staminaText

        document.getElementById("stamina").style.left = "-" + staminaText2 + "vw"
        if (this.stamina_ <= 0 && !this.collapse && !this.onWall) {
          this.collapse = true;
          this.inAir_ = false;
          this.sliding_ = false;
          this.FallAnimation_();
          this.soundShield.pause();
        }
      }
    }
  };

  return {
    Player: Player,
  };
})();
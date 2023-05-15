// import * as THREE from 'https://storage.googleapis.com/sproud-hpb/node_modules/three/build/three.module.js';

// import { GLTFLoader } from "https://storage.googleapis.com/sproud-hpb/node_modules/three/examples/jsm/loaders/GLTFLoader.js";


import * as THREE from './../node_modules/three/build/three.module.js';

import { GLTFLoader } from "./../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

export const player = (() => {

  class Player {
    constructor(params) {
      //player properties
      this.position_ = new THREE.Vector3(0, 0, 0);
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


      //init
      this.params_ = params;
      this.LoadModel_();
      this.InitInput_();

    }

    LoadModel_() {
      let model;
      let texturePath;

      if (this.params_.gender === "male") {
        model = 'BoyAll.gltf';
      } else {
        model = 'GirlAll.gltf';
      }

      // Load the texture image
      const textureLoader = new THREE.TextureLoader();

      const texture = textureLoader.load(texturePath);


      // Instantiate a loader
      const loader = new GLTFLoader();
      loader.setPath('./resources/Player/Player_YBot/');
      loader.load(
        model,
        (gltf) => {
          console.log(gltf.scene.children[0].children[1])
          this.gltf = gltf


          this.mesh_ = gltf.scene.children[0]

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


          this.params_.scene.add(this.mesh_);
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
          } else if (event.keyCode === 32) {
            this.keys_.space = true;
          } else if (event.keyCode === 40) {
            this.keys_.down = true;
          }


        }
      });

      document.addEventListener('keyup', (event) => {
        if (event.keyCode === 32) {
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
          if (this.immunitiy) {
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

            this.params_.scene.add(this.mesh_);
            this.immunitiy = false
            this.propArray = []
            document.getElementById("shieldTimer").style.zIndex = "-1";
            this.shieldTime = 100
            document.getElementById("food1").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
            document.getElementById("food2").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
            document.getElementById("food3").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
            document.getElementById("food4").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
            document.getElementById("food1").style.bottom = "7.5vw"
            document.getElementById("food2").style.bottom = "7.5vw"
            document.getElementById("food3").style.bottom = "7.5vw"
            document.getElementById("food4").style.bottom = "7.5vw"
          } else {
            newStamina = this.stamina_ - 10
            this.stamina_ = newStamina;
            this.playerHit = true;
            this.speed = 0.1;
            this.debuff = true;

            document.querySelector('#video-container').style.background = "radial-gradient(circle at center, transparent 0%, rgba(255, 0, 0, 0) 60%, rgba(255, 0, 0, 0.8) 100%)"
            setTimeout(() => {
              // Reset the background color to the original color
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


          if (this.immunitiy) {
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

            this.params_.scene.add(this.mesh_);
            this.immunitiy = false
            this.propArray = []
            document.getElementById("shieldTimer").style.zIndex = "-1";
            this.shieldTime = 100
            document.getElementById("food1").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
            document.getElementById("food2").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
            document.getElementById("food3").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
            document.getElementById("food4").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
            document.getElementById("food1").style.bottom = "7.5vw"
            document.getElementById("food2").style.bottom = "7.5vw"
            document.getElementById("food3").style.bottom = "7.5vw"
            document.getElementById("food4").style.bottom = "7.5vw"


          } else {
            newStamina = this.stamina_ - 10
            this.stamina_ = newStamina;
            this.playerHit = true;
            this.speed = 0.1
            this.debuff = true;

            document.querySelector('#video-container').style.background = "radial-gradient(circle at center, transparent 0%, rgba(255, 0, 0, 0) 60%, rgba(255, 0, 0, 0.8) 100%)"
            setTimeout(() => {
              // Reset the background color to the original color
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

            if (this.immunitiy) {
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

              this.params_.scene.add(this.mesh_);
              this.immunitiy = false
              this.propArray = []
              document.getElementById("shieldTimer").style.zIndex = "-1";
              this.shieldTime = 100
              document.getElementById("food1").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
              document.getElementById("food2").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
              document.getElementById("food3").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
              document.getElementById("food4").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
              document.getElementById("food1").style.bottom = "7.5vw"
              document.getElementById("food2").style.bottom = "7.5vw"
              document.getElementById("food3").style.bottom = "7.5vw"
              document.getElementById("food4").style.bottom = "7.5vw"
            } else {
              this.FallAnimation_()
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


            if (this.drink === "drank") {

              this.drink = ""
              this.processedWaterIDs.push(this.waterID);
            } else {
              this.drink = "drank"
              this.processedWaterIDs.push(this.waterID);
              var newStamina = this.stamina_ + 35;
              newStamina = Math.min(newStamina, 100)
              this.stamina_ = newStamina;
              this.params_.water.ToggleVisible();
              this.params_.waterGrade.ToggleVisible();

              setTimeout(() => {
                this.drink = ""
              }, 1000);
            }

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
              this.drink = "drank"
              this.processedSodaIDs.push(this.sodaID);
              var newStamina = this.stamina_ + 20;
              newStamina = Math.min(newStamina, 100)
              this.stamina_ = newStamina;
              this.params_.soda.ToggleVisible();
              this.params_.sodaGrade.ToggleVisible();

              this.sugarDrinks++
              setTimeout(() => {
                this.drink = ""
              }, 1000);
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
              this.drink = "drank"
              this.processedFruitIDs.push(this.fruitID);
              var newStamina = this.stamina_ + 20;
              newStamina = Math.min(newStamina, 100)
              this.stamina_ = newStamina;
              this.params_.fruitDrink.ToggleVisible();
              this.params_.fruitDrinkGrade.ToggleVisible();

              this.sugarDrinks++
              setTimeout(() => {
                this.drink = ""
              }, 1000);
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
            } else {
              this.processedMeatIDs.push(this.meatID);
              this.food = "ate"
              this.meatProp = this.meatProp + 1

              if (this.meatProp >= 1) {
                this.mesh_.traverse((object) => {

                  if (object.name === 'quarter_meat_GEO') {
                    object.visible = true;

                  }
                });

                this.params_.scene.add(this.mesh_);

              } else {
                this.mesh_.traverse((object) => {

                  if (object.name === 'quarter_meat_GEO') {
                    object.visible = false;

                  }
                });
                this.params_.scene.add(this.mesh_);

              }


              this.AddFood('meat')
              this.GetFood()
              this.params_.meat.ToggleVisible()

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
              } else {
                this.processedVegeIDs.push(this.vegeID);
                this.food = "ate"
                this.vegeProp = this.vegeProp + 1


                if (this.vegeProp == 2) {
                  this.mesh_.traverse((object) => {

                    if (object.name === 'half_vegetable_GEO') {
                      object.visible = true;

                    }
                  });


                  this.params_.scene.add(this.mesh_);
                } else {
                  this.mesh_.traverse((object) => {

                    if (object.name === 'half_vegetable_GEO') {
                      object.visible = false;

                    }
                  });

                  this.params_.scene.add(this.mesh_);
                }


                this.AddFood('vege')
                this.GetFood()
                this.params_.vege.ToggleVisible()

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
              } else {

                this.processedCarbsIDs.push(this.carbsID);
                this.food = "ate"
                this.carbProp = this.carbProp + 1

                if (this.carbProp >= 1) {
                  this.mesh_.traverse((object) => {

                    if (object.name === 'quarter_rice_GEO') {
                      object.visible = true;

                    }
                  });

                  this.params_.scene.add(this.mesh_);

                } else {
                  this.mesh_.traverse((object) => {

                    if (object.name === 'quarter_rice_GEO') {
                      object.visible = false;

                    }
                  });
                  this.params_.scene.add(this.mesh_);

                }


                this.AddFood('carbs')
                this.GetFood()
                this.params_.carbs.ToggleVisible()


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
            document.getElementById("food1").style.bottom = "8.5vw"

          }
          else if (this.propArray[0] == 'meat') {
            document.getElementById("food1").src = "./resources/Shield/Meat_shield_UI.png"
          }
          else if (this.propArray[0] == 'carbs') {
            document.getElementById("food1").src = "./resources/Shield/Rice_shield_UI.png"
            document.getElementById("food1").style.bottom = "9vw"

          }
        } else if (this.propArray.length == 2) {
          if (this.propArray[1] == 'vege') {
            document.getElementById("food2").src = "./resources/Shield/Vegtable_shield_UI.png"
            document.getElementById("food2").style.bottom = "8.5vw"

          }
          else if (this.propArray[1] == 'meat') {
            document.getElementById("food2").src = "./resources/Shield/Meat_shield_UI.png"
          }
          else if (this.propArray[1] == 'carbs') {
            document.getElementById("food2").src = "./resources/Shield/Rice_shield_UI.png"
            document.getElementById("food2").style.bottom = "9vw"


          }
        } else if (this.propArray.length == 3) {
          if (this.propArray[2] == 'vege') {
            document.getElementById("food3").src = "./resources/Shield/Vegtable_shield_UI.png"
            document.getElementById("food3").style.bottom = "8.5vw"

          }
          else if (this.propArray[2] == 'meat') {
            document.getElementById("food3").src = "./resources/Shield/Meat_shield_UI.png"
          }
          else if (this.propArray[2] == 'carbs') {
            document.getElementById("food3").src = "./resources/Shield/Rice_shield_UI.png"
            document.getElementById("food3").style.bottom = "9vw"


          }
        } else if (this.propArray.length == 4 && !this.firstFour) {
          if (!this.firstFour) {
            this.firstFour = true;
            if (this.propArray[3] == 'vege') {
              document.getElementById("food4").src = "./resources/Shield/Vegtable_shield_UI.png"
              document.getElementById("food4").style.bottom = "8.5vw"

            }
            else if (this.propArray[3] == 'meat') {
              document.getElementById("food4").src = "./resources/Shield/Meat_shield_UI.png"
            }
            else if (this.propArray[3] == 'carbs') {
              document.getElementById("food4").src = "./resources/Shield/Rice_shield_UI.png"
              document.getElementById("food4").style.bottom = "9vw"


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
              document.getElementById(id).style.bottom = "8.5vw"

            }
            else if (this.propArray[i] == 'meat') {
              document.getElementById(id).src = "./resources/Shield/Meat_shield_UI.png"
              document.getElementById(id).style.bottom = "7.5vw"

            }
            else if (this.propArray[i] == 'carbs') {
              document.getElementById(id).src = "./resources/Shield/Rice_shield_UI.png"
              document.getElementById(id).style.bottom = "9vw"

            }
          }

        }

      }

      if (this.propArray.length == 4) {
        if (vegePortion == 2 && meatPortion == 1 && carbsPortion == 1) {
          this.immunitiy = true;
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
          this.params_.scene.add(this.mesh_)
          document.getElementById("shieldTimer").style.zIndex = "1";
        }
      }
    }

    //RESCUED UI

    RescueUI() {
      var textID = "";
      for (var i = 0; i < this.friendsSaved; i++) {

        textID = 'rescue' + (i + 1)
        console.log(textID)
        document.getElementById(textID).src = "./resources/Rescued_Friend_UI/Saved.png";

      }
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
    SwipeLeft() {

      if (this.keys_.right) {
        this.keys_.left = false;

        if (this.position_.z >= 0) {
          this.position_.z = (Math.round(this.position_.z * 10) / 10) + this.rightMovementSpeed;
          if (this.position_.z >= 3) {
            this.position_.z = 3
            this.keys_.right = false;
          }
        } else if (this.position_.z >= -3) {

          this.position_.z = (Math.round(this.position_.z * 10) / 10) + this.rightMovementSpeed;
          if (this.position_.z == 0) {
            this.keys_.right = false;
          }
        } else if (this.position_.z == 3) {
          return;
        }
        // var baileyWoo = document.getElementById("bailey-woo");
        // baileyWoo.play();
      } else {
        if (this.position_.z <= 0) {
          this.position_.z = (Math.round(this.position_.z * 10) / 10) + this.leftMovementSpeed;
          if (this.position_.z <= -3) {
            this.position_.z = -3
            this.keys_.left = false;
          }

        } else if (this.position_.z <= 3) {
          this.position_.z = (Math.round(this.position_.z * 10) / 10) + this.leftMovementSpeed;
          if (this.position_.z == 0) {
            this.keys_.left = false;
          }
        } else if (this.position_.z == -3) {
          return;
        }
        // var baileyWoo = document.getElementById("bailey-woo");
        // baileyWoo.play();
      }


    }

    SwipeFullLeft() {

      if (this.position_.z <= 3) {
        this.position_.z = (Math.round(this.position_.z * 10) / 10) + (this.leftMovementSpeed / 1.5);
        this.position_.z = (Math.round(this.position_.z * 10) / 10)
        if (this.position_.z == -3) {
          this.keys_.left = false;
        }
      } else if (this.position_.z == -3) {
        return;
      }
      // var baileyWoo = document.getElementById("bailey-woo");
      // baileyWoo.play();
    }

    SwipeFullRight() {

      if (this.position_.z >= -3) {
        this.position_.z = (Math.round(this.position_.z * 10) / 10) + (this.rightMovementSpeed / 1.5);
        this.position_.z = (Math.round(this.position_.z * 10) / 10)
        if (this.position_.z == 3) {
          this.keys_.right = false;
        }
      } else if (this.position_.z == 3) {
        return;
      }
      // var baileyWoo = document.getElementById("bailey-woo");
      // baileyWoo.play();
    }

    SwipeRight() {
      if (this.keys_.left) {
        this.keys_.right = false;
        if (this.position_.z <= 0) {
          this.position_.z = (Math.round(this.position_.z * 10) / 10) + this.leftMovementSpeed;
          if (this.position_.z <= -3) {
            this.position_.z = -3
            this.keys_.left = false;
          }

        } else if (this.position_.z <= 3) {
          this.position_.z = (Math.round(this.position_.z * 10) / 10) + this.leftMovementSpeed;
          if (this.position_.z == 0) {
            this.keys_.left = false;
          }
        } else if (this.position_.z == -3) {
          return;
        }
        // var baileyWoo = document.getElementById("bailey-woo");
        // baileyWoo.play();
      } else {
        if (this.position_.z >= 0) {
          this.position_.z = (Math.round(this.position_.z * 10) / 10) + this.rightMovementSpeed;
          if (this.position_.z >= 3) {
            this.position_.z = 3
            this.keys_.right = false;
          }
        } else if (this.position_.z >= -3) {

          this.position_.z = (Math.round(this.position_.z * 10) / 10) + this.rightMovementSpeed;
          if (this.position_.z == 0) {
            this.keys_.right = false;
          }
        } else if (this.position_.z == 3) {
          return;
        }
        // var baileyWoo = document.getElementById("bailey-woo");
        // baileyWoo.play();
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
          this.downPressed_ = true
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

      //if shield is active
      if (this.immunitiy) {
        this.shieldTime -= timeElapsed * 10.0;
        document.getElementById("fullShield").style.height = this.shieldTime + "%"
        if (this.shieldTime <= 0) {
          document.getElementById("shieldTimer").style.zIndex = "-1";
          document.getElementById("food1").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
          document.getElementById("food2").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
          document.getElementById("food3").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
          document.getElementById("food4").src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
          document.getElementById("food1").style.bottom = "7.5vw"
          document.getElementById("food2").style.bottom = "7.5vw"
          document.getElementById("food3").style.bottom = "7.5vw"
          document.getElementById("food4").style.bottom = "7.5vw"
          this.propArray = []
          this.immunitiy = false;

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

          this.params_.scene.add(this.mesh_);

        }
      }


      if (!this.wallLoaded) {
        this.wallArray = wallPosition
        this.wallLoaded = true;
      }
      // wall running sheesh hard coded
      if (this.wallArray.length != 0) {
        //wall running right wall mechanics
        if (this.wallArray[0].z > 0) {
          if (this.wallArray[0].x < 18 && this.wallArray[0].x > -14 && !this.wallFail) {
            //dont jump u die 
            if (this.position_.y == 0 && this.wallArray[1].x > 15 && this.wallArray[0].x > 0 && !this.wallFail) {
              this.wallFail = true;
              this.inAir_ = false;
              this.FallAnimation_()
            }

            //click left way too early
            if (this.onWall && (this.keys_.left || swipeLeft) && this.wallArray[1].x > 15) {
              this.SwipeLeft()
              this.onWall = false;
              this.wallFail = true;
              this.inAir_ = false;
              this.FallAnimation_()

            }

            //right wall first -> if u jump and go to right , u will stay in that y position.
            if (this.inAir_ && (this.keys_.right || swipeRight) && !this.wallFail) {
              this.SwipeRight()
              if (this.position_.z >= 2.5 && !this.wallFail) {

                this.position_.z = 3
                if (this.position_.y != 3) {
                  if (this.position_.y > 3) {
                    this.position_.y = this.position_.y - (timeElapsed * 2)
                    if (this.position_.y < 3.1) {
                      this.position_.y = 3
                    }
                  } else {
                    this.position_.y = this.position_.y + (timeElapsed * 2)
                    if (this.position_.y > 2.9) {
                      this.position_.y = 3
                    }
                  }

                }
                this.inAir_ = false;
                this.onWall = true;
                this.RightWallRunAnimation_()
              }
            }

            if (this.onWall) {

              if (this.position_.y != 3) {
                if (this.position_.y > 3) {
                  this.position_.y = this.position_.y - (timeElapsed * 2)
                  if (this.position_.y < 3.1) {
                    this.position_.y = 3
                  }
                } else {
                  this.position_.y = this.position_.y + (timeElapsed * 2)
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
          }



          //wall running left wall mechanics
          if (this.wallArray[1].x < 18 && this.wallArray[1].x > -14 && !this.wallFail) {

            //left wall
            if (!this.inAir_ && (this.keys_.left || swipeLeft) && this.position_.z != -3 && !this.wallFail) {

              this.SwipeFullLeft()


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
          if (this.wallArray[0].x < 18 && this.wallArray[0].x > -14 && !this.wallFail) {
            //dont jump u die 
            if (this.position_.y == 0 && this.wallArray[1].x > 15 && this.wallArray[0].x > 0 && !this.wallFail) {
              this.wallFail = true;
              this.inAir_ = false;
              this.FallAnimation_()
            }

            //click right way too early
            if (this.onWall && (this.keys_.right || swipeRight) && this.wallArray[1].x > 15) {
              this.SwipeRight()
              this.onWall = false;
              this.wallFail = true;
              this.inAir_ = false;
              this.FallAnimation_()

            }

            //left wall first -> if u jump and go to left , u will stay in that y position.
            if (this.inAir_ && (this.keys_.left || swipeLeft) && !this.wallFail) {
              this.SwipeLeft()
              if (this.position_.z <= -2.5 && !this.wallFail) {

                this.position_.z = -3
                if (this.position_.y != -3) {
                  if (this.position_.y > 3) {
                    this.position_.y = this.position_.y - (timeElapsed * 2)
                    if (this.position_.y < 3.1) {
                      this.position_.y = 3
                    }
                  } else {
                    this.position_.y = this.position_.y + (timeElapsed * 2)
                    if (this.position_.y > 2.9) {
                      this.position_.y = 3
                    }
                  }

                }
                this.inAir_ = false;
                this.onWall = true;
                this.LeftWallRunAnimation_()
              }
            }

            if (this.onWall) {

              if (this.position_.y != 3) {
                if (this.position_.y > 3) {
                  this.position_.y = this.position_.y - (timeElapsed * 2)
                  if (this.position_.y < 3.1) {
                    this.position_.y = 3
                  }
                } else {
                  this.position_.y = this.position_.y + (timeElapsed * 2)
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
          }

          //wall running right wall mechanics
          if (this.wallArray[1].x < 18 && this.wallArray[1].x > -14 && !this.wallFail) {


            //right wall
            if (!this.inAir_ && (this.keys_.right || swipeRight) && this.position_.z != 3 && !this.wallFail) {

              this.SwipeFullRight()


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

      }


      //player movement with keyboard controls
      if (this.keys_.space && this.position_.y == 0.0) {
        this.SwipeUp(timeElapsed)

      }

      if (this.keys_.down && this.position_.y == 0.0 && !this.downPressed_ && !this.inAir_) {
        this.SwipeDown()

      }

      if (this.keys_.left && !this.onWall) {

        this.SwipeLeft()


      } else if (this.onWall && this.position_.z == -3) {
        this.keys_.left = false;

      }

      if (this.keys_.right && !this.onWall) {

        this.SwipeRight()


      } else if (this.onWall && this.position_.z == 3) {
        this.keys_.right = false;

      }

      //jump and slide calculation.
      if (this.inAir_) {

        const acceleration = -115 * (timeElapsed / 1.6);
        this.position_.y += (timeElapsed / 1.6) * (this.velocity_ + acceleration * 0.5);


        this.position_.y = Math.max(this.position_.y, 0.0);

        this.velocity_ += acceleration;
        this.velocity_ = Math.max(this.velocity_, -100);
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
        const acceleration = -8.8 * timeElapsed;

        this.slideTimer_ -= timeElapsed * (this.velocity_ + acceleration * 0.5);
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
        }
      }


      //update player animation, position and check collision
      if (this.mesh_) {
        this.mixer_.update(timeElapsed);
        this.mesh_.position.copy(this.position_);
        this.CheckCollisions_();

      }

      //update stamina
      this.UpdateStamina_(timeElapsed, pause);


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
      if (!pause && timeElapsed < 0.1) {

        this.stamina_ -= timeElapsed * 3.5
        const staminaText =(16.55 * Math.round((this.stamina_ * 10)) / 1000)
        const staminaText2 = 26.2 - staminaText
        console.log(staminaText2)

        document.getElementById("stamina").style.left = "-" + staminaText2 + "vw"
        if (this.stamina_ <= 0 && !this.collapse && !this.onWall) {
          this.collapse = true;
          this.inAir_ = false;
          this.sliding_ = false;
          this.FallAnimation_();
        }
      }

    }
  };

  return {
    Player: Player,
  };
})();
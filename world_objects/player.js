import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/GLTFLoader.js";

export const player = (() => {

  class Player {
    constructor(params) {
      //player properties
      this.position_ = new THREE.Vector3(0, 0, 0);
      this.velocity_ = 0.0;
      this.leftMovementSpeed = -0.3;
      this.rightMovementSpeed = 0.3;
      this.jumping_ = false;
      this.inAir_ = false;
      this.sliding_ = false;
      this.slideAnimation_ = false;
      this.slideTimer_ = 0;
      this.playerBox_ = new THREE.Box3();

      //paused
      this.paused = false;

      //monster variables
      this.shoogaGliderID = null;
      this.processedshoogaGliderIDs = [];
      this.trolliumChlorideID = null;
      this.processedtrolliumChlorideIDs = [];

      //water variables
      this.waterID = null;
      this.processedWaterIDs = [];

      //soda variables
      this.sodaID = null;
      this.processedSodaIDs = [];

      //fruit drink variables
      this.fruitID = null;
      this.processedFruitIDs = [];

      //food variables
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
      this.endWall = false;
      //sheild variables
      this.immunitiy = false;

      //HPB box logo variables
      this.box = "";
      this.box1ID = null;
      this.processedbox1IDs = [];
      this.box2ID = null;
      this.processedbox2IDs = [];
      this.box3ID = null;
      this.processedbox3IDs = [];

      //map speed
      this.speed = 0.2
      this.debuff = false;
      this.buff = false;

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
      if (this.params_.gender === "male") {
        model = 'YBotAll.gltf';
      } else {
        model = 'YBotGetHitAll.gltf'
      }
      // Instantiate a loader
      const loader = new GLTFLoader();

      // Load a glTF resource
      loader.setPath('./resources/Player/Player_YBot/');
      loader.load(
        model,
        (gltf) => {
          this.gltf = gltf
          this.mesh_ = gltf.scene
          this.params_.scene.add(this.mesh_);
          this.mesh_.scale.set(0.01, 0.01, 0.01);
          this.mesh_.position.x = 0;				    //Position (x = right+ left-) 
          this.mesh_.position.y = 0;				    //Position (y = up+, down-)
          this.mesh_.position.z = 0;				    //Position (z = front +, back-)
          this.mesh_.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);

          const m = new THREE.AnimationMixer(this.mesh_);
          this.mixer_ = m;
          this.action;
          const clip = gltf.animations[1];
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

    SlideAnimation_() {
      if (!this.mixer_) {
        return;

      }
      this.action.stop();
      const clip = this.gltf.animations[4];
      this.action = this.mixer_.clipAction(clip);
      this.action.setLoop(THREE.LoopOnce);

      this.action.play();


    }


    RightWallRunAnimation_() {
      if (!this.mixer_) {
        return;

      }
      this.action.stop();
      const clip = this.gltf.animations[2];
      this.action = this.mixer_.clipAction(clip);
      this.action.play();
    }

    LeftWallRunAnimation_() {
      if (!this.mixer_) {
        return;

      }
      this.action.stop();
      const clip = this.gltf.animations[3];
      this.action = this.mixer_.clipAction(clip);
      this.action.play();
    }

    DownAnimation_() {
      if (!this.mixer_) {
        return;

      }
      this.action.stop();
      const clip = this.gltf.animations[12];
      this.action = this.mixer_.clipAction(clip);
      this.action.play();
    }

    RunAnimation_() {
      if (!this.mixer_) {
        return;

      }
      this.action.stop();
      const clip = this.gltf.animations[1];
      this.action = this.mixer_.clipAction(clip);
      this.action.play();
    }


    JumpAnimation_() {
      if (!this.mixer_) {
        return;

      }
      this.action.stop();
      const clip = this.gltf.animations[11];
      this.action = this.mixer_.clipAction(clip);
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
        if (event.keyCode === 37) {
          this.keys_.left = true;
        } else if (event.keyCode === 39) {
          this.keys_.right = true;
        } else if (event.keyCode === 32) {
          this.keys_.space = true;
        } else if (event.keyCode === 40) {
          this.keys_.down = true;
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
            this.immunitiy = false

            document.querySelector('#quarterOne').style.backgroundColor = '#333'
            document.querySelector('#quarterTwo').style.backgroundColor = '#333'
            document.querySelector('#quarterThree').style.backgroundColor = '#333'
            document.querySelector('#quarterFour').style.backgroundColor = '#333'
          } else {
            newStamina = this.stamina_ - 10
            this.stamina_ = newStamina;

            document.querySelector('#video-container').style.backgroundColor = '#754c4c7d'
            setTimeout(() => {
              // Reset the background color to the original color
              document.querySelector('#video-container').style.backgroundColor = 'transparent'
            }, 2000)
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
            this.immunitiy = false

            document.querySelector('#quarterOne').style.backgroundColor = '#333'
            document.querySelector('#quarterTwo').style.backgroundColor = '#333'
            document.querySelector('#quarterThree').style.backgroundColor = '#333'
            document.querySelector('#quarterFour').style.backgroundColor = '#333'

          } else {
            newStamina = this.stamina_ - 10
            this.stamina_ = newStamina;


            document.querySelector('#video-container').style.backgroundColor = '#754c4c7d'
            setTimeout(() => {
              // Reset the background color to the original color
              document.querySelector('#video-container').style.backgroundColor = 'transparent'
            }, 2000)
          }
        }
      }

      //if player collides with water
      for (let c of water) {

        const cur = c.collider;
        if (c.mesh) {
          this.waterID = c.mesh.uuid;
          if (!this.processedWaterIDs.includes(this.waterID) && cur.intersectsBox(this.playerBox_)) {
            this.processedWaterIDs.push(this.waterID);
            var newStamina = this.stamina_ + 35;
            newStamina = Math.min(newStamina, 100)
            this.stamina_ = newStamina;
            this.params_.water.ToggleVisible();
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
            this.processedSodaIDs.push(this.sodaID);
            var newStamina = this.stamina_ + 20;
            newStamina = Math.min(newStamina, 100)
            this.stamina_ = newStamina;
            this.params_.soda.ToggleVisible();
            this.sugarDrinks++
            if (this.sugarDrinks == 3) {
              newStamina = this.stamina_ / 2
              this.stamina_ = newStamina;
              this.sugarDrinks = 0
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
            this.processedFruitIDs.push(this.fruitID);
            var newStamina = this.stamina_ + 20;
            newStamina = Math.min(newStamina, 100)
            this.stamina_ = newStamina;
            this.params_.fruitDrink.ToggleVisible();
            this.sugarDrinks++
            if (this.sugarDrinks == 3) {
              newStamina = this.stamina_ / 2
              this.stamina_ = newStamina;
              this.sugarDrinks = 0
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
            this.processedWaterIDs.push(this.box1ID);
            this.box = "powerup"
            this.speed = 0.54;
            this.buff = true;
            this.params_.box1.ToggleVisible();
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
          if (!this.processedbox1IDs.includes(this.box2ID) && cur.intersectsBox(this.playerBox_)) {
            this.processedWaterIDs.push(this.box2ID);
            this.box = "powerdown"
            this.speed = 0.05;
            this.debuff = true;
            this.params_.box2.ToggleVisible();
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
            this.processedWaterIDs.push(this.box3ID);
            this.box = "powerdown"
            this.speed = 0.05;
            this.debuff = true;
            this.params_.box3.ToggleVisible();
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
            this.processedMeatIDs.push(this.meatID);
            this.meatProp = this.meatProp + 1

            this.AddFood('meat')
            this.GetFood()
            this.params_.meat.ToggleVisible()


          }
        } else {
          return;
        }

        //if player collides with meat
        for (let c of vege) {

          const cur = c.collider;
          if (c.mesh) {
            this.vegeID = c.mesh.uuid;
            if (!this.processedVegeIDs.includes(this.vegeID) && cur.intersectsBox(this.playerBox_)) {
              this.processedVegeIDs.push(this.vegeID);
              this.vegeProp = this.vegeProp + 1

              this.AddFood('vege')
              this.GetFood()
              this.params_.vege.ToggleVisible()
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
              this.processedCarbsIDs.push(this.carbsID);
              this.carbProp = this.carbProp + 1

              this.AddFood('carbs')
              this.GetFood()
              this.params_.carbs.ToggleVisible()

            }
          } else {
            return;
          }
        }
      }
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

      let quaterOne = document.querySelector('#quarterOne')
      let quarterTwo = document.querySelector('#quarterTwo')
      let quarterThree = document.querySelector('#quarterThree')
      let quarterFour = document.querySelector('#quarterFour')

      let colorOne;
      let colorTwo;
      let colorThree;
      let colorFour;

      for (let i = 0; i < this.propArray.length; i++) {
        if (this.propArray[i] === "vege") {
          vegePortion = vegePortion + 1

          if (i == 0) {
            colorOne = "#228B22"
          } else if (i == 1) {
            colorTwo = "#228B22"

          } else if (i == 2) {
            colorThree = "#228B22"

          } else if (i == 3) {
            colorFour = "#228B22"

          }


        } else if (this.propArray[i] === "meat") {
          meatPortion = meatPortion + 1

          if (i == 0) {
            colorOne = "#8B4513"
          } else if (i == 1) {
            colorTwo = "#8B4513"

          } else if (i == 2) {
            colorThree = "#8B4513"

          } else if (i == 3) {
            colorFour = "#8B4513"

          }

        } else if (this.propArray[i] === "carbs") {
          carbsPortion = carbsPortion + 1

          if (i == 0) {
            colorOne = "#FFF8DC"
          } else if (i == 1) {
            colorTwo = "#FFF8DC"

          } else if (i == 2) {
            colorThree = "#FFF8DC"

          } else if (i == 3) {
            colorFour = "#FFF8DC"

          }

        }


      }


      const backgroundColor1 = getComputedStyle(quaterOne).getPropertyValue('background-color');
      const backgroundColor2 = getComputedStyle(quarterTwo).getPropertyValue('background-color');
      const backgroundColor3 = getComputedStyle(quarterThree).getPropertyValue('background-color');
      const backgroundColor4 = getComputedStyle(quarterFour).getPropertyValue('background-color');

      if (backgroundColor1 === 'rgb(51, 51, 51)' || backgroundColor1 === '#333') {
        quaterOne.style.backgroundColor = colorOne
      } else if (backgroundColor2 === 'rgb(51, 51, 51)' || backgroundColor2 === '#333') {
        quarterTwo.style.backgroundColor = colorTwo
      } else if (backgroundColor3 === 'rgb(51, 51, 51)' || backgroundColor3 === '#333') {
        quarterThree.style.backgroundColor = colorThree
      } else if (backgroundColor4 === 'rgb(51, 51, 51)' || backgroundColor4 === '#333') {
        quarterFour.style.backgroundColor = colorFour
      }

      if (this.propArray.length == 4) {
        if (vegePortion == 2 && meatPortion == 1 && carbsPortion == 1) {
          this.immunitiy = true;
          this.propArray = [];
        } else {
          quaterOne.style.backgroundColor = '#333'
          quarterTwo.style.backgroundColor = '#333'
          quarterThree.style.backgroundColor = '#333'
          quarterFour.style.backgroundColor = '#333'

        }
      }
    }



    //send back callbacks for speed and collision
    getSpeed(callback) {
      const result = this.speed;
      callback(result);
    }

    getBoxCollide(callback) {
      const result = this.box;
      callback(result);
      this.box = ""
    }
    getStamina(callback) {
      const result = this.stamina_;
      callback(result);
    }



    //player movement with swipe gestures
    SwipeLeft() {

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
      var baileyWoo = document.getElementById("bailey-woo");
      baileyWoo.play();
    }

    SwipeFullLeft() {

      if (this.position_.z <= 3) {
        this.position_.z = (Math.round(this.position_.z * 10) / 10) + this.leftMovementSpeed;
        if (this.position_.z == -3) {
          this.keys_.left = false;
        }
      } else if (this.position_.z == -3) {
        return;
      }
      var baileyWoo = document.getElementById("bailey-woo");
      baileyWoo.play();
    }

    SwipeRight() {
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
      var baileyWoo = document.getElementById("bailey-woo");
      baileyWoo.play();
    }


    SwipeUp() {
      if (this.position_.y == 0.0) {
        if (this.position_.z == 0 || this.position_.z == -3 || this.position_.z == 3) {
          this.velocity_ = 30;
          this.inAir_ = true;
          var baileyYay = document.getElementById("bailey-yay");
          baileyYay.play();
        }

      }
      if (this.inAir_) {
        this.JumpAnimation_()

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


    Update(timeElapsed, pause, wallPosition) {
      if (!pause) {


        if (this.paused == true) {
          this.action.play();
          this.paused = false
        }



        // wall running sheesh hard coded
        if (wallPosition.length != 0 ) {
          //wall running right wall mechanics
          if (wallPosition[0].x < 15 && wallPosition[0].x > -15) {
            //dont jump u die 
            if (this.position_.y == 0 && wallPosition[1].x > 15 && wallPosition[0].x > 0) {
              this.gameOver = true
            }
            //right wall first -> if u jump and go to right , u will stay in that y position.
            if (this.inAir_ && this.keys_.right) {
              this.SwipeRight()
              if (this.position_.z == 3) {
                this.position_.y = this.position_.y
                this.inAir_ = false;
                this.onWall = true;
                this.RightWallRunAnimation_()
              }

            }

            //click left way too early
            if (this.onWall && this.keys_.left && wallPosition[1].x > 15) {
              this.SwipeLeft()
              this.inAir_ = true
            }


          }
          //fall down when wall ends
          if (!this.endWall && wallPosition[0].x < -15 && this.position_.z == 3) {
            this.inAir_ = true;
            this.endWall = true;
            this.RunAnimation_()
          }



          //wall running left wall mechanics
          if (wallPosition[1].x < 15 && wallPosition[1].x > -15) {

            //dont jump u die 
            if (this.position_.y == 0 && wallPosition[1].x > -10) {
              this.gameOver = true
            }

            //left wall
            if (!this.inAir_ && this.keys_.left) {
              this.SwipeFullLeft()
              if (this.position_.z == -3) {
                this.onWall = true;
                this.LeftWallRunAnimation_()
              }

            }

            if (this.onWall && this.keys_.right && this.position_.z == -3) {
              this.SwipeRight()
              this.inAir_ = true
            }


          }
          //fall down when wall ends
          if (!this.endWall && wallPosition[1].x < -15) {
            this.inAir_ = true;
            this.endWall = true;
            this.onWall = false;

          }
        }








        //player movement with keyboard controls
        if (this.keys_.space && this.position_.y == 0.0) {
          this.SwipeUp(timeElapsed)
        }

        if (this.keys_.down && this.position_.y == 0.0 && !this.downPressed_) {
          this.SwipeDown()

        }

        if (!this.inAir_) {
          if (this.keys_.left) {

            if (!this.keys_.right && !this.onWall) {
              this.SwipeLeft()
            }
          }
          if (this.keys_.right) {
            this.SwipeRight()

          }
        }

        //jump and slide calculation.
        if (this.inAir_) {
          const acceleration = -75 * timeElapsed;

          this.position_.y += timeElapsed * (this.velocity_ + acceleration * 0.5);
          this.position_.y = Math.max(this.position_.y, 0.0);

          this.velocity_ += acceleration;
          this.velocity_ = Math.max(this.velocity_, -100);
          if (this.position_.y == 0) {
            this.RunAnimation_();

          }
        }

        if (this.sliding_) {
          const acceleration = -25 * timeElapsed;

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
      } else {
        if (!this.mixer_) {
          return;

        } else {
          this.action.stop();

        }
        this.paused = true
      }

      //update player animation, position and check collision
      if (this.mesh_) {
        this.mixer_.update(timeElapsed);
        this.mesh_.position.copy(this.position_);
        this.CheckCollisions_();

      }

      //update stamina
      this.UpdateStamina_(timeElapsed, pause);


      if (!pause) {
        //check speed decay
        if (this.buff) {
          if (this.speed > 0.2) {
            this.speed -= (timeElapsed / 10)
          }
          if (this.speed < 0.2) {
            this.speed = 0.2
            this.buff = false
          }
        }

        if (this.debuff) {
          if (this.speed > 0.2) {
            this.speed = 0.2
            this.debuff = false
          }
          if (this.speed < 0.2) {
            this.speed += (timeElapsed / 10)

          }
        }
      }


    }

    // Stamina
    UpdateStamina_(timeElapsed, pause) {
      if (!pause && timeElapsed < 0.1) {

        this.stamina_ -= timeElapsed * 5
        const staminaText = (Math.round(this.stamina_ * 10) / 10).toLocaleString(
          'en-US', { minimumIntegerDigits: 3, useGrouping: false });

        document.getElementById("stamina").style.width = staminaText + "%"
        if (this.stamina_ <= 0) {
          //this.gameOver = true
        }
      }

    }
  };

  return {
    Player: Player,
  };
})();
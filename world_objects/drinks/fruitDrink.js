// import * as THREE from 'https://storage.googleapis.com/sproud-hpb/node_modules/three/build/three.module.js';

// import { FBXLoader } from "https://storage.googleapis.com/sproud-hpb/node_modules/three/examples/jsm/loaders/FBXLoader.js";




import * as THREE from '../../node_modules/three/build/three.module.js';

import { FBXLoader } from "../../node_modules/three/examples/jsm/loaders/FBXLoader.js";



export const fruitDrink = (() => {

  class DrinksObject {
    constructor(params) {
      this.position = new THREE.Vector3(0, 0, 0);
      this.quaternion = new THREE.Quaternion();
      this.scale = 1.0;
      this.drinks_ = []
      this.collider = new THREE.Box3();
      this.params_ = params;
      this.LoadModel_();

    }

    //load the drinks
    LoadModel_() {

      const loader = new FBXLoader();
      loader.setPath('./resources/Drinks/');

      loader.load('drinks2.fbx', (fbx) => {

        this.mesh = fbx.children[9];

        this.params_.scene.add(this.mesh);

        fbx.traverse((child) => {
          if (child.isMesh) {
            child.material.map = new THREE.TextureLoader().load('./resources/Drinks/textures/drinks_albedo.jpg');

          }
        });
      });

    }

    UpdateCollider_() {
      this.collider.setFromObject(this.mesh);
    }

    Update() {
      if (!this.mesh) {
        return;
      }
      this.mesh.quaternion.copy(this.quaternion);
      this.mesh.position.copy(this.position);
      this.mesh.scale.setScalar(this.scale);
      this.UpdateCollider_();
    }
  }

  class DrinksManager {
    constructor(params) {
      this.objects_ = [];
      this.unused_ = [];
      this.speed_ = 12;
      this.counter1_ = 0
      this.params_ = params;
      this.counter_ = 0;
      this.spawn_ = 0;
    }

    GetColliders() {
      return this.objects_;
    }

    ToggleVisible() {
      this.objects_[0].mesh.visible = false;
    }

    SpawnObjUpdate_() {
      let spawnPosition;
      if (this.params_.turnWhen == 1) {
        spawnPosition = [50]

      } else if (this.params_.turnWhen == 2) {
        if (this.params_.firstChase) {
          spawnPosition = [50, 130]

        } else {
          spawnPosition = [50, 130, 270]

        }

      } else if (this.params_.turnWhen == 3) {
        spawnPosition = [50, 130, 270, 350, 430]

      }else {
        spawnPosition = [50, 130, 270, 350, 430, 500]

      }
      
      let spawnPositionY = [50, 130, 270, 350, 430, 500]
      let rotation;

      if (this.params_.firstChase) {
        for (let i = 0; i < spawnPosition.length; i++) {
          spawnPosition[i] += 40;
        }
      }

      let obj = null;
      if (this.params_.mapRandomizer == 1) {
        spawnPositionY = spawnPositionY.map(y => -y);
        rotation = Math.PI / 2
      } else {
        rotation = -Math.PI / 2
      }
      if (this.params_.turnWhen == 1) {

        for (var i = 0; i < spawnPosition.length; i++) {
          if (this.counter1_ == i) {

            obj = new DrinksObject(this.params_);

            obj.position.x = spawnPosition[i]
            obj.position.z = this.params_.position[i]
            obj.scale = 0.05;
            this.objects_.push(obj);
            this.counter1_++
          }
        }
        for (var i = 0; i < spawnPositionY.length; i++) {
          if (this.counter_ == i) {
            obj = new DrinksObject(this.params_);
            obj.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation);

            obj.position.x = 99.5 + this.params_.position[i]
            obj.position.z = spawnPositionY[i]
            obj.scale = 0.05;
            this.objects_.push(obj);
            this.counter_++
          }
        }

      } else if (this.params_.turnWhen == 2) {
        for (var i = 0; i < spawnPosition.length; i++) {
          if (this.counter_ == i) {

            obj = new DrinksObject(this.params_);

            obj.position.x = spawnPosition[i]
            obj.position.z = this.params_.position[i]
            obj.scale = 0.05;
            this.objects_.push(obj);
            this.counter_++

          }
        }
        for (var i = 0; i < spawnPositionY.length; i++) {
          if (this.counter1_ == i) {

            obj = new DrinksObject(this.params_);
            obj.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation);

            obj.position.x = 299.5 + this.params_.position[i]
            obj.position.z = spawnPositionY[i]
            obj.scale = 0.05;
            this.objects_.push(obj);

            this.counter1_++

          }
        }


      } else if (this.params_.turnWhen == 3) {
        for (var i = 0; i < spawnPosition.length; i++) {
          if (this.counter_ == i) {

            obj = new DrinksObject(this.params_);

            obj.position.x = spawnPosition[i]
            obj.position.z = this.params_.position[i]
            obj.scale = 0.05;
            this.objects_.push(obj);
            this.counter_++

          }
        }
        for (var i = 0; i < spawnPositionY.length; i++) {
          if (this.counter1_ == i) {

            obj = new DrinksObject(this.params_);
            obj.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation);

            obj.position.x = 500 + this.params_.position[i]
            obj.position.z = spawnPositionY[i]
            obj.scale = 0.05;
            this.objects_.push(obj);

            this.counter1_++

          }
        }


      } else {
        for (var i = 0; i < spawnPosition.length; i++) {
          if (this.counter_ == i) {

            obj = new DrinksObject(this.params_);

            obj.position.x = spawnPosition[i]
            obj.position.z = this.params_.position[i]
            obj.scale = 0.05;
            this.objects_.push(obj);
            this.counter_++
          }
        }
      }

    }


    Update(timeElapsed, speed, mapTurn) {
      this.SpawnObjUpdate_()

      this.UpdateColliders_(timeElapsed, speed, mapTurn);
    }

    UpdateColliders_(timeElapsed, speed, mapTurn) {
      const invisible = [];
      const visible = [];


      for (let obj of this.objects_) {
        if (mapTurn == 2) {
          obj.position.z -= timeElapsed * speed;
          if (obj.position.z < -20) {
            invisible.push(obj);
            obj.mesh.visible = false;
          } else {
            visible.push(obj);
          }
        } else if (mapTurn == 1) {
          obj.position.z += timeElapsed * speed;
          if (obj.position.z > 20) {
            invisible.push(obj);
            obj.mesh.visible = false;
          } else {
            visible.push(obj);
          }
        } else if (mapTurn == 0) {
          obj.position.x -= timeElapsed * speed;
          if (obj.position.x < -20) {
            invisible.push(obj);
            obj.mesh.visible = false;
          } else {
            visible.push(obj);
          }
        }



        obj.Update(timeElapsed);
      }

      this.objects_ = visible;
      this.unused_.push(...invisible);
    }

  };

  return {
    DrinksManager: DrinksManager,
  };
})();
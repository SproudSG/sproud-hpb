// import * as THREE from 'https://storage.googleapis.com/sproud-hpb/node_modules/three/build/three.module.js';

// import { FBXLoader } from "https://storage.googleapis.com/sproud-hpb/node_modules/three/examples/jsm/loaders/FBXLoader.js";




import * as THREE from '../../node_modules/three/build/three.module.js';

import { FBXLoader } from "../../node_modules/three/examples/jsm/loaders/FBXLoader.js";



export const carbs = (() => {

  class FoodObject {
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
      loader.setPath('./resources/Food/');

      loader.load('food.fbx', (fbx) => {
        this.mesh = fbx.children[3];
        this.params_.scene.add(this.mesh);

        fbx.traverse((child) => {
          if (child.isMesh) {
              child.material.map = new THREE.TextureLoader().load('./resources/Food/textures/food_albedo.jpg');
            
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
      this.mesh.position.copy(this.position);
      this.mesh.quaternion.copy(this.quaternion);
      this.mesh.scale.setScalar(this.scale);
      this.UpdateCollider_();
    }
  }

  class FoodManager {
    constructor(params) {
      this.objects_ = [];
      this.unused_ = [];
      this.speed_ = 12;
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

   
    SpawnObj_(position, timeElapsed) {
      this.progress_ += timeElapsed * 10.0;

      const spawnPosition = [120, 170, 280, 330, 360, 420]

      let obj = null;

      for (var i = 0; i < spawnPosition.length; i++) {
        if (this.counter_ == i) {
          obj = new FoodObject(this.params_);

          obj.position.x = spawnPosition[i]
          obj.position.z = position[i]
          obj.scale = 0.015;
          this.objects_.push(obj);
          this.counter_++
        }
      }

    }


    Update(timeElapsed,speed) {
      this.SpawnObj_(this.params_.position, timeElapsed)
      this.UpdateColliders_(timeElapsed,speed);

    }

    UpdateColliders_(timeElapsed,speed) {
      const invisible = [];
      const visible = [];

      for (let obj of this.objects_) {
        obj.position.x -= timeElapsed * speed;

        if (obj.position.x < -20) {
          invisible.push(obj);
          obj.mesh.visible = false;
        } else {
          visible.push(obj);
        }

        obj.Update(timeElapsed);
      }

      this.objects_ = visible;
      this.unused_.push(...invisible);
    }

  };

  return {
    FoodManager: FoodManager,
  };
})();
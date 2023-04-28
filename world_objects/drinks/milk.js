import * as THREE from '../../node_modules/three/build/three.module.js';

import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

export const milk = (() => {

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

      const loader = new GLTFLoader();
      loader.setPath('./resources/Drinks/');

      loader.load('drinks.gltf', (gltf) => {
        this.mesh = gltf.scene.children[0].children[1];

        this.params_.scene.add(this.mesh);


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

  class DrinksManager {
    constructor(params) {
      this.objects_ = [];
      this.unused_ = [];
      this.speed_ = 12;
      this.params_ = params;
      this.counter_ = 0;
      this.visibilityCounter_ = 0
      this.spawn_ = 0;
      this.progress_ = 0;
      this.floatSpeed = 0.01;
      this.rotateY = 0
      this.rotateIncrement = 0.01
    }

    GetColliders() {
      return this.objects_;
    }

    ToggleVisible() {

      this.objects_[0].mesh.visible = false;

    }

    SpawnObj_(position, timeElapsed) {
      this.progress_ += timeElapsed * 10.0;

      const spawnPosition =  [50, 130, 200, 430, 500]

      if (this.params_.firstChase) {
        for (let i = 0; i < spawnPosition.length; i++) {
          spawnPosition[i] += 70;
        }
      }
      let obj = null;

      for (var i = 0; i < spawnPosition.length; i++) {
        if (this.counter_ == i) {
          obj = new DrinksObject(this.params_);

          obj.position.x = spawnPosition[i]
          obj.position.z = position[i]
          obj.scale = 0.025;

          obj.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);

          this.objects_.push(obj);
          this.counter_++
        }
      }

    }


    Update(timeElapsed, speed) {
      this.SpawnObj_(this.params_.position, timeElapsed)
      this.UpdateColliders_(timeElapsed, speed);

    }

    UpdateColliders_(timeElapsed, speed) {
      const invisible = [];
      const visible = [];
      this.rotateY += this.rotateIncrement

      for (let obj of this.objects_) {
        obj.position.x -= timeElapsed * speed;

        if (obj.position.x < -20) {
          invisible.push(obj);
          obj.mesh.visible = false;
        } else {
          visible.push(obj);
        }
        if (obj.position.y < 0 && !this.toggleFloat) {
          this.toggleFloat = true;
          this.toggleFloat1 = false;

          this.floatSpeed *= -1
        }

        if (obj.position.y > 0.25 && !this.toggleFloat1) {
          this.toggleFloat = false;
          this.toggleFloat1 = true;

          this.floatSpeed *= -1
        }

        obj.position.y += this.floatSpeed;

        obj.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.rotateY);
  

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
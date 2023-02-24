import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/GLTFLoader.js";


export const trolliumChloride = (() => {

  class TrolliumChlorideObject {
    constructor(params) {
      this.position = new THREE.Vector3(0, 0, 0);
      this.quaternion = new THREE.Quaternion()//.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
      this.scale = 1.0;

      this.collider = new THREE.Box3();
      this.params_ = params;
      this.LoadModel_();
      this.mixer = null;
    }

    // load the monster
    LoadModel_() {

      const loader = new GLTFLoader();
      loader.load('./resources/TrolliumChloride/TrolliumChlorideSwipe.gltf', (gltf) => {
        this.mesh = gltf.scene;
        this.gltf = gltf
        //add model to the scene
        this.params_.scene.add(this.mesh);
        //this.mesh.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);

        // Rotate the mesh around the x-axis

        // Extract the animation clips from the gltf file


        const animations = gltf.animations;
        this.mixer = new THREE.AnimationMixer(this.mesh);
        const animation = animations[0];
        this.action = this.mixer.clipAction(animation);
      });

    }

    UpdateCollider_() {
      this.collider.setFromObject(this.mesh);
    // console.log(`The position of the box is: (${this.collider.position.x}, ${this.collider.position.y}, ${this.collider.position.z})`);

    }

    PauseAnimation_() {
      if (!this.mixer) {
        return
      }
      this.action.stop()
    }

    PlayAnimation_() {
      if (!this.mixer) {
        return
      }
      this.action.play()
    }

    Update(timeElapsed) {
      if (!this.mesh) {
        return;
      }
      this.mesh.position.copy(this.position);
      //this.mesh.rotation.set(0, -Math.PI / 2, 0)
      this.mesh.scale.setScalar(this.scale);
      this.UpdateCollider_();

      // play animation 
      if (this.mixer) {
        this.mixer.update(timeElapsed);
      }
    }
  }

  class TrolliumChlorideManager {
    constructor(params) {
      this.objects_ = [];
      this.unused_ = [];
      this.speed_ = 12;
      this.params_ = params;
      this.counter_ = 0;
      this.spawn_ = 0;
      this.paused = false
    }

    GetColliders() {
      return this.objects_;
    }

    ToggleVisible() {
      this.objects_[0].mesh.visible = false;
    }


    SpawnObj_(timeElapsed) {
      this.progress_ += timeElapsed * 10.0;

      const spawnPosition = [100, 350, 450]

      let obj = null;

      for (var i = 0; i < spawnPosition.length; i++) {
        if (this.counter_ == i) {
          obj = new TrolliumChlorideObject(this.params_);

          // obj.quaternion.setFromAxisAngle(
          //   new THREE.Vector3(0, 1, 0), -Math.PI / 2);




          obj.position.x = spawnPosition[i]
          obj.position.z = 6
          obj.position.y = -5

          obj.scale = 0.02;
          this.objects_.push(obj);
          this.counter_++
        }
      }

    }


    Update(timeElapsed, speed, paused) {
      this.SpawnObj_(this.params_.position, timeElapsed)
      this.UpdateColliders_(timeElapsed, speed, paused);

    }

    UpdateColliders_(timeElapsed, speed, paused) {
      const invisible = [];
      const visible = [];



      for (let obj of this.objects_) {


        obj.position.x -= timeElapsed * speed;

        if (obj.position.x < 25) {
          // obj.position.y = -4
          obj.PlayAnimation_()
          if (paused) {
            obj.PauseAnimation_()
            this.paused = true
          } else if (this.paused == true) {
            for (let obj of this.objects_) {
              obj.PlayAnimation_()

            }
            this.paused = false

          }
        }

        if (obj.position.x < -10) {
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
    TrolliumChlorideManager: TrolliumChlorideManager,
  };
})();
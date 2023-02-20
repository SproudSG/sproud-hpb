import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/GLTFLoader.js";


export const shoogaGlider = (() => {

  class ShoogaGliderObject {
    constructor(params) {
      this.position = new THREE.Vector3(0, 0, 0);
      this.quaternion = new THREE.Quaternion();
      this.scale = 1.0;

      this.collider = new THREE.Box3();
      this.params_ = params;
      this.LoadModel_();
      this.mixer = null;
    }

    // load the monster
    LoadModel_() {

      const loader = new GLTFLoader();
      loader.load('./resources/ShoogaGlider/ShoogaGliderFlap.gltf', (fbx) => {
        this.mesh = fbx.scene;

        //add model to the scene
        this.params_.scene.add(this.mesh);

        // Extract the animation clips from the fbx file
        const animations = fbx.animations;
        this.mixer = new THREE.AnimationMixer(this.mesh);
        const animation = animations[0];
        const action = this.mixer.clipAction(animation);
        action.play()
      });

    }

    UpdateCollider_() {
      this.collider.setFromObject(this.mesh);
    }

    Update(timeElapsed) {
      if (!this.mesh) {
        return;
      }
      this.mesh.position.copy(this.position);
      this.mesh.quaternion.copy(this.quaternion);
      this.mesh.scale.setScalar(this.scale);
      this.UpdateCollider_();

      // play animation 
      if (this.mixer) {
        this.mixer.update(timeElapsed);
      }
    }
  }

  class ShoogaGliderManager {
    constructor(params) {
      this.objects_ = [];
      this.unused_ = [];
      this.speed_ = 50;
      this.speedz_ = 6
      this.speedy_ = 12

      this.params_ = params;
      this.counter_ = 0;
      this.spawn_ = 0;
    }

    //used in player.js to check for player and monster collision
    GetColliders() {
      return this.objects_;
    }

    SpawnObj_(timeElapsed) {

      this.progress_ += timeElapsed * 10.0;


      const spawnPosition = [570, 1100, 1700]

      let obj = null;

      for (var i = 0; i < spawnPosition.length; i++) {
        if (this.counter_ == i) {

          obj = new ShoogaGliderObject(this.params_);


          // code below to set where the object is facing

          obj.quaternion.setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), -Math.PI / 2);


          //set shooga glider position abnd scale
          obj.position.x = spawnPosition[i] + Math.random()
          obj.position.z = 0;
          obj.position.y = 100;
          obj.scale = 0.6;

          this.objects_.push(obj);


          this.counter_++

        }
      }

    }


    Update(timeElapsed, speed, speedz, speedy) {
      this.SpawnObj_(timeElapsed);
      this.UpdateColliders_(timeElapsed, speed, speedz, speedy);
    }

    //sets the speed of the spawned monsters
    UpdateColliders_(timeElapsed, speed, speedz, speedy) {
      const invisible = [];
      const visible = [];

      for (let obj of this.objects_) {
        obj.position.x -= timeElapsed * speed;

        // console.log(obj.position.z)
        // if (obj.position.z < -3 || obj.position.z > 3) {
        //   obj.position.z -= timeElapsed * -speedz;

        // }else{
        //   obj.position.z -= timeElapsed * speedz;

        // }
        if (obj.position.y != 1) {
          if (obj.position.y < 1) {
            obj.position.y = 1
          } else {
            obj.position.y -= timeElapsed * speedy;

          }
        }


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
    ShoogaGliderManager: ShoogaGliderManager,
  };
})();
// import * as THREE from 'https://storage.googleapis.com/sproud-hpb/node_modules/three/build/three.module.js';

// import { GLTFLoader } from "https://storage.googleapis.com/sproud-hpb/node_modules/three/examples/jsm/loaders/GLTFLoader.js";


import * as THREE from '../../node_modules/three/build/three.module.js';

import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

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
      loader.load('./resources/ShoogaGlider/IceCreamMonsterAll.gltf', (gltf) => {
        this.mesh = gltf.scene;
        this.gltf = gltf
        //add model to the scene
        this.params_.scene.add(this.mesh);

        // Extract the animation clips from the gltf file


        const animations = gltf.animations;
        this.mixer = new THREE.AnimationMixer(this.mesh);
        const animation = THREE.AnimationClip.findByName(animations, 'Flap');
        this.action = this.mixer.clipAction(animation);
        this.action.play()
      });

    }

    AttackAnimation() {
      if (!this.mixer) {
        return;
      }
      this.action.stop();
      const clip = THREE.AnimationClip.findByName(this.gltf.animations, 'Attack');
      this.action = this.mixer.clipAction(clip);
      this.action.setLoop(THREE.LoopOnce);
      this.action.play();
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
          obj.scale = 0.05;

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
    UpdateColliders_(timeElapsed, speed, speedz, speedy,) {
      const invisible = [];
      const visible = [];

      for (let obj of this.objects_) {

        obj.position.x -= timeElapsed * speed;
        if (obj.position.y != 0.5 && obj.position.x <= 350) {
          if (obj.position.y < 0.5) {
            obj.position.y = 0.5
          } else {
            obj.position.y -= timeElapsed * (speedy * 2);

          }
        }

        if (obj.position.x < 80 && !this.attacked) {
          this.attacked = true;
          obj.position.z = -0.5
          obj.AttackAnimation()
        }
        if (obj.position.x < -20) {
          this.attacked = false;

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
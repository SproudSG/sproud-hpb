// import * as THREE from 'https://storage.googleapis.com/sproud-hpb/node_modules/three/build/three.module.js';

// import { GLTFLoader } from "https://storage.googleapis.com/sproud-hpb/node_modules/three/examples/jsm/loaders/GLTFLoader.js";


import * as THREE from '../../node_modules/three/build/three.module.js';

import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

export const trolliumChloride = (() => {

  class TrolliumChlorideObject {
    constructor(params) {
      this.position = new THREE.Vector3(0, 0, 0);
      this.quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
      this.scale = 1.0;

      this.collider = new THREE.Box3();
      this.params_ = params;
      this.LoadModel_();
      this.mixer = null;
    }

    // load the monster
    LoadModel_() {

      const loader = new GLTFLoader();
      loader.load('./resources/TrolliumChloride/SoyMonster.gltf', (gltf) => {
        this.mesh = gltf.scene;
        this.gltf = gltf
        //add model to the scene
        this.params_.scene.add(this.mesh);
        this.mixer = new THREE.AnimationMixer(this.mesh);

      });

    }

    UpdateCollider_() {
      this.collider.setFromObject(this.mesh);
      this.collider.min.z = -8.07592529296875;
      this.collider.max.z = 10.939229736328125;
      this.collider.max.y = 0.18;
      this.collider.max.x = this.collider.max.x - 10;
      this.collider.min.x = this.collider.min.x + 5;
    }

    PlayRightAnimation_() {
      if (!this.mixer) {
        return
      }
      const animations = this.gltf.animations;
      const animation = animations[1];
      this.action = this.mixer.clipAction(animation);
      this.action.setLoop(THREE.LoopOnce);
      this.action.play()
    }

    PlayLeftAnimation_() {
      if (!this.mixer) {
        return
      }
      const animations = this.gltf.animations;
      const animation = animations[2];
      this.action = this.mixer.clipAction(animation);
      this.action.setLoop(THREE.LoopOnce);
      this.action.play()
    }

    Update(timeElapsed) {
      if (!this.mesh) {
        return;
      }
      this.mesh.position.copy(this.position);
      this.mesh.quaternion.copy(this.quaternion)
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
      this.speed_ = 12;
      this.params_ = params;
      this.counter_ = 0;
      this.spawn_ = 0;
      this.soundSogias2 = document.getElementById("sound-sogias2");
      this.soundSogias1 = document.getElementById("sound-sogias1");
    }

    GetColliders() {
      return this.objects_;
    }

    ToggleVisible() {
      this.objects_[0].mesh.visible = false;
    }


    SpawnObj_() {

      var spawnPosition = [0]
      var spawnZ = [0]
      if (this.params_.stage == 2) {
        spawnPosition = [40, 124, 278, 362, 404, 418, 530, 614, 642]
        spawnZ = [8, 16.5, 8, 8, 16.5, 8, 16.5, 16.5, 8]
      } else if (this.params_.stage == 3) {
        spawnPosition = [55, 85, 175, 295, 445, 505, 565, 595, 685, 865, 910]
        spawnZ = [16.5, 8, 16.5, 8, 16.5, 8, 16.5, 8, 16.5, 16.5, 8]
      }

      let obj = null;

      for (var i = 0; i < spawnPosition.length; i++) {
        if (this.counter_ == i) {
          obj = new TrolliumChlorideObject(this.params_);
          obj.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);

          obj.scale = 0.02
          obj.position.set(spawnPosition[i], -5, spawnZ[i]);

          this.objects_.push(obj);
          this.counter_++
        }
      }

    }


    Update(timeElapsed, speed) {
      this.SpawnObj_()
      this.UpdateColliders_(timeElapsed, speed);

    }

    UpdateColliders_(timeElapsed, speed) {
      const visible = [];

      for (let obj of this.objects_) {

        obj.position.x -= timeElapsed * speed;

        if (obj.position.x < 25) {
          if (obj.position.z == 8) {
            obj.PlayRightAnimation_()
            setTimeout(() => {
                this.soundSogias2.play();
            }, 700);
          } else if (obj.position.z == 16.5) {
            obj.position.y = -5
            obj.mesh.visible = true;
            obj.PlayLeftAnimation_()
            setTimeout(() => {
                this.soundSogias1.play();
            }, 700);
          }
        } else {
          if (this.params_.stage == 3) {

            if (obj.position.z == 16.5) {
              obj.position.y = -40
            }
          }
        }

        if (obj.position.x < -7) {
          obj.mesh.visible = false;

        } else {
          visible.push(obj);
        }

        obj.Update(timeElapsed);
      }

      this.objects_ = visible;
    }

  };

  return {
    TrolliumChlorideManager: TrolliumChlorideManager,
  };
})();
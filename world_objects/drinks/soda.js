import * as THREE from '../../node_modules/three/build/three.module.js';

import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

export const soda = (() => {

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

            const textureLoader = new THREE.TextureLoader();
      textureLoader.setPath('./resources/Drinks/');
      const texture = textureLoader.load('drinks_colour.png', () => {
        texture.encoding = THREE.LinearEncoding; // Set the texture encoding if needed
        texture.flipY = false; // Adjust the texture's Y-axis orientation if needed
        texture.minFilter = THREE.LinearFilter; // Set the texture's minification filter if needed
        texture.magFilter = THREE.LinearFilter; // Set the texture's magnification filter if needed
        texture.channel = 0; // Set the desired texture channel (in this case, channel 0)
      });

      loader.load('drinks.gltf', (gltf) => {
        this.mesh = gltf.scene.children[0].children[2];
        this.mesh.traverse(function (node) {
          if (node.isMesh) {
  // Swap shader to basic material
            const material = new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5 });

            // Decrease the brightness of the material
            const brightnessFactor = 0.6; // Value between 0 and 1 (0 = completely dark, 1 = original brightness)
            material.color.multiplyScalar(brightnessFactor);

            // Make sure to update the material to reflect the changes
            material.needsUpdate = true;

            node.material = material;

          }
        });
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
      this.spawn_ = 0;
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


    SpawnObj_(position) {

      var spawnPosition = [0]
      if (this.params_.stage == 1) {
        spawnPosition = [155, 275, 320, 365, 410, 455]
      } else if (this.params_.stage == 2) {
        spawnPosition = [54, 110, 446, 474]

      }


      if (this.params_.firstChase) {
        for (let i = 0; i < spawnPosition.length; i++) {
          spawnPosition[i] += 40;
        }
      }
      let obj = null;

      for (var i = 0; i < spawnPosition.length; i++) {
        if (this.counter_ == i) {
          obj = new DrinksObject(this.params_);

          obj.position.x = spawnPosition[i]
          obj.position.z = position[i]
          obj.scale = 0.02;

          obj.quaternion.setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), -Math.PI / 2);

          this.objects_.push(obj);
          this.counter_++
        }
      }

    }



    Update(timeElapsed) {
      this.SpawnObj_(this.params_.position)
      this.UpdateColliders_(timeElapsed);

    }

    UpdateColliders_(timeElapsed) {
      const invisible = [];
      const visible = [];
      this.rotateY += (timeElapsed/20)

      for (let obj of this.objects_) {
        obj.position.x -= timeElapsed;

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

        obj.Update(timeElapsed*0.083);
      }

      this.objects_ = visible;
      this.unused_.push(...invisible);
    }

  };

  return {
    DrinksManager: DrinksManager,
  };
})();
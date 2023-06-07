// import * as THREE from 'https://storage.googleapis.com/sproud-hpb/node_modules/three/build/three.module.js';

// import { FBXLoader } from "https://storage.googleapis.com/sproud-hpb/node_modules/three/examples/jsm/loaders/FBXLoader.js";




import * as THREE from '../../node_modules/three/build/three.module.js';

import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

export const hpbWrongLogo2 = (() => {

  class BoxObject {
    constructor(params) {
      this.position = new THREE.Vector3(0, 1, 0);
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
      loader.setPath('./resources/crates/');
            const textureLoader = new THREE.TextureLoader();
      textureLoader.setPath('./resources/crates/');
      const texture = textureLoader.load('crates_colour.png', () => {
        texture.encoding = THREE.LinearEncoding; // Set the texture encoding if needed
        texture.flipY = false; // Adjust the texture's Y-axis orientation if needed
        texture.minFilter = THREE.LinearFilter; // Set the texture's minification filter if needed
        texture.magFilter = THREE.LinearFilter; // Set the texture's magnification filter if needed
        texture.channel = 0; // Set the desired texture channel (in this case, channel 0)
      });
      loader.load('crates.gltf', (gltf) => {
        this.mesh = gltf.scene.children[2]
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

  class BoxManager {
    constructor(params) {
      this.objects_ = [];
      this.unused_ = [];
      this.speed_ = 12;
      this.params_ = params;
      this.counter_ = 0;
      this.spawn_ = 0;
      this.floatSpeed = 0.002
      this.rotateY = 0
      this.rotateIncrement = 0.01
      this.positionY = 0;
    }

    GetColliders() {
      return this.objects_;
    }

    ToggleVisible() {
      this.objects_[0].mesh.visible = false;
    }

   
    SpawnObj_(position) {

      const spawnPosition = [190, 280, 550, 700, 925]
      
      let obj = null;

      for (var i = 0; i < spawnPosition.length; i++) {
        if (this.counter_ == i) {
          obj = new BoxObject(this.params_);

          obj.position.x = spawnPosition[i]
          obj.position.z = position[i]
          // obj.position.y = 1

          obj.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2);

          obj.scale = 0.025;
          this.objects_.push(obj);
          this.counter_++
        }
      }

    }


    Update(timeElapsed) {
      this.SpawnObj_(this.params_.position, timeElapsed)
      this.UpdateColliders_(timeElapsed);

    }

    UpdateColliders_(timeElapsed) {
      const invisible = [];
      const visible = [];
      for (let obj of this.objects_) {
        obj.position.x -= timeElapsed;

        if (obj.position.x < -20) {
          invisible.push(obj);
          obj.mesh.visible = false;
        } else {
          visible.push(obj);
        }
        if (this.positionY < 0 && !this.toggleFloat) {
          this.toggleFloat = true;
          this.toggleFloat1 = false;

          this.floatSpeed *= -1
        }

        if (this.positionY  > 0.25 && !this.toggleFloat1) {
          this.toggleFloat = false;
          this.toggleFloat1 = true;

          this.floatSpeed *= -1
        }

        this.positionY += this.floatSpeed ;

        obj.position.y = this.positionY + 1
  
        obj.Update(timeElapsed*0.083);
      }

      this.objects_ = visible;
      this.unused_.push(...invisible);
    }

  };

  return {
    BoxManager: BoxManager,
  };
})();
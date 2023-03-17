// import * as THREE from 'https://storage.googleapis.com/sproud-hpb/node_modules/three/build/three.module.js';

// import { GLTFLoader } from "https://storage.googleapis.com/sproud-hpb/node_modules/three/examples/jsm/loaders/GLTFLoader.js";



import * as THREE from '../../node_modules/three/build/three.module.js';

import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader.js";


export const pitfall = (() => {

    class PitfallObject {
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
            loader.setPath('./resources/Pitfall/');

            loader.load('pit.gltf', (gltf) => {
                this.mesh = gltf.scene
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

    class PitfallManager {
        constructor(params) {
            this.objects_ = [];
            this.unused_ = [];
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


        SpawnObj_(timeElapsed) {
            this.progress_ += timeElapsed * 10.0;

            const spawnPosition = [70, 340]
      
            if (this.params_.firstChase) {
                for (let i = 0; i < spawnPosition.length; i++) {
                  spawnPosition[i] += 100;
                }
              }
            let obj = null;

            const arr = [];
            for (let i = 0; i < spawnPosition.length; i++) {
                const randomValue = Math.random() < 0.5 ? -2 : 2;
                arr.push(randomValue);
            }


            for (var i = 0; i < spawnPosition.length; i++) {
                if (this.counter_ == i) {
                    obj = new PitfallObject(this.params_);

                    obj.position.x = spawnPosition[i]
                    obj.position.y = 0.2
                    obj.position.z = arr[i]

                   

                    obj.scale = 0.01;
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
        PitfallManager: PitfallManager,
    };
})();
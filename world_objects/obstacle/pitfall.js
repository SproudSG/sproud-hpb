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
                this.mesh = gltf.scene.children[this.params_.stage - 1]
                this.params_.scene.add(this.mesh);
            });

        }

        UpdateCollider_() {
            this.collider.setFromObject(this.mesh);
            console.log(this.collider)
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
            var spawnPosition = []
            var spawnZ = [];

            if (this.params_.stage == 1) {
                spawnPosition = [65, 95, 95, 215, 215, 365, 425, 490]
                spawnZ = [0, -3, 3, -3, 3, 3, 0, -3]
            } else if (this.params_.stage == 2) {
                spawnPosition = [138, 194, 278, 334]
                spawnZ = [3, 0, -3, 0]
            } else if (this.params_.stage == 3) {
                spawnPosition = [535, 655, 880]
                spawnZ = [-3, 0, -3]
            }

            if (this.params_.firstChase) {
                for (let i = 0; i < spawnPosition.length; i++) {
                    spawnPosition[i] += 40;
                }
            }
            let obj = null;

            for (var i = 0; i < spawnPosition.length; i++) {
                if (this.counter_ == i) {
                    obj = new PitfallObject(this.params_);
                    obj.position.x = spawnPosition[i]
                    obj.position.y = 0.2
                    obj.position.z = spawnZ[i]
                    obj.scale = 0.0045;
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
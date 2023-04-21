// import * as THREE from 'https://storage.googleapis.com/sproud-hpb/node_modules/three/build/three.module.js';

// import { GLTFLoader } from "https://storage.googleapis.com/sproud-hpb/node_modules/three/examples/jsm/loaders/GLTFLoader.js";


import * as THREE from '../../node_modules/three/build/three.module.js';

import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

export const wallrun = (() => {

    class WallObject {
        constructor(params) {
            this.position = new THREE.Vector3(0, 0, 0);
            this.quaternion = new THREE.Quaternion();
            this.scale = 1.0;
            this.collider = new THREE.Box3();
            this.params_ = params;
            this.LoadModel_();
            this.mixer = null;
        }

        // load the model        
        LoadModel_() {

            const loader = new GLTFLoader();
            loader.setPath('./resources/Wall/');
            loader.load('stg3_wallrun.gltf', (gltf) => {
                console.log(gltf.scene.children[0])
                this.mesh = gltf.scene.children[0].children[0];

                this.params_.scene.add(this.mesh);

            })

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

    class WallManager {
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

        GetPosition(callback) {
            const positions = [];
            for (let i = 0; i < this.objects_.length; i++) {
                positions.push(this.objects_[i].position);
            }
            callback(positions);
        }

        SpawnObj_(timeElapsed) {
            this.progress_ += timeElapsed * 10.0;

            const spawnPosition = [324, 343]
            let obj = null;
            let zPosition = 6.3; // initialize the zPosition to positive 5

            for (var i = 0; i < spawnPosition.length; i++) {
                if (this.counter_ == i) {
                obj = new WallObject(this.params_);

                obj.position.x = spawnPosition[i]
                obj.position.y = 0
                obj.position.z = zPosition; // set the zPosition for the object


                if (zPosition > 0 && i % 2 === 1) {
                    obj.quaternion.setFromAxisAngle(
                        new THREE.Vector3(0, 1, 0), Math.PI / 2);
                }else if(zPosition < 0 && i % 2 === 0) {
                    obj.quaternion.setFromAxisAngle(
                        new THREE.Vector3(0, 1, 0), -Math.PI / 2);
                }else if(zPosition > 0 && i % 2 === 0) {
                    obj.quaternion.setFromAxisAngle(
                        new THREE.Vector3(0, 1, 0), Math.PI / 2);
                }else if(zPosition < 0 && i % 2 === 1) {
                    obj.quaternion.setFromAxisAngle(
                        new THREE.Vector3(0, 1, 0), -Math.PI / 2);
                }





                obj.scale = 0.011;
                this.objects_.push(obj);
                this.counter_++
                zPosition *= -1; // toggle the zPosition between positive and negative
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



                if (obj.position.x < -890) {
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
        WallManager: WallManager,
    };
})();
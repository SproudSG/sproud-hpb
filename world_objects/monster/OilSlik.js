// import * as THREE from 'https://storage.googleapis.com/sproud-hpb/node_modules/three/build/three.module.js';

// import { GLTFLoader } from "https://storage.googleapis.com/sproud-hpb/node_modules/three/examples/jsm/loaders/GLTFLoader.js";


import * as THREE from '../../node_modules/three/build/three.module.js';

import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

export const oilSlik = (() => {

    class OilSlik {
        constructor(params) {
            //player properties
            this.position_ = new THREE.Vector3(-5, 0, 0);
            this.speed_ = 4;
            this.slowCheck = false;
            this.params_ = params;
            this.LoadModel_();
        }

        LoadModel_() {
            const loader = new GLTFLoader();
            loader.setPath('./resources/OilSilk/');
            loader.load('OilSilkChase.gltf', (gltf) => {
                this.mesh_ = gltf.scene;

                this.mesh_.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
                this.mesh_.position.copy(this.position_);
                this.mesh_.scale.set(0.2, 0.2, 0.2);

                this.params_.scene.add(this.mesh_);

                const m = new THREE.AnimationMixer(this.mesh_);
                this.mixer_ = m;
                this.action;
                const clip = gltf.animations[0];
                this.action = this.mixer_.clipAction(clip);
                this.action.play();
            });
        }


        Update(timeElapsed, pause, chase, mapTurn) { //there was a 'slow' variable here
            console.log()
            if (this.mesh_) {

                if (mapTurn == 2) {
                    this.mesh_.position.x = 0
                    if (!this.firstTurn) {
                        this.mesh_.position.z = -18
                        this.firstTurn = true;
                    }
                    this.mesh_.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 2);
                    if (chase && this.mesh_.position.z < -8.5 && !pause) {
                        this.mesh_.position.z += timeElapsed * this.speed_;
                    }

                } else if (mapTurn == 1) {
                    this.mesh_.position.x = 0
                    if (!this.firstTurn) {
                        this.mesh_.position.z = 18
                        this.firstTurn = true;
                    }
                    this.mesh_.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI);
                    if (chase && this.mesh_.position.z < 8.5 && !pause) {
                        this.mesh_.position.z -= timeElapsed * this.speed_;
                    }
                }
                else {
                    if (chase && this.mesh_.position.x < -8.5 && !pause) {
                        this.mesh_.position.x += timeElapsed * this.speed_;
                    }

                    if (!chase && this.mesh_.position.x > -12 && !pause) {
                        this.mesh_.position.x -= timeElapsed * this.speed_;
                    }
                }


                this.mixer_.update(timeElapsed);

                // if (!slow && !this.slowCheck && !pause) {
                //     if (this.mesh_.position.x > -12) {
                //         this.mesh_.position.x -= timeElapsed * this.speed_;
                //     } else {
                //         this.slowCheck = true
                //     }
                // }

            }

        }


    };

    return {
        OilSlik: OilSlik,
    };
})();
// import * as THREE from 'https://storage.googleapis.com/sproud-hpb/node_modules/three/build/three.module.js';

// import { GLTFLoader } from "https://storage.googleapis.com/sproud-hpb/node_modules/three/examples/jsm/loaders/GLTFLoader.js";


import * as THREE from '../../node_modules/three/build/three.module.js';

import { GLTFLoader } from "../../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

export const oilSlik = (() => {

    class OilSlik {
        constructor(params) {
            //player properties
            this.position_ = new THREE.Vector3(-5, 0, 0);
            this.speed_ = 0.2;
            this.slowCheck = false;
            this.params_ = params;
            this.LoadModel_();
        }

        LoadModel_() {
            const loader = new GLTFLoader();
            loader.setPath('./resources/OilSilk/');
            loader.load('BurgerMonster.gltf', (gltf) => {
                this.mesh_ = gltf.scene;

                this.mesh_.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
                this.mesh_.position.copy(this.position_);
                if (this.params_.stage == 1) {
                    if (this.params_.firstChase == false) {
                        this.mesh_.scale.set(0.25, 0.25, 0.25);
                    }else{
                        this.mesh_.scale.set(0.3, 0.3, 0.3);

                    }
                } else {
                    this.mesh_.scale.set(0.25, 0.25, 0.25);
                }

                this.params_.scene.add(this.mesh_);
                const m = new THREE.AnimationMixer(this.mesh_);
                this.mixer_ = m;
                this.action;
                const clip = gltf.animations[0];
                this.action = this.mixer_.clipAction(clip);
                this.action.play();
            });
        }


        Update(timeElapsed, pause, chase, slow) {
            if (this.mesh_) {
                this.mixer_.update(timeElapsed*0.083);
                if (chase && this.mesh_.position.x < -8.5 && !pause) {
                    this.mesh_.position.x += timeElapsed;
                }

                if (!chase && this.mesh_.position.x > -15 && !pause) {
                    this.mesh_.position.x -= timeElapsed;
                }

                if (!slow && !this.slowCheck && !pause) {
                    if (this.mesh_.position.x > -15) {
                        this.mesh_.position.x -= timeElapsed;
                    } else {
                        this.slowCheck = true
                    }
                }
            }
        }
    };
    return {
        OilSlik: OilSlik,
    };
})();
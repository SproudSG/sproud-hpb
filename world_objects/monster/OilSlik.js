import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/GLTFLoader.js";


export const oilSlik = (() => {

    class OilSlik {
        constructor(params) {
            //player properties
            this.position_ = new THREE.Vector3(-10, 0, 0);
            this.playerBox_ = new THREE.Box3();
            this.speed_ = 2;


            this.params_ = params;
            this.LoadModel_();
        }

        LoadModel_() {
            const loader = new GLTFLoader();
            loader.setPath('./resources/OilSilk/');
            loader.load('OilSilkChase.gltf', (gltf) => {
                this.mesh_ = gltf.scene;

                this.mesh_.quaternion.setFromAxisAngle(
                    new THREE.Vector3(0, 1, 0), Math.PI / 2);
        
        
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

        //checks if player collides with any other mesh
        CheckCollisions_() {
        }


        Update(timeElapsed) {

            if (this.mesh_) {
                this.mixer_.update(timeElapsed);
                this.mesh_.position.copy(this.position_);
                this.CheckCollisions_();
                // this.mesh_.position.x = timeElapsed * this.speed_;

            }

        }


    };

    return {
        OilSlik: OilSlik,
    };
})();
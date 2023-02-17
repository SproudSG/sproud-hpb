import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';

import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/FBXLoader.js';


export const oilSlik = (() => {

    class OilSlik {
        constructor(params) {
            //player properties
            this.position_ = new THREE.Vector3(-5, 0, 0);
            this.playerBox_ = new THREE.Box3();
            this.speed_ = 2;


            this.params_ = params;
            this.LoadModel_();
        }

        LoadModel_() {
            const loader = new FBXLoader();
            loader.setPath('./resources/Creatures/FBX/');
            loader.load('monster.fbx', (fbx) => {
                fbx.scale.setScalar(0.01);
                fbx.quaternion.setFromAxisAngle(
                    new THREE.Vector3(0, 1, 0), Math.PI / 2);

                this.mesh_ = fbx;
                this.params_.scene.add(this.mesh_);


                const m = new THREE.AnimationMixer(fbx);
                this.mixer_ = m;

                for (let i = 0; i < fbx.animations.length; ++i) {
                    if (fbx.animations[i].name.includes('Run')) {
                        const clip = fbx.animations[i];
                        const action = this.mixer_.clipAction(clip);
                        action.play();
                    }
                }
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
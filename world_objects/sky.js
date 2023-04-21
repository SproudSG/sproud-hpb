import * as THREE from './../node_modules/three/build/three.module.js';


import { GLTFLoader } from "./../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

export const sky = (() => {

    class Sky {
        constructor(params) {
            this.params_ = params;
            this.position_ = new THREE.Vector3(500, 0, 0); // Set the position to (1000, 0, 0)
            this.mesh_ = null;

            this.LoadModel_();
        }

        LoadModel_() {
            const loader = new GLTFLoader();
            loader.setPath('./resources/Map/Stage3/');
            loader.load('stg3_sky.gltf', (gltf) => {
                console.log(gltf.scene.children[0])

                this.mesh_ = gltf.scene.children[0];
                this.mesh_.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
                this.mesh_.position.copy(this.position_);


                this.params_.scene.add(this.mesh_);
                this.mesh_.scale.set(0.01,0.01, 0.01);

            });
        }

        Update() {
            if (!this.mesh_) {
                return;
            }
            this.mesh_.position.copy(this.position_);
        }
    };

    return {
        Sky: Sky,
    };
})();
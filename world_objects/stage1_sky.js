import * as THREE from './../node_modules/three/build/three.module.js';


import { GLTFLoader } from "./../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

export const stg1sky = (() => {

    class Sky {
        constructor(params) {
            this.params_ = params;
            this.position_ = new THREE.Vector3(0, 50, 0); // Set the position to (1000, 0, 0)
            this.mesh_ = null;

            this.LoadModel_();
        }

        LoadModel_() {
            const loader = new GLTFLoader();

            const textureLoader = new THREE.TextureLoader();

            const texture = textureLoader.load("./resources/Map/Stage1/stg1_sky_colour.png");
            loader.setPath('./resources/Map/Stage1/');

            const material = new THREE.MeshBasicMaterial({
                map: texture
            });


            loader.load('stg1_sky.gltf', (gltf) => {
                this.mesh_ = gltf.scene.children[0];
                 this.mesh_.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI);
                this.mesh_.position.copy(this.position_);
                this.mesh_.traverse((child) => {
                    if (child.isMesh) {
                        child.material = material; // Assign the new texture
                    }
                });

                this.params_.scene.add(this.mesh_);
                this.mesh_.scale.set(0.2, 0.2, 0.2);

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
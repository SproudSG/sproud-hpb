// import * as THREE from 'https://storage.googleapis.com/sproud-hpb/node_modules/three/build/three.module.js';

// import { GLTFLoader } from "https://storage.googleapis.com/sproud-hpb/node_modules/three/examples/jsm/loaders/GLTFLoader.js";


import * as THREE from './../node_modules/three/build/three.module.js';


import { GLTFLoader } from "./../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

import { math } from './math.js';

export const cloud = (() => {

  class BackgroundCloud {
    constructor(params) {
      this.params_ = params;
      this.position_ = new THREE.Vector3();
      this.quaternion_ = new THREE.Quaternion();
      this.scale_ = 1.0;
      this.mesh_ = null;

      this.LoadModel_();
    }

    LoadModel_() {
      const loader = new GLTFLoader();
      loader.setPath('./resources/Clouds/GLTF/');
      loader.load('stg1_cottoncloud.gltf', (gltf) => {
        this.mesh_ = gltf.scene.children[0].children[0].children[math.rand_int(0,2)];
        this.params_.scene.add(this.mesh_);

        this.position_.x = math.rand_range(600, 1200);
        this.position_.y = math.rand_range(100, 180);
        this.position_.z = math.rand_range(500, -1000);
        this.scale_ = math.rand_range(0.01, 0.05);

        const q = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), math.rand_range(0, 360));
        this.quaternion_.copy(q);


      });
    }

    Update(timeElapsed) {
      if (!this.mesh_) {
        return;
      }
      this.position_.x -= timeElapsed * 10 ;

      this.mesh_.position.copy(this.position_);
      this.mesh_.quaternion.copy(this.quaternion_);
      this.mesh_.scale.setScalar(this.scale_);
    }
  };

  class Cloud {
    constructor(params) {
      this.params_ = params;
      this.clouds_ = [];
      this.crap_ = [];

      this.SpawnClouds_();
    }

    SpawnClouds_() {
      for (let i = 0; i < 25; ++i) {
        const cloud = new BackgroundCloud(this.params_);

        this.clouds_.push(cloud);
      }
    }


    Update(timeElapsed) {
      for (let c of this.clouds_) {
        c.Update(timeElapsed*0.083);
      }

    }
  }

  return {
    Cloud: Cloud,
  };
})();
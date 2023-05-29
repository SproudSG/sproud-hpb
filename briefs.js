import * as THREE from './node_modules/three/build/three.module.js';
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js"


// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(75, (window.innerWidth / 2) / (window.innerHeight / 2), 0.1, 1000);
camera.position.z = 100;
camera.position.y = 10;

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
document.getElementById('stage111').appendChild(renderer.domElement);
scene.background = new THREE.Color(0x00BFF3);

// Add objects to the scene

const light = new THREE.DirectionalLight(0xffffff, 200);
light.position.set(1, 1, 1);
scene.add(light);


const loader = new GLTFLoader();
loader.setPath('./resources/');
loader.load('WriteOnEffectTestG.gltf.glb', (gltf) => {
    console.log(gltf)
    const mesh = gltf.scene;
    scene.add(mesh);
    const mixer = new THREE.AnimationMixer(mesh);
    const clock = new THREE.Clock();

    // Find the animation clip by name
    const clip = THREE.AnimationClip.findByName(gltf.animations, 'Animation');

    // Create an animation action from the clip
    const action = mixer.clipAction(clip);
    // Play the animation action
    action.play();
    function animate() {
        requestAnimationFrame(animate);
        const deltaTime = clock.getDelta();

        mixer.update(deltaTime*10);
    
        renderer.render(scene, camera);
    }
    animate();
});


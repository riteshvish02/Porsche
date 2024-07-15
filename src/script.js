import './style.css'
import * as THREE from 'three'
import * as dat from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
// import gsap from 'gsap'

function inet(){
    gsap.registerPlugin(ScrollTrigger);
    const locoScroll = new LocomotiveScroll({
      el: document.querySelector("#main"),
      smooth: true
    });
    locoScroll.on("scroll", ScrollTrigger.update);
    
    ScrollTrigger.scrollerProxy("#main", {
      scrollTop(value) {
        return arguments.length ? locoScroll.scrollTo(value, 0, 0) : locoScroll.scroll.instance.scroll.y;
      }, 
        getBoundingClientRect() {
        return {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight};
      },
      pinType: document.querySelector("#main").style.transform ? "transform" : "fixed"
    });
    
    }
    
    inet();

// Texture loading
const textureLoader = new THREE.TextureLoader();
const floorterrain = textureLoader.load('/textures/terrain-normal.jpg');
const floorrough = textureLoader.load('/textures/terrain-roughness.jpg');
const cubetexture = new THREE.CubeTextureLoader();
const env = cubetexture.load([
    '/textures/environmentMaps/2/px.jpg',
    '/textures/environmentMaps/2/nx.jpg',
    '/textures/environmentMaps/2/py.jpg',
    '/textures/environmentMaps/2/ny.jpg',
    '/textures/environmentMaps/2/pz.jpg',
    '/textures/environmentMaps/2/nz.jpg',
]);

// GLTF and DRACO loading
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
dracoLoader.setDecoderConfig({ type: 'wasm', url: '/draco/draco_decoder.wasm' });
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Base settings
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
camera.position.z = 70;
camera.position.y = 15;
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true,});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
env.encoding = THREE.sRGBEncoding;
renderer.toneMappingExposure = 2;

const gui = new dat.GUI({ width: 400, height: 400, scale: 2 });
const Debugobj = { intensity: 1 };
gui.add(Debugobj, 'intensity').max(10).min(1).step(1).name('intensityEnvMap').onChange(updateMaterial);
gui.add(renderer, 'toneMapping', {
    No: THREE.NoToneMapping,
    Linaer: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    cineon: THREE.CineonToneMapping,
    ACESFilmicg: THREE.ACESFilmicToneMapping,
});

// Lighting
const directionlight = new THREE.DirectionalLight('#ffffff', 1.3);
directionlight.position.set(0.25, 3, -2.25);
scene.add(directionlight);
gui.add(directionlight, 'intensity').min(0).max(10).step(0.001).name('lightIntensity');
gui.add(directionlight.position, 'x').min(-5).max(5).step(0.001).name('lightX');
gui.add(directionlight.position, 'y').min(-5).max(5).step(0.001).name('lightY');
gui.add(directionlight.position, 'z').min(-5).max(5).step(0.001).name('lightZ');

// Floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({
        color: 'red',
      
    })
);
// [floorterrain, floorrough].forEach(texture => {
//     texture.wrapS = THREE.RepeatWrapping;
//     texture.wrapT = THREE.RepeatWrapping;
//     texture.repeat.set(20, 20);
// });
floor.rotation.x = -Math.PI * 0.5;
floor.position.y = -12.5;
scene.add(floor);

// Raycaster
const raycaster = new THREE.Raycaster();
const points = [
    { position: new THREE.Vector3(-10,5.48,11), element: document.querySelector('.point-0') },
    { position: new THREE.Vector3(36.77, 0.8, -1.6), element: document.querySelector('.point-1') },
    { position: new THREE.Vector3(-41, -1.3, -0.7), element: document.querySelector('.point-2') }
];

points.forEach((point, index) => {
    const pointFolder = gui.addFolder(`Point ${index}`);
    pointFolder.add(point.position, 'x').min(-200).max(200).step(0.01).name('X Position');
    pointFolder.add(point.position, 'y').min(-200).max(200).step(0.01).name('Y Position');
    pointFolder.add(point.position, 'z').min(-200).max(200).step(0.01).name('Z Position');
});


// Load model
let carPaintMesh = null;
let angle = 0;
const radius = 100;
gltfLoader.load('/models/scene.glb', (gltf) => {
    // console.log(gltf.scene);
    gltf.scene.scale.set(21, 21, 21);
    gltf.scene.position.set(0, 0, 0);
    gltf.scene.rotation.y = Math.PI / 2;
    scene.add(gltf.scene);
    gui.add(gltf.scene.rotation, 'y').min(-Math.PI).max(Math.PI).step(0.001).name('Rotation');
    gui.add(gltf.scene.position, 'x').min(0).max(100).step(0.001).name('Rotation');
    gui.add(gltf.scene.position, 'y').min(0).max(100).step(0.001).name('Rotation');
    gui.add(gltf.scene.position, 'z').min(0).max(100).step(0.001).name('Rotation');
    gui.add(gltf.scene.scale, 'x').min(0).max(100).step(0.001).name('Rotation');
    gui.add(gltf.scene.scale, 'y').min(0).max(100).step(0.001).name('Rotation');
    gui.add(gltf.scene.scale, 'z').min(0).max(100).step(0.001).name('Rotation');
    
    updateMaterial();
});

// Update material
function updateMaterial() {
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.envMap = env;
            child.material.envMapIntensity = Debugobj.intensity;
            child.castShadow = true;
            child.receiveShadow = true;
        }
        if (child.isMesh && child.material.name === 'EXT_Carpaint.004') {
            carPaintMesh = child;
        }
    });
}

// Change car paint color
function changeCarPaintColor(color) {
    if (carPaintMesh) {
        carPaintMesh.material.color.set(color);
    }
}

// Animate
function animate() {
      angle += 0.01; // Adjust the speed of rotation here
    camera.position.x = radius * Math.cos(angle);
    camera.position.z = radius * Math.sin(angle);
    camera.lookAt(scene.position);
    points.forEach(point => {
        const screenPosition = point.position.clone().project(camera);
        raycaster.setFromCamera(screenPosition, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        const intersectionDistance = intersects.length > 0 ? intersects[0].distance : Infinity;
        const pointDistance = point.position.distanceTo(camera.position);
        point.element.classList.toggle('visible', intersectionDistance >= pointDistance);
        point.element.style.transform = `translateX(${screenPosition.x * sizes.width * 0.5}px) translateY(${-screenPosition.y * sizes.height * 0.5}px)`;
    });
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// Resize handling
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Color change buttons
document.querySelectorAll('button[data-color]').forEach(button => {
    button.addEventListener('click', () => {
        changeCarPaintColor(button.getAttribute('data-color'));
    });
});

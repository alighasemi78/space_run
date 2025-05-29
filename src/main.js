import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Road } from "./road";
import { Audio } from "./audio";
import { Player } from "./player";
import { HUD } from "./hud";
import { Monster } from "./monster";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(8, 6, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // for smooth motion
controls.dampingFactor = 0.05;
controls.target.set(0, 1, 0); // look at the character's chest/torso
controls.update();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const hud = new HUD();
const audio = new Audio(camera);
const road = new Road(scene);
const player = new Player(
    scene,
    road.tileWidth,
    hud.updateHealthBar.bind(hud),
    hud.endGame.bind(hud)
);
const monster = new Monster(scene);

window.addEventListener("keydown", (event) => {
    hud.updateScreen(audio.backgroundAudio, animate);

    // Handle lane movement after game starts
    if (event.code === "ArrowLeft") {
        player.lateralMove(-1);
    } else if (event.code === "ArrowRight") {
        player.lateralMove(1);
    } else if (event.code === "ArrowUp" || event.code === "Space") {
        player.jump(audio.jumpAudio);
    } else if (event.code == "ArrowDown") {
        player.stopJump();
    }
});

function animate() {
    if (hud.isGameOver) return;
    requestAnimationFrame(animate);

    road.update();
    player.update(road, audio.screamAudio, audio.hitAudio);
    monster.update(player.player);
    hud.update();

    controls.update();
    renderer.render(scene, camera);
}

renderer.render(scene, camera);

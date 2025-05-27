import * as THREE from "three";
import { Road } from "./road";
import { Audio } from "./audio";
import { Player } from "./player";
import { HUD } from "./hud";
import { Monster } from "./monster";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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
    }
});

function animate() {
    if (hud.isGameOver) return;
    requestAnimationFrame(animate);

    road.update();
    player.update(road, audio.screamAudio, audio.hitAudio);
    monster.update(player.player);
    hud.update();

    renderer.render(scene, camera);
}

renderer.render(scene, camera);

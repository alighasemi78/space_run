import { World } from "./world";
import { Road } from "./road";
import { Audio } from "./audio";
import { Player } from "./player";
import { HUD } from "./hud";
import { Plane } from "./plane";

const world = new World();

const scene = world.scene;
const skyTexture = world.skyTexture;
const camera = world.camera;
const renderer = world.renderer;
// const composer = world.composer;
const controls = world.controls;

const hud = new HUD();
const audio = new Audio(camera);
const road = new Road(scene, skyTexture);
const player = new Player(
    scene,
    road.tileWidth,
    audio,
    hud.updateHealthBar.bind(hud),
    hud.updateJetPackBar.bind(hud),
    hud.endGame.bind(hud)
);
const plane = new Plane(scene, road.tileWidth, skyTexture);

world.handleKeyPress(animate, hud, audio, player);

function animate() {
    if (hud.isGameOver) return;
    requestAnimationFrame(animate);

    const elapsedSeconds = world.getElapsedSeconds();

    road.update(elapsedSeconds);
    player.update(road);
    plane.update(player.player);
    hud.update(elapsedSeconds);

    controls.update();
    renderer.render(scene, camera);
    // composer.render();
}

renderer.render(scene, camera);

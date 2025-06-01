import { World } from "./world";
import { Road } from "./road";
import { Audio } from "./audio";
import { Player } from "./player";
import { HUD } from "./hud";
import { Plane } from "./plane";

const world = new World();

const scene = world.scene;
const camera = world.camera;
const renderer = world.renderer;
const controls = world.controls;
const skyTexture = world.skyTexture;

const hud = new HUD();
const audio = new Audio(camera);
const road = new Road(scene, skyTexture);
const player = new Player(
    scene,
    road.tileWidth,
    audio,
    hud.updateHealthBar.bind(hud),
    hud.endGame.bind(hud)
);
const plane = new Plane(scene, road.tileWidth, skyTexture);

world.handleKeyPress(animate, hud, audio, player);

function animate() {
    if (hud.isGameOver) return;
    requestAnimationFrame(animate);

    road.update();
    player.update(road);
    plane.update(player.player);
    hud.update();

    controls.update();
    renderer.render(scene, camera);
}

renderer.render(scene, camera);

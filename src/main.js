import * as THREE from "three";

let gameStarted = false;
let isGameOver = false;

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScoreText = document.getElementById("final-score");

let score = 0;
const scoreDisplay = document.getElementById("score");

let health = 3;
const maxHealth = 3;
const healthFill = document.getElementById("health-fill");

let monsterOffsetZ = 3; // how far behind the player the monster stays

let isGrounded = true;
let verticalVelocity = 0;
const gravity = -0.01;
const jumpVelocity = 0.3;

function updateHealthBar() {
    const percentage = (health / maxHealth) * 100;
    healthFill.style.width = percentage + "%";
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // light blue sky
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 2, 5);

const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load("../assets/audio/background.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
});

const fallSound = new THREE.Audio(listener);
const fallLoader = new THREE.AudioLoader();
fallLoader.load("../assets/audio/scream.mp3", function (buffer) {
    fallSound.setBuffer(buffer);
    fallSound.setVolume(0.7);
});

const jumpSound = new THREE.Audio(listener);
const landSound = new THREE.Audio(listener);
const hitSound = new THREE.Audio(listener);

audioLoader.load("../assets/audio/gruntJump.mp3", (buffer) => {
    jumpSound.setBuffer(buffer);
    jumpSound.setVolume(0.5);
});
audioLoader.load("../assets/audio/gruntTrip.mp3", (buffer) => {
    hitSound.setBuffer(buffer);
    hitSound.setVolume(0.5);
});

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Light
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);

// Ground
const tileGeometry = new THREE.BoxGeometry(4, 0.1, 4);
const tileMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });

const tiles = [];
for (let i = 0; i < 10; i++) {
    const tile = new THREE.Mesh(tileGeometry, tileMaterial);

    tile.position.z = -i * 4;
    scene.add(tile);
    tiles.push(tile);
}

// Player
const playerGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 0.6, 0); // center lane, slightly above the ground
scene.add(player);

const playerBox = new THREE.Box3().setFromObject(player);

// Monster (chasing from behind)
const monsterGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
const monsterMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
const monster = new THREE.Mesh(monsterGeometry, monsterMaterial);
monster.position.set(0, 0.6, 3); // Start behind the player
scene.add(monster);

// Variables for player movement
let lane = 0; // -1 for left, 0 for center, 1 for right
const laneOffset = 1.2; // how far left/right the lanes are

window.addEventListener("keydown", (event) => {
    if (!gameStarted) {
        gameStarted = true;
        sound.play();
        startScreen.style.display = "none"; // Hide start menu
        animate();
    }

    if (isGameOver) {
        // Restart the game by reloading the page
        location.reload();
        return;
    }

    // Handle lane movement after game starts
    if (event.code === "ArrowLeft" && lane > -1) {
        lane -= 1;
    } else if (event.code === "ArrowRight" && lane < 1) {
        lane += 1;
    } else if (
        (event.code === "ArrowUp" || event.code === "Space") &&
        isGrounded
    ) {
        verticalVelocity = jumpVelocity;
        isGrounded = false;
        if (jumpSound.isPlaying) jumpSound.stop();
        jumpSound.play();
    }
});

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const obstacleGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

const obstacles = [];

function spawnObstacle(zPos) {
    const laneIndex = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(laneIndex * laneOffset, 0.6, zPos);
    const obstacleBox = new THREE.Box3().setFromObject(obstacle);
    obstacle.userData.box = obstacleBox;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// Initial batch of obstacles
for (let i = 1; i <= 5; i++) {
    spawnObstacle(-i * 8); // space them out initially
}

function endGame() {
    if (isGameOver) return;
    isGameOver = true;

    finalScoreText.textContent = "Score: " + Math.floor(score);
    gameOverScreen.style.display = "flex";
}

function handlePlayerHit(obstacle) {
    if (hitSound.isPlaying) hitSound.stop();
    hitSound.play();
    health--;
    updateHealthBar();

    // Bring monster closer after each hit
    monsterOffsetZ = Math.max(monsterOffsetZ - 0.5, 0.5); // minimum distance

    // Flash effect
    let flashDuration = 2000; // in ms
    let flashInterval = 200;
    let flashCount = 0;
    const flashTimer = setInterval(() => {
        player.visible = !player.visible;
        flashCount += flashInterval;
        if (flashCount >= flashDuration) {
            clearInterval(flashTimer);
            player.visible = true;
        }
    }, flashInterval);

    // Animate obstacle to fall (rotate)
    const fallSpeed = 0.05;
    let angle = 0;
    const fallTimer = setInterval(() => {
        if (angle >= Math.PI / 2) {
            clearInterval(fallTimer);
            return;
        }
        obstacle.rotation.x += fallSpeed;
        angle += fallSpeed;
    }, 16);

    // Check for death
    if (health <= 0) {
        console.log("💀 Monster caught the player!");
        endGame();
    }
}

let previousWasGap = false;

function animate() {
    if (isGameOver) return;
    requestAnimationFrame(animate);

    // Move tiles forward to simulate motion
    tiles.forEach((tile) => {
        tile.position.z += 0.1;

        // Recycle tiles when they move behind the camera
        if (tile.position.z > 5) {
            tile.position.z -= 40; // 10 tiles * 4 units apart

            // Make sure no two consecutive gaps
            tile.userData.isGap = !previousWasGap && Math.random() < 0.2;
            tile.visible = !tile.userData.isGap;

            previousWasGap = tile.userData.isGap;
        }
    });

    // Smooth lane transition (optional)
    const targetX = lane * laneOffset;
    player.position.x += (targetX - player.position.x) * 0.2;
    // Apply vertical velocity
    if (!isGrounded) {
        player.position.y += verticalVelocity;
        verticalVelocity += gravity;
    }

    // Check if player is standing on a tile
    let groundedThisFrame = false;

    for (const tile of tiles) {
        if (tile.isMesh && !tile.userData.isGap) {
            const dz = Math.abs(tile.position.z - player.position.z);
            if (dz < 2 && player.position.y <= 0.61) {
                groundedThisFrame = true;
                break;
            }
        }
    }

    if (groundedThisFrame) {
        if (!isGrounded) {
            // Just landed
            player.position.y = 0.6;
            verticalVelocity = 0;
            isGrounded = true;
        }
    } else {
        isGrounded = false;
    }

    // Game over if fallen too far
    if (player.position.y < -2) {
        if (!fallSound.isPlaying) fallSound.play();
        endGame();
    }

    // Smoothly follow the player's X position
    monster.position.x += (player.position.x - monster.position.x) * 0.1;

    // Stay behind the player at a fixed Z offset
    const desiredZ = player.position.z + monsterOffsetZ;
    monster.position.z += (desiredZ - monster.position.z) * 0.05;

    // Move and recycle obstacles
    obstacles.forEach((obs) => {
        obs.position.z += 0.1;
        if (obs.position.z > 5) {
            obs.position.z -= 40; // Recycle to back

            // Pick a random tile to align with
            const tile = tiles.find(
                (t) =>
                    t.isMesh &&
                    !t.userData.isGap &&
                    Math.abs(t.position.z - obs.position.z) < 1
            );

            if (tile) {
                const newLane = Math.floor(Math.random() * 3) - 1;
                obs.position.x = newLane * laneOffset;
                obs.visible = true;
            } else {
                obs.visible = false;
            }

            obs.rotation.x = 0;
            obs.userData.hit = false;
        }
    });

    // Update player bounding box
    playerBox.setFromObject(player);

    // Collision check
    for (const obs of obstacles) {
        obs.userData.box.setFromObject(obs);
        if (playerBox.intersectsBox(obs.userData.box)) {
            if (!obs.userData.hit) {
                obs.userData.hit = true; // prevent multiple triggers
                handlePlayerHit(obs);
            }
        }
    }

    score += 0.01;
    scoreDisplay.textContent = "Score: " + Math.floor(score);

    renderer.render(scene, camera);
}

renderer.render(scene, camera);

import * as THREE from "three";

export class Player {
    constructor(scene, tileWidth, updateHealthBar, endGame) {
        this.scene = scene;
        this.tileWidth = tileWidth;
        this.updateHealthBar = updateHealthBar;
        this.endGame = endGame;
        this._player = null;
        this.playerBox = null;

        this.lane = 0;

        this.isJumping = false;
        this.verticalVelocity = 0;
        this.gravity = -0.01;
        this.jumpVelocity = 0.2;

        this.health = 3; // Player's health
        this.maxHealth = 3; // Maximum health

        this.createPlayer();
    }

    createPlayer() {
        const playerGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
        const playerMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
        });
        this._player = new THREE.Mesh(playerGeometry, playerMaterial);
        this._player.position.set(0, 0.6, 0);
        this.scene.add(this._player);

        this.playerBox = new THREE.Box3().setFromObject(this._player);
    }

    lateralMove(direction) {
        this.lane += direction;
        this.lane = Math.max(this.lane, -1);
        this.lane = Math.min(this.lane, 1);
    }

    jump(jumpAudio) {
        if (!this.isJumping) {
            this.verticalVelocity = this.jumpVelocity;
            this.isJumping = true;
            if (jumpAudio.isPlaying) jumpAudio.stop();
            jumpAudio.play();
        }
    }

    handlePlayerHit(obstacle, hitAudio) {
        if (!hitAudio.isPlaying) hitAudio.play();
        this.health--;
        this.updateHealthBar(this.health);

        // Bring monster closer after each hit
        // monsterOffsetZ = Math.max(monsterOffsetZ - 0.5, 0.5); // minimum distance

        // Flash effect
        let flashDuration = 2000; // in ms
        let flashInterval = 200;
        let flashCount = 0;
        const flashTimer = setInterval(() => {
            this._player.visible = !this._player.visible;
            flashCount += flashInterval;
            if (flashCount >= flashDuration) {
                clearInterval(flashTimer);
                this._player.visible = true;
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
            obstacle.rotation.z += fallSpeed;
            angle += fallSpeed;
        }, 16);

        // Check for death
        if (this.health <= 0) {
            console.log("💀 Monster caught the player!");
            this.endGame();
        }
    }

    update(road, screamAudio, hitAudio) {
        // Smooth lane transition (optional)
        const targetX = this.lane * this.tileWidth;
        this._player.position.x += (targetX - this._player.position.x) * 0.2;

        // Apply vertical velocity
        if (this.isJumping) {
            this._player.position.y += this.verticalVelocity;
            this.verticalVelocity += this.gravity;
        }

        const tile = road.getTileAt(
            this._player.position.x,
            this._player.position.z
        );
        if (
            tile.visible &&
            this._player.position.y <= 0.61 &&
            this._player.position.y >= 0
        ) {
            if (this.isJumping) {
                this._player.position.y = 0.6;
                this.verticalVelocity = 0;
                this.isJumping = false;
            }
        } else {
            this.isJumping = true;
        }

        // Game over if fallen too far
        if (this._player.position.y < 0) {
            if (!screamAudio.isPlaying) screamAudio.play();
            this.endGame();
        }

        // Update player bounding box
        this.playerBox.setFromObject(this._player);

        road.checkCollision(
            this.playerBox,
            this.handlePlayerHit.bind(this),
            hitAudio
        );
    }

    get player() {
        return this._player;
    }
}

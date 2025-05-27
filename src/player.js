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
        this._player = new THREE.Group();

        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.8, 0.3),
            material
        );
        torso.position.set(0, 1, 0);

        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 0.3),
            material
        );
        head.position.set(0, 1.55, 0);

        this.leftArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.6, 0.15),
            material
        );
        this.leftArm.position.set(-0.4, 1.1, 0);

        this.rightArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.6, 0.15),
            material
        );
        this.rightArm.position.set(0.4, 1.1, 0);

        this.leftLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.6, 0.15),
            material
        );
        this.leftLeg.position.set(-0.15, 0.3, 0);

        this.rightLeg = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.6, 0.15),
            material
        );
        this.rightLeg.position.set(0.15, 0.3, 0);

        this._player.add(
            torso,
            head,
            this.leftArm,
            this.rightArm,
            this.leftLeg,
            this.rightLeg
        );

        this._player.position.set(0, 0, 0);
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
        const time = performance.now() * 0.005; // time in milliseconds → seconds
        const swing = Math.sin(time * 5) * 0.5; // speed and amplitude

        // Arms swing opposite to legs
        this.leftArm.rotation.x = swing;
        this.rightArm.rotation.x = -swing;
        this.leftLeg.rotation.x = -swing;
        this.rightLeg.rotation.x = swing;

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
            this._player.position.y <= 0.1 &&
            this._player.position.y >= -0.5
        ) {
            if (this.isJumping) {
                this._player.position.y = 0;
                this.verticalVelocity = 0;
                this.isJumping = false;
            }
        } else {
            this.isJumping = true;
        }

        // Game over if fallen too far
        if (this._player.position.y < -0.5) {
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

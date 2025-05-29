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
        this.jumpVelocity = 0.3;

        this.health = 3; // Player's health
        this.maxHealth = 3; // Maximum health

        this.createPlayer();
    }

    createLeg(material, xPosition) {
        const shinWidth = 0.1;
        const shinLength = 0.6;
        const shinAngle = -Math.PI / 6;
        const thighWidth = 0.2;
        const thighLength = 0.4;
        const thighAngle = Math.PI / 6;

        const leg = new THREE.Group();

        const shin = new THREE.Mesh(
            new THREE.BoxGeometry(shinWidth, shinLength, shinWidth),
            material
        );
        shin.castShadow = true;
        shin.receiveShadow = true;
        shin.rotateX(shinAngle);

        shin.position.set(
            0,
            -(shinLength / 2) * Math.cos(shinAngle) -
                thighLength * Math.cos(thighAngle),
            -(shinLength / 2) * Math.sin(shinAngle) -
                thighLength * Math.sin(thighAngle)
        );

        const thighMaterial = new THREE.MeshStandardMaterial({ color: "red" });
        const thigh = new THREE.Mesh(
            new THREE.BoxGeometry(thighWidth, thighLength, thighWidth),
            thighMaterial
        );
        thigh.castShadow = true;
        thigh.receiveShadow = true;
        thigh.rotateX(thighAngle);

        thigh.position.set(
            0,
            -(thighLength / 2) * Math.cos(thighAngle),
            -(thighLength / 2) * Math.sin(thighAngle)
        );

        leg.add(thigh, shin);
        leg.position.set(
            xPosition,
            shinLength * Math.cos(shinAngle) -
                (shinWidth / 2) * Math.sin(shinAngle) +
                thighLength * Math.cos(thighAngle),
            shinLength * Math.sin(shinAngle) +
                thighLength * Math.sin(thighAngle)
        );
        leg.userData.joint = leg.position;

        return leg;
    }

    createTorso(leg) {
        const torsoWidth = 0.5;
        const torsoHeight = 0.8;
        const torsoDepth = 0.3;

        const legBox = new THREE.Box3().setFromObject(leg);
        const legSize = new THREE.Vector3();
        legBox.getSize(legSize);

        const material = new THREE.MeshStandardMaterial({ color: "blue" });

        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(torsoWidth, torsoHeight, torsoDepth),
            material
        );
        torso.castShadow = true;
        torso.receiveShadow = true;
        torso.position.set(
            0,
            legSize.y + torsoHeight / 2,
            leg.userData.joint.z
        );

        return torso;
    }

    createArm(material, xPosition, leg, torso) {
        const bicepWidth = 0.1;
        const bicepHeight = 0.4;
        const handAngle = Math.PI / 3;

        const legBox = new THREE.Box3().setFromObject(leg);
        const legSize = new THREE.Vector3();
        legBox.getSize(legSize);

        const torsoBox = new THREE.Box3().setFromObject(torso);
        const torsoSize = new THREE.Vector3();
        const torsoCenter = new THREE.Vector3();
        torsoBox.getSize(torsoSize);
        torsoBox.getCenter(torsoCenter);

        const arm = new THREE.Group();

        const bicep = new THREE.Mesh(
            new THREE.BoxGeometry(bicepWidth, bicepHeight, bicepWidth),
            material
        );
        bicep.castShadow = true;
        bicep.receiveShadow = true;
        bicep.position.set(0, -bicepHeight / 2, 0);

        const hand = new THREE.Mesh(
            new THREE.BoxGeometry(bicepWidth, bicepHeight, bicepWidth),
            material
        );
        hand.castShadow = true;
        hand.receiveShadow = true;
        hand.rotateX(handAngle);
        hand.position.set(
            0,
            -bicepHeight - (bicepHeight / 2) * Math.cos(handAngle),
            -(bicepHeight / 2) * Math.sin(handAngle)
        );

        arm.add(bicep, hand);
        arm.position.set(xPosition, legSize.y + torsoSize.y, torsoCenter.z);

        return arm;
    }

    createHead(material, leg, torso) {
        const headWidth = 0.3;
        const hairHeight = 0.05;

        const legBox = new THREE.Box3().setFromObject(leg);
        const legSize = new THREE.Vector3();
        legBox.getSize(legSize);

        const torsoBox = new THREE.Box3().setFromObject(torso);
        const torsoSize = new THREE.Vector3();
        const torsoCenter = new THREE.Vector3();
        torsoBox.getSize(torsoSize);
        torsoBox.getCenter(torsoCenter);

        const head = new THREE.Group();

        const face = new THREE.Mesh(
            new THREE.BoxGeometry(headWidth, headWidth, headWidth),
            material
        );
        face.castShadow = true;
        face.receiveShadow = true;
        face.position.set(0, 0, 0);

        const hairMaterial = new THREE.MeshStandardMaterial({
            color: "black",
        });

        const hair = new THREE.Mesh(
            new THREE.BoxGeometry(headWidth, hairHeight, headWidth),
            hairMaterial
        );
        hair.castShadow = true;
        hair.receiveShadow = true;
        hair.position.set(0, headWidth / 2 + hairHeight / 2, 0);

        head.add(hair, face);
        head.position.set(
            0,
            legSize.y + torsoSize.y + headWidth / 2,
            torsoCenter.z
        );

        return head;
    }

    createPlayer() {
        this._player = new THREE.Group();

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: "sandybrown",
        });

        this.leftLeg = this.createLeg(bodyMaterial, 0.15);
        this.rightLeg = this.createLeg(bodyMaterial, -0.15);

        const torso = this.createTorso(this.leftLeg);

        this.leftArm = this.createArm(bodyMaterial, -0.35, this.leftLeg, torso);
        this.rightArm = this.createArm(bodyMaterial, 0.35, this.leftLeg, torso);

        const head = this.createHead(bodyMaterial, this.leftLeg, torso);

        this._player.add(
            head,
            torso,
            this.leftArm,
            this.rightArm,
            this.leftLeg,
            this.rightLeg
        );

        this._player.position.set(0, 0.1, 0);
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

    stopJump() {
        if (this.isJumping) {
            this.verticalVelocity = 10 * this.gravity;
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
        } else {
            const time = performance.now() * 0.005; // time in milliseconds → seconds
            const swing = Math.sin(time * 3) * 1; // speed and amplitude

            // Arms swing opposite to legs
            this.leftArm.rotation.x = swing;
            this.rightArm.rotation.x = -swing;
            this.leftLeg.rotation.x = swing;
            this.rightLeg.rotation.x = -swing;
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

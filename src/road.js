import * as THREE from "three";

export class Road {
    constructor(scene, skyTexture) {
        this.scene = scene;
        this.skyTexture = skyTexture;

        this.roadLength = 20;
        this._tiles = [];

        this.sampleTile = this.createSampleTile();
        this.sampleLaserGate = this.createSampleLaserGate();
        this.sampleMeteorite = this.createSampleMeteorite();
        this.sampleJetpack = this.createSampleJetPack();

        this.createTiles();
    }

    createSampleTile() {
        this._tileWidth = 2; // Width of each tile
        this.tileHeight = 0.2;

        const tileGeometry = new THREE.BoxGeometry(
            this._tileWidth,
            this.tileHeight,
            this._tileWidth
        );
        const tileMaterial = new THREE.MeshStandardMaterial({
            color: "black",
        });

        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.receiveShadow = true;
        tile.position.set(0, 0, 0);
        tile.userData.isGap = false; // Initialize gap state
        tile.visible = !tile.userData.isGap; // Initially visible

        return tile;
    }

    createSampleLaserGate() {
        const poleWidth = 0.3;
        const poleHeight = 1;

        const laserGate = new THREE.Group();

        const poleL = new THREE.Mesh(
            new THREE.BoxGeometry(poleWidth, 1, poleWidth),
            new THREE.MeshStandardMaterial({
                color: 0x888888,
            })
        );
        const poleR = poleL.clone();

        poleL.position.set(-this.tileWidth / 2 + poleWidth / 2, 0, 0);
        poleR.position.set(this.tileWidth / 2 - poleWidth / 2, 0, 0);

        const laser = new THREE.Mesh(
            new THREE.BoxGeometry(
                this.tileWidth - 2 * poleWidth,
                poleHeight / 2,
                poleWidth / 2
            ),
            new THREE.MeshStandardMaterial({
                color: "red",
                emissive: "red",
                transparent: true,
                opacity: 0.4,
                emissiveIntensity: 2,
            })
        );
        laser.position.set(0, 0, 0);

        laserGate.add(poleL, poleR, laser);
        laserGate.position.set(0, poleHeight / 2, 0);
        return laserGate;
    }

    createSampleMeteorite() {
        const meteoriteWidth = this.tileWidth / 3;

        const geometry = new THREE.IcosahedronGeometry(meteoriteWidth, 0);
        const material = new THREE.MeshStandardMaterial({
            color: "brown",
            roughness: 1.0,
        });
        const rock = new THREE.Mesh(geometry, material);

        // Apply random non-uniform scale
        rock.scale.set(
            0.8 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4
        );

        rock.position.set(0, 0, 0);

        return rock;
    }

    createSampleJetPack() {
        const jetpack = new THREE.Group();

        const material = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.6,
            metalness: 0.8,
        });

        // Two cylindrical thrusters
        for (let i = -1; i <= 1; i += 2) {
            const thruster = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, 0.8, 12),
                material
            );
            thruster.position.set(i * 0.2, 0, 0); // adjust spacing

            // Flame
            const flameMat = new THREE.MeshStandardMaterial({
                color: 0xff6600,
                emissive: 0xff2200,
                transparent: true,
                opacity: 0.7,
            });

            const flame = new THREE.Mesh(
                new THREE.ConeGeometry(0.05, 0.3, 8),
                flameMat
            );
            flame.rotation.x = Math.PI; // Flip down
            flame.position.set(0, -0.45, 0);
            thruster.add(flame);

            jetpack.add(thruster);
        }

        jetpack.position.y = this.tileHeight + 0.4;

        return jetpack;
    }

    createLaserGate(x, z) {
        const laserGate = this.sampleLaserGate.clone();
        laserGate.position.x = x;
        laserGate.position.z = z;
        return laserGate;
    }

    createMeteorite(x, z) {
        const asteroid = this.sampleMeteorite.clone();
        asteroid.position.x = x;
        asteroid.position.z = z;

        return asteroid;
    }

    createObstacle(x, z) {
        let obstacle = null;
        if (Math.random() < 0.5) {
            obstacle = this.createLaserGate(x, z);
        } else {
            obstacle = this.createMeteorite(x, z);
        }
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        obstacle.userData.box = obstacleBox;

        return obstacle;
    }

    createJetPack(x, z) {
        const jetPack = this.sampleJetpack.clone();
        jetPack.position.x = x;
        jetPack.position.z = z;

        const jetPackBox = new THREE.Box3().setFromObject(jetPack);
        jetPack.userData.box = jetPackBox;

        return jetPack;
    }

    createTiles() {
        for (let i = 0; i < this.roadLength; i++) {
            const row = [];
            const rowHasObstacles = i > 0 && Math.random() < 0.2;
            for (let j = 0; j < 3; j++) {
                const tile = this.sampleTile.clone();
                tile.position.set(
                    j * this._tileWidth - this._tileWidth,
                    0,
                    -i * this._tileWidth
                );
                tile.userData.hasJetPack = false;
                tile.userData.isGap = false; // Initialize gap state
                tile.visible = !tile.userData.isGap; // Initially visible
                tile.userData.hasObstacle =
                    rowHasObstacles && Math.random() < 0.33;

                if (tile.userData.hasObstacle) {
                    const obstacle = this.createObstacle(
                        j * this._tileWidth - this._tileWidth,
                        -i * this._tileWidth
                    );
                    tile.userData.obstacle = obstacle;
                    this.scene.add(obstacle);
                }

                row.push(tile);
                this.scene.add(tile);
            }
            this._tiles.push(row);
        }
    }

    update() {
        const hasJetPack = Math.random() < 0.05;
        let jetPackUsed = false;

        // Move tiles forward to simulate motion
        this._tiles.forEach((row, i) => {
            const isGap = Math.random() < 0.1;
            const rowHasObstacles = i > 0 && Math.random() < 0.2;
            row.forEach((tile) => {
                tile.position.z += 0.1;

                if (tile.userData.hasJetPack) {
                    tile.userData.jetPack.position.z += 0.1;
                    tile.userData.jetPack.rotation.y += 0.05;
                }

                if (tile.userData.hasObstacle) {
                    tile.userData.obstacle.position.z += 0.1;
                }

                // Recycle tiles when they move behind the camera
                if (tile.position.z > 20) {
                    tile.position.z -= this.roadLength * this._tileWidth;

                    // Make sure no two consecutive gaps
                    tile.userData.isGap =
                        (i == 0 || this._tiles[i - 1][0].visible) && isGap;
                    tile.visible = !tile.userData.isGap;

                    if (tile.userData.hasJetPack) {
                        this.scene.remove(tile.userData.jetPack);
                    }

                    tile.userData.hasJetPack =
                        !tile.userData.isGap &&
                        hasJetPack &&
                        !jetPackUsed &&
                        Math.random() < 0.33;

                    if (tile.userData.hasJetPack) {
                        jetPackUsed = true;

                        const jetPack = this.createJetPack(
                            tile.position.x,
                            tile.position.z
                        );
                        tile.userData.jetPack = jetPack;
                        this.scene.add(jetPack);
                    }

                    if (tile.userData.hasObstacle) {
                        this.scene.remove(tile.userData.obstacle);
                    }

                    tile.userData.hasObstacle =
                        !tile.userData.hasJetPack &&
                        !tile.userData.isGap &&
                        rowHasObstacles &&
                        Math.random() < 0.33;

                    if (tile.userData.hasObstacle) {
                        const obstacle = this.createObstacle(
                            tile.position.x,
                            tile.position.z
                        );
                        tile.userData.obstacle = obstacle;
                        this.scene.add(obstacle);
                    }
                }
            });
        });
    }

    getTileAt(x, z) {
        let selected_tile = null;
        let min_dis = Infinity;

        this._tiles.forEach((row) => {
            row.forEach((tile) => {
                if (
                    Math.sqrt(
                        (tile.position.x - x) ** 2 + (tile.position.z - z) ** 2
                    ) < min_dis
                ) {
                    selected_tile = tile;
                    min_dis = Math.sqrt(
                        (tile.position.x - x) ** 2 + (tile.position.z - z) ** 2
                    );
                }
            });
        });

        return selected_tile;
    }

    checkCollision(playerBox, handlePlayerHit, hitAudio) {
        // Collision check
        this._tiles.forEach((row) => {
            row.forEach((tile) => {
                if (tile.userData.hasObstacle) {
                    const obstacle = tile.userData.obstacle;
                    obstacle.userData.box.setFromObject(obstacle);
                    if (playerBox.intersectsBox(obstacle.userData.box)) {
                        if (!obstacle.userData.hit) {
                            obstacle.userData.hit = true; // prevent multiple triggers
                            handlePlayerHit(hitAudio);
                        }
                    }
                }
            });
        });
    }

    checkJetPack(playerBox, handleJetPack) {
        // Collision check
        this._tiles.forEach((row) => {
            row.forEach((tile) => {
                if (tile.userData.hasJetPack) {
                    const jetPack = tile.userData.jetPack;
                    jetPack.userData.box.setFromObject(jetPack);
                    if (playerBox.intersectsBox(jetPack.userData.box)) {
                        if (!jetPack.userData.hit) {
                            jetPack.userData.hit = true; // prevent multiple triggers
                            handleJetPack(jetPack);
                        }
                    }
                }
            });
        });
    }

    get tiles() {
        return this._tiles;
    }

    get tileWidth() {
        return this._tileWidth;
    }
}

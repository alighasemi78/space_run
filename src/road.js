import * as THREE from "three";

export class Road {
    constructor(scene, skyTexture) {
        this.scene = scene;
        this.skyTexture = skyTexture;

        this._tileWidth = 2; // Width of each tile

        this.tileGeometry = new THREE.BoxGeometry(
            this._tileWidth,
            0.2,
            this._tileWidth
        );
        this.tileMaterial = new THREE.MeshStandardMaterial({
            color: "white",
            envMap: this.skyTexture,
            metalness: 0.9,
            roughness: 0.1,
            envMapIntensity: 10,
        });
        this.obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
        this.obstacleMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            envMap: this.skyTexture,
            metalness: 0.9,
            roughness: 0.1,
            envMapIntensity: 10,
        });

        this._tiles = [];

        this.createTiles();
    }

    createTiles() {
        for (let i = 0; i < 30; i++) {
            const row = [];
            const rowHasObstacles = i > 0 && Math.random() < 0.2;
            for (let j = 0; j < 3; j++) {
                const tile = new THREE.Mesh(
                    this.tileGeometry,
                    this.tileMaterial
                );
                tile.castShadow = true;
                tile.receiveShadow = true;
                tile.position.set(
                    j * this._tileWidth - this._tileWidth,
                    0,
                    -i * this._tileWidth
                );
                tile.userData.isGap = false; // Initialize gap state
                tile.visible = !tile.userData.isGap; // Initially visible
                tile.userData.hasObstacle =
                    rowHasObstacles && Math.random() < 0.33;

                if (tile.userData.hasObstacle) {
                    const obstacle = new THREE.Mesh(
                        this.obstacleGeometry,
                        this.obstacleMaterial
                    );
                    obstacle.castShadow = true;
                    obstacle.receiveShadow = true;
                    obstacle.position.set(
                        j * this._tileWidth - this._tileWidth,
                        0.6,
                        -i * this._tileWidth
                    );
                    const obstacleBox = new THREE.Box3().setFromObject(
                        obstacle
                    );
                    obstacle.userData.box = obstacleBox;
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
        // Move tiles forward to simulate motion
        this._tiles.forEach((row, i) => {
            const isGap = Math.random() < 0.1;
            const rowHasObstacles = i > 0 && Math.random() < 0.2;
            row.forEach((tile) => {
                tile.position.z += 0.1;

                if (tile.userData.hasObstacle) {
                    tile.userData.obstacle.position.z += 0.1;
                }

                // Recycle tiles when they move behind the camera
                if (tile.position.z > 20) {
                    tile.position.z -= 30 * this._tileWidth;

                    // Make sure no two consecutive gaps
                    tile.userData.isGap =
                        (i == 0 || this._tiles[i - 1][0].visible) && isGap;
                    tile.visible = !tile.userData.isGap;

                    if (tile.userData.hasObstacle) {
                        this.scene.remove(tile.userData.obstacle);
                    }

                    tile.userData.hasObstacle =
                        !tile.userData.isGap &&
                        rowHasObstacles &&
                        Math.random() < 0.33;

                    if (tile.userData.hasObstacle) {
                        const obstacle = new THREE.Mesh(
                            this.obstacleGeometry,
                            this.obstacleMaterial
                        );
                        obstacle.castShadow = true;
                        obstacle.receiveShadow = true;
                        obstacle.position.set(
                            tile.position.x,
                            0.6,
                            tile.position.z
                        );
                        const obstacleBox = new THREE.Box3().setFromObject(
                            obstacle
                        );
                        obstacle.userData.box = obstacleBox;
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
                            handlePlayerHit(obstacle, hitAudio);
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

import * as THREE from "three";

export class Monster {
    constructor(scene) {
        this.scene = scene;
        this.monsterGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
        this.monsterMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
        });
        this.monsterOffsetZ = 3;
        this.monster = null;
        this.createMonster();
    }

    createMonster() {
        this.monster = new THREE.Mesh(
            this.monsterGeometry,
            this.monsterMaterial
        );
        this.monster.position.set(0, 0.6, this.monsterOffsetZ); // Start behind the player
        this.scene.add(this.monster);
    }

    update(player) {
        this.monster.position.x +=
            (player.position.x - this.monster.position.x) * 0.1;
        const desiredZ = player.position.z + this.monsterOffsetZ;
        this.monster.position.z += (desiredZ - this.monster.position.z) * 0.05;
    }
}

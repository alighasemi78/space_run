import * as THREE from "three";

export class Plane {
    constructor(scene, tileWidth, skyTexture) {
        this.scene = scene;
        this.tileWidth = tileWidth;
        this.skyTexture = skyTexture;

        this.planeOffset = 5;
        this.plane = null;
        this.createPlane();
    }

    createBody(material) {
        const bodyTopWidth = 0.2;
        const bodyBottomWidth = 0.1;
        const bodyDepth = 2;

        const bodyGeometry = new THREE.CylinderGeometry(
            bodyTopWidth,
            bodyBottomWidth,
            bodyDepth
        );
        bodyGeometry.rotateX(-Math.PI / 2);

        const body = new THREE.Mesh(bodyGeometry, material);

        body.position.set(0, 0, 0);
        body.userData.bottomWidth = bodyBottomWidth;
        body.userData.slope = Math.asin(
            (bodyTopWidth - bodyBottomWidth) / 2 / bodyDepth
        );

        return body;
    }

    createBlade(zRotation) {
        const bladeWidth = 0.1;
        const bladeHeight = 0.8;
        const bladeDepth = 0.01;
        const material = new THREE.MeshStandardMaterial({ color: "white" });

        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(bladeWidth, bladeHeight, bladeDepth),
            material
        );

        blade.rotateZ(zRotation);
        blade.position.set(0, 0, -bladeDepth / 2);

        return blade;
    }

    createPropeller(body) {
        const bodyBox = new THREE.Box3().setFromObject(body);
        const bodySize = new THREE.Vector3();
        const bodyCenter = new THREE.Vector3();
        bodyBox.getSize(bodySize);
        bodyBox.getCenter(bodyCenter);

        const propeller = new THREE.Group();

        const blade1 = this.createBlade(Math.PI / 4);
        const blade2 = this.createBlade(-Math.PI / 4);

        propeller.add(blade1, blade2);
        propeller.position.set(
            bodyCenter.x,
            bodyCenter.y,
            bodyCenter.z - bodySize.z / 2
        );

        return propeller;
    }

    createWing(body, material, xPosition) {
        const wingWidth = 1.5;
        const wingHeight = 0.05;
        const wingDepth = 0.6;

        const bodyBox = new THREE.Box3().setFromObject(body);
        const bodySize = new THREE.Vector3();
        const bodyCenter = new THREE.Vector3();
        bodyBox.getSize(bodySize);
        bodyBox.getCenter(bodyCenter);

        const wing = new THREE.Mesh(
            new THREE.BoxGeometry(wingWidth, wingHeight, wingDepth),
            material
        );

        wing.position.set(
            bodyCenter.x +
                (xPosition * bodySize.x) / 2 +
                (xPosition * wingWidth) / 2 -
                xPosition * Math.sin(body.userData.slope) * bodySize.z,
            bodyCenter.y,
            bodyCenter.z
        );

        return wing;
    }

    createTail(body, material, position) {
        const tailWidth = 0.3;
        const tailDepth = 0.01;

        const bodyBox = new THREE.Box3().setFromObject(body);
        const bodySize = new THREE.Vector3();
        const bodyCenter = new THREE.Vector3();
        bodyBox.getSize(bodySize);
        bodyBox.getCenter(bodyCenter);

        const tailShape = new THREE.Shape();
        tailShape.moveTo(0, 0);
        tailShape.lineTo(0, tailWidth);
        tailShape.lineTo(tailWidth, 0);
        tailShape.lineTo(0, 0);

        const tailGeometry = new THREE.ExtrudeGeometry(tailShape, {
            depth: tailDepth,
            bevelEnabled: false,
        });

        const tail = new THREE.Mesh(tailGeometry, material);

        tail.position.set(
            bodyCenter.x +
                (position === "right"
                    ? body.userData.bottomWidth / 2
                    : position === "left"
                    ? -body.userData.bottomWidth / 2
                    : 0),
            bodyCenter.y +
                (position === "top" ? body.userData.bottomWidth / 2 : 0),
            bodyCenter.z + bodySize.z / 2
        );
        tail.rotation.set(
            position === "top" ? 0 : -Math.PI / 2,
            position === "top" ? Math.PI / 2 : 0,
            position === "left" ? Math.PI / 2 : 0
        );

        return tail;
    }

    createFlashlight(body) {
        const bodyBox = new THREE.Box3().setFromObject(body);
        const bodySize = new THREE.Vector3();
        const bodyCenter = new THREE.Vector3();
        bodyBox.getSize(bodySize);
        bodyBox.getCenter(bodyCenter);

        const flashlight = new THREE.DirectionalLight(0xffffff, 3.5);
        flashlight.castShadow = true;

        flashlight.position.set(
            bodyCenter.x,
            bodyCenter.y - bodySize.y / 2,
            bodyCenter.z - bodySize.z / 2
        );
        flashlight.target.position.set(
            bodyCenter.x,
            bodyCenter.y - this.planeOffset,
            bodyCenter.z - this.planeOffset + 3 * this.tileWidth
        ); // pointing slightly downward and forward

        return flashlight;
    }

    createPlane() {
        this.plane = new THREE.Group();

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: "yellow",
            side: THREE.DoubleSide,
            envMap: this.skyTexture,
            metalness: 0.9,
            roughness: 0.1,
            envMapIntensity: 10,
        });

        const body = this.createBody(bodyMaterial);
        this.propeller = this.createPropeller(body);
        const rightWing = this.createWing(body, bodyMaterial, 1);
        const leftWing = this.createWing(body, bodyMaterial, -1);
        const topTail = this.createTail(body, bodyMaterial, "top");
        const rightTail = this.createTail(body, bodyMaterial, "right");
        const leftTail = this.createTail(body, bodyMaterial, "left");
        const flashlight = this.createFlashlight(body);

        this.plane.add(
            body,
            this.propeller,
            rightWing,
            leftWing,
            topTail,
            rightTail,
            leftTail,
            flashlight
        );
        this.plane.position.set(0, this.planeOffset, this.planeOffset);

        this.scene.add(this.plane);
    }

    update(player) {
        this.propeller.rotation.z += 0.2;

        const time = performance.now() * 0.005; // time in milliseconds → seconds
        const swing = Math.sin(time * 1) * 0.1; // speed and amplitude

        // Arms swing opposite to legs
        this.plane.rotation.x = -swing;
        this.plane.position.y -= swing * 0.1;

        const desiredZ = player.position.z + this.planeOffset;
        this.plane.position.z += (desiredZ - this.plane.position.z) * 0.05;
    }
}

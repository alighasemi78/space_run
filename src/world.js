import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class World {
    constructor() {
        this.fogConfig = {
            color: 0x000000,
            near: 5,
            far: 30,
        };
        this.cameraConfig = {
            fov: 75,
            aspect: window.innerWidth / window.innerHeight,
            near: 0.1,
            far: 1000,
            position: {
                x: 8,
                y: 6,
                z: 6,
            },
        };

        this.createScene();
        this.createSky();
        this.createCamera();
        this.createRenderer();
        // this.createComposer();
        this.createControls();

        window.addEventListener("resize", () => {
            this._camera.aspect = window.innerWidth / window.innerHeight;
            this._camera.updateProjectionMatrix();
            this._renderer.setSize(window.innerWidth, window.innerHeight);
            // this._composer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    createScene() {
        this._scene = new THREE.Scene();
        this._scene.fog = new THREE.Fog(
            this.fogConfig.color,
            this.fogConfig.near,
            this.fogConfig.far
        );
    }

    createSky() {
        const loader = new THREE.CubeTextureLoader();
        loader.setPath("/assets/textures/sky/");

        const skies = [
            "dark-s_nx.jpg",
            "dark-s_ny.jpg",
            "dark-s_nz.jpg",
            "dark-s_px.jpg",
            "dark-s_py.jpg",
            "dark-s_pz.jpg",
        ];

        const scene = this._scene;
        this._skyTexture = loader.load(skies, function (texture) {
            // This is called after all 6 images are loaded
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;

            // Apply it to the scene background or an object
            scene.background = texture;
        });
    }

    createCamera() {
        this._camera = new THREE.PerspectiveCamera(
            this.cameraConfig.fov,
            this.cameraConfig.aspect,
            this.cameraConfig.near,
            this.cameraConfig.far
        );
        this._camera.position.set(
            this.cameraConfig.position.x,
            this.cameraConfig.position.y,
            this.cameraConfig.position.z
        );
    }

    createRenderer() {
        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this._renderer.domElement);
    }

    createComposer() {
        this._composer = new EffectComposer(this._renderer);
        this._composer.addPass(new RenderPass(this._scene, this._camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1,
            0.01,
            0.5
        );
        this._composer.addPass(bloomPass);
        this._composer.addPass(new OutputPass());
    }

    createControls() {
        this._controls = new OrbitControls(
            this._camera,
            this._renderer.domElement
        );
        this._controls.enableDamping = true; // for smooth motion
        this._controls.dampingFactor = 0.05;
        this._controls.update();
    }

    handleKeyPress(animate, hud, audio, player) {
        window.addEventListener("keydown", (event) => {
            hud.updateScreen(audio.backgroundAudio, animate);

            // Handle lane movement after game starts
            if (event.code === "ArrowLeft") {
                player.lateralMove(-1);
            } else if (event.code === "ArrowRight") {
                player.lateralMove(1);
            } else if (event.code === "ArrowUp" || event.code === "Space") {
                player.jump(audio.jumpAudio);
            } else if (event.code == "ArrowDown") {
                player.stopJump();
            }
        });
    }

    get scene() {
        return this._scene;
    }

    get skyTexture() {
        return this._skyTexture;
    }

    get camera() {
        return this._camera;
    }

    get renderer() {
        return this._renderer;
    }

    get composer() {
        return this._composer;
    }

    get controls() {
        return this._controls;
    }
}

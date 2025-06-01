export class HUD {
    constructor() {
        this.gameStarted = false;
        this._isGameOver = false;

        this.startScreen = document.getElementById("start-screen");
        this.gameOverScreen = document.getElementById("game-over-screen");
        this.finalScoreText = document.getElementById("final-score");
        this.score = 0;
        this.scoreDisplay = document.getElementById("score");

        this.maxHealth = 3;
        this.healthFill = document.getElementById("health-fill");

        this.maxJetPackFuel = 5;
        this.jetPackBar = document.getElementById("jetPack-bar");
        this.jetPackFill = document.getElementById("jetPack-fill");
    }

    updateScreen(backgroundAudio, animate) {
        if (!this.gameStarted) {
            this.gameStarted = true;
            backgroundAudio.play();
            this.startScreen.style.display = "none"; // Hide start menu
            animate();
        }

        if (this._isGameOver) {
            // Restart the game by reloading the page
            location.reload();
            return;
        }
    }

    updateHealthBar(health) {
        const percentage = (health / this.maxHealth) * 100;
        this.healthFill.style.width = percentage + "%";
    }

    updateJetPackBar(fuel) {
        if (fuel >= this.maxJetPackFuel) {
            this.jetPackBar.style.display = "none";
        } else {
            this.jetPackBar.style.display = "block";
            const percentage =
                ((this.maxJetPackFuel - fuel) / this.maxJetPackFuel) * 100;
            this.jetPackFill.style.width = percentage + "%";
        }
    }

    endGame() {
        if (this._isGameOver) return;
        this._isGameOver = true;

        this.finalScoreText.textContent = "Score: " + Math.floor(this.score);
        this.gameOverScreen.style.display = "flex";
    }

    update() {
        this.score += 0.01;
        this.scoreDisplay.textContent = "Score: " + Math.floor(this.score);
    }

    get isGameOver() {
        return this._isGameOver;
    }
}

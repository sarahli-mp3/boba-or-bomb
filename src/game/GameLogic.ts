import { FallingObject, Cup, DrinkType } from "../types";
import { ObjectPool } from "./ObjectPool";
import { PhysicsEngine } from "./PhysicsEngine";

export class GameLogic {
  private readonly CUP_SPEED = 400; // pixels per second
  private targetBobaCount = 10; // Default for taro (Easy)

  private bobaCount = 0;
  private lastBobaCount = 0;
  private gameStartTime = 0;
  private gameTime = 0;
  private lives = 3;
  private currentDrinkType: DrinkType | null = null;
  private speedBoostApplied = false;
  private hardDifficultySpeedBoosts = 0; // Track how many speed boosts have been applied for hard difficulty

  constructor(
    private objectPool: ObjectPool,
    private physicsEngine: PhysicsEngine,
    private onBobaCountChange: (count: number) => void,
    private onLivesChange: (lives: number) => void,
    private onGameEnd: (result: "win" | "lose") => void,
    private onMaxLivesReached?: () => void
  ) {}

  start() {
    this.bobaCount = 0;
    this.lastBobaCount = 0;
    this.gameStartTime = performance.now();
    this.gameTime = 0;
    this.lives = 3;
    this.speedBoostApplied = false;
    this.hardDifficultySpeedBoosts = 0;
    this.objectPool.returnAllObjects();
    this.onBobaCountChange(0);
    this.onLivesChange(3);
  }

  update(
    deltaTime: number,
    cup: Cup
  ): { needsRender: boolean; gameEnded: boolean } {
    this.gameTime = performance.now() - this.gameStartTime;
    let gameEnded = false;

    // Update physics
    const fallingObjects = this.objectPool.getActiveObjects();
    this.physicsEngine.update(deltaTime, fallingObjects);

    // Check for new object spawn
    if (this.physicsEngine.shouldSpawnObject(deltaTime)) {
      this.spawnObject();
    }

    // Check collisions - iterate backwards for safe removal
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
      const obj = fallingObjects[i];

      if (this.physicsEngine.checkCollision(obj, cup)) {
        if (obj.type === "boba") {
          this.handleBobaCollision();
        } else if (obj.type === "bomb") {
          console.log(
            `Bomb collision! Lives before: ${this.lives}, Boba count: ${this.bobaCount}`
          );
          this.handleBombCollision();
          gameEnded = true; // Bomb collision immediately ends the game
          console.log(
            `Game ended due to bomb collision. Lives after: ${this.lives}`
          );
          break;
        } else if (obj.type === "heart") {
          this.handleHeartCollision();
        }

        // Remove object after collision
        this.objectPool.returnObject(obj);
      }
    }

    // Remove off-screen objects and treat missed boba like hitting a bomb
    const canvas = document.querySelector("canvas");
    const canvasHeight = canvas
      ? canvas.getBoundingClientRect().height
      : window.innerHeight;
    const threshold = canvasHeight + 100;

    // Get a fresh snapshot after collision handling
    const remainingObjects = this.objectPool.getActiveObjects();
    for (let i = 0; i < remainingObjects.length; i++) {
      const obj = remainingObjects[i];
      if (obj.y > threshold) {
        if (obj.type === "boba") {
          // Missing a pearl costs one life (not instant death)
          this.loseOneLife();
          if (this.lives <= 0) {
            gameEnded = true;
          }
        }
        // Always return off-screen objects to the pool
        this.objectPool.returnObject(obj);
        if (gameEnded) break;
      }
    }

    // Check win condition only if game hasn't ended
    console.log(
      `End of update: gameEnded=${gameEnded}, bobaCount=${this.bobaCount}, target=${this.targetBobaCount}, lives=${this.lives}`
    );

    if (!gameEnded && this.bobaCount >= this.targetBobaCount) {
      console.log(
        `Game won! Boba count: ${this.bobaCount}, Target: ${this.targetBobaCount}, Drink: ${this.currentDrinkType}`
      );
      gameEnded = true;
      this.onGameEnd("win");
    } else if (gameEnded && this.lives <= 0) {
      // Game ended due to bomb collision or other lose condition
      console.log(
        `Game lost! Lives: ${this.lives}, Boba count: ${this.bobaCount}`
      );
      this.onGameEnd("lose");
    }

    return { needsRender: false, gameEnded };
  }

  private spawnObject() {
    const obj = this.objectPool.getObject();
    const canvas = document.querySelector("canvas");
    const canvasWidth = canvas
      ? canvas.getBoundingClientRect().width
      : window.innerWidth;
    const objectData = this.physicsEngine.generateObject(canvasWidth, 64);

    Object.assign(obj, objectData, {
      width: 64,
      height: 64,
    });
  }

  private handleBobaCollision() {
    this.bobaCount++;
    console.log(
      `Boba collected! New count: ${this.bobaCount}, Target: ${this.targetBobaCount}`
    );

    if (this.bobaCount !== this.lastBobaCount) {
      this.lastBobaCount = this.bobaCount;
      this.onBobaCountChange(this.bobaCount);
    }

    // Check for speed boost on medium difficulty at 10 boba
    if (
      this.currentDrinkType === "milk_tea" &&
      this.bobaCount === 10 &&
      !this.speedBoostApplied
    ) {
      this.physicsEngine.increaseSpeedMultiplier(0.1); // 10% speed increase on top of 20% harder base
      this.physicsEngine.increaseSpawnFrequencyMultiplier(0.1); // 10% boba frequency increase on top of 20% harder base
      this.speedBoostApplied = true;
    }

    // Check for progressive speed and frequency boosts on hard difficulty
    if (this.currentDrinkType === "matcha") {
      if (this.bobaCount === 10 && this.hardDifficultySpeedBoosts === 0) {
        this.physicsEngine.increaseSpeedMultiplier(0.1); // 10% speed increase on top of 20% harder base
        this.physicsEngine.increaseSpawnFrequencyMultiplier(0.1); // 10% boba frequency increase on top of 20% harder base
        this.hardDifficultySpeedBoosts = 1;
      } else if (
        this.bobaCount === 20 &&
        this.hardDifficultySpeedBoosts === 1
      ) {
        this.physicsEngine.increaseSpeedMultiplier(0.2); // 20% speed increase on top of 20% harder base
        this.physicsEngine.increaseSpawnFrequencyMultiplier(0.05); // 5% boba frequency increase on top of 20% harder base
        this.hardDifficultySpeedBoosts = 2;
      } else if (
        this.bobaCount === 30 &&
        this.hardDifficultySpeedBoosts === 2
      ) {
        this.physicsEngine.increaseSpeedMultiplier(0.2); // 20% speed increase on top of 20% harder base
        this.physicsEngine.increaseSpawnFrequencyMultiplier(0.05); // 5% boba frequency increase on top of 20% harder base
        this.hardDifficultySpeedBoosts = 3;
      }
    }

    // Win condition will be checked in the main update method
  }

  private loseOneLife() {
    this.lives--;
    this.onLivesChange(this.lives);
    if (this.lives <= 0) {
      this.onGameEnd("lose");
    }
  }

  private handleBombCollision() {
    // Bombs now cause instant death regardless of remaining lives
    this.lives = 0;
    this.onLivesChange(this.lives);
    // Game end will be handled by the main update method
  }

  private handleHeartCollision() {
    // Add a life, but cap at maximum of 3 lives
    if (this.lives < 3) {
      this.lives = Math.min(this.lives + 1, 3);
      this.onLivesChange(this.lives);
    } else {
      // Player already has max lives, trigger animation
      this.onMaxLivesReached?.();
    }
  }

  getBobaCount(): number {
    return this.bobaCount;
  }

  getGameTime(): number {
    return this.gameTime;
  }

  getFallingObjects(): FallingObject[] {
    return this.objectPool.getActiveObjects();
  }

  getLives(): number {
    return this.lives;
  }

  setTargetBobaCount(drinkType: DrinkType | null): void {
    this.currentDrinkType = drinkType;
    this.speedBoostApplied = false; // Reset speed boost when drink changes
    this.hardDifficultySpeedBoosts = 0; // Reset hard difficulty speed boosts

    switch (drinkType) {
      case "taro":
        this.targetBobaCount = 10; // Easy
        break;
      case "milk_tea":
        this.targetBobaCount = 20; // Medium
        break;
      case "matcha":
        this.targetBobaCount = 40; // Hard
        break;
      default:
        this.targetBobaCount = 10; // Default to easy
        break;
    }

    console.log(
      `Target boba count set to: ${this.targetBobaCount} for drink: ${drinkType}`
    );
  }

  getTargetBobaCount(): number {
    return this.targetBobaCount;
  }

  updateCupPosition(
    cup: Cup,
    input: { left: boolean; right: boolean; mouseX?: number }
  ) {
    if (input.mouseX !== undefined) {
      cup.x = input.mouseX - cup.width / 2;
    } else {
      const speed = (this.CUP_SPEED * 16.67) / 1000; // 16.67ms frame time
      if (input.left) {
        cup.x -= speed;
      }
      if (input.right) {
        cup.x += speed;
      }
    }

    // Clamp cup position to canvas bounds
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      cup.x = Math.max(0, Math.min(rect.width - cup.width, cup.x));
    }
  }
}

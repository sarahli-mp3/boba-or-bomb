import { FallingObject, Cup } from "../types";
import { ObjectPool } from "./ObjectPool";
import { PhysicsEngine } from "./PhysicsEngine";

export class GameLogic {
  private readonly TARGET_BOBA_COUNT = 10;
  private readonly CUP_SPEED = 400; // pixels per second

  private bobaCount = 0;
  private lastBobaCount = 0;
  private gameStartTime = 0;
  private gameTime = 0;
  private lives = 3;

  constructor(
    private objectPool: ObjectPool,
    private physicsEngine: PhysicsEngine,
    private onBobaCountChange: (count: number) => void,
    private onLivesChange: (lives: number) => void,
    private onGameEnd: (result: "win" | "lose") => void
  ) {}

  start() {
    this.bobaCount = 0;
    this.lastBobaCount = 0;
    this.gameStartTime = performance.now();
    this.gameTime = 0;
    this.lives = 3;
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
          this.handleBombCollision();
          if (this.lives <= 0) {
            gameEnded = true;
            break;
          }
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

    if (this.bobaCount !== this.lastBobaCount) {
      this.lastBobaCount = this.bobaCount;
      this.onBobaCountChange(this.bobaCount);
    }

    if (this.bobaCount >= this.TARGET_BOBA_COUNT) {
      this.onGameEnd("win");
    }
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
    this.onGameEnd("lose");
  }

  private handleHeartCollision() {
    // Add a life, but cap at maximum of 5 lives
    this.lives = Math.min(this.lives + 1, 5);
    this.onLivesChange(this.lives);
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

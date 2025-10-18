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

  constructor(
    private objectPool: ObjectPool,
    private physicsEngine: PhysicsEngine,
    private onBobaCountChange: (count: number) => void,
    private onGameEnd: (result: "win" | "lose") => void
  ) {}

  start() {
    this.bobaCount = 0;
    this.lastBobaCount = 0;
    this.gameStartTime = performance.now();
    this.gameTime = 0;
    this.objectPool.returnAllObjects();
    this.onBobaCountChange(0);
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
          gameEnded = true;
          break;
        }

        // Remove object after collision
        this.objectPool.returnObject(obj);
      }
    }

    // Remove off-screen objects
    const canvas = document.querySelector("canvas");
    const canvasHeight = canvas
      ? canvas.getBoundingClientRect().height
      : window.innerHeight;
    this.physicsEngine.removeOffScreenObjects(fallingObjects, canvasHeight);

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

  private handleBombCollision() {
    this.onGameEnd("lose");
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

import { FallingObject, Cup } from "../types";

export class PhysicsEngine {
  private readonly BASE_FALLING_SPEED = 150; // pixels per second - smooth gameplay
  private readonly SPAWN_INTERVAL = 1000; // milliseconds - reasonable spawn rate
  private readonly BOMB_CHANCE = 0.2; // 20% chance
  private readonly HEART_CHANCE = 0.05; // 5% chance for heart power-up
  // Active collision area for cup: wide and very short (no side hitboxes)
  private readonly CUP_ACTIVE_WIDTH_FRACTION = 0.6; // 60% of cup width (inset 20% per side)
  private readonly CUP_ACTIVE_HEIGHT_FRACTION = 0.15; // 15% of cup height at the top

  private spawnTimer = 0;
  private speedMultiplier = 1.0; // Default speed multiplier
  private spawnFrequencyMultiplier = 1.0; // Default spawn frequency multiplier

  update(deltaTime: number, fallingObjects: FallingObject[]): void {
    // Update falling objects
    const currentFallingSpeed = this.BASE_FALLING_SPEED * this.speedMultiplier;
    fallingObjects.forEach((obj) => {
      obj.y += (currentFallingSpeed * deltaTime) / 1000;
    });
  }

  shouldSpawnObject(deltaTime: number): boolean {
    this.spawnTimer += deltaTime;
    const adjustedSpawnInterval =
      this.SPAWN_INTERVAL / this.spawnFrequencyMultiplier;
    if (this.spawnTimer >= adjustedSpawnInterval) {
      this.spawnTimer = 0;
      return true;
    }
    return false;
  }

  generateObject(
    canvasWidth: number,
    objectWidth: number
  ): Partial<FallingObject> {
    const x = Math.random() * (canvasWidth - objectWidth);
    const random = Math.random();
    let type: "boba" | "bomb" | "heart";

    if (random < this.HEART_CHANCE) {
      type = "heart";
    } else if (random < this.HEART_CHANCE + this.BOMB_CHANCE) {
      type = "bomb";
    } else {
      type = "boba";
    }

    return {
      x: Math.max(0, x),
      y: -64, // Start above screen
      vx: 0,
      vy: this.BASE_FALLING_SPEED * this.speedMultiplier,
      type,
    };
  }

  checkCollision(obj: FallingObject, cup: Cup): boolean {
    // Fast bounds check first
    if (obj.y + obj.height < cup.y || obj.y > cup.y + cup.height) {
      return false;
    }
    if (obj.x + obj.width < cup.x || obj.x > cup.x + cup.width) {
      return false;
    }

    // Compute active collision rect for cup (centered, very short height at top)
    const activeCupWidth = cup.width * this.CUP_ACTIVE_WIDTH_FRACTION;
    const activeCupHeight = cup.height * this.CUP_ACTIVE_HEIGHT_FRACTION;
    const activeCupX = cup.x + (cup.width - activeCupWidth) * 0.5;
    const activeCupY = cup.y; // top of cup

    // Check overlap between object and active cup region only
    return (
      obj.x < activeCupX + activeCupWidth &&
      obj.x + obj.width > activeCupX &&
      obj.y < activeCupY + activeCupHeight &&
      obj.y + obj.height > activeCupY
    );
  }

  removeOffScreenObjects(
    fallingObjects: FallingObject[],
    canvasHeight: number
  ): number {
    const initialLength = fallingObjects.length;
    const threshold = canvasHeight + 100;

    // Use swap-and-pop for better performance
    let writeIndex = 0;
    for (let i = 0; i < fallingObjects.length; i++) {
      if (fallingObjects[i].y <= threshold) {
        if (writeIndex !== i) {
          fallingObjects[writeIndex] = fallingObjects[i];
        }
        writeIndex++;
      }
    }

    // Trim array to new length
    fallingObjects.length = writeIndex;
    return initialLength - fallingObjects.length;
  }

  setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = multiplier;
  }

  increaseSpeedMultiplier(increase: number): void {
    this.speedMultiplier += increase;
  }

  setSpawnFrequencyMultiplier(multiplier: number): void {
    this.spawnFrequencyMultiplier = multiplier;
  }

  increaseSpawnFrequencyMultiplier(increase: number): void {
    this.spawnFrequencyMultiplier += increase;
  }
}

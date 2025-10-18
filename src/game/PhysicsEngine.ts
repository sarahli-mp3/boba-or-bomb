import { FallingObject, Cup } from "../types";

export class PhysicsEngine {
  private readonly FALLING_SPEED = 150; // pixels per second
  private readonly SPAWN_INTERVAL = 600; // milliseconds
  private readonly BOMB_CHANCE = 0.2; // 20% chance
  // Active collision area for cup: wide and very short (no side hitboxes)
  private readonly CUP_ACTIVE_WIDTH_FRACTION = 0.6; // 60% of cup width (inset 20% per side)
  private readonly CUP_ACTIVE_HEIGHT_FRACTION = 0.15; // 15% of cup height at the top

  private spawnTimer: number = 0;

  update(deltaTime: number, fallingObjects: FallingObject[]): void {
    // Update falling objects
    fallingObjects.forEach((obj) => {
      obj.y += (this.FALLING_SPEED * deltaTime) / 1000;
    });
  }

  shouldSpawnObject(deltaTime: number): boolean {
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.SPAWN_INTERVAL) {
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
    const type = Math.random() < this.BOMB_CHANCE ? "bomb" : "boba";

    return {
      x: Math.max(0, x),
      y: -64, // Start above screen
      vx: 0,
      vy: this.FALLING_SPEED,
      type,
    };
  }

  checkCollision(obj: FallingObject, cup: Cup): boolean {
    // Validate input parameters
    if (!obj || !cup) {
      return false;
    }

    // Ensure all required properties exist and are numbers
    const objProps = ["x", "y", "width", "height"];
    const cupProps = ["x", "y", "width", "height"];

    for (const prop of objProps) {
      if (
        typeof obj[prop as keyof FallingObject] !== "number" ||
        isNaN(obj[prop as keyof FallingObject] as number)
      ) {
        return false;
      }
    }

    for (const prop of cupProps) {
      if (
        typeof cup[prop as keyof Cup] !== "number" ||
        isNaN(cup[prop as keyof Cup] as number)
      ) {
        return false;
      }
    }

    // Compute active collision rect for cup (centered, very short height at top)
    const activeCupWidth = cup.width * this.CUP_ACTIVE_WIDTH_FRACTION;
    const activeCupHeight = cup.height * this.CUP_ACTIVE_HEIGHT_FRACTION;
    const activeCupX = cup.x + (cup.width - activeCupWidth) / 2;
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
    // Remove objects in reverse order to avoid index shifting
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
      if (fallingObjects[i].y > canvasHeight + 100) {
        fallingObjects.splice(i, 1);
      }
    }
    return initialLength - fallingObjects.length;
  }
}

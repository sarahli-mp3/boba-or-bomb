import { FallingObject } from "../types";

export class ObjectPool {
  private pool: FallingObject[] = [];
  private activeObjects: FallingObject[] = [];
  private activeCount = 0;

  constructor(private initialSize: number = 20) {
    this.initializePool();
  }

  private initializePool() {
    for (let i = 0; i < this.initialSize; i++) {
      this.pool.push(this.createObject());
    }
  }

  private createObject(): FallingObject {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      width: 64,
      height: 64,
      type: "boba",
    };
  }

  private resetObject(obj: FallingObject) {
    obj.x = 0;
    obj.y = 0;
    obj.vx = 0;
    obj.vy = 0;
    obj.width = 64;
    obj.height = 64;
    obj.type = "boba";
  }

  getObject(): FallingObject {
    let obj: FallingObject;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      // Pool exhausted, create new object
      obj = this.createObject();
    }

    this.activeObjects[this.activeCount] = obj;
    this.activeCount++;
    return obj;
  }

  returnObject(obj: FallingObject) {
    // Find and remove object from active array
    for (let i = 0; i < this.activeCount; i++) {
      if (this.activeObjects[i] === obj) {
        // Swap with last element and decrement count
        this.activeObjects[i] = this.activeObjects[this.activeCount - 1];
        this.activeCount--;
        this.resetObject(obj);
        this.pool.push(obj);
        return;
      }
    }
  }

  returnAllObjects() {
    for (let i = 0; i < this.activeCount; i++) {
      this.resetObject(this.activeObjects[i]);
      this.pool.push(this.activeObjects[i]);
    }
    this.activeCount = 0;
  }

  getActiveObjects(): FallingObject[] {
    return this.activeObjects.slice(0, this.activeCount);
  }

  getPoolSize(): number {
    return this.pool.length;
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  getTotalCount(): number {
    return this.pool.length + this.activeCount;
  }

  // Cleanup method for when the game ends
  destroy() {
    this.returnAllObjects();
    this.pool = [];
    this.activeCount = 0;
  }
}

import { FallingObject } from "../types";

export class ObjectPool {
  private pool: FallingObject[] = [];
  private activeObjects: Set<FallingObject> = new Set();

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

    this.activeObjects.add(obj);
    return obj;
  }

  returnObject(obj: FallingObject) {
    if (this.activeObjects.has(obj)) {
      this.activeObjects.delete(obj);
      this.resetObject(obj);
      this.pool.push(obj);
    }
  }

  returnAllObjects() {
    for (const obj of this.activeObjects) {
      this.resetObject(obj);
      this.pool.push(obj);
    }
    this.activeObjects.clear();
  }

  getActiveObjects(): FallingObject[] {
    return Array.from(this.activeObjects);
  }

  getPoolSize(): number {
    return this.pool.length;
  }

  getActiveCount(): number {
    return this.activeObjects.size;
  }

  getTotalCount(): number {
    return this.pool.length + this.activeObjects.size;
  }

  // Cleanup method for when the game ends
  destroy() {
    this.returnAllObjects();
    this.pool = [];
    this.activeObjects.clear();
  }
}

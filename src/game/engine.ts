import {
  FallingObject,
  Cup,
  GameAssets,
  InputState,
  DrinkType,
} from "../types";

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private assets: GameAssets;
  private selectedDrink: DrinkType;
  private onGameEnd: (result: "win" | "lose") => void;
  private onBobaCountChange: (count: number) => void;

  // Game state
  private cup!: Cup;
  private fallingObjects: FallingObject[] = [];
  private bobaCount: number = 0;
  private lastBobaCount: number = 0;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private spawnTimer: number = 0;
  private animationFrameId: number | null = null;
  private needsRender: boolean = true;

  // Game constants
  private readonly FALLING_SPEED = 150; // pixels per second (slower)
  private readonly SPAWN_INTERVAL = 600; // milliseconds (less frequent spawning)
  private readonly BOMB_CHANCE = 0.2; // 20% chance
  private readonly CUP_SPEED = 400; // pixels per second
  private readonly TARGET_BOBA_COUNT = 10;

  // Object dimensions (will be set based on loaded images)
  private objectWidth: number = 64; // 32px * 2 = 64px (2x scaling)
  private objectHeight: number = 64; // 32px * 2 = 64px (2x scaling)
  private cupWidth: number = 128; // 64px * 2 = 128px (2x scaling)
  private cupHeight: number = 160; // 80px * 2 = 160px (2x scaling)

  constructor(
    canvas: HTMLCanvasElement,
    assets: GameAssets,
    selectedDrink: DrinkType,
    onGameEnd: (result: "win" | "lose") => void,
    onBobaCountChange: (count: number) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.assets = assets;
    this.selectedDrink = selectedDrink;
    this.onGameEnd = onGameEnd;
    this.onBobaCountChange = onBobaCountChange;

    this.setupCanvas();
    this.initializeCup();
  }

  private setupCanvas() {
    const rect = this.canvas.getBoundingClientRect();

    // Ensure we have valid dimensions
    const width = Math.max(rect.width, window.innerWidth);
    const height = Math.max(rect.height, window.innerHeight);

    // Set canvas to exact pixel dimensions (no DPR scaling for pixel art)
    this.canvas.width = width;
    this.canvas.height = height;

    // Disable image smoothing for crisp pixel art
    this.ctx.imageSmoothingEnabled = false;

    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
  }

  private initializeCup() {
    this.cup = {
      x: (this.canvas.width - this.cupWidth) / 2,
      y: this.canvas.height - this.cupHeight - 20,
      width: this.cupWidth,
      height: this.cupHeight,
    };
  }

  public start() {
    this.isRunning = true;
    this.bobaCount = 0;
    this.lastBobaCount = 0;
    this.fallingObjects = [];
    this.spawnTimer = 0;
    this.needsRender = true; // Ensure initial render
    this.onBobaCountChange(0);
    this.gameLoop(0);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public updateInput(input: InputState) {
    if (!this.isRunning) return;

    // Handle keyboard input
    if (input.left) {
      this.cup.x -= (this.CUP_SPEED * 16.67) / 1000; // 16.67ms frame time
      this.needsRender = true; // Mark that we need to render
    }
    if (input.right) {
      this.cup.x += (this.CUP_SPEED * 16.67) / 1000;
      this.needsRender = true; // Mark that we need to render
    }

    // Handle mouse/touch click - move cup to click position
    if (input.mouseX !== undefined) {
      this.cup.x = input.mouseX - this.cup.width / 2;
      this.needsRender = true; // Mark that we need to render
    }

    // Clamp cup position
    this.cup.x = Math.max(
      0,
      Math.min(this.canvas.width - this.cup.width, this.cup.x)
    );
  }

  public resize() {
    this.setupCanvas();
    this.initializeCup();

    // Clamp existing objects to new bounds
    const maxX = this.canvas.width - this.objectWidth;
    this.fallingObjects.forEach((obj) => {
      obj.x = Math.max(0, Math.min(maxX, obj.x));
    });
  }

  private gameLoop(currentTime: number) {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);

    // Only render if something changed
    if (this.needsRender) {
      this.render();
      this.needsRender = false;
    }

    this.animationFrameId = requestAnimationFrame((time) =>
      this.gameLoop(time)
    );
  }

  private update(deltaTime: number) {
    // Spawn new objects
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.SPAWN_INTERVAL) {
      this.spawnObject();
      this.spawnTimer = 0;
      this.needsRender = true; // Mark that we need to render
    }

    // Update falling objects
    this.fallingObjects.forEach((obj, index) => {
      obj.y += (this.FALLING_SPEED * deltaTime) / 1000;
      this.needsRender = true; // Mark that we need to render

      // Check collision with cup
      if (this.checkCollision(obj, this.cup)) {
        if (obj.type === "boba") {
          this.bobaCount++;

          // Only update React state if count actually changed
          if (this.bobaCount !== this.lastBobaCount) {
            this.lastBobaCount = this.bobaCount;
            this.onBobaCountChange(this.bobaCount);
          }

          if (this.bobaCount >= this.TARGET_BOBA_COUNT) {
            this.endGame("win");
            return;
          }
        } else if (obj.type === "bomb") {
          this.endGame("lose");
          return;
        }

        // Remove object after collision
        this.fallingObjects.splice(index, 1);
        this.needsRender = true; // Mark that we need to render
      }
    });

    // Remove objects that fell off screen
    const oldLength = this.fallingObjects.length;
    this.fallingObjects = this.fallingObjects.filter(
      (obj) => obj.y < this.canvas.height + 100
    );
    if (this.fallingObjects.length !== oldLength) {
      this.needsRender = true; // Mark that we need to render
    }
  }

  private spawnObject() {
    const canvasWidth = this.canvas.width;
    const x = Math.random() * (canvasWidth - this.objectWidth);
    const type = Math.random() < this.BOMB_CHANCE ? "bomb" : "boba";

    const obj: FallingObject = {
      x,
      y: -this.objectHeight,
      vx: 0,
      vy: this.FALLING_SPEED,
      width: this.objectWidth,
      height: this.objectHeight,
      type,
    };

    this.fallingObjects.push(obj);
  }

  private checkCollision(obj: FallingObject, cup: Cup): boolean {
    return (
      obj.x < cup.x + cup.width &&
      obj.x + obj.width > cup.x &&
      obj.y < cup.y + cup.height &&
      obj.y + obj.height > cup.y
    );
  }

  private render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw a background to make sure canvas is working
    this.ctx.fillStyle = "#87CEEB";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw falling objects
    this.fallingObjects.forEach((obj) => {
      const image =
        obj.type === "boba" ? this.assets.items.boba : this.assets.items.bomb;
      if (image) {
        // Use nearest-neighbor scaling for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        // Draw at exact pixel boundaries with integer scaling
        const x = Math.round(obj.x);
        const y = Math.round(obj.y);
        this.ctx.drawImage(image, x, y, obj.width, obj.height);
      } else {
        // Draw fallback shapes
        if (obj.type === "boba") {
          this.ctx.fillStyle = "#8B4513"; // Brown for boba
          this.ctx.beginPath();
          this.ctx.arc(
            obj.x + obj.width / 2,
            obj.y + obj.height / 2,
            obj.width / 2,
            0,
            2 * Math.PI
          );
          this.ctx.fill();
        } else {
          this.ctx.fillStyle = "#FF0000"; // Red for bomb
          this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
      }
    });

    // Draw cup
    const cupImage = this.assets.drinks[this.selectedDrink];
    if (cupImage) {
      // Use nearest-neighbor scaling for pixel-perfect rendering
      this.ctx.imageSmoothingEnabled = false;
      // Draw at exact pixel boundaries with integer scaling
      const x = Math.round(this.cup.x);
      const y = Math.round(this.cup.y);
      this.ctx.drawImage(cupImage, x, y, this.cup.width, this.cup.height);
    } else {
      // Draw fallback rectangle if image doesn't load
      this.ctx.fillStyle = "#8B4513"; // Brown color for cup
      this.ctx.fillRect(
        this.cup.x,
        this.cup.y,
        this.cup.width,
        this.cup.height
      );
      this.ctx.strokeStyle = "#654321";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(
        this.cup.x,
        this.cup.y,
        this.cup.width,
        this.cup.height
      );
    }

    // Draw cup fill overlays - layer all overlays from 1 to current boba count
    if (this.bobaCount > 0 && this.bobaCount <= 10) {
      for (let i = 0; i < this.bobaCount; i++) {
        const overlayImage = this.assets.overlays[i];
        if (overlayImage) {
          // Use nearest-neighbor scaling for pixel-perfect rendering
          this.ctx.imageSmoothingEnabled = false;
          // Draw at exact pixel boundaries with integer scaling
          const x = Math.round(this.cup.x);
          const y = Math.round(this.cup.y);
          this.ctx.drawImage(
            overlayImage,
            x,
            y,
            this.cup.width,
            this.cup.height
          );
        }
      }
    }
  }

  private endGame(result: "win" | "lose") {
    this.stop();
    this.onGameEnd(result);
  }

  public getBobaCount(): number {
    return this.bobaCount;
  }
}

import { FallingObject, Cup, DrinkType } from "../types";
import { AssetManager } from "./AssetManager";

export class RenderEngine {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private assets: AssetManager;

  // Simple rendering state
  private imageSmoothingSet = false;

  constructor(canvas: HTMLCanvasElement, assets: AssetManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.assets = assets;
    this.setupCanvas();
  }

  private setupCanvas() {
    // Disable image smoothing for crisp pixel art assets
    this.ctx.imageSmoothingEnabled = false;
    this.imageSmoothingSet = true;

    // Set up high-DPI rendering
    this.setupHighDPICanvas();
  }

  private setupHighDPICanvas() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    // Set the actual canvas size in memory (scaled up for high DPI)
    this.canvas.width = rect.width * devicePixelRatio;
    this.canvas.height = rect.height * devicePixelRatio;

    // Scale the canvas back down using CSS
    this.canvas.style.width = rect.width + "px";
    this.canvas.style.height = rect.height + "px";

    // Scale the drawing context so everything draws at the correct size
    this.ctx.scale(devicePixelRatio, devicePixelRatio);

    // Ensure image smoothing is disabled for crisp rendering
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.imageSmoothingQuality = "high";
  }

  resize() {
    // Use the high-DPI setup for proper scaling
    this.setupHighDPICanvas();
  }

  clear() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
  }

  drawBackground() {
    // Simple, direct background drawing
    this.ctx.fillStyle = "#87CEEB";
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.fillRect(0, 0, rect.width, rect.height);
  }

  drawFallingObjects(objects: FallingObject[]) {
    // Simple, direct rendering for smooth gameplay
    objects.forEach((obj) => {
      if (obj.type === "boba") {
        const img = this.assets.getItemImage("boba");
        if (img) {
          this.drawImage(img, obj.x, obj.y, obj.width, obj.height);
        } else {
          this.drawBoba(obj);
        }
      } else {
        const img = this.assets.getItemImage("bomb");
        if (img) {
          this.drawImage(img, obj.x, obj.y, obj.width, obj.height);
        } else {
          this.drawBomb(obj);
        }
      }
    });
  }

  drawCupWithImage(cup: Cup, selectedDrink: DrinkType | null) {
    if (selectedDrink) {
      const img = this.assets.getDrinkImage(selectedDrink);
      if (img) {
        this.drawImage(img, cup.x, cup.y, cup.width, cup.height);
        return;
      }
    }
    this.drawCup(cup);
  }

  private drawBoba(obj: FallingObject) {
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
  }

  private drawBomb(obj: FallingObject) {
    this.ctx.fillStyle = "#FF0000"; // Red for bomb
    this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
  }

  private drawImage(
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    // Ensure image smoothing is disabled for crisp pixel art
    if (!this.imageSmoothingSet) {
      this.ctx.imageSmoothingEnabled = false;
      this.imageSmoothingSet = true;
    }

    // Round coordinates to prevent sub-pixel rendering
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    const roundedW = Math.round(w);
    const roundedH = Math.round(h);

    this.ctx.drawImage(img, roundedX, roundedY, roundedW, roundedH);
  }

  drawCup(cup: Cup) {
    // Draw cup body with rounded coordinates
    this.ctx.fillStyle = "#8B4513"; // Brown color for cup
    this.ctx.fillRect(
      Math.round(cup.x),
      Math.round(cup.y),
      Math.round(cup.width),
      Math.round(cup.height)
    );

    // Draw cup border
    this.ctx.strokeStyle = "#654321";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      Math.round(cup.x),
      Math.round(cup.y),
      Math.round(cup.width),
      Math.round(cup.height)
    );
  }

  drawCupFill(cup: Cup, bobaCount: number) {
    if (bobaCount > 0 && bobaCount <= 10) {
      // Use group images progressively
      // 1st pearl: show first overlay (1.PNG)
      // 2nd pearl: show Group 1
      // 3rd pearl: show Group 3
      // 4th pearl: show Group 4
      // ...and so on

      let imageToUse: HTMLImageElement | null = null;

      if (bobaCount === 1) {
        // First pearl: use overlay image
        imageToUse = this.assets.getOverlayImage(0); // 1.PNG
      } else {
        // Map pearl count to available group images
        // 2 pearls -> Group 1 (index 0)
        // 3 pearls -> Group 3 (index 2)
        // 4 pearls -> Group 4 (index 3)
        // etc.
        let groupIndex: number;
        if (bobaCount === 2) {
          groupIndex = 0; // Group 1
        } else if (bobaCount >= 3) {
          groupIndex = bobaCount - 1; // Group 3, 4, 5, etc.
        } else {
          groupIndex = -1; // Invalid
        }

        if (groupIndex >= 0) {
          imageToUse = this.assets.getGroupImage(groupIndex);
        }
      }

      if (imageToUse && imageToUse.naturalWidth > 0) {
        // Draw the group/overlay image showing the cup with the correct number of pearls
        this.drawImage(imageToUse, cup.x, cup.y, cup.width, cup.height);
      } else {
        // Fallback: draw individual pearls if overlay not loaded
        const pearlImg = this.assets.getItemImage("boba");
        const pearlSize = 10;
        const margin = 24;
        const innerWidth = cup.width - margin * 2;
        const pearlsPerRow = Math.floor(innerWidth / (pearlSize + 2));
        const startY = cup.y + cup.height - margin - pearlSize;

        for (let i = 0; i < bobaCount; i++) {
          const row = Math.floor(i / pearlsPerRow);
          const col = i % pearlsPerRow;
          const x = cup.x + margin + col * (pearlSize + 2);
          const y = startY - row * (pearlSize + 2);

          if (pearlImg && pearlImg.naturalWidth > 0) {
            this.drawImage(pearlImg, x, y, pearlSize, pearlSize);
          } else {
            this.ctx.fillStyle = "#8B4513";
            this.ctx.beginPath();
            this.ctx.arc(
              x + pearlSize / 2,
              y + pearlSize / 2,
              pearlSize / 2,
              0,
              2 * Math.PI
            );
            this.ctx.fill();
          }
        }
      }
    }
  }

  drawFPS(fps: number) {
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "16px monospace";
    this.ctx.fillText(`FPS: ${fps.toFixed(1)}`, 10, 30);
  }

  drawHUD(bobaCount: number, highScore: number) {
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "20px Arial";
    this.ctx.fillText(`Boba: ${bobaCount}/10`, 10, 60);
    this.ctx.fillText(`High Score: ${highScore}`, 10, 90);
  }
}

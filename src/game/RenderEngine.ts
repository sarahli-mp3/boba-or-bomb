import { FallingObject, Cup, DrinkType } from "../types";
import { AssetManager } from "./AssetManager";

export class RenderEngine {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private assets: AssetManager;

  constructor(canvas: HTMLCanvasElement, assets: AssetManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.assets = assets;
    this.setupCanvas();
  }

  private setupCanvas() {
    // Disable image smoothing for crisp pixel art
    this.ctx.imageSmoothingEnabled = false;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(rect.width, window.innerWidth);
    const height = Math.max(rect.height, window.innerHeight);

    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBackground() {
    this.ctx.fillStyle = "#87CEEB";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawFallingObjects(objects: FallingObject[]) {
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
        this.drawImage(
          img,
          Math.round(cup.x),
          Math.round(cup.y),
          cup.width,
          cup.height
        );
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
    // nearest-neighbor style
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(img, x, y, w, h);
  }

  drawCup(cup: Cup) {
    // Draw cup body
    this.ctx.fillStyle = "#8B4513"; // Brown color for cup
    this.ctx.fillRect(cup.x, cup.y, cup.width, cup.height);

    // Draw cup border
    this.ctx.strokeStyle = "#654321";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(cup.x, cup.y, cup.width, cup.height);
  }

  drawCupFill(cup: Cup, bobaCount: number) {
    if (bobaCount > 0 && bobaCount <= 10) {
      // Draw overlay images progressively (1 to bobaCount)
      for (let i = 0; i < bobaCount; i++) {
        const overlayImg = this.assets.getOverlayImage(i);
        if (overlayImg) {
          this.drawImage(
            overlayImg,
            Math.round(cup.x),
            Math.round(cup.y),
            cup.width,
            cup.height
          );
        }
      }

      // Fallback: if no overlay images loaded, draw brown rectangle
      if (bobaCount > 0 && !this.assets.getOverlayImage(0)) {
        const fillHeight = (bobaCount / 10) * cup.height;
        this.ctx.fillStyle = "#8B4513"; // Same brown as cup
        this.ctx.fillRect(
          cup.x + 2,
          cup.y + cup.height - fillHeight,
          cup.width - 4,
          fillHeight
        );
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

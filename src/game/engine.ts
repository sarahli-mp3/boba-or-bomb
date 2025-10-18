import { Cup, InputState, DrinkType } from "../types";
import { ObjectPool } from "./ObjectPool";
import { PhysicsEngine } from "./PhysicsEngine";
import { RenderEngine } from "./RenderEngine";
import { GameLogic } from "./GameLogic";
import { GameSettingsManager } from "../utils/GameSettings";
import { AssetManager } from "./AssetManager";

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private onGameEnd: (result: "win" | "lose") => void;

  // Game state
  private cup!: Cup;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private needsRender: boolean = true;

  // Modular components
  private objectPool: ObjectPool;
  private physicsEngine: PhysicsEngine;
  private renderEngine: RenderEngine;
  private gameLogic: GameLogic;
  private assets: AssetManager;
  private selectedDrink: DrinkType | null = null;

  // Object dimensions
  private cupWidth: number = 128;
  private cupHeight: number = 160;

  // Performance tracking
  private fps: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    onGameEnd: (result: "win" | "lose") => void,
    onBobaCountChange: (count: number) => void,
    selectedDrink?: DrinkType | null
  ) {
    this.canvas = canvas;
    this.onGameEnd = onGameEnd;

    // Initialize modular components
    this.objectPool = new ObjectPool(20);
    this.physicsEngine = new PhysicsEngine();
    this.assets = new AssetManager();
    this.renderEngine = new RenderEngine(canvas, this.assets);
    this.gameLogic = new GameLogic(
      this.objectPool,
      this.physicsEngine,
      onBobaCountChange,
      onGameEnd
    );
    this.selectedDrink = selectedDrink ?? null;

    this.setupCanvas();
    this.initializeCup();
  }

  private setupCanvas() {
    this.renderEngine.resize();
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
    this.needsRender = true;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.gameLogic.start();
    // Preload assets in background; render falls back if missing
    this.assets.preloadAll().then(() => {
      this.needsRender = true;
    });
    this.gameLoop(0);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public restart() {
    this.isRunning = true;
    this.lastTime = 0;
    this.gameLogic.start();
    this.needsRender = true;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.gameLoop(0);
  }

  public updateInput(input: InputState) {
    if (!this.isRunning) return;

    this.gameLogic.updateCupPosition(this.cup, input);
    this.needsRender = true;
  }

  public resize() {
    this.setupCanvas();
    this.initializeCup();
  }

  private gameLoop(currentTime: number) {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.updateFPS(currentTime);
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

  private updateFPS(currentTime: number) {
    this.frameCount++;
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.fps = (this.frameCount * 1000) / (currentTime - this.lastFpsUpdate);
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }
  }

  private update(deltaTime: number) {
    const result = this.gameLogic.update(deltaTime, this.cup);

    if (result.gameEnded) {
      this.endGame();
      return;
    }

    if (result.needsRender) {
      this.needsRender = true;
    }
  }

  private render() {
    this.renderEngine.clear();
    this.renderEngine.drawBackground();

    const fallingObjects = this.gameLogic.getFallingObjects();
    this.renderEngine.drawFallingObjects(fallingObjects);

    this.renderEngine.drawCupWithImage(this.cup, this.selectedDrink);
    this.renderEngine.drawCupFill(this.cup, this.gameLogic.getBobaCount());

    // Draw HUD
    const settings = GameSettingsManager.getSettings();
    this.renderEngine.drawHUD(
      this.gameLogic.getBobaCount(),
      settings.highScore
    );

    if (settings.showFPS) {
      this.renderEngine.drawFPS(this.fps);
    }
  }

  private endGame() {
    const result = this.gameLogic.getBobaCount() >= 10 ? "win" : "lose";

    // Record game statistics
    const gameTime = this.gameLogic.getGameTime();
    const bobaCount = this.gameLogic.getBobaCount();
    GameSettingsManager.recordGameResult(bobaCount, gameTime);

    if (result === "win") {
      GameSettingsManager.updateHighScore(bobaCount);
    }

    this.stop();
    this.onGameEnd(result);
  }

  public getBobaCount(): number {
    return this.gameLogic.getBobaCount();
  }

  public destroy() {
    this.stop();
    this.objectPool.destroy();
  }
}

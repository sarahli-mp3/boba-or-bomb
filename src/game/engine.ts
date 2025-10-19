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
  private isRunning = false;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;

  // Modular components
  private objectPool: ObjectPool;
  private physicsEngine: PhysicsEngine;
  private renderEngine: RenderEngine;
  private gameLogic: GameLogic;
  private assets: AssetManager;
  private selectedDrink: DrinkType | null = null;
  private onTargetBobaCountChange?: (count: number) => void;

  // Object dimensions
  private cupWidth = 128;
  private cupHeight = 160;

  // Performance tracking
  private fps = 0;
  private frameCount = 0;
  private lastFpsUpdate = 0;

  // Performance optimizations
  // private frameSkipThreshold = 16.67; // Skip frames if delta > 16.67ms (60fps)

  constructor(
    canvas: HTMLCanvasElement,
    onGameEnd: (result: "win" | "lose") => void,
    onBobaCountChange: (count: number) => void,
    onLivesChange: (lives: number) => void,
    selectedDrink?: DrinkType | null,
    onMaxLivesReached?: () => void,
    onTargetBobaCountChange?: (count: number) => void
  ) {
    this.canvas = canvas;
    this.onGameEnd = onGameEnd;
    this.onTargetBobaCountChange = onTargetBobaCountChange;

    // Initialize modular components
    this.objectPool = new ObjectPool(10); // Reduced pool size for better performance
    this.physicsEngine = new PhysicsEngine();
    this.assets = new AssetManager();
    this.renderEngine = new RenderEngine(canvas, this.assets);
    this.gameLogic = new GameLogic(
      this.objectPool,
      this.physicsEngine,
      onBobaCountChange,
      onLivesChange,
      onGameEnd,
      onMaxLivesReached
    );
    this.selectedDrink = selectedDrink ?? null;

    this.setupCanvas();
    this.initializeCup();
    this.setDifficultySpeed();
    this.gameLogic.setTargetBobaCount(this.selectedDrink);
  }

  private setupCanvas() {
    this.renderEngine.resize();
  }

  private initializeCup() {
    // Use display dimensions, not high-DPI canvas dimensions
    const rect = this.canvas.getBoundingClientRect();
    this.cup = {
      x: (rect.width - this.cupWidth) / 2,
      y: rect.height - this.cupHeight - 20,
      width: this.cupWidth,
      height: this.cupHeight,
    };
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.gameLogic.start();

    // Preload all assets before starting game loop
    await this.assets.preloadAll();

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
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.setDifficultySpeed();
    this.gameLoop(0);
  }

  public updateInput(input: InputState) {
    if (!this.isRunning) return;

    this.gameLogic.updateCupPosition(this.cup, input);
    // Remove needsRender flag - always render for smooth gameplay
  }

  public updateSelectedDrink(drink: DrinkType | null) {
    this.selectedDrink = drink;
    this.setDifficultySpeed();
    this.gameLogic.setTargetBobaCount(drink);
  }

  public resize() {
    this.setupCanvas();
    this.initializeCup();
  }

  private gameLoop(currentTime: number) {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Simple, smooth game loop
    this.updateFPS(currentTime);
    this.update(deltaTime);
    this.render();

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

    // Removed needsRender optimization for smoother gameplay
  }

  private render() {
    this.renderEngine.clear();
    this.renderEngine.drawBackground();

    const fallingObjects = this.gameLogic.getFallingObjects();
    this.renderEngine.drawFallingObjects(fallingObjects);

    this.renderEngine.drawCupWithImage(this.cup, this.selectedDrink);
    this.renderEngine.drawCupFill(this.cup, this.gameLogic.getBobaCount());

    // FPS display (if enabled)
    const settings = GameSettingsManager.getSettings();
    if (settings.showFPS) {
      this.renderEngine.drawFPS(this.fps);
    }
  }

  private endGame() {
    const bobaCount = this.gameLogic.getBobaCount();
    const targetBobaCount = this.gameLogic.getTargetBobaCount();
    const result = bobaCount >= targetBobaCount ? "win" : "lose";
    console.log(
      `EndGame: bobaCount=${bobaCount}, target=${targetBobaCount}, result=${result}`
    );

    // Record game statistics
    const gameTime = this.gameLogic.getGameTime();
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

  public get running(): boolean {
    return this.isRunning;
  }

  private setDifficultySpeed() {
    let speedMultiplier = 1.0; // Default for taro (Easy)
    let targetBobaCount = 10; // Default for taro (Easy)

    switch (this.selectedDrink) {
      case "taro":
        speedMultiplier = 1.0; // Easy - base speed
        targetBobaCount = 10; // Easy
        break;
      case "milk_tea":
        speedMultiplier = 1.2; // Medium - 20% faster than taro
        targetBobaCount = 20; // Medium
        break;
      case "matcha":
        speedMultiplier = 1.5; // Hard - 50% faster than taro
        targetBobaCount = 40; // Hard
        break;
      default:
        speedMultiplier = 1.0;
        targetBobaCount = 10;
        break;
    }

    this.physicsEngine.setSpeedMultiplier(speedMultiplier);
    this.physicsEngine.setSpawnFrequencyMultiplier(1.0); // Reset spawn frequency
    this.gameLogic.setTargetBobaCount(this.selectedDrink);
    this.onTargetBobaCountChange?.(targetBobaCount);
  }

  public destroy() {
    this.stop();
    this.objectPool.destroy();
  }
}

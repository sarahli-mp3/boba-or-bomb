export type DrinkType = "taro" | "milk_tea" | "matcha";

export type GameResult = "win" | "lose";

export type GameScreen = "start" | "game" | "result";

export interface GameState {
  currentScreen: GameScreen;
  selectedDrink: DrinkType | null;
  lastResult: GameResult | null;
  bobaCount: number;
  lives: number;
  targetBobaCount: number;
}

export interface FallingObject {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: "boba" | "bomb" | "heart";
}

export interface Cup {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  mouseX: number;
  isDragging: boolean;
}

// Game Settings Types
export interface GameSettings {
  highScore: number;
  soundEnabled: boolean;
  difficulty: "easy" | "normal" | "hard";
  showFPS: boolean;
  particleEffects: boolean;
}

export interface GameStats {
  gamesPlayed: number;
  totalBobaCollected: number;
  bestStreak: number;
  averageGameTime: number;
}

export type DrinkType = "taro" | "milk_tea" | "matcha";

export type GameResult = "win" | "lose";

export type GameScreen = "start" | "game" | "result";

export interface GameState {
  currentScreen: GameScreen;
  selectedDrink: DrinkType | null;
  lastResult: GameResult | null;
  bobaCount: number;
}

export interface FallingObject {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: "boba" | "bomb";
}

export interface Cup {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameAssets {
  drinks: {
    taro: HTMLImageElement;
    milk_tea: HTMLImageElement;
    matcha: HTMLImageElement;
  };
  items: {
    boba: HTMLImageElement;
    bomb: HTMLImageElement;
  };
  overlays: HTMLImageElement[];
}

export interface InputState {
  left: boolean;
  right: boolean;
  mouseX: number;
  isDragging: boolean;
}

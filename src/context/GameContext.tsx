import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { GameState, DrinkType, GameResult } from "../types";

interface GameContextType {
  state: GameState;
  selectDrink: (drink: DrinkType) => void;
  startGame: () => void;
  endGame: (result: GameResult) => void;
  resetGame: () => void;
  setBobaCount: (count: number) => void;
  setLives: (lives: number) => void;
  setTargetBobaCount: (count: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

type GameAction =
  | { type: "SELECT_DRINK"; payload: DrinkType }
  | { type: "START_GAME" }
  | { type: "END_GAME"; payload: GameResult }
  | { type: "RESET_GAME" }
  | { type: "SET_BOBA_COUNT"; payload: number }
  | { type: "SET_LIVES"; payload: number }
  | { type: "SET_TARGET_BOBA_COUNT"; payload: number };

const initialState: GameState = {
  currentScreen: "start",
  selectedDrink: null,
  lastResult: null,
  bobaCount: 0,
  lives: 3,
  targetBobaCount: 10,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SELECT_DRINK":
      return {
        ...state,
        selectedDrink: action.payload,
      };
    case "START_GAME":
      return {
        ...state,
        currentScreen: "game",
        bobaCount: 0,
        lives: 3,
      };
    case "END_GAME":
      return {
        ...state,
        currentScreen: "result",
        lastResult: action.payload,
      };
    case "RESET_GAME":
      return {
        ...state,
        currentScreen: "start",
        selectedDrink: null,
        lastResult: null,
        bobaCount: 0,
        lives: 3,
        targetBobaCount: 10,
      };
    case "SET_BOBA_COUNT":
      return {
        ...state,
        bobaCount: action.payload,
      };
    case "SET_LIVES":
      return {
        ...state,
        lives: action.payload,
      };
    case "SET_TARGET_BOBA_COUNT":
      return {
        ...state,
        targetBobaCount: action.payload,
      };
    default:
      return state;
  }
}

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const selectDrink = useCallback((drink: DrinkType) => {
    dispatch({ type: "SELECT_DRINK", payload: drink });
  }, []);

  const startGame = useCallback(() => {
    dispatch({ type: "START_GAME" });
  }, []);

  const endGame = useCallback((result: GameResult) => {
    dispatch({ type: "END_GAME", payload: result });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: "RESET_GAME" });
  }, []);

  const setBobaCount = useCallback((count: number) => {
    dispatch({ type: "SET_BOBA_COUNT", payload: count });
  }, []);

  const setLives = useCallback((lives: number) => {
    dispatch({ type: "SET_LIVES", payload: lives });
  }, []);

  const setTargetBobaCount = useCallback((count: number) => {
    dispatch({ type: "SET_TARGET_BOBA_COUNT", payload: count });
  }, []);

  const value: GameContextType = useMemo(
    () => ({
      state,
      selectDrink,
      startGame,
      endGame,
      resetGame,
      setBobaCount,
      setLives,
      setTargetBobaCount,
    }),
    [
      state,
      selectDrink,
      startGame,
      endGame,
      resetGame,
      setBobaCount,
      setLives,
      setTargetBobaCount,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

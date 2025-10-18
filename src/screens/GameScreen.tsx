import { useEffect, useRef } from "react";
import { useGame } from "../context/GameContext";
import { GameEngine } from "../game/engine";
import { InputHandler } from "../game/input";
import { InputState } from "../types";

export function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const { state, endGame, setBobaCount } = useGame();

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create engine once if it doesn't exist
    if (!gameEngineRef.current) {
      const canvas = canvasRef.current;
      const gameEngine = new GameEngine(
        canvas,
        endGame,
        setBobaCount,
        state.selectedDrink
      );
      const inputHandler = new InputHandler(canvas, (input: InputState) => {
        gameEngine.updateInput(input);
      });

      gameEngineRef.current = gameEngine;
      inputHandlerRef.current = inputHandler;

      const handleResize = () => gameEngine.resize();
      window.addEventListener("resize", handleResize);

      // Start immediately if drink is selected
      if (state.selectedDrink) {
        gameEngine.start();
      }

      return () => {
        window.removeEventListener("resize", handleResize);
        if (gameEngineRef.current) {
          gameEngineRef.current.destroy();
          gameEngineRef.current = null;
        }
        if (inputHandlerRef.current) {
          inputHandlerRef.current.destroy();
          inputHandlerRef.current = null;
        }
      };
    } else if (state.selectedDrink) {
      // Engine exists, just restart for new round
      gameEngineRef.current.restart();
    }
  }, [state.selectedDrink]); // Trigger on selectedDrink changes

  return (
    <div className="game-screen">
      <div className="game-hud">
        <div className="boba-count">Boba: {state.bobaCount}/10</div>
      </div>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "block",
          cursor: "default",
          zIndex: 1,
          touchAction: "none",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}

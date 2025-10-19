import { useEffect, useRef, useState } from "react";
import { useGame } from "../context/GameContext";
import { GameEngine } from "../game/engine";
import { InputHandler } from "../game/input";
import { InputState } from "../types";

export function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const { state, endGame, setBobaCount, setLives } = useGame();
  const [showMaxLivesAnimation, setShowMaxLivesAnimation] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || gameEngineRef.current) return;

    const canvas = canvasRef.current;
    const gameEngine = new GameEngine(
      canvas,
      endGame,
      setBobaCount,
      setLives,
      state.selectedDrink,
      () => setShowMaxLivesAnimation(true)
    );
    const inputHandler = new InputHandler(canvas, (input: InputState) => {
      gameEngine.updateInput(input);
    });

    gameEngineRef.current = gameEngine;
    inputHandlerRef.current = inputHandler;

    const handleResize = () => gameEngine.resize();
    window.addEventListener("resize", handleResize);

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
  }, []); // Only run once on mount

  // Separate effect for starting/restarting game
  useEffect(() => {
    if (!state.selectedDrink || !gameEngineRef.current) return;

    if (gameEngineRef.current.running) {
      // Restart existing game
      gameEngineRef.current.restart();
    } else {
      // Start new game
      gameEngineRef.current.start().catch((error) => {
        console.error("Game start failed:", error);
      });
    }
  }, [state.selectedDrink]);

  // Effect to handle max lives animation
  useEffect(() => {
    if (showMaxLivesAnimation) {
      // Reset animation after it completes
      const timeoutId = setTimeout(() => {
        setShowMaxLivesAnimation(false);
      }, 500); // Match the CSS animation duration

      return () => clearTimeout(timeoutId);
    }
  }, [showMaxLivesAnimation]);

  return (
    <div className="game-screen">
      <div className="game-hud">
        <div className="lives-display">
          {Array.from({ length: 3 }, (_, i) => (
            <img
              key={i}
              src="/assets/pixelheart.png"
              alt="Life"
              className={`life-heart ${
                i < state.lives ? "active" : "inactive"
              } ${showMaxLivesAnimation ? "max-lives-animation" : ""}`}
              style={{
                width: "32px",
                height: "32px",
                marginRight: "8px",
                filter:
                  i < state.lives ? "none" : "grayscale(100%) opacity(0.3)",
              }}
            />
          ))}
        </div>
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

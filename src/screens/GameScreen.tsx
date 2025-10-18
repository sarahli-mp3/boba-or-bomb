import { useEffect, useRef, useState } from "react";
import { useGame } from "../context/GameContext";
import { GameEngine } from "../game/engine";
import { InputHandler } from "../game/input";
import { GameAssets, InputState } from "../types";

// Cache assets globally so they only load once
let cachedAssets: GameAssets | null = null;
let assetsLoadingPromise: Promise<GameAssets> | null = null;
let assetsLoaded = false; // Track if we've attempted to load assets

export function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [bobaCount, setBobaCount] = useState(0);
  const { state, endGame } = useGame();

  useEffect(() => {
    if (!state.selectedDrink) return;

    // If we have cached assets or have already loaded, skip loading screen entirely
    if (cachedAssets || assetsLoaded) {
      console.log("Cached assets available, skipping loading screen");
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const loadAssets = async (): Promise<GameAssets> => {
      const assets: GameAssets = {
        drinks: {} as any,
        items: {} as any,
        overlays: [],
      };

      const totalAssets = 3 + 2 + 10; // drinks + items + overlays
      let loadedAssets = 0;

      const updateProgress = () => {
        loadedAssets++;
        setLoadingProgress((loadedAssets / totalAssets) * 100);
      };

      // Set a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Asset loading timeout")), 10000); // 10 second timeout
      });

      // Load drink images with timeout
      const drinkPromises = [
        { key: "taro" as const, src: "/assets/taro.png" },
        { key: "milk_tea" as const, src: "/assets/milk_tea.png" },
        { key: "matcha" as const, src: "/assets/matcha.png" },
      ].map(async ({ key, src }) => {
        const img = new Image();
        img.src = src;
        await Promise.race([
          new Promise((resolve, reject) => {
            img.onload = () => {
              updateProgress();
              resolve(img);
            };
            img.onerror = reject;
          }),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Image load timeout")), 2000);
          }),
        ]);
        assets.drinks[key] = img;
      });

      // Load item images with timeout
      const itemPromises = [
        { key: "boba" as const, src: "/assets/boba.png" },
        { key: "bomb" as const, src: "/assets/bomb.png" },
      ].map(async ({ key, src }) => {
        const img = new Image();
        img.src = src;
        await Promise.race([
          new Promise((resolve, reject) => {
            img.onload = () => {
              updateProgress();
              resolve(img);
            };
            img.onerror = reject;
          }),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Image load timeout")), 2000);
          }),
        ]);
        assets.items[key] = img;
      });

      // Load overlay images with timeout
      const overlayPromises = Array.from({ length: 10 }, (_, i) => {
        const img = new Image();
        img.src = `/assets/${i + 1}.png`;
        return Promise.race([
          new Promise<HTMLImageElement>((resolve, reject) => {
            img.onload = () => {
              updateProgress();
              resolve(img);
            };
            img.onerror = reject;
          }),
          new Promise<HTMLImageElement>((_, reject) => {
            setTimeout(() => reject(new Error("Image load timeout")), 2000);
          }),
        ]);
      });

      try {
        await Promise.race([
          Promise.all([...drinkPromises, ...itemPromises, ...overlayPromises]),
          timeoutPromise,
        ]);
        assets.overlays = await Promise.all(overlayPromises);
        return assets;
      } catch (error) {
        console.error("Asset loading failed:", error);
        // Return empty assets - the game will use fallback shapes
        return assets;
      }
    };

    const initializeGame = async () => {
      try {
        let assets: GameAssets;

        // Use cached assets if available
        if (cachedAssets) {
          console.log("Using cached assets - instant load!");
          assets = cachedAssets;
          setIsLoading(false);
        } else if (assetsLoadingPromise) {
          console.log("Assets already loading, waiting...");
          // If assets are already loading, wait for them
          assets = await assetsLoadingPromise;
          setIsLoading(false);
        } else {
          console.log("Loading assets for the first time...");
          assetsLoaded = true; // Mark that we've attempted to load
          // Start loading assets and cache the promise
          assetsLoadingPromise = Promise.race([
            loadAssets(),
            new Promise<GameAssets>((resolve) => {
              setTimeout(() => {
                console.log("Skipping asset loading, using fallbacks");
                resolve({
                  drinks: {} as any,
                  items: {} as any,
                  overlays: [],
                });
              }, 1000); // 1 second timeout - much faster
            }),
          ]);

          assets = await assetsLoadingPromise;
          cachedAssets = assets; // Cache the loaded assets (even if empty)
          assetsLoadingPromise = null; // Clear the promise
          setIsLoading(false);
        }

        if (!canvasRef.current) {
          return;
        }

        const canvas = canvasRef.current;
        const gameEngine = new GameEngine(
          canvas,
          assets,
          state.selectedDrink!,
          endGame,
          setBobaCount
        );

        const inputHandler = new InputHandler(canvas, (input: InputState) => {
          gameEngine.updateInput(input);
        });

        gameEngineRef.current = gameEngine;
        inputHandlerRef.current = inputHandler;

        gameEngine.start();

        // Handle window resize
        const handleResize = () => {
          gameEngine.resize();
        };

        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
          gameEngine.stop();
          inputHandler.destroy();
        };
      } catch (error) {
        setIsLoading(false);
      }
    };

    initializeGame();

    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
      }
      if (inputHandlerRef.current) {
        inputHandlerRef.current.destroy();
      }
    };
  }, [state.selectedDrink, endGame, setBobaCount]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h2>Loading Game Assets...</h2>
          <div className="loading-bar">
            <div
              className="loading-progress"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p>{Math.round(loadingProgress)}% - Loading 15 PNG files</p>
          <p style={{ fontSize: "0.8rem", marginTop: "10px", opacity: 0.7 }}>
            This only happens once - assets are cached after loading
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-screen">
      <div className="game-hud">
        <div className="boba-count">Boba: {bobaCount}/10</div>
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

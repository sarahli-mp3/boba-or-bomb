import { useGame } from "../context/GameContext";

export function ResultScreen() {
  const { state, resetGame, startGame } = useGame();

  const handleReplay = () => {
    resetGame();
  };

  const handlePlayAgain = () => {
    startGame();
  };

  const isWin = state.lastResult === "win";

  return (
    <div className="result-screen">
      <div className="result-content">
        <h1 className={`result-title ${isWin ? "win" : "lose"}`}>
          {isWin ? "You Win!" : "You Lose!"}
        </h1>

        <div className="result-message">
          {isWin ? (
            <p>Congratulations! You caught 10 boba pearls!</p>
          ) : (
            <p>You spilled your drink!</p>
          )}
        </div>

        <div className="result-actions">
          <button
            className="action-button primary"
            onClick={handlePlayAgain}
            aria-label="Play again with same drink"
          >
            Play Again with Same Drink
          </button>

          <button
            className="action-button secondary"
            onClick={handleReplay}
            aria-label="Choose a different drink"
          >
            Choose Different Drink
          </button>
        </div>
      </div>
    </div>
  );
}

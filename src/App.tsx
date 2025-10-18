import { GameProvider, useGame } from "./context/GameContext";
import { StartScreen } from "./screens/StartScreen";
import { GameScreen } from "./screens/GameScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";

function AppContent() {
  const { state } = useGame();

  const renderScreen = () => {
    switch (state.currentScreen) {
      case "start":
        return <StartScreen />;
      case "game":
        return <GameScreen />;
      case "result":
        return <ResultScreen />;
      default:
        return <StartScreen />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="app">{renderScreen()}</div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;

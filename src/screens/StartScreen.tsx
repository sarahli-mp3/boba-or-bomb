import { useGame } from "../context/GameContext";
import { DrinkType } from "../types";

export function StartScreen() {
  const { selectDrink, startGame } = useGame();

  const handleDrinkSelect = (drink: DrinkType) => {
    selectDrink(drink);
    startGame();
  };

  const drinks: { type: DrinkType; name: string; image: string }[] = [
    { type: "taro", name: "Taro", image: "/assets/taro.png" },
    { type: "milk_tea", name: "Milk Tea", image: "/assets/milk_tea.png" },
    { type: "matcha", name: "Matcha", image: "/assets/matcha.png" },
  ];

  return (
    <div className="start-screen">
      <div className="start-content">
        <h1 className="game-title">Boba or Bomb</h1>
        <p className="game-subtitle">Choose a drink to start</p>

        <div className="drink-selection">
          {drinks.map((drink) => (
            <button
              key={drink.type}
              className="drink-button"
              onClick={() => handleDrinkSelect(drink.type)}
              aria-label={`Select ${drink.name} drink`}
            >
              <img src={drink.image} alt={drink.name} className="drink-image" />
              <span className="drink-name">{drink.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

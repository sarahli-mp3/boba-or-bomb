import { GameSettings, GameStats } from "../types";

const DEFAULT_SETTINGS: GameSettings = {
  highScore: 0,
  soundEnabled: true,
  difficulty: "normal",
  showFPS: false,
  particleEffects: true,
};

const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  totalBobaCollected: 0,
  bestStreak: 0,
  averageGameTime: 0,
};

export class GameSettingsManager {
  private static readonly SETTINGS_KEY = "boba-game-settings";
  private static readonly STATS_KEY = "boba-game-stats";

  static getSettings(): GameSettings {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn("Failed to load game settings:", error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  static saveSettings(settings: Partial<GameSettings>): void {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to save game settings:", error);
    }
  }

  static getStats(): GameStats {
    try {
      const stored = localStorage.getItem(this.STATS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_STATS, ...parsed };
      }
    } catch (error) {
      console.warn("Failed to load game stats:", error);
    }
    return { ...DEFAULT_STATS };
  }

  static updateStats(updates: Partial<GameStats>): void {
    try {
      const current = this.getStats();
      const updated = { ...current, ...updates };
      localStorage.setItem(this.STATS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to save game stats:", error);
    }
  }

  static updateHighScore(score: number): boolean {
    const current = this.getSettings();
    if (score > current.highScore) {
      this.saveSettings({ highScore: score });
      return true;
    }
    return false;
  }

  static recordGameResult(bobaCount: number, gameTime: number): void {
    const stats = this.getStats();
    const newStats = {
      gamesPlayed: stats.gamesPlayed + 1,
      totalBobaCollected: stats.totalBobaCollected + bobaCount,
      bestStreak: Math.max(stats.bestStreak, bobaCount),
      averageGameTime:
        (stats.averageGameTime * stats.gamesPlayed + gameTime) /
        (stats.gamesPlayed + 1),
    };
    this.updateStats(newStats);
  }

  static clearAllData(): void {
    try {
      localStorage.removeItem(this.SETTINGS_KEY);
      localStorage.removeItem(this.STATS_KEY);
    } catch (error) {
      console.warn("Failed to clear game data:", error);
    }
  }

  static exportData(): string {
    return JSON.stringify({
      settings: this.getSettings(),
      stats: this.getStats(),
      exportDate: new Date().toISOString(),
    });
  }

  static importData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.settings && parsed.stats) {
        localStorage.setItem(
          this.SETTINGS_KEY,
          JSON.stringify(parsed.settings)
        );
        localStorage.setItem(this.STATS_KEY, JSON.stringify(parsed.stats));
        return true;
      }
    } catch (error) {
      console.warn("Failed to import game data:", error);
    }
    return false;
  }
}

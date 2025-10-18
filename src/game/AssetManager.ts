import { DrinkType } from "../types";

type ImageRecord = Record<string, HTMLImageElement>;

export class AssetManager {
  private itemImages: ImageRecord = {};
  private drinkImages: ImageRecord = {};
  private overlayImages: HTMLImageElement[] = [];
  private failedKeys: Set<string> = new Set();

  private loadImage(key: string, src: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(
          `[assets] Failed to load image for key="${key}" from ${src}`
        );
        this.failedKeys.add(key);
        resolve(img); // resolve anyway; callers will detect naturalWidth === 0
      };
    });
  }

  async preloadAll(): Promise<void> {
    const entries: Array<[string, string, (img: HTMLImageElement) => void]> = [
      [
        "items:boba",
        "/assets/boba.png",
        (img) => (this.itemImages["boba"] = img),
      ],
      [
        "items:bomb",
        "/assets/bomb.png",
        (img) => (this.itemImages["bomb"] = img),
      ],
      [
        "drinks:taro",
        "/assets/taro.png",
        (img) => (this.drinkImages["taro"] = img),
      ],
      [
        "drinks:milk_tea",
        "/assets/milk_tea.png",
        (img) => (this.drinkImages["milk_tea"] = img),
      ],
      [
        "drinks:matcha",
        "/assets/matcha.png",
        (img) => (this.drinkImages["matcha"] = img),
      ],
    ];

    await Promise.all(
      entries.map(async ([key, src, assign]) => {
        const img = await this.loadImage(key, src);
        assign(img);
      })
    );

    // Load overlay images (1.PNG through 10.PNG)
    for (let i = 1; i <= 10; i++) {
      const key = `overlays:${i}`;
      const src = `/assets/${i}.PNG`;
      const img = await this.loadImage(key, src);
      this.overlayImages[i - 1] = img; // Store at index 0-9
    }
  }

  getItemImage(kind: "boba" | "bomb"): HTMLImageElement | null {
    const img = this.itemImages[kind];
    if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) return null;
    return img;
  }

  getDrinkImage(drink: DrinkType): HTMLImageElement | null {
    const img = this.drinkImages[drink];
    if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) return null;
    return img;
  }

  hasFailed(key: string): boolean {
    return this.failedKeys.has(key);
  }

  getOverlayImage(index: number): HTMLImageElement | null {
    if (index < 0 || index >= this.overlayImages.length) return null;
    const img = this.overlayImages[index];
    if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) return null;
    return img;
  }
}

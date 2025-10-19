import { DrinkType } from "../types";

type ImageRecord = Record<string, HTMLImageElement>;

export class AssetManager {
  private itemImages: ImageRecord = {};
  private drinkImages: ImageRecord = {};
  private overlayImages: HTMLImageElement[] = [];
  private groupImages: HTMLImageElement[] = [];
  private pearlImage: HTMLImageElement | null = null;
  private failedKeys: Set<string> = new Set();

  private loadImage(key: string, src: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image();

      // Ensure images are loaded at full resolution
      img.crossOrigin = "anonymous";
      img.decoding = "async";

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
    // Load critical assets first (items and cup overlays)
    const criticalAssets: Array<
      [string, string, (img: HTMLImageElement) => void]
    > = [
      [
        "items:boba",
        "/assets/boba.png",
        (img: HTMLImageElement) => (this.itemImages["boba"] = img),
      ],
      [
        "items:bomb",
        "/assets/bomb.png",
        (img: HTMLImageElement) => (this.itemImages["bomb"] = img),
      ],
      [
        "items:heart",
        "/assets/pixelheart.png",
        (img: HTMLImageElement) => (this.itemImages["heart"] = img),
      ],
    ];

    // Load cup overlay images (1-10 pearls)
    for (let i = 1; i <= 10; i++) {
      criticalAssets.push([
        `overlays:${i}`,
        `/assets/${i}.PNG`,
        (img: HTMLImageElement) => (this.overlayImages[i - 1] = img),
      ]);
    }

    // Load group images (Group 1, 3-10) - using PNG for transparency
    // Note: Group 2.png doesn't exist, so we skip it
    const groupIndices = [1, 3, 4, 5, 6, 7, 8, 9, 10];
    for (const i of groupIndices) {
      criticalAssets.push([
        `groups:${i}`,
        `/assets/Group ${i}.png`,
        (img: HTMLImageElement) => {
          this.groupImages[i - 1] = img;
        },
      ]);
    }

    await Promise.all(
      criticalAssets.map(async ([key, src, assign]) => {
        const img = await this.loadImage(key, src);
        assign(img);
      })
    );

    // Load other assets in parallel without blocking
    const otherAssets: Array<
      [string, string, (img: HTMLImageElement) => void]
    > = [
      [
        "drinks:taro",
        "/assets/taro.png",
        (img: HTMLImageElement) => (this.drinkImages["taro"] = img),
      ],
      [
        "drinks:milk_tea",
        "/assets/milk_tea.png",
        (img: HTMLImageElement) => (this.drinkImages["milk_tea"] = img),
      ],
      [
        "drinks:matcha",
        "/assets/matcha.png",
        (img: HTMLImageElement) => (this.drinkImages["matcha"] = img),
      ],
    ];

    // Don't await these - let them load in background
    Promise.all(
      otherAssets.map(async ([key, src, assign]) => {
        const img = await this.loadImage(key, src);
        assign(img);
      })
    );

    // Load pearl image for cup fill (background loading)
    this.loadImage("pearl", "/assets/pixelheart.png").then((img) => {
      this.pearlImage = img;
    });
  }

  getItemImage(kind: "boba" | "bomb" | "heart"): HTMLImageElement | null {
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

  getPearlImage(): HTMLImageElement | null {
    if (
      !this.pearlImage ||
      this.pearlImage.naturalWidth === 0 ||
      this.pearlImage.naturalHeight === 0
    )
      return null;
    return this.pearlImage;
  }

  getGroupImage(index: number): HTMLImageElement | null {
    if (index < 0 || index >= this.groupImages.length) {
      return null;
    }
    const img = this.groupImages[index];
    if (!img || img.naturalWidth === 0 || img.naturalHeight === 0) {
      return null;
    }
    return img;
  }
}

import { InputState } from "../types";

export class InputHandler {
  private inputState: InputState;
  private canvas: HTMLCanvasElement;
  private onInputChange: (input: InputState) => void;

  constructor(
    canvas: HTMLCanvasElement,
    onInputChange: (input: InputState) => void
  ) {
    this.canvas = canvas;
    this.onInputChange = onInputChange;
    this.inputState = {
      left: false,
      right: false,
      mouseX: 0,
      isDragging: false,
    };

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Keyboard events
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));

    // Mouse events
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.canvas.addEventListener("mouseleave", this.handleMouseUp.bind(this));

    // Touch events
    this.canvas.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
      { passive: false }
    );
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener(
      "touchcancel",
      this.handleTouchEnd.bind(this),
      { passive: false }
    );
  }

  private handleKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case "ArrowLeft":
      case "KeyA":
        event.preventDefault();
        this.inputState.left = true;
        this.notifyInputChange();
        break;
      case "ArrowRight":
      case "KeyD":
        event.preventDefault();
        this.inputState.right = true;
        this.notifyInputChange();
        break;
    }
  }

  private handleKeyUp(event: KeyboardEvent) {
    switch (event.code) {
      case "ArrowLeft":
      case "KeyA":
        this.inputState.left = false;
        this.notifyInputChange();
        break;
      case "ArrowRight":
      case "KeyD":
        this.inputState.right = false;
        this.notifyInputChange();
        break;
    }
  }

  private handleMouseDown(event: MouseEvent) {
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    this.inputState.mouseX = event.clientX - rect.left;
    this.notifyInputChange();
  }

  private handleMouseMove(event: MouseEvent) {
    if (this.inputState.isDragging) {
      event.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      this.inputState.mouseX = event.clientX - rect.left;
      this.notifyInputChange();
    }
  }

  private handleMouseUp(event: MouseEvent) {
    event.preventDefault();
    this.inputState.isDragging = false;
    this.notifyInputChange();
  }

  private handleTouchStart(event: TouchEvent) {
    event.preventDefault();
    if (event.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      this.inputState.mouseX = event.touches[0].clientX - rect.left;
      this.notifyInputChange();
    }
  }

  private handleTouchMove(event: TouchEvent) {
    if (this.inputState.isDragging && event.touches.length > 0) {
      event.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      this.inputState.mouseX = event.touches[0].clientX - rect.left;
      this.notifyInputChange();
    }
  }

  private handleTouchEnd(event: TouchEvent) {
    event.preventDefault();
    this.inputState.isDragging = false;
    this.notifyInputChange();
  }

  private notifyInputChange() {
    this.onInputChange({ ...this.inputState });
  }

  public getInputState(): InputState {
    return { ...this.inputState };
  }

  public destroy() {
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
    document.removeEventListener("keyup", this.handleKeyUp.bind(this));
    this.canvas.removeEventListener(
      "mousedown",
      this.handleMouseDown.bind(this)
    );
    this.canvas.removeEventListener(
      "mousemove",
      this.handleMouseMove.bind(this)
    );
    this.canvas.removeEventListener("mouseup", this.handleMouseUp.bind(this));
    this.canvas.removeEventListener(
      "mouseleave",
      this.handleMouseUp.bind(this)
    );
    this.canvas.removeEventListener(
      "touchstart",
      this.handleTouchStart.bind(this)
    );
    this.canvas.removeEventListener(
      "touchmove",
      this.handleTouchMove.bind(this)
    );
    this.canvas.removeEventListener("touchend", this.handleTouchEnd.bind(this));
    this.canvas.removeEventListener(
      "touchcancel",
      this.handleTouchEnd.bind(this)
    );
  }
}

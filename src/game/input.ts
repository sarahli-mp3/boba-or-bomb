import { InputState } from "../types";

export class InputHandler {
  private inputState: InputState;
  private canvas: HTMLCanvasElement;
  private onInputChange: (input: InputState) => void;
  private boundHandlers: {
    keyDown: (e: KeyboardEvent) => void;
    keyUp: (e: KeyboardEvent) => void;
    mouseDown: (e: MouseEvent) => void;
    mouseMove: (e: MouseEvent) => void;
    mouseUp: (e: MouseEvent) => void;
    touchStart: (e: TouchEvent) => void;
    touchMove: (e: TouchEvent) => void;
    touchEnd: (e: TouchEvent) => void;
  };

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

    // Store bound functions to prevent memory leaks
    this.boundHandlers = {
      keyDown: this.handleKeyDown.bind(this),
      keyUp: this.handleKeyUp.bind(this),
      mouseDown: this.handleMouseDown.bind(this),
      mouseMove: this.handleMouseMove.bind(this),
      mouseUp: this.handleMouseUp.bind(this),
      touchStart: this.handleTouchStart.bind(this),
      touchMove: this.handleTouchMove.bind(this),
      touchEnd: this.handleTouchEnd.bind(this),
    };

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Keyboard events
    document.addEventListener("keydown", this.boundHandlers.keyDown);
    document.addEventListener("keyup", this.boundHandlers.keyUp);

    // Mouse events
    this.canvas.addEventListener("mousedown", this.boundHandlers.mouseDown);
    this.canvas.addEventListener("mousemove", this.boundHandlers.mouseMove);
    this.canvas.addEventListener("mouseup", this.boundHandlers.mouseUp);
    this.canvas.addEventListener("mouseleave", this.boundHandlers.mouseUp);

    // Touch events
    this.canvas.addEventListener("touchstart", this.boundHandlers.touchStart, {
      passive: false,
    });
    this.canvas.addEventListener("touchmove", this.boundHandlers.touchMove, {
      passive: false,
    });
    this.canvas.addEventListener("touchend", this.boundHandlers.touchEnd, {
      passive: false,
    });
    this.canvas.addEventListener("touchcancel", this.boundHandlers.touchEnd, {
      passive: false,
    });
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
    document.removeEventListener("keydown", this.boundHandlers.keyDown);
    document.removeEventListener("keyup", this.boundHandlers.keyUp);
    this.canvas.removeEventListener("mousedown", this.boundHandlers.mouseDown);
    this.canvas.removeEventListener("mousemove", this.boundHandlers.mouseMove);
    this.canvas.removeEventListener("mouseup", this.boundHandlers.mouseUp);
    this.canvas.removeEventListener("mouseleave", this.boundHandlers.mouseUp);
    this.canvas.removeEventListener(
      "touchstart",
      this.boundHandlers.touchStart
    );
    this.canvas.removeEventListener("touchmove", this.boundHandlers.touchMove);
    this.canvas.removeEventListener("touchend", this.boundHandlers.touchEnd);
    this.canvas.removeEventListener("touchcancel", this.boundHandlers.touchEnd);
  }
}

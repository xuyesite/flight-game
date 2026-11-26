// Sky Courier: Ring Run — keyboard, mouse and touch input.
// One job: turn keys and pointer moves into one clean control state.
export class InputState {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouseY = null;
    this.mouseDown = false;
    this.mouseActive = false;
    this.anyKey = null;
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      this.anyKey = e.code;
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
      this.mouseActive = true;
    });
    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
      this.mouseDown = true;
      this.mouseActive = true;
    });
    window.addEventListener('pointerup', () => { this.mouseDown = false; });
    canvas.addEventListener('pointerleave', () => { this.mouseActive = false; });
  }

  get up() { return this.keys.has('ArrowUp') || this.keys.has('KeyW'); }
  get down() { return this.keys.has('ArrowDown') || this.keys.has('KeyS'); }
  get left() { return this.keys.has('ArrowLeft') || this.keys.has('KeyA'); }
  get right() { return this.keys.has('ArrowRight') || this.keys.has('KeyD'); }
  get boost() { return this.keys.has('Space') || this.mouseDown; }
  get pausePressed() { return this.consume('KeyP') || this.consume('Escape'); }
  get restartPressed() { return this.consume('KeyR'); }
  get mutePressed() { return this.consume('KeyM'); }
  get startPressed() { return this.consume('Enter') || this.consume('Space'); }

  consume(code) {
    if (this.keys.has(code)) {
      this.keys.delete(code);
      return true;
    }
    return false;
  }

  clearTransient() {
    this.anyKey = null;
  }
}

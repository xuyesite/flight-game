// Sky Courier: Ring Run — the courier plane: flight physics and drawing.
// One job: how the plane moves, and what it looks like in the air.
import { GAME_HEIGHT, PHYSICS, PLANE_X, COLORS } from './config.js';

export class Plane {
  constructor() {
    this.reset();
  }

  reset() {
    this.y = 260;
    this.vy = 0;
    this.speed = 170;
    this.throttle = 0.55;
    this.tilt = 0;
    this.propAngle = 0;
    this.invuln = 0;
  }

  get x() { return PLANE_X; }

  get headingDeg() {
    return Math.round(90 + (Math.atan2(this.vy, this.speed) * 180) / Math.PI);
  }

  get altitudeFt() {
    return Math.max(0, Math.round((520 - this.y) * 4));
  }

  get speedKt() {
    return Math.round(this.speed * 0.62);
  }

  update(dt, input, fuelEmpty) {
    if (input.up) this.vy -= PHYSICS.climbPower * dt;
    if (input.down) this.vy += PHYSICS.descendPower * dt;
    if (input.mouseActive && input.mouseY !== null) {
      const diff = input.mouseY - this.y;
      // Steer toward the pointer's height at a speed that grows with the
      // gap, then ease off as the gap closes: the plane settles on the
      // pointer instead of overshooting past it and into the ground.
      // (Before, vy just accumulated diff * 2.4, so a dive at a low ring
      // carried the plane straight through the ground line.)
      const wantVy = Math.max(-PHYSICS.maxVy, Math.min(PHYSICS.maxVy, diff * 3.2));
      this.vy += (wantVy - this.vy) * Math.min(1, 6 * dt);
    }
    if (input.right) this.throttle = Math.min(1, this.throttle + 0.9 * dt);
    if (input.left) this.throttle = Math.max(0.15, this.throttle - 0.9 * dt);
    const boosting = input.boost && !fuelEmpty;
    const targetSpeed = boosting
      ? PHYSICS.boostSpeed
      : PHYSICS.minSpeed + this.throttle * (PHYSICS.maxSpeed - PHYSICS.minSpeed);
    this.speed += (targetSpeed - this.speed) * Math.min(1, 1.6 * dt);
    // Lift cancels gravity at full speed; at cruise the plane sinks slowly.
    const lift = fuelEmpty ? 0 : Math.min(1, this.speed / PHYSICS.maxSpeed);
    this.vy += PHYSICS.gravity * (1 - lift) * dt;
    if (this.speed < PHYSICS.stallSpeed) this.vy += 90 * dt;
    // Trim: hands off the stick, the plane eases toward level flight instead
    // of diving away, so a new pilot is not punished for a moment's pause.
    // The trim is firm (5/s): a dive levels out in a fraction of a second
    // once the stick is released, instead of carrying the plane 100 px
    // past where the pilot meant to stop — into the ground.
    const steering = input.up || input.down || (input.mouseActive && input.mouseY !== null);
    if (!steering) this.vy += (0 - this.vy) * Math.min(1, 5.0 * dt);
    this.vy = Math.max(-PHYSICS.maxVy, Math.min(PHYSICS.maxVy, this.vy));
    this.y += this.vy * dt;
    if (this.y < 46) {
      this.y = 46;
      this.vy = Math.max(0, this.vy);
    }
    if (this.y > GAME_HEIGHT - 8) this.y = GAME_HEIGHT - 8;
    const targetTilt = Math.max(-0.5, Math.min(0.5, this.vy / 480));
    this.tilt += (targetTilt - this.tilt) * Math.min(1, 8 * dt);
    this.propAngle += dt * (18 + this.throttle * 30);
    if (this.invuln > 0) this.invuln -= dt;
    return boosting;
  }

  draw(ctx, time) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.invuln > 0 && Math.floor(time * 10) % 2 === 0) ctx.globalAlpha = 0.35;
    ctx.rotate(this.tilt);
    // Tail wing
    ctx.fillStyle = COLORS.planeRed;
    ctx.beginPath();
    ctx.moveTo(-34, -2);
    ctx.lineTo(-48, -16);
    ctx.lineTo(-40, -2);
    ctx.closePath();
    ctx.fill();
    // Main wing (upper, nearer the viewer)
    ctx.fillStyle = '#c93329';
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.lineTo(10, -26);
    ctx.lineTo(20, -24);
    ctx.lineTo(12, -2);
    ctx.closePath();
    ctx.fill();
    // Fuselage
    ctx.fillStyle = COLORS.planeRed;
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.quadraticCurveTo(-30, -13, 4, -11);
    ctx.quadraticCurveTo(34, -9, 44, -1);
    ctx.quadraticCurveTo(34, 8, 2, 10);
    ctx.quadraticCurveTo(-30, 11, -42, 0);
    ctx.closePath();
    ctx.fill();
    // Cream cheatline
    ctx.fillStyle = COLORS.planeCream;
    ctx.beginPath();
    ctx.moveTo(-30, -4);
    ctx.quadraticCurveTo(0, -6, 34, -2);
    ctx.lineTo(32, 3);
    ctx.quadraticCurveTo(0, 0, -30, 1);
    ctx.closePath();
    ctx.fill();
    // Cockpit window
    ctx.fillStyle = '#bfe6ff';
    ctx.beginPath();
    ctx.ellipse(16, -7, 10, 6, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.ellipse(13, -9, 4, 2, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Tail stripe + registration
    ctx.fillStyle = COLORS.planeCream;
    ctx.fillRect(-38, -6, 5, 12);
    ctx.fillStyle = '#1d3557';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('SK-27', -28, 13);
    // Propeller disc + blades
    ctx.save();
    ctx.translate(45, -1);
    ctx.fillStyle = 'rgba(200, 210, 225, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(this.propAngle);
    ctx.fillStyle = '#2b2b3a';
    ctx.fillRect(-2, -21, 4, 42);
    ctx.restore();
    // Spinner
    ctx.fillStyle = COLORS.planeCream;
    ctx.beginPath();
    ctx.arc(45, -1, 4, 0, Math.PI * 2);
    ctx.fill();
    // Lower wing
    ctx.fillStyle = '#c93329';
    ctx.beginPath();
    ctx.moveTo(-4, 8);
    ctx.lineTo(8, 24);
    ctx.lineTo(16, 22);
    ctx.lineTo(10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

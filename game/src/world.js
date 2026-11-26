// Sky Courier: Ring Run — the scrolling world: terrain, sky traffic and pickups.
// One job: own every entity that is not the plane, and where the ground is.
import { GAME_WIDTH, GROUND_LINE, SPAWN, COLORS } from './config.js';
import { createRandom } from './random.js';

export class World {
  constructor(seed) {
    this.rng = createRandom(seed);
    this.distance = 0;
    this.rings = [];
    this.stars = [];
    this.fuelCans = [];
    this.balloons = [];
    this.birds = [];
    this.particles = [];
    this.clouds = [];
    this.nextRingX = 700;
    this.nextStarX = 1150;
    this.nextFuelX = 2100;
    this.nextBalloonX = 1500;
    this.nextBirdX = 1900;
    this.ringsSpawned = 0;
    this.fuelSpawned = 0;
    this.runwayX = null;
    this.time = 0;
    for (let i = 0; i < 9; i++) {
      this.clouds.push({
        x: this.rng.range(-100, GAME_WIDTH + 400),
        y: this.rng.range(30, 230),
        scale: this.rng.range(0.6, 1.5),
        drift: this.rng.range(4, 12),
      });
    }
  }

  groundYAt(worldX) {
    if (this.runwayX !== null) {
      const start = this.runwayX - 260;
      const end = this.runwayX + 420;
      if (worldX > start && worldX < end) {
        const edge = Math.min(worldX - start, end - worldX) / 260;
        const flat = GROUND_LINE;
        const rolling = GROUND_LINE + 18 * Math.sin(worldX * 0.004) + 10 * Math.sin(worldX * 0.011 + 2);
        return flat + (rolling - flat) * Math.min(1, edge);
      }
    }
    return GROUND_LINE + 18 * Math.sin(worldX * 0.004) + 10 * Math.sin(worldX * 0.011 + 2);
  }

  setRunwayAhead() {
    if (this.runwayX === null) this.runwayX = this.distance + 2600;
  }

  screenX(worldX) {
    return worldX - this.distance;
  }

  spawnRing(x) {
    const y = this.rng.range(130, 420);
    this.rings.push({ x, y, r: 36, passed: false, spin: this.rng.range(0, Math.PI * 2) });
    this.ringsSpawned++;
  }

  spawnStarArc(x) {
    const cy = this.rng.range(150, 380);
    for (let i = 0; i < 5; i++) {
      this.stars.push({
        x: x + i * 46,
        y: cy - Math.sin((i / 4) * Math.PI) * 70,
        r: 13,
        taken: false,
        spin: this.rng.range(0, Math.PI * 2),
      });
    }
  }

  spawnFuelCan(x) {
    this.fuelCans.push({ x, y: this.rng.range(140, 420), r: 16, taken: false });
    this.fuelSpawned++;
  }

  spawnBalloon(x) {
    const palette = ['#e8443a', '#f2a541', '#4f9fd8', '#8e6cc8'];
    this.balloons.push({
      x,
      y: this.rng.range(120, 430),
      r: 26,
      baseY: 0,
      phase: this.rng.range(0, Math.PI * 2),
      color: this.rng.pick(palette),
    });
    const b = this.balloons[this.balloons.length - 1];
    b.baseY = b.y;
  }

  spawnBird(x) {
    this.birds.push({
      x,
      y: this.rng.range(100, 400),
      phase: this.rng.range(0, Math.PI * 2),
      flap: this.rng.range(0, Math.PI * 2),
      speed: this.rng.range(30, 70),
    });
  }

  burst(x, y, color, count, power) {
    for (let i = 0; i < count; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const v = this.rng.range(power * 0.3, power);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 40,
        life: this.rng.range(0.4, 0.9),
        maxLife: 0.9,
        color,
        size: this.rng.range(2, 6),
      });
    }
  }

  trailPuff(x, y) {
    this.particles.push({
      x, y,
      vx: -60 + this.rng.range(-15, 15),
      vy: this.rng.range(-8, 18),
      life: 0.5,
      maxLife: 0.5,
      color: 'rgba(255,255,255,0.55)',
      size: this.rng.range(2, 4),
    });
  }

  update(dt, speed, missionKey) {
    this.time += dt;
    this.distance += speed * dt;
    const ahead = this.distance + GAME_WIDTH + 260;
    if (missionKey === 'rings' && this.nextRingX < ahead) {
      this.spawnRing(this.nextRingX);
      this.nextRingX += this.rng.range(SPAWN.ringGapMin, SPAWN.ringGapMax);
      if (this.rng.chance(SPAWN.starArcChance)) this.spawnStarArc(this.nextRingX - 260);
    }
    if (missionKey === 'stars' && this.nextStarX < ahead) {
      this.spawnStarArc(this.nextStarX);
      this.nextStarX += this.rng.range(430, 640);
    }
    if (this.nextFuelX < ahead) {
      this.spawnFuelCan(this.nextFuelX);
      this.nextFuelX += 1500 + this.fuelSpawned * 260;
    }
    if (this.nextBalloonX < ahead) {
      this.spawnBalloon(this.nextBalloonX);
      this.nextBalloonX += this.rng.range(SPAWN.balloonGapMin, SPAWN.balloonGapMax);
    }
    if (this.nextBirdX < ahead) {
      this.spawnBird(this.nextBirdX);
      this.nextBirdX += this.rng.range(SPAWN.birdGapMin, SPAWN.birdGapMax);
    }
    for (const c of this.clouds) {
      c.x -= (c.drift + speed * 0.06) * dt;
      if (c.x < -180) {
        c.x = GAME_WIDTH + this.rng.range(40, 320);
        c.y = this.rng.range(30, 230);
        c.scale = this.rng.range(0.6, 1.5);
      }
    }
    for (const b of this.balloons) b.y = b.baseY + Math.sin(this.time * 1.4 + b.phase) * 14;
    for (const b of this.birds) {
      b.x -= b.speed * dt;
      b.flap += dt * 11;
      b.y += Math.sin(this.time * 2.2 + b.phase) * 22 * dt;
    }
    const cut = this.distance - 200;
    this.rings = this.rings.filter((r) => r.x > cut);
    this.stars = this.stars.filter((s) => s.x > cut);
    this.fuelCans = this.fuelCans.filter((f) => f.x > cut);
    this.balloons = this.balloons.filter((b) => b.x > cut);
    this.birds = this.birds.filter((b) => b.x > cut);
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 160 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  static dist(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }
}

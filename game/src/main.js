// Sky Courier: Ring Run — game states, loop, missions, scoring and screenshots.
// One job: run the whole game; everything else is a helper it calls.
import { GAME_WIDTH, GAME_HEIGHT, GROUND_LINE, PLANE_X, PHYSICS, FUEL, LIVES_START, SCORE, MISSIONS } from './config.js';
import { createRandom } from './random.js';
import { SoundEngine } from './audio.js';
import { InputState } from './input.js';
import { World } from './world.js';
import { Plane } from './plane.js';
import { Renderer } from './render.js';

const params = new URLSearchParams(window.location.search);
const SHOT = params.get('shot') || '';
const SEED = Number(params.get('seed') || '7');

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new InputState(canvas);
const sound = new SoundEngine();
const renderer = new Renderer();

const overlays = {
  start: document.getElementById('screen-start'),
  pause: document.getElementById('screen-pause'),
  over: document.getElementById('screen-over'),
  win: document.getElementById('screen-win'),
};
const finalStats = document.getElementById('final-stats');
const winStats = document.getElementById('win-stats');
const bestLine = document.getElementById('best-line');

const game = {
  state: 'start',
  score: 0,
  lives: LIVES_START,
  fuel: FUEL.start,
  time: 0,
  missionIndex: 0,
  missionProgress: 0,
  banner: '',
  bannerSub: '',
  bannerLife: 0,
  popups: [],
  best: Number(window.localStorage.getItem('sky-courier-best') || 0),
  muted: false,
  crashFlash: 0,
};

let world = new World(SEED);
let plane = new Plane();
let lastTs = 0;
let elapsed = 0;

function showOnly(name) {
  for (const [key, el] of Object.entries(overlays)) {
    if (el) el.classList.toggle('hidden', key !== name);
  }
}

function mission() {
  return MISSIONS[game.missionIndex];
}

function setBanner(text, sub) {
  game.banner = text;
  game.bannerSub = sub;
  game.bannerLife = 2.6;
}

function addPopup(x, y, text, color) {
  game.popups.push({ x, y, text, color: color || '#ffc93c', life: 1.1 });
}

function startGame() {
  world = new World(SEED + Math.floor(Math.random() * 1000));
  plane = new Plane();
  game.state = 'playing';
  game.score = 0;
  game.lives = LIVES_START;
  game.fuel = FUEL.start;
  game.time = 0;
  game.missionIndex = 0;
  game.missionProgress = 0;
  game.popups = [];
  game.crashFlash = 0;
  showOnly(null);
  setBanner('MISSION 1 — RING RUN', MISSIONS[0].blurb);
  sound.unlock();
}

function missionComplete() {
  game.score += SCORE.missionBonus;
  addPopup(PLANE_X + 60, plane.y - 40, `MISSION BONUS +${SCORE.missionBonus}`, '#37e08a');
  if (game.missionIndex === 0) {
    game.missionIndex = 1;
    game.missionProgress = 0;
    setBanner('MISSION 2 — STAR HARVEST', MISSIONS[1].blurb);
  } else if (game.missionIndex === 1) {
    game.missionIndex = 2;
    game.missionProgress = 0;
    world.setRunwayAhead();
    setBanner('MISSION 3 — HOME RUN', MISSIONS[2].blurb + ' — runway 27 ahead');
  }
}

function landPlane() {
  game.state = 'win';
  game.bannerLife = 0;
  game.banner = '';
  const landingBonus = SCORE.landingBonus + Math.max(0, Math.round(game.fuel) * 2);
  game.score += landingBonus;
  game.missionProgress = 1;
  if (game.score > game.best) {
    game.best = game.score;
    window.localStorage.setItem('sky-courier-best', String(game.best));
  }
  sound.winArpeggio();
  sound.setEngine(0, false);
  if (winStats) {
    winStats.textContent = `Score ${game.score}  ·  Time ${formatTime(game.time)}  ·  Fuel left ${Math.round(game.fuel)}%  ·  Best ${game.best}`;
  }
  showOnly('win');
}

function crashPlane(reason) {
  game.lives -= 1;
  game.crashFlash = 0.5;
  const wx = world.distance + PLANE_X;
  const wy = plane.y;
  world.burst(wx, wy, '#ff7a1a', 26, 220);
  world.burst(wx, wy, '#5a5a6a', 18, 150);
  sound.crashThud();
  if (game.lives <= 0) {
    game.state = 'over';
    if (game.score > game.best) {
      game.best = game.score;
      window.localStorage.setItem('sky-courier-best', String(game.best));
    }
    sound.setEngine(0, false);
    if (finalStats) {
      finalStats.textContent = `Score ${game.score}  ·  Survived ${formatTime(game.time)}  ·  Mission ${game.missionIndex + 1}/3  ·  Best ${game.best}`;
    }
    showOnly('over');
    return;
  }
  addPopup(PLANE_X + 40, plane.y - 50, reason || 'CRASH!', '#ff5a4e');
  plane.reset();
  plane.y = 220;
  plane.invuln = 2.2;
  game.fuel = Math.max(game.fuel, 45);
}

function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function checkCollisions() {
  const px = world.distance + PLANE_X;
  const py = plane.y;
  for (const ring of world.rings) {
    if (ring.passed) continue;
    if (World.dist(px, py, ring.x, ring.y) < ring.r) {
      ring.passed = true;
      game.score += SCORE.ring;
      addPopup(ring.x - world.distance, ring.y - 30, `RING +${SCORE.ring}`, '#ffc93c');
      world.burst(ring.x, ring.y, '#ffc93c', 16, 160);
      sound.ringChime();
      if (mission().key === 'rings') {
        game.missionProgress += 1;
        if (game.missionProgress >= mission().goal) missionComplete();
      }
    }
  }
  for (const s of world.stars) {
    if (s.taken) continue;
    if (World.dist(px, py, s.x, s.y) < s.r + 16) {
      s.taken = true;
      game.score += SCORE.star;
      addPopup(s.x - world.distance, s.y - 24, `STAR +${SCORE.star}`, '#ffe45e');
      world.burst(s.x, s.y, '#ffe45e', 10, 120);
      sound.starBlip();
      if (mission().key === 'stars') {
        game.missionProgress += 1;
        if (game.missionProgress >= mission().goal) missionComplete();
      }
    }
  }
  for (const f of world.fuelCans) {
    if (f.taken) continue;
    if (World.dist(px, py, f.x, f.y) < f.r + 16) {
      f.taken = true;
      game.fuel = Math.min(100, game.fuel + FUEL.canBonus);
      game.score += SCORE.fuelCan;
      addPopup(f.x - world.distance, f.y - 24, `FUEL +${FUEL.canBonus}`, '#37e08a');
      sound.fuelBlip();
    }
  }
  if (plane.invuln <= 0) {
    for (const b of world.balloons) {
      if (World.dist(px, py, b.x, b.y) < 24 + 16) {
        crashPlane('BALLOON HIT!');
        return;
      }
    }
    for (const b of world.birds) {
      if (World.dist(px, py, b.x, b.y) < 14 + 14) {
        crashPlane('BIRD STRIKE!');
        return;
      }
    }
  }
  // Ground contact
  const gy = world.groundYAt(px);
  if (py + 12 >= gy) {
    const onRunway = world.runwayX !== null && px >= world.runwayX && px <= world.runwayX + 360;
    const gentle = Math.abs(plane.vy) < 120 && plane.speed < 230;
    if (onRunway && gentle && mission().key === 'landing') {
      landPlane();
    } else if (onRunway && gentle) {
      plane.y = gy - 12;
      plane.vy = Math.min(0, plane.vy);
    } else if (plane.invuln > 0) {
      // Still flashing from the last crash: invulnerability has to mean
      // invulnerable, so the plane bounces off the ground instead of
      // dying twice to the same dive.
      plane.y = gy - 12;
      plane.vy = -140;
    } else {
      crashPlane('GROUND HIT!');
    }
  }
}

function update(dt) {
  elapsed += dt;
  game.time += dt;
  if (game.bannerLife > 0) game.bannerLife -= dt;
  if (game.crashFlash > 0) game.crashFlash -= dt;
  for (const p of game.popups) {
    p.y -= 26 * dt;
    p.life -= dt;
  }
  game.popups = game.popups.filter((p) => p.life > 0);
  const fuelEmpty = game.fuel <= 0;
  const boosting = plane.update(dt, input, fuelEmpty);
  const drain = boosting ? FUEL.drainBoost : plane.throttle > 0.7 ? FUEL.drainCruise : FUEL.drainIdle;
  game.fuel = Math.max(0, game.fuel - drain * dt);
  world.update(dt, plane.speed, mission().key);
  if (Math.random() < dt * 6) world.trailPuff(world.distance + PLANE_X - 44, plane.y + 2);
  sound.setEngine(plane.throttle, !fuelEmpty);
  checkCollisions();
}

function snapshot() {
  const m = mission();
  return {
    state: game.state,
    score: game.score,
    missionIndex: game.missionIndex,
    missionName: m.name,
    missionProgress: game.missionProgress,
    missionGoal: m.goal,
    fuel: game.fuel,
    lives: game.lives,
    altitude: plane.altitudeFt,
    speedKt: plane.speedKt,
    heading: plane.headingDeg,
    time: game.time,
    timeText: formatTime(game.time),
    planeY: plane.y,
    planeVy: plane.vy,
    groundY: world.groundYAt(world.distance + PLANE_X),
    popups: game.popups,
    banner: game.bannerLife > 0 ? game.banner : '',
    bannerSub: game.bannerSub,
    bannerLife: Math.min(1, game.bannerLife),
    runwayAhead: world.runwayX !== null && world.screenX(world.runwayX) < GAME_WIDTH + 40 && world.screenX(world.runwayX) > -380,
  };
}

function frame(ts) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 0.016);
  lastTs = ts;
  // Read the pause key once: calling the getter twice would eat the press.
  const pauseHit = input.pausePressed;
  if (pauseHit && game.state === 'playing') {
    game.state = 'paused';
    showOnly('pause');
    sound.setEngine(0, false);
  } else if (pauseHit && game.state === 'paused') {
    game.state = 'playing';
    showOnly(null);
  }
  if (input.mutePressed) {
    game.muted = !game.muted;
    sound.setMuted(game.muted);
    const btn = document.getElementById('btn-mute');
    if (btn) btn.textContent = game.muted ? '🔇 Muted' : '🔊 Sound';
  }
  if (input.restartPressed && game.state !== 'start') startGame();
  if (game.state === 'playing') update(dt);
  if (game.state === 'start') {
    world.update(dt * 0.4, 60, 'rings');
    plane.y = 250 + Math.sin(elapsed * 0.8) * 18;
    plane.propAngle += dt * 20;
  }
  renderer.draw(ctx, world, plane, snapshot(), elapsed);
  if (game.crashFlash > 0) {
    ctx.fillStyle = `rgba(255, 60, 40, ${game.crashFlash * 0.5})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
  input.clearTransient();
}

// Buttons
document.getElementById('btn-start').addEventListener('click', () => { sound.unlock(); startGame(); });
document.getElementById('btn-restart-over').addEventListener('click', startGame);
document.getElementById('btn-restart-win').addEventListener('click', startGame);
document.getElementById('btn-resume').addEventListener('click', () => {
  game.state = 'playing';
  showOnly(null);
});
document.getElementById('btn-restart-pause').addEventListener('click', startGame);
document.getElementById('btn-quit-pause').addEventListener('click', () => {
  game.state = 'start';
  world = new World(SEED);
  plane = new Plane();
  showOnly('start');
});
document.getElementById('btn-pause').addEventListener('click', () => {
  if (game.state === 'playing') {
    game.state = 'paused';
    showOnly('pause');
    sound.setEngine(0, false);
  }
});
document.getElementById('btn-mute').addEventListener('click', () => {
  game.muted = !game.muted;
  sound.setMuted(game.muted);
  document.getElementById('btn-mute').textContent = game.muted ? '🔇 Muted' : '🔊 Sound';
});
document.getElementById('btn-restart-top').addEventListener('click', () => {
  if (game.state !== 'start') startGame();
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Enter' && game.state === 'start') startGame();
  if (e.code === 'Enter' && (game.state === 'over' || game.state === 'win')) startGame();
});

// Best score line on the start screen
if (bestLine) bestLine.textContent = game.best > 0 ? `Best score: ${game.best}` : 'First flight? Rings are worth 100, stars 50 — mind the balloons.';

// Screenshot modes (?shot=start|play|land|end) for the maker's own renders
function applyShotMode() {
  if (SHOT === 'play') {
    startGame();
    game.score = 350;
    game.missionProgress = 3;
    game.fuel = 82;
    plane.y = 250;
    world.spawnRing(world.distance + 430);
    world.spawnStarArc(world.distance + 560);
    world.spawnBalloon(world.distance + 760);
  } else if (SHOT === 'land') {
    startGame();
    game.missionIndex = 2;
    game.missionProgress = 0;
    game.score = 1450;
    game.fuel = 46;
    plane.y = 300;
    plane.vy = 0;
    plane.speed = 210;
    world.setRunwayAhead();
    world.runwayX = world.distance + 480;
    setBanner('MISSION 3 — HOME RUN', MISSIONS[2].blurb + ' — runway 27 ahead');
  } else if (SHOT === 'end') {
    startGame();
    game.missionIndex = 2;
    game.missionProgress = 1;
    game.score = 2150;
    game.time = 187;
    game.fuel = 34;
    landPlane();
  } else {
    showOnly('start');
  }
}

// Read-only hook for automated play-testing (does not change gameplay).
window.__skyCourier = () => {
  const ahead = (list) => {
    let best = null;
    for (const e of list) {
      const dx = world.screenX(e.x) - PLANE_X;
      if (dx > 0 && (best === null || dx < best.dx)) best = { dx: Math.round(dx), y: Math.round(e.y) };
    }
    return best;
  };
  return {
    state: game.state,
    score: game.score,
    lives: game.lives,
    fuel: Math.round(game.fuel),
    time: Math.round(game.time * 10) / 10,
    mission: game.missionIndex + 1,
    progress: game.missionProgress,
    altitude: plane.altitudeFt,
    speedKt: plane.speedKt,
    heading: plane.headingDeg,
    planeY: Math.round(plane.y),
    rings: world.rings.length,
    balloons: world.balloons.length,
    birds: world.birds.length,
    distance: Math.round(world.distance),
    nextRing: ahead(world.rings),
    nextBalloon: ahead(world.balloons),
    nextBird: ahead(world.birds),
    nextFuel: ahead(world.fuelCans),
  };
};

applyShotMode();
requestAnimationFrame(frame);

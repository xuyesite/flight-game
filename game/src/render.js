// Sky Courier: Ring Run — all drawing: sky, terrain, entities, HUD and gauges.
// One job: turn game state into one pretty 800x600 frame.
import { GAME_WIDTH, GAME_HEIGHT, GROUND_LINE, COLORS } from './config.js';

function ridgeY(x, seed, amp, base) {
  return base - (Math.abs(Math.sin(x * 0.006 + seed)) * amp + Math.abs(Math.sin(x * 0.013 + seed * 2)) * amp * 0.4);
}

function drawSky(ctx, time) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_LINE);
  g.addColorStop(0, COLORS.skyTop);
  g.addColorStop(0.55, COLORS.skyMid);
  g.addColorStop(1, COLORS.skyLow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_WIDTH, GROUND_LINE + 2);
  // Sun with glow
  const sx = 668;
  const sy = 86;
  const glow = ctx.createRadialGradient(sx, sy, 8, sx, sy, 120);
  glow.addColorStop(0, 'rgba(255, 243, 176, 0.95)');
  glow.addColorStop(0.35, 'rgba(255, 215, 106, 0.45)');
  glow.addColorStop(1, 'rgba(255, 215, 106, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sx - 130, sy - 130, 260, 260);
  ctx.fillStyle = COLORS.sunCore;
  ctx.beginPath();
  ctx.arc(sx, sy, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 220, 120, 0.7)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + time * 0.05;
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(a) * 38, sy + Math.sin(a) * 38);
    ctx.lineTo(sx + Math.cos(a) * 50, sy + Math.sin(a) * 50);
    ctx.stroke();
  }
}

function drawMountains(ctx, distance) {
  for (const layer of [
    { par: 0.12, color: COLORS.mountainFar, amp: 90, base: 470 },
    { par: 0.25, color: COLORS.mountainNear, amp: 70, base: 500 },
  ]) {
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_LINE);
    const off = distance * layer.par;
    for (let x = 0; x <= GAME_WIDTH; x += 10) {
      ctx.lineTo(x, ridgeY(x + off, layer.par * 40, layer.amp, layer.base));
    }
    ctx.lineTo(GAME_WIDTH, GROUND_LINE);
    ctx.closePath();
    ctx.fill();
    // Snow caps on the taller peaks
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let x = 20; x < GAME_WIDTH; x += 90) {
      const px = x;
      const py = ridgeY(px + off, layer.par * 40, layer.amp, layer.base);
      const prev = ridgeY(px - 10 + off, layer.par * 40, layer.amp, layer.base);
      const next = ridgeY(px + 10 + off, layer.par * 40, layer.amp, layer.base);
      if (py < prev - 4 && py < next - 4) {
        ctx.beginPath();
        ctx.moveTo(px - 14, py + 12);
        ctx.lineTo(px, py - 2);
        ctx.lineTo(px + 14, py + 12);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

function drawCloud(ctx, x, y, scale) {
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.ellipse(x, y, 42 * scale, 17 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 28 * scale, y + 6 * scale, 26 * scale, 13 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 30 * scale, y + 6 * scale, 28 * scale, 14 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 4 * scale, y - 12 * scale, 26 * scale, 14 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround(ctx, world) {
  const d = world.distance;
  ctx.beginPath();
  ctx.moveTo(0, GAME_HEIGHT);
  for (let x = 0; x <= GAME_WIDTH; x += 8) {
    ctx.lineTo(x, world.groundYAt(d + x));
  }
  ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
  ctx.closePath();
  ctx.fillStyle = COLORS.ground;
  ctx.fill();
  // Field patches
  for (let wx = Math.floor(d / 130) * 130; wx < d + GAME_WIDTH + 130; wx += 130) {
    const sx = wx - d;
    const gy = world.groundYAt(wx);
    const kind = Math.abs(Math.sin(wx * 0.37)) > 0.5;
    ctx.fillStyle = kind ? COLORS.fieldA : COLORS.fieldB;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(sx, gy + 6, 120, 90);
    ctx.globalAlpha = 1;
  }
  // River band
  const riverW = 900;
  const riverX = (((Math.floor(d / riverW) * riverW) - d) % riverW + riverW) % riverW;
  ctx.fillStyle = COLORS.river;
  ctx.beginPath();
  ctx.moveTo(riverX, world.groundYAt(d + riverX));
  ctx.quadraticCurveTo(riverX + 30, world.groundYAt(d + riverX) + 40, riverX + 10, GAME_HEIGHT);
  ctx.lineTo(riverX + 44, GAME_HEIGHT);
  ctx.quadraticCurveTo(riverX + 60, world.groundYAt(d + riverX) + 40, riverX + 34, world.groundYAt(d + riverX));
  ctx.closePath();
  ctx.fill();
  // Trees and cottages
  for (let wx = Math.floor(d / 90) * 90; wx < d + GAME_WIDTH + 90; wx += 90) {
    const sx = wx - d;
    const gy = world.groundYAt(wx);
    const h = Math.abs(Math.sin(wx * 0.913));
    if (h > 0.62) {
      ctx.fillStyle = '#3d7a34';
      ctx.beginPath();
      ctx.moveTo(sx, gy - 26);
      ctx.lineTo(sx - 11, gy - 2);
      ctx.lineTo(sx + 11, gy - 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#6b4a2b';
      ctx.fillRect(sx - 2, gy - 4, 4, 6);
    } else if (h > 0.45) {
      ctx.fillStyle = '#f4e3c2';
      ctx.fillRect(sx - 11, gy - 16, 22, 16);
      ctx.fillStyle = '#c25b4e';
      ctx.beginPath();
      ctx.moveTo(sx - 13, gy - 16);
      ctx.lineTo(sx, gy - 26);
      ctx.lineTo(sx + 13, gy - 16);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawRunway(ctx, world) {
  if (world.runwayX === null) return;
  const sx = world.screenX(world.runwayX);
  if (sx > GAME_WIDTH + 80 || sx + 360 < -80) return;
  const gy = GROUND_LINE;
  ctx.fillStyle = '#3a3f4a';
  ctx.fillRect(sx, gy - 2, 360, 12);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 9; i++) ctx.fillRect(sx + 14 + i * 38, gy + 3, 22, 3);
  ctx.fillRect(sx + 8, gy - 2, 6, 12);
  ctx.fillRect(sx + 346, gy - 2, 6, 12);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('27', sx + 168, gy - 8);
  // Windsock
  ctx.strokeStyle = '#d8d8d8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx + 330, gy - 2);
  ctx.lineTo(sx + 330, gy - 34);
  ctx.stroke();
  ctx.fillStyle = '#ff7a1a';
  ctx.beginPath();
  ctx.moveTo(sx + 330, gy - 34);
  ctx.lineTo(sx + 356, gy - 28);
  ctx.lineTo(sx + 330, gy - 22);
  ctx.closePath();
  ctx.fill();
  // Approach lights
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 ? '#37e08a' : '#ffffff';
    ctx.beginPath();
    ctx.arc(sx - 26 - i * 18, gy - 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function starPath(ctx, x, y, r, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = rot + (i / 10) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawEntities(ctx, world, time) {
  for (const ring of world.rings) {
    const sx = world.screenX(ring.x);
    if (sx < -60 || sx > GAME_WIDTH + 60) continue;
    const pulse = 1 + Math.sin(time * 3 + ring.spin) * 0.06;
    ctx.save();
    ctx.translate(sx, ring.y);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = COLORS.ringGlow;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = COLORS.ring;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff3c4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, ring.r, -2.4, -1.2);
    ctx.stroke();
    ctx.restore();
  }
  for (const s of world.stars) {
    if (s.taken) continue;
    const sx = world.screenX(s.x);
    if (sx < -30 || sx > GAME_WIDTH + 30) continue;
    const pulse = 1 + Math.sin(time * 4 + s.spin) * 0.15;
    ctx.save();
    ctx.translate(sx, s.y);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = COLORS.star;
    ctx.shadowBlur = 12;
    ctx.fillStyle = COLORS.star;
    starPath(ctx, 0, 0, s.r, time * 0.8 + s.spin);
    ctx.fill();
    ctx.restore();
  }
  for (const f of world.fuelCans) {
    if (f.taken) continue;
    const sx = world.screenX(f.x);
    if (sx < -30 || sx > GAME_WIDTH + 30) continue;
    const bob = Math.sin(time * 3 + f.x) * 4;
    ctx.save();
    ctx.translate(sx, f.y + bob);
    ctx.shadowColor = '#ff5a4e';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#e8443a';
    ctx.beginPath();
    ctx.roundRect(-13, -12, 26, 24, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8f1d16';
    ctx.fillRect(-6, -18, 12, 7);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('F', 0, 5);
    ctx.textAlign = 'left';
    ctx.restore();
  }
  for (const b of world.balloons) {
    const sx = world.screenX(b.x);
    if (sx < -60 || sx > GAME_WIDTH + 60) continue;
    ctx.save();
    ctx.translate(sx, b.y);
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.ellipse(0, -6, 24, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-8, -16, 7, 12, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-14, 18);
    ctx.lineTo(-8, 30);
    ctx.moveTo(14, 18);
    ctx.lineTo(8, 30);
    ctx.stroke();
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(-9, 30, 18, 12);
    ctx.restore();
  }
  for (const b of world.birds) {
    const sx = world.screenX(b.x);
    if (sx < -40 || sx > GAME_WIDTH + 40) continue;
    const flap = Math.sin(b.flap) * 9;
    ctx.save();
    ctx.translate(sx, b.y);
    ctx.strokeStyle = '#2b2b3a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.quadraticCurveTo(-5, -6 - flap, 0, 0);
    ctx.quadraticCurveTo(5, -6 - flap, 12, 0);
    ctx.stroke();
    ctx.restore();
  }
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGauge(ctx, cx, cy, r, label, valueText, frac, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(8, 18, 38, 0.78)';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
    const inner = i % 5 === 0 ? r - 10 : r - 6;
    ctx.strokeStyle = '#cfe3ff';
    ctx.lineWidth = i % 5 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
    ctx.stroke();
  }
  const na = Math.PI * 0.75 + Math.max(0, Math.min(1, frac)) * Math.PI * 1.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(na) * (r - 12), Math.sin(na) * (r - 12));
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9fc0e8';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, r - 16);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(valueText, 0, 6);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawHud(ctx, snap) {
  ctx.fillStyle = COLORS.hudPanel;
  ctx.beginPath();
  ctx.roundRect(8, 8, GAME_WIDTH - 16, 46, 10);
  ctx.fill();
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('SCORE', 20, 24);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = COLORS.hudAmber;
  ctx.fillText(String(snap.score).padStart(5, '0'), 20, 45);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`MISSION ${snap.missionIndex + 1}/3`, 140, 24);
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(snap.missionName, 140, 42);
  ctx.fillStyle = '#9fc0e8';
  ctx.font = '11px sans-serif';
  ctx.fillText(`${snap.missionProgress}/${snap.missionGoal}`, 260, 42);
  // Fuel gauge
  const fx = 330;
  ctx.fillStyle = '#9fc0e8';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('FUEL', fx, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.roundRect(fx, 30, 130, 12, 6);
  ctx.fill();
  const fuelFrac = Math.max(0, snap.fuel / 100);
  const fuelColor = snap.fuel < FUEL_LOW ? COLORS.danger : fuelFrac < 0.5 ? COLORS.hudAmber : '#37e08a';
  ctx.fillStyle = fuelColor;
  if (snap.fuel < FUEL_LOW && Math.floor(snap.time * 4) % 2 === 0) ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.roundRect(fx, 30, 130 * fuelFrac, 12, 6);
  ctx.fill();
  ctx.globalAlpha = 1;
  // ALT / SPD / HDG
  const rx = 486;
  ctx.fillStyle = '#9fc0e8';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('ALT', rx, 22);
  ctx.fillText('SPD', rx + 78, 22);
  ctx.fillText('HDG', rx + 156, 22);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`${snap.altitude} FT`, rx, 42);
  ctx.fillText(`${snap.speedKt} KT`, rx + 78, 42);
  ctx.fillText(`${String(snap.heading).padStart(3, '0')}°`, rx + 156, 42);
  // Lives hearts
  for (let i = 0; i < 3; i++) {
    const hx = 716 + i * 24;
    const hy = 30;
    ctx.fillStyle = i < snap.lives ? '#ff5a6e' : 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(hx, hy + 6);
    ctx.bezierCurveTo(hx - 8, hy - 2, hx - 5, hy - 9, hx, hy - 4);
    ctx.bezierCurveTo(hx + 5, hy - 9, hx + 8, hy - 2, hx, hy + 6);
    ctx.fill();
  }
  ctx.fillStyle = '#9fc0e8';
  ctx.font = '11px sans-serif';
  ctx.fillText(snap.timeText, 716, 50);
  // Gauges bottom corners
  drawGauge(ctx, 52, GAME_HEIGHT - 52, 40, 'ALTITUDE', `${snap.altitude}`, Math.min(1, snap.altitude / 2200), '#7fb2e8');
  drawGauge(ctx, GAME_WIDTH - 52, GAME_HEIGHT - 52, 40, 'AIRSPEED', `${snap.speedKt}`, Math.min(1, snap.speedKt / 240), '#37e08a');
  // Compass strip
  ctx.fillStyle = 'rgba(8, 18, 38, 0.6)';
  ctx.beginPath();
  ctx.roundRect(GAME_WIDTH / 2 - 110, GAME_HEIGHT - 30, 220, 20, 10);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N  030  060  E  120  150  S  210  240  W  300  330', GAME_WIDTH / 2, GAME_HEIGHT - 16);
  ctx.fillStyle = COLORS.hudAmber;
  ctx.fillText('▲', GAME_WIDTH / 2, GAME_HEIGHT - 32);
  ctx.textAlign = 'left';
  // Floating score popups
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  for (const t of snap.popups) {
    ctx.globalAlpha = Math.max(0, t.life / 1.1);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  // Low fuel warning
  if (snap.fuel < FUEL_LOW && snap.state === 'playing' && Math.floor(snap.time * 3) % 2 === 0) {
    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ LOW FUEL — GRAB A RED CAN ⚠', GAME_WIDTH / 2, 78);
    ctx.textAlign = 'left';
  }
  // Pull-up warning: close to the ground and still descending
  if (snap.state === 'playing' && snap.groundY - snap.planeY < 95 && snap.planeVy > 60) {
    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▲ PULL UP! ▲', GAME_WIDTH / 2, 108);
    ctx.textAlign = 'left';
  }
  // Mission banner
  if (snap.banner) {
    ctx.globalAlpha = Math.max(0, Math.min(1, snap.bannerLife));
    ctx.fillStyle = 'rgba(8, 18, 38, 0.75)';
    ctx.beginPath();
    ctx.roundRect(GAME_WIDTH / 2 - 210, 92, 420, 52, 12);
    ctx.fill();
    ctx.fillStyle = COLORS.hudAmber;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(snap.banner, GAME_WIDTH / 2, 116);
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px sans-serif';
    ctx.fillText(snap.bannerSub, GAME_WIDTH / 2, 136);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
  // Runway pointer
  if (snap.runwayAhead) {
    ctx.fillStyle = COLORS.hudAmber;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RUNWAY 27 AHEAD →', GAME_WIDTH - 110, 78);
    ctx.textAlign = 'left';
  }
}

const FUEL_LOW = 25;

export class Renderer {
  draw(ctx, world, plane, snap, time) {
    drawSky(ctx, time);
    drawMountains(ctx, world.distance);
    for (const c of world.clouds) drawCloud(ctx, c.x, c.y, c.scale);
    drawGround(ctx, world);
    drawRunway(ctx, world);
    drawEntities(ctx, world, time);
    plane.draw(ctx, time);
    drawHud(ctx, snap);
  }
}

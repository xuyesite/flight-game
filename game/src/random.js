// Sky Courier: Ring Run — small seeded random generator.
// One job: deterministic randomness so a screenshot seed replays the same sky.
export function createRandom(seed) {
  let state = (seed >>> 0) || 1;
  function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function range(min, max) {
    return min + next() * (max - min);
  }
  function pick(list) {
    return list[Math.floor(next() * list.length)];
  }
  function chance(p) {
    return next() < p;
  }
  return { next, range, pick, chance };
}

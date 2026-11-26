// Sky Courier: Ring Run — shared tuning constants.
// One job: every number the rest of the game tunes against lives here.
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const GROUND_LINE = 520;
export const PLANE_X = 210;

export const PHYSICS = {
  gravity: 150,
  climbPower: 340,
  descendPower: 300,
  minSpeed: 110,
  maxSpeed: 320,
  boostSpeed: 380,
  accel: 240,
  stallSpeed: 95,
  maxVy: 260,
};

export const FUEL = {
  start: 100,
  drainCruise: 1.5,
  drainBoost: 2.8,
  drainIdle: 0.9,
  canBonus: 35,
  lowWarn: 25,
};

export const LIVES_START = 3;
export const INVULN_SECONDS = 2.2;

export const SCORE = {
  ring: 100,
  star: 50,
  fuelCan: 25,
  missionBonus: 250,
  landingBonus: 500,
};

export const MISSIONS = [
  { key: 'rings', name: 'Ring Run', goal: 8, blurb: 'Fly through 8 golden rings' },
  { key: 'stars', name: 'Star Harvest', goal: 12, blurb: 'Collect 12 sky stars' },
  { key: 'landing', name: 'Home Run', goal: 1, blurb: 'Land gently on runway 27' },
];

export const COLORS = {
  skyTop: '#2f6fd0',
  skyMid: '#7fb2e8',
  skyLow: '#ffe3b3',
  sunCore: '#fff3b0',
  sunGlow: '#ffd76a',
  mountainFar: '#8fa8d8',
  mountainNear: '#5d7fb0',
  hill: '#6fae62',
  ground: '#57a047',
  fieldA: '#6fbf5a',
  fieldB: '#e8c85a',
  river: '#4f9fd8',
  cloud: '#ffffff',
  ring: '#ffc93c',
  ringGlow: '#ff9d00',
  star: '#ffe45e',
  planeRed: '#e8443a',
  planeCream: '#fff3d6',
  planeDark: '#2b2b3a',
  hudPanel: 'rgba(10, 22, 44, 0.72)',
  hudText: '#ffffff',
  hudAmber: '#ffc93c',
  danger: '#ff5a4e',
};

export const SPAWN = {
  ringGapMin: 420,
  ringGapMax: 620,
  starArcChance: 0.55,
  fuelCanEvery: 3,
  balloonGapMin: 650,
  balloonGapMax: 1050,
  birdGapMin: 700,
  birdGapMax: 1200,
};

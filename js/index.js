// js/upgrades/index.js
// RANDOM-FIX1: корректный Fisher-Yates shuffle.
// RANDOM-FIX2: getRandomChoices с excludeIds + логирование.
// RANDOM-FIX3: generateUpgradeChoices для всех 3 слотов.
import * as survivorMod from './survivorUpgrades.js';
import * as attackerMod from './attackerUpgrades.js';
import * as tankMod     from './tankUpgrades.js';
import * as supportMod  from './supportUpgrades.js';

const POSSIBLE_EXPORTS = [
  'SURVIVOR_UPGRADES', 'ATTACKER_UPGRADES', 'TANK_UPGRADES', 'SUPPORT_UPGRADES',
  'survivorUpgrades', 'attackerUpgrades', 'tankUpgrades', 'supportUpgrades',
  'UPGRADES', 'upgrades', 'default'
];

function extractArray(mod, fallbackRole) {
  if (!mod) return [];
  for (const key of POSSIBLE_EXPORTS) if (Array.isArray(mod[key])) return mod[key];
  const arrs = Object.values(mod).filter(Array.isArray);
  if (arrs.length === 1) return arrs[0];
  console.warn(`[upgrades/index] Нет массива для "${fallbackRole}"`);
  return [];
}

function normalize(list, defaultRole) {
  return list.map(u => ({
    ...u,
    role: u.role || defaultRole,
    visual: u.visual?.part
      ? { part: u.visual.part, layer: typeof u.visual.layer === 'number' ? u.visual.layer : 5 }
      : { part: `fallback_${defaultRole}_${u.id || 'x'}`, layer: 5 }
  }));
}

const ALL_UPGRADES = [
  ...normalize(extractArray(survivorMod, 'survivor'), 'survivor'),
  ...normalize(extractArray(attackerMod, 'zombie_attacker'), 'zombie_attacker'),
  ...normalize(extractArray(tankMod,     'zombie_tank'), 'zombie_tank'),
  ...normalize(extractArray(supportMod,  'zombie_support'), 'zombie_support')
];

const BY_ID = new Map();
for (const u of ALL_UPGRADES) if (u.id) BY_ID.set(u.id, u);

// RANDOM-FIX1: корректный Fisher-Yates
export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getAllUpgrades() { return ALL_UPGRADES; }

export function getUpgradesFor(role, slot = null) {
  return ALL_UPGRADES.filter(u => u.role === role && (slot ? u.slot === slot : true));
}

export function getUpgradeById(id) { return BY_ID.get(id) || null; }

// RANDOM-FIX2: shuffle + excludeIds + дедуп по id
export function getRandomChoices(role, slot, count = 2, excludeIds = []) {
  const all = getUpgradesFor(role, slot);
  if (!all || all.length === 0) return [];
  const unique = Array.from(new Map(all.map(u => [u.id, u])).values());
  const exclude = new Set(excludeIds);
  const filtered = unique.filter(u => !exclude.has(u.id));
  const pool = filtered.length >= count ? filtered : unique;
  const result = shuffleArray(pool).slice(0, count);
  console.log('[getRandomChoices]', role, slot, 'pool=', pool.length, 'excluded=', excludeIds.length, '→', result.map(u => u.id));
  return result;
}

// RANDOM-FIX3: полный набор для всех трёх слотов
export function generateUpgradeChoices(role, existingIds = [], count = 2) {
  const slots = ['main', 'secondary', 'passive'];
  const result = {};
  for (const slot of slots) {
    const pool = getRandomChoices(role, slot, count, existingIds);
    result[slot] = pool.map(u => u.id);
  }
  return result;
}

export function isSecondaryUnlocked(upgrades) {
  if (!Array.isArray(upgrades)) return false;
  return upgrades.some(u => u?.unlocksSecondary === true);
}

export default {
  getAllUpgrades, getUpgradesFor, getUpgradeById,
  getRandomChoices, generateUpgradeChoices, isSecondaryUnlocked, shuffleArray
};
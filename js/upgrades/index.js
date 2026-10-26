// js/upgrades/index.js
// Собирает все 120 улучшений из 4 каталогов и предоставляет API для UI/игры.
// Устойчиво к разным вариантам именования экспортов в файлах-каталогах.

import * as survivorMod from './survivorUpgrades.js';
import * as attackerMod from './attackerUpgrades.js';
import * as tankMod     from './tankUpgrades.js';
import * as supportMod  from './supportUpgrades.js';

// Возможные имена экспорта массива в каждом каталоге.
// Если у вас массив называется иначе — добавьте сюда.
const POSSIBLE_EXPORTS = [
  'SURVIVOR_UPGRADES', 'ATTACKER_UPGRADES', 'TANK_UPGRADES', 'SUPPORT_UPGRADES',
  'survivorUpgrades',  'attackerUpgrades',  'tankUpgrades',  'supportUpgrades',
  'UPGRADES', 'upgrades', 'default'
];

// Извлекает массив улучшений из модуля, перебирая возможные имена.
function extractArray(mod, fallbackRole) {
  if (!mod) return [];
  for (const key of POSSIBLE_EXPORTS) {
    if (Array.isArray(mod[key])) return mod[key];
  }
  // Если в модуле лежит единственный массив — возьмём его
  const arrays = Object.values(mod).filter(Array.isArray);
  if (arrays.length === 1) return arrays[0];
  console.warn(`[upgrades/index] Не найден массив улучшений для роли "${fallbackRole}"`);
  return [];
}

// Собираем все 4 массива в один. Приводим id/role к единому виду.
const rawSurvivor = extractArray(survivorMod, 'survivor');
const rawAttacker = extractArray(attackerMod, 'zombie_attacker');
const rawTank     = extractArray(tankMod,     'zombie_tank');
const rawSupport  = extractArray(supportMod,  'zombie_support');

// Присваиваем каждой записи корректный role, если его нет,
// и нормализуем visual-поля на случай, если в файле их забыли.
function normalize(list, defaultRole) {
  return list.map(u => ({
    ...u,
    role: u.role || defaultRole,
    visual: u.visual && u.visual.part
      ? {
          part:  u.visual.part,
          layer: typeof u.visual.layer === 'number' ? u.visual.layer : 5
        }
      : { part: `fallback_${defaultRole}_${u.id || 'x'}`, layer: 5 }
  }));
}

// Финальный массив 120 улучшений (по 30 на роль)
const ALL_UPGRADES = [
  ...normalize(rawSurvivor, 'survivor'),
  ...normalize(rawAttacker, 'zombie_attacker'),
  ...normalize(rawTank,     'zombie_tank'),
  ...normalize(rawSupport,  'zombie_support')
];

// Индекс по id для быстрого поиска
const BY_ID = new Map();
for (const u of ALL_UPGRADES) {
  if (u.id) BY_ID.set(u.id, u);
}

/**
 * Возвращает все улучшения (120 штук).
 */
export function getAllUpgrades() {
  return ALL_UPGRADES;
}

/**
 * Возвращает список улучшений для конкретной роли.
 * role: 'survivor' | 'zombie_attacker' | 'zombie_tank' | 'zombie_support'
 * slot (необязательно): 'main' | 'secondary' | 'passive'
 */
export function getUpgradesFor(role, slot = null) {
  return ALL_UPGRADES.filter(u =>
    u.role === role && (slot ? u.slot === slot : true)
  );
}

/**
 * Возвращает улучшение по id или null.
 */
export function getUpgradeById(id) {
  return BY_ID.get(id) || null;
}

/**
 * Возвращает случайные варианты для набора слотов роли.
 * slots — массив слотов (например, ['main', 'secondary', 'passive'])
 * возвращает объект { main: upgrade, secondary: upgrade, passive: upgrade }
 * но с учётом правил:
 *   - secondary у выжившего доступен только если в main выбрано улучшение с unlocksSecondary=true.
 *   - Для зомби все слоты доступны всегда.
 *
 * Параметр options:
 *   { unlockSecondary: bool }  — если false, secondary не возвращается.
 */
export function getRandomChoices(role, slots = ['main', 'secondary', 'passive'], options = {}) {
  const { unlockSecondary = role !== 'survivor' } = options;

  const result = {};
  for (const slot of slots) {
    if (slot === 'secondary' && !unlockSecondary) {
      result[slot] = null;
      continue;
    }
    const pool = getUpgradesFor(role, slot);
    if (pool.length === 0) {
      result[slot] = null;
      continue;
    }
    result[slot] = pool[Math.floor(Math.random() * pool.length)];
  }
  return result;
}

/**
 * Утилита: возвращает true, если среди выбранных улучшений есть такое,
 * что unlocksSecondary = true. Нужна для логики выжившего.
 */
export function isSecondaryUnlocked(upgrades) {
  if (!Array.isArray(upgrades)) return false;
  return upgrades.some(u => u && u.unlocksSecondary === true);
}

// Удобный дефолтный экспорт
export default {
  getAllUpgrades,
  getUpgradesFor,
  getUpgradeById,
  getRandomChoices,
  isSecondaryUnlocked
};
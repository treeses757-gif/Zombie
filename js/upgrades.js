// Менеджер улучшений: парсинг, валидация, применение.
// Готов к переносу на сервер: чистые функции, никаких зависимостей от DOM/Firebase.

const MIN_TOTAL = 0.15; // минимальная суммарная сила улучшения (15%)
const MAX_TOTAL = 0.30; // максимальная (30%)
const IMBALANCE_TOLERANCE = 0.10; // допустимый дисбаланс баффов/дебаффов

// Синонимы ключей
const KEY_ALIASES = {
  hp: 'hp',
  'хп': 'hp',
  'жизни': 'hp',
  'здоровье': 'hp',
  speed: 'speed',
  'скорость': 'speed',
  damage: 'damage',
  'урон': 'damage',
  'атака': 'damage'
};

export const UpgradeManager = {
  /**
   * Парсит и валидирует строку улучшения.
   * Формат: "+10% HP, -5% скорость" — через запятую или точку с запятой.
   * Возвращает { valid, error?, parsed? }
   */
  validateUpgrade(upgradeText) {
    if (typeof upgradeText !== 'string' || !upgradeText.trim()) {
      return { valid: false, error: 'Улучшение пустое' };
    }

    const parts = upgradeText
      .split(/[,;]/)
      .map(s => s.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return { valid: false, error: 'Не найдено модификаторов' };
    }
    if (parts.length > 3) {
      return { valid: false, error: 'Максимум 3 модификатора' };
    }

    const parsed = { hp: 0, speed: 0, damage: 0 };
    const seen = new Set();

    // Регулярка: [знак] число % [ключ]
    const re = /^([+\-])\s*(\d+(?:[.,]\d+)?)\s*%\s*([a-zа-яё]+)$/i;

    for (const part of parts) {
      const m = part.match(re);
      if (!m) {
        return { valid: false, error: `Не удалось разобрать: "${part}"` };
      }
      const sign = m[1] === '+' ? 1 : -1;
      const value = parseFloat(m[2].replace(',', '.')) * sign;
      if (value === 0) {
        return { valid: false, error: 'Нулевое изменение бессмысленно' };
      }
      if (Math.abs(value) > 50) {
        return { valid: false, error: `Слишком большой модификатор: ${value}%` };
      }

      const keyRaw = m[3].toLowerCase();
      const key = KEY_ALIASES[keyRaw];
      if (!key) {
        return { valid: false, error: `Неизвестный параметр: "${m[3]}"` };
      }
      if (seen.has(key)) {
        return { valid: false, error: `Параметр "${key}" указан дважды` };
      }
      seen.add(key);
      parsed[key] = value / 100;
    }

    // Баланс
    const positives = Object.values(parsed).filter(v => v > 0).reduce((a, b) => a + b, 0);
    const negatives = Object.values(parsed).filter(v => v < 0).reduce((a, b) => a + b, 0);
    const total = positives + Math.abs(negatives);

    if (positives <= 0) {
      return { valid: false, error: 'Нужен хотя бы один бафф (+)' };
    }
    if (negatives >= 0) {
      return { valid: false, error: 'Нужен хотя бы один дебафф (−)' };
    }
    if (total < MIN_TOTAL) {
      return { valid: false, error: `Суммарный эффект слишком слабый (минимум ${MIN_TOTAL * 100}%)` };
    }
    if (total > MAX_TOTAL) {
      return { valid: false, error: `Суммарный эффект слишком сильный (максимум ${MAX_TOTAL * 100}%)` };
    }
    if (Math.abs(positives + negatives) > IMBALANCE_TOLERANCE) {
      return { valid: false, error: 'Баффы должны примерно компенсироваться дебаффами' };
    }

    return { valid: true, parsed };
  },

  // Применяет распарсенное улучшение к игроку
  applyUpgrade(player, parsedUpgrade) {
    if (!player || !parsedUpgrade) return;
    player.applyUpgrade(parsedUpgrade);
  }
};
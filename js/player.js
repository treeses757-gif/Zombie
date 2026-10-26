// Базовый класс игрока. Наследуется зомби-типами.
// Хранит визуальные слои улучшений (visualLayers) для spriteSystem.js.

export class Player {
  constructor({
    id,
    name = 'Игрок',
    x = 0,
    y = 0,
    hp = 100,
    maxHp = 100,
    speed = 150,
    damage = 20,
    role = 'survivor',
    upgrade = null,
    upgrades = null,
    canvasW = 800,
    canvasH = 600
  } = {}) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.hp = hp;
    this.maxHp = maxHp;
    this.speed = speed;
    this.damage = damage;
    this.role = role;
    this.upgrade = upgrade;             // совместимость со старым форматом (parsed)
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.alive = hp > 0;
    this.angle = 0;
    this._lastHit = 0;
    this._prevX = x;
    this._prevY = y;

    // Массив выбранных улучшений (полные объекты из upgrades/*.js)
    this.upgrades = Array.isArray(upgrades) ? upgrades.slice() : [];
    // Кэш визуальных слоёв: [{ part, layer }, ...] в порядке отрисовки
    this.visualLayers = [];

    // Применяем старое numeric-улучшение, если было передано
    if (upgrade) this.applyUpgrade(upgrade);

    // Пересобираем визуальные слои (если upgrades уже были)
    this.refreshVisualLayers();
  }

  // Движение с ограничением по границам canvas
  move(dx, dy) {
    this.x = Math.max(0, Math.min(this.canvasW, this.x + dx));
    this.y = Math.max(0, Math.min(this.canvasH, this.y + dy));
  }

  takeDamage(amount) {
    if (!this.alive) return false;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
    return this.alive;
  }

  heal(amount) {
    if (!this.alive) return 0;
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - before;
  }

  // Старый формат: { hp: 0.1, speed: -0.05, damage: 0 } — доли от базы.
  applyUpgrade(parsed) {
    if (!parsed) return;
    if (parsed.hp) {
      const diff = this.maxHp * parsed.hp;
      this.maxHp = Math.max(10, this.maxHp + diff);
      if (diff > 0) this.hp = Math.min(this.maxHp, this.hp + diff);
    }
    if (parsed.speed)  this.speed  *= (1 + parsed.speed);
    if (parsed.damage) this.damage *= (1 + parsed.damage);

    // Защитные минимумы
    this.speed  = Math.max(20, this.speed);
    this.damage = Math.max(1,  this.damage);
    this.maxHp  = Math.max(10, this.maxHp);
    this.hp     = Math.min(this.hp, this.maxHp);
  }

  // Новый формат: полный объект улучшения из upgrades/*.js
  // { id, slot, title, effects: { hp:+15, speed:-5, ... }, visual: { part, layer } }
  // effects в ПРОЦЕНТАХ. Применяем числовые ключи, остальные сохраняются в upgrades.
  addUpgrade(upgradeObj) {
    if (!upgradeObj) return;
    this.upgrades.push(upgradeObj);

    const eff = upgradeObj.effects || {};
    const parsed = {};
    if (typeof eff.hp     === 'number') parsed.hp     = eff.hp / 100;
    if (typeof eff.hpMax  === 'number') parsed.hp     = (parsed.hp || 0) + eff.hpMax / 100;
    if (typeof eff.speed  === 'number') parsed.speed  = eff.speed / 100;
    if (typeof eff.damage === 'number') parsed.damage = eff.damage / 100;
    if (Object.keys(parsed).length > 0) this.applyUpgrade(parsed);

    // Остальные эффекты (resist, critChance, cooldown и т.д.)
    // читаются игровой логикой прямо из this.upgrades — здесь не дублируем.

    this.refreshVisualLayers();
  }

  // Возвращает массив { part, layer } из выбранных улучшений в порядке слоёв
  getVisualParts() {
    const parts = [];
    for (const up of this.upgrades) {
      if (up && up.visual && up.visual.part) {
        parts.push({
          part: up.visual.part,
          layer: typeof up.visual.layer === 'number' ? up.visual.layer : 5
        });
      }
    }
    parts.sort((a, b) => a.layer - b.layer);
    return parts;
  }

  // Пересобирает кэш visualLayers (вызывать после изменения upgrades)
  refreshVisualLayers() {
    this.visualLayers = this.getVisualParts();
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      x: Math.round(this.x),
      y: Math.round(this.y),
      hp: Math.round(this.hp),
      maxHp: Math.round(this.maxHp),
      speed: this.speed,
      damage: this.damage,
      role: this.role,
      alive: this.alive,
      angle: this.angle
    };
  }

  static deserialize(data, canvasW, canvasH) {
    return new Player({ ...data, canvasW, canvasH });
  }
}
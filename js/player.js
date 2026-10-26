// js/player.js
// Базовый класс игрока. FIX 1 (applyUpgrade + стартовые upgrades), FIX 2 (анимация), FIX 6 (плавное движение), FIX B7-B8 (damage, takeDamage).
export class Player {
  constructor({
    id, name = 'Игрок', x = 0, y = 0,
    hp = 100, maxHp = 100, speed = 150, damage = 20,
    role = 'survivor', upgrade = null, upgrades = null,
    canvasW = 800, canvasH = 600
  } = {}) {
    this.id = id;
    this.name = name;
    this.x = x; this.y = y;
    this.hp = hp; this.maxHp = maxHp;
    this.speed = speed;
    // FIX B7: damage никогда не 0/undefined
    this.damage = typeof damage === 'number' && damage > 0 ? damage : 25;
    this.role = role;
    this.upgrade = upgrade;
    this.canvasW = canvasW; this.canvasH = canvasH;
    this.alive = hp > 0;
    this.angle = 0;
    this._lastHit = 0;
    this._prevX = x; this._prevY = y;

    // FIX 6: физика с ускорением
    this.vx = 0; this.vy = 0;
    this.acceleration = 1800;
    this.maxSpeed = speed;
    this.friction = 0.85;

    // FIX B7: скорость атаки (ударов/выстрелов в секунду)
    this.attackSpeed = 2.0;

    // FIX 2: анимация
    this.anim = { walkPhase: 0, attackTimer: 0, hurtTimer: 0, deathTimer: 0 };

    // FIX 1: выбранные улучшения и их визуальные части
    this.upgrades = Array.isArray(upgrades) ? upgrades.slice() : [];
    this.visualParts = [];
    this.visualLayers = [];
    this.defaultUpgradeIds = [];

    if (upgrade) this.applyUpgrade(upgrade);
    this.refreshVisualLayers();
  }

  // FIX 6: движение с ускорением и трением
  updateMovement(dt, inputX, inputY) {
    if (inputX || inputY) {
      const len = Math.hypot(inputX, inputY) || 1;
      const nx = inputX / len, ny = inputY / len;
      this.vx += nx * this.acceleration * dt;
      this.vy += ny * this.acceleration * dt;
    } else {
      const f = Math.pow(this.friction, dt * 60);
      this.vx *= f; this.vy *= f;
    }
    const sp = Math.hypot(this.vx, this.vy);
    if (sp > this.maxSpeed) {
      this.vx = (this.vx / sp) * this.maxSpeed;
      this.vy = (this.vy / sp) * this.maxSpeed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (sp > 5) this.angle = Math.atan2(this.vy, this.vx);
  }

  // FIX 2: триггер анимации атаки
  triggerAttack() {
    this.anim.attackTimer = 150;
  }

  // FIX B8: урон с защитой от повторной смерти
  takeDamage(amount) {
    if (!this.alive) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.anim.hurtTimer = 200;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.anim.deathTimer = 500;
    }
    return this.alive;
  }

  heal(amount) {
    if (!this.alive) return 0;
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - before;
  }

  // FIX 1: применение улучшения
  applyUpgrade(upgrade) {
    if (!upgrade) return;
    const e = upgrade.effects || {};

    if (typeof e.hp === 'number') {
      this.maxHp += e.hp;
      this.hp = Math.min(this.maxHp, this.hp + Math.max(0, e.hp));
    }
    if (typeof e.speed === 'number' && e.speed !== 0) {
      this.speed *= (1 + e.speed / 100);
    }
    if (typeof e.damage === 'number' && e.damage !== 0) {
      this.damage *= (1 + e.damage / 100);
    }
    if (typeof e.attackSpeed === 'number' && e.attackSpeed !== 0) {
      this.attackSpeed *= (1 + e.attackSpeed / 100);
    }

    if (upgrade.parsed) {
      const p = upgrade.parsed;
      if (p.hp)     this.maxHp += this.maxHp * p.hp;
      if (p.speed)  this.speed *= (1 + p.speed);
      if (p.damage) this.damage *= (1 + p.damage);
    }

    this.maxSpeed = this.speed;

    if (upgrade.visual && upgrade.visual.part) {
      if (!this.visualParts.includes(upgrade.visual.part)) {
        this.visualParts.push(upgrade.visual.part);
      }
    }
    if (!this.upgrades.includes(upgrade)) this.upgrades.push(upgrade);

    this.speed = Math.max(20, this.speed);
    this.damage = Math.max(1, this.damage);
    this.maxHp = Math.max(10, this.maxHp);
    this.hp = Math.min(this.hp, this.maxHp);
    this.refreshVisualLayers();
  }

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
    if (parts.length === 0 && this.visualParts.length > 0) {
      for (const part of this.visualParts) parts.push({ part, layer: 5 });
    }
    return parts.sort((a, b) => a.layer - b.layer);
  }

  refreshVisualLayers() {
    this.visualLayers = this.getVisualParts();
  }

  serialize() {
    return {
      id: this.id, name: this.name,
      x: Math.round(this.x), y: Math.round(this.y),
      hp: Math.round(this.hp), maxHp: Math.round(this.maxHp),
      speed: this.speed, damage: this.damage,
      role: this.role, alive: this.alive, angle: this.angle
    };
  }
}
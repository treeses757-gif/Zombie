// js/player.js
// BUG1-FIX5: hitRadius по роли. BUG3-FIX3: takeDamage с защитой.
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
    this.damage = typeof damage === 'number' && damage > 0 ? damage : 25;
    this.role = role;
    this.upgrade = upgrade;
    this.canvasW = canvasW; this.canvasH = canvasH;
    this.alive = hp > 0;
    this.angle = 0;
    this._lastHit = 0;
    this._prevX = x; this._prevY = y;

    // BUG1-FIX5: радиус попадания
    this.hitRadius = role === 'zombie_tank' ? 28 : 18;

    this.vx = 0; this.vy = 0;
    this.acceleration = 1800;
    this.maxSpeed = speed;
    this.friction = 0.85;

    this.attackSpeed = 2.0;
    this.anim = { walkPhase: 0, attackTimer: 0, hurtTimer: 0, deathTimer: 0 };

    this.upgrades = Array.isArray(upgrades) ? upgrades.slice() : [];
    this.visualParts = [];
    this.visualLayers = [];
    this.defaultUpgradeIds = [];

    if (upgrade) this.applyUpgrade(upgrade);
    this.refreshVisualLayers();
  }

  updateMovement(dt, inputX, inputY) {
    if (inputX || inputY) {
      const len = Math.hypot(inputX, inputY) || 1;
      this.vx += (inputX / len) * this.acceleration * dt;
      this.vy += (inputY / len) * this.acceleration * dt;
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

  triggerAttack() { this.anim.attackTimer = 150; }

  // BUG3-FIX3: sourceRole защищает от «своих»
  takeDamage(amount, sourceRole) {
    if (!this.alive) return false;
    if (this.role === 'base' && sourceRole === 'survivor') return false;
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

  applyUpgrade(upgrade) {
    if (!upgrade) return;
    const e = upgrade.effects || {};
    if (typeof e.hp === 'number') {
      this.maxHp += e.hp;
      this.hp = Math.min(this.maxHp, this.hp + Math.max(0, e.hp));
    }
    if (typeof e.speed === 'number' && e.speed !== 0) this.speed *= (1 + e.speed / 100);
    if (typeof e.damage === 'number' && e.damage !== 0) this.damage *= (1 + e.damage / 100);
    if (typeof e.attackSpeed === 'number' && e.attackSpeed !== 0) this.attackSpeed *= (1 + e.attackSpeed / 100);

    if (upgrade.parsed) {
      const p = upgrade.parsed;
      if (p.hp)     this.maxHp += this.maxHp * p.hp;
      if (p.speed)  this.speed *= (1 + p.speed);
      if (p.damage) this.damage *= (1 + p.damage);
    }

    this.maxSpeed = this.speed;
    if (upgrade.visual && upgrade.visual.part && !this.visualParts.includes(upgrade.visual.part)) {
      this.visualParts.push(upgrade.visual.part);
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
      if (up?.visual?.part) parts.push({ part: up.visual.part, layer: up.visual.layer ?? 5 });
    }
    if (parts.length === 0 && this.visualParts.length > 0) {
      for (const part of this.visualParts) parts.push({ part, layer: 5 });
    }
    return parts.sort((a, b) => a.layer - b.layer);
  }

  refreshVisualLayers() { this.visualLayers = this.getVisualParts(); }

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
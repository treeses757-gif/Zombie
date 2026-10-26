// Базовый класс игрока. Наследуется зомби-типами.
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
    this.upgrade = upgrade;
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.alive = hp > 0;
    this._lastHit = 0;
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

  // Применить распарсенное улучшение (формат: { hp: -0.05, speed: 0.10, damage: 0 })
  // Значения — доли от базы (0.1 = +10%).
  applyUpgrade(parsed) {
    if (!parsed) return;
    if (parsed.hp) {
      const diff = this.maxHp * parsed.hp;
      this.maxHp = Math.max(10, this.maxHp + diff);
      // При положительном изменении — компенсируем и текущее HP
      if (diff > 0) this.hp = Math.min(this.maxHp, this.hp + diff);
      if (this.hp > this.maxHp) this.hp = this.maxHp;
    }
    if (parsed.speed) this.speed *= (1 + parsed.speed);
    if (parsed.damage) this.damage *= (1 + parsed.damage);

    // Защитные минимумы
    this.speed = Math.max(20, this.speed);
    this.damage = Math.max(1, this.damage);
    this.maxHp = Math.max(10, this.maxHp);
    this.hp = Math.min(this.hp, this.maxHp);
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
      alive: this.alive
    };
  }

  static deserialize(data, canvasW, canvasH) {
    return new Player({ ...data, canvasW, canvasH });
  }
}
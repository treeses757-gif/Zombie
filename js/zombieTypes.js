// Типы зомби + фабрика. Каждый класс задаёт свой базовый style
// (используется PART_RENDERERS в spriteSystem.js и игровой логикой).

import { Player } from './player.js';

// Танк: много HP, медленный, защищает союзников
export class TankZombie extends Player {
  constructor(opts) {
    super({ ...opts, role: 'zombie_tank' });
    this.maxHp *= 2;
    this.hp = this.maxHp;
    this.speed *= 0.6;
    this.damage *= 0.7;
    this.shield = true;

    // Базовый визуальный стиль
    this.style = {
      bodyColor:   '#71717a',
      accentColor: '#52525b',
      eyeColor:    '#fbbf24',
      shieldColor: '#52525b'
    };
  }

  // Поглотить часть урона, летящего в союзника. Возвращает сколько принял на себя.
  absorbDamage(ally, amount) {
    if (!this.shield || !this.alive || !ally.alive) return 0;
    const absorbed = amount * 0.6;
    this.takeDamage(absorbed * 0.5);
    return absorbed;
  }
}

// Атакующий: быстрый и бьёт больно, но хрупкий
export class AttackerZombie extends Player {
  constructor(opts) {
    super({ ...opts, role: 'zombie_attacker' });
    this.maxHp *= 0.7;
    this.hp = this.maxHp;
    this.speed *= 1.3;
    this.damage *= 1.5;

    this.style = {
      bodyColor:   '#4d7c0f',
      accentColor: '#dc2626',
      eyeColor:    '#ff3030',
      clawColor:   '#fbbf24'
    };
  }
}

// Помогающий: лечит/баффает союзных зомби, слаб в бою
export class SupportZombie extends Player {
  constructor(opts) {
    super({ ...opts, role: 'zombie_support' });
    this.maxHp *= 0.8;
    this.hp = this.maxHp;
    this.damage *= 0.5;
    this.healCooldown = 0; // сек

    this.style = {
      bodyColor:   '#7c3aed',
      accentColor: '#4ade80',
      eyeColor:    '#22d3ee',
      crystalColor:'#4ade80'
    };
  }

  healAlly(ally, amount) {
    if (this.healCooldown > 0 || !ally.alive) return 0;
    const healed = ally.heal(amount);
    if (healed > 0) this.healCooldown = 3;
    return healed;
  }
}

// Возвращает МАССИВ ТИПОВ зомби для заданного общего числа игроков.
// 2 игрока: 1 выживший + attacker
// 3 игрока: 1 выживший + attacker + support
// 4 игрока: 1 выживший + attacker + tank + support
export function createZombiesForPlayerCount(count) {
  if (count <= 2) return ['attacker'];
  if (count === 3) return ['attacker', 'support'];
  return ['attacker', 'tank', 'support'];
}

// Фабрика конкретного зомби по типу
export function createZombie(type, opts) {
  switch (type) {
    case 'tank':    return new TankZombie(opts);
    case 'support': return new SupportZombie(opts);
    case 'attacker':
    default:        return new AttackerZombie(opts);
  }
}

// Маппинг role → тип (когда rooms.js уже записал role в Firebase)
export function roleToZombieType(role) {
  if (role === 'zombie_tank')    return 'tank';
  if (role === 'zombie_support') return 'support';
  return 'attacker';
}
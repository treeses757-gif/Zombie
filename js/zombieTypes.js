// js/zombieTypes.js
// DAMAGE-FIX3: hitRadius для танка.
import { Player } from './player.js';

export class TankZombie extends Player {
  constructor(opts) {
    super({ ...opts, role: 'zombie_tank' });
    this.maxHp *= 2; this.hp = this.maxHp;
    this.speed *= 0.6; this.maxSpeed = this.speed;
    this.damage *= 0.7;
    this.hitRadius = 28;
    this.shield = true;
    this.style = { bodyColor: '#71717a', accentColor: '#52525b', eyeColor: '#fbbf24', shieldColor: '#52525b' };
    this.defaultUpgradeIds = ['tnk_main_01', 'tnk_sec_01', 'tnk_pas_01'];
    this._lastSyncedHp = Math.round(this.hp);
  }
  absorbDamage(ally, amount) {
    if (!this.shield || !this.alive || !ally.alive) return 0;
    const absorbed = amount * 0.6;
    this.takeDamage(absorbed * 0.5);
    return absorbed;
  }
}

export class AttackerZombie extends Player {
  constructor(opts) {
    super({ ...opts, role: 'zombie_attacker' });
    this.maxHp *= 0.7; this.hp = this.maxHp;
    this.speed *= 1.3; this.maxSpeed = this.speed;
    this.damage *= 1.5;
    this.attackSpeed = 1.5;
    this.hitRadius = 18;
    this.style = { bodyColor: '#4d7c0f', accentColor: '#dc2626', eyeColor: '#ff3030', clawColor: '#fbbf24' };
    this.defaultUpgradeIds = ['att_main_01', 'att_sec_01', 'att_pas_01'];
    this._lastSyncedHp = Math.round(this.hp);
  }
}

export class SupportZombie extends Player {
  constructor(opts) {
    super({ ...opts, role: 'zombie_support' });
    this.maxHp *= 0.8; this.hp = this.maxHp;
    this.damage *= 0.5;
    this.healCooldown = 0;
    this.hitRadius = 18;
    this.style = { bodyColor: '#7c3aed', accentColor: '#4ade80', eyeColor: '#22d3ee', crystalColor: '#4ade80' };
    this.defaultUpgradeIds = ['sup_main_01', 'sup_sec_01', 'sup_pas_01'];
    this._lastSyncedHp = Math.round(this.hp);
  }
  healAlly(ally, amount) {
    if (this.healCooldown > 0 || !ally.alive) return 0;
    const healed = ally.heal(amount);
    if (healed > 0) this.healCooldown = 3;
    return healed;
  }
}

export function createZombiesForPlayerCount(count) {
  if (count <= 2) return ['attacker'];
  if (count === 3) return ['attacker', 'support'];
  return ['attacker', 'tank', 'support'];
}

export function createZombie(type, opts) {
  switch (type) {
    case 'tank':    return new TankZombie(opts);
    case 'support': return new SupportZombie(opts);
    default:        return new AttackerZombie(opts);
  }
}

export function roleToZombieType(role) {
  if (role === 'zombie_tank')    return 'tank';
  if (role === 'zombie_support') return 'support';
  return 'attacker';
}
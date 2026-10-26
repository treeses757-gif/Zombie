import { db, ref, update, onValue } from './firebase.js';
import { Player } from './player.js';
import { createZombie, roleToZombieType, createZombiesForPlayerCount } from './zombieTypes.js';
import { setGameStatus } from './ui.js';
import { UpgradeManager } from './upgrades.js';

const CANVAS_W = 800;
const CANVAS_H = 600;
const SYNC_INTERVAL_MS = 50;   // 20 записей/сек
const ATTACK_COOLDOWN_MS = 800;
const ATTACK_RANGE = 34;
const SUPPORT_RANGE = 160;
const SUPPORT_HEAL = 22;
const TANK_SHIELD_RANGE = 100;

export class Game {
  constructor({ roomId, uid, room, onFinish }) {
    this.roomId = roomId;
    this.uid = uid;
    this.room = room;
    this.roomData = room;
    this.onFinish = onFinish || (() => {});

    this.canvas = null;
    this.ctx = null;
    this.players = new Map(); // uid -> Player
    this.myPlayer = null;
    this.keys = {};
    this.running = false;
    this.rafId = null;
    this.lastFrame = 0;
    this.lastSync = 0;
    this.unsubRoom = null;
    this._winnerReported = false;
  }

  start() {
    this.setupCanvas();
    this.setupInput();
    this.buildPlayers(this.room);
    this.subscribeRoom();
    this.running = true;
    this.lastFrame = performance.now();
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.unsubRoom) this.unsubRoom();
    window.removeEventListener('keydown', this._kd);
    window.removeEventListener('keyup', this._ku);
  }

  setupCanvas() {
    this.canvas = document.getElementById('game-canvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'game-canvas';
      document.getElementById('game-screen').appendChild(this.canvas);
    }
    this.canvas.width = CANVAS_W;
    this.canvas.height = CANVAS_H;
    this.ctx = this.canvas.getContext('2d');
  }

  setupInput() {
    this._kd = (e) => {
      const k = e.key.toLowerCase();
      // Стрелки не должны скроллить страницу во время игры
      if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) {
        e.preventDefault();
      }
      this.keys[k] = true;
    };
    this._ku = (e) => { this.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', this._kd);
    window.addEventListener('keyup', this._ku);
  }

  // Определение типа зомби для игрока
  determineZombieType(pid, room) {
    const data = room.players[pid] || {};
    if (data.zombieType) return data.zombieType;
    if (data.role && data.role.startsWith('zombie_')) {
      return roleToZombieType(data.role);
    }
    // Фолбэк: определяем по количеству игроков
    const totalCount = Object.keys(room.players || {}).length;
    const zombieIds = Object.keys(room.players || {})
      .filter(id => id !== room.survivorId);
    const types = createZombiesForPlayerCount(totalCount);
    const idx = zombieIds.indexOf(pid);
    return types[idx] || 'attacker';
  }

  buildPlayers(room) {
    const rPlayers = room.players || {};
    const survivorId = room.survivorId;
    const cx = CANVAS_W / 2;
    const cy = CANVAS_H / 2;
    let zombieIndex = 0;

    this.players.clear();

    for (const [pid, data] of Object.entries(rPlayers)) {
      const isSurvivor = pid === survivorId;

      // Начальные координаты
      let spawnX, spawnY;
      if (data.pos) {
        spawnX = data.pos.x;
        spawnY = data.pos.y;
      } else if (isSurvivor) {
        spawnX = cx;
        spawnY = cy;
      } else {
        const angle = (zombieIndex / 3) * Math.PI * 2;
        spawnX = cx + Math.cos(angle) * 250;
        spawnY = cy + Math.sin(angle) * 200;
        zombieIndex++;
      }

      const baseOpts = {
        id: pid,
        name: data.name || 'Игрок',
        x: spawnX,
        y: spawnY,
        canvasW: CANVAS_W,
        canvasH: CANVAS_H
      };

      let p;
      if (isSurvivor) {
        p = new Player({ ...baseOpts, role: 'survivor' });
        p.speed = 170;
        p.damage = 22;
      } else {
        const type = this.determineZombieType(pid, room);
        p = createZombie(type, baseOpts);
      }

      // Применяем сохранённое улучшение
      if (data.upgrade) {
        UpgradeManager.applyUpgrade(p, data.upgrade);
      }
      if (typeof data.hp === 'number') p.hp = data.hp;
      if (typeof data.alive === 'boolean') p.alive = data.alive;

      this.players.set(pid, p);
    }

    this.myPlayer = this.players.get(this.uid) || null;
  }

  subscribeRoom() {
    const roomRef = ref(db, `rooms/${this.roomId}`);
    this.unsubRoom = onValue(roomRef, (snap) => {
      const room = snap.val();
      if (!room) {
        this.stop();
        return;
      }
      this.roomData = room;

      if (room.state === 'finished') {
        this.checkWinCondition(); // финальный расчёт не нужен
        this.stop();
        return;
      }
      if (room.state !== 'playing') return;

      // Обновляем / добавляем / удаляем игроков
      const presentIds = new Set(Object.keys(room.players || {}));
      for (const [pid, data] of Object.entries(room.players || {})) {
        let p = this.players.get(pid);
        if (!p) {
          // На случай, если игрок появился позже (например, реконнект)
          const base = { id: pid, name: data.name, canvasW: CANVAS_W, canvasH: CANVAS_H };
          if (pid === room.survivorId) p = new Player({ ...base, role: 'survivor' });
          else {
            const t = this.determineZombieType(pid, room);
            p = createZombie(t, base);
          }
          if (data.upgrade) UpgradeManager.applyUpgrade(p, data.upgrade);
          this.players.set(pid, p);
        }
        // Позиции других игроков берём из Firebase
        if (data.pos && pid !== this.uid) {
          p.x = data.pos.x;
          p.y = data.pos.y;
        }
        if (typeof data.hp === 'number') p.hp = data.hp;
        if (typeof data.alive === 'boolean') p.alive = data.alive;
      }
      // Удаляем вышедших
      for (const pid of [...this.players.keys()]) {
        if (!presentIds.has(pid)) this.players.delete(pid);
      }

      this.checkWinCondition();
    });
  }

  checkWinCondition() {
    if (this._winnerReported) return;
    if (!this.roomData || this.roomData.state !== 'playing') return;

    const survivorId = this.roomData.survivorId;
    const survivorInRoom = this.roomData.players?.[survivorId];

    // Выживший вышел — победа зомби
    if (!survivorInRoom) {
      this._winnerReported = true;
      this.onFinish('zombies');
      return;
    }

    const survivor = this.players.get(survivorId);
    const zombies = [...this.players.values()].filter(p => p.id !== survivorId);

    let winner = null;
    if (survivor && !survivor.alive) winner = 'zombies';
    else if (zombies.length > 0 && zombies.every(z => !z.alive)) winner = 'survivor';

    if (winner) {
      this._winnerReported = true;
      this.onFinish(winner);
    }
  }

  loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;

    this.update(dt);
    this.render();

    if (this.roomData?.state === 'playing' && now - this.lastSync > SYNC_INTERVAL_MS) {
      this.syncMyState();
      this.lastSync = now;
    }

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (!this.myPlayer || !this.myPlayer.alive) return;
    if (this.roomData?.state !== 'playing') return;

    // Ввод движения
    let dx = 0, dy = 0;
    if (this.keys['w'] || this.keys['ц'] || this.keys['arrowup'])    dy -= 1;
    if (this.keys['s'] || this.keys['ы'] || this.keys['arrowdown'])  dy += 1;
    if (this.keys['a'] || this.keys['ф'] || this.keys['arrowleft'])  dx -= 1;
    if (this.keys['d'] || this.keys['в'] || this.keys['arrowright']) dx += 1;

    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      this.myPlayer.move(
        (dx / len) * this.myPlayer.speed * dt,
        (dy / len) * this.myPlayer.speed * dt
      );
    }

    this.handleCombat();
    this.handleSupportHeal(dt);
  }

  // ---- Боевая логика (клиент-авторитетная, по своей роли) ----
  handleCombat() {
    const me = this.myPlayer;
    if (!me || !me.alive) return;
    if (this.roomData?.state !== 'playing') return;

    const now = performance.now();
    if (now - (me._lastHit || 0) < ATTACK_COOLDOWN_MS) return;

    for (const other of this.players.values()) {
      if (other.id === me.id) continue;
      if (!other.alive) continue;

      const dist = Math.hypot(other.x - me.x, other.y - me.y);
      if (dist > ATTACK_RANGE) continue;

      // Выживший бьёт только зомби, зомби — только выжившего
      const isMeSurvivor = me.id === this.roomData.survivorId;
      const isOtherSurvivor = other.id === this.roomData.survivorId;
      if (isMeSurvivor === isOtherSurvivor) continue;

      me._lastHit = now;
      this.resolveDamage(me, other);
      return; // одна цель за тик
    }
  }

  resolveDamage(attacker, target) {
    const dmg = attacker.damage * 0.5;

    // Танк-зомби может защитить союзника-зомби
    if (target.id !== this.roomData.survivorId) {
      let tank = null;
      for (const p of this.players.values()) {
        if (p.id === target.id) continue;
        if (p.role !== 'zombie_tank' || !p.alive) continue;
        const d = Math.hypot(p.x - target.x, p.y - target.y);
        if (d < TANK_SHIELD_RANGE) { tank = p; break; }
      }
      if (tank) {
        const absorbed = dmg * 0.6;
        target.takeDamage(dmg * 0.4);
        tank.takeDamage(absorbed * 0.5);
        this.syncPlayer(target);
        this.syncPlayer(tank);
        return;
      }
    }

    target.takeDamage(dmg);
    this.syncPlayer(target);
  }

  // Помогающий зомби лечит ближайшего раненого союзника
  handleSupportHeal(dt) {
    const me = this.myPlayer;
    if (!me || me.role !== 'zombie_support' || !me.alive) return;

    me.healCooldown = Math.max(0, (me.healCooldown || 0) - dt);
    if (me.healCooldown > 0) return;

    let bestAlly = null;
    let bestDist = Infinity;
    for (const p of this.players.values()) {
      if (p.id === me.id) continue;
      if (!p.alive) continue;
      if (p.id === this.roomData.survivorId) continue;
      if (p.hp >= p.maxHp) continue;
      const d = Math.hypot(p.x - me.x, p.y - me.y);
      if (d < SUPPORT_RANGE && d < bestDist) {
        bestDist = d;
        bestAlly = p;
      }
    }
    if (bestAlly) {
      const healed = bestAlly.heal(SUPPORT_HEAL);
      if (healed > 0) {
        me.healCooldown = 3;
        this.syncPlayer(bestAlly);
      }
    }
  }

  // ---- Синхронизация с Firebase ----
  syncMyState() {
    if (!this.myPlayer) return;
    const myRef = ref(db, `rooms/${this.roomId}/players/${this.uid}`);
    update(myRef, {
      pos: { x: Math.round(this.myPlayer.x), y: Math.round(this.myPlayer.y) },
      hp: Math.round(this.myPlayer.hp),
      alive: this.myPlayer.alive
    }).catch(() => {});
  }

  syncPlayer(p) {
    const pRef = ref(db, `rooms/${this.roomId}/players/${p.id}`);
    update(pRef, {
      hp: Math.round(p.hp),
      alive: p.alive
    }).catch(() => {});
  }

  // ---- Рендер ----
  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    // Фон
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Сетка
    ctx.strokeStyle = '#1a1a26';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }

    // Игроки
    for (const p of this.players.values()) {
      if (!p.alive) continue;
      this.drawPlayer(ctx, p);
    }

    // HUD
    if (this.myPlayer) {
      const me = this.myPlayer;
      const roleLabel = me.role === 'survivor' ? 'Выживший' :
        me.role === 'zombie_tank' ? 'Танк' :
        me.role === 'zombie_attacker' ? 'Атакующий' :
        me.role === 'zombie_support' ? 'Помогающий' : me.role;
      const status = me.alive
        ? `${roleLabel} | HP: ${Math.round(me.hp)}/${Math.round(me.maxHp)} | WASD для движения`
        : `${roleLabel} | Вы мертвы`;
      setGameStatus(status);
    }
  }

  drawPlayer(ctx, p) {
    let color = '#888888';
    if (p.role === 'survivor')        color = '#4ade80';
    else if (p.role === 'zombie_attacker') color = '#ef4444';
    else if (p.role === 'zombie_tank')     color = '#3b82f6';
    else if (p.role === 'zombie_support')  color = '#a855f7';

    const isMe = p.id === this.uid;
    const r = 20;

    // Круг
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Обводка своей роли / "это я"
    if (isMe) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // HP-бар
    const hpPct = Math.max(0, p.hp / p.maxHp);
    const barW = 44;
    const barX = p.x - barW / 2;
    const barY = p.y - r - 12;
    ctx.fillStyle = '#000';
    ctx.fillRect(barX, barY, barW, 5);
    ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(barX, barY, barW * hpPct, 5);

    // Имя
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.name + (isMe ? ' (вы)' : ''), p.x, barY - 4);
  }
}
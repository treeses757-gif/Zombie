// Игровой цикл, синхронизация с Firebase и рендер через spriteSystem.
import { db, ref, update, onValue } from './firebase.js';
import { Player } from './player.js';
import {
  createZombie, roleToZombieType, createZombiesForPlayerCount
} from './zombieTypes.js';
import { setGameStatus } from './ui.js';
import { UpgradeManager } from './upgrades.js';
import { drawPlayer, drawBase } from './spriteSystem.js';

// Опциональный импорт каталога улучшений.
// Если файл недоступен — ловим ошибку и работаем без восстановления улучшений по id.
let getAllUpgrades = () => [];
try {
  const mod = await import('./upgrades/index.js');
  if (typeof mod.getAllUpgrades === 'function') {
    getAllUpgrades = mod.getAllUpgrades;
  }
} catch (_) {
  // нет каталога — не критично, работаем со старым форматом data.upgrade
}

const CANVAS_W = 800;
const CANVAS_H = 600;
const SYNC_INTERVAL_MS = 50;    // 20 записей/сек
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
    this.players = new Map();     // uid -> Player
    this.myPlayer = null;
    this.keys = {};
    this.running = false;
    this.rafId = null;
    this.lastFrame = 0;
    this.lastSync = 0;
    this.startTime = 0;           // для state.t в spriteSystem
    this.unsubRoom = null;
    this._winnerReported = false;

    // Кэш каталога улучшений по id
    this._upgradeIndex = null;
  }

  start() {
    this.setupCanvas();
    this.setupInput();
    this.buildPlayers(this.room);
    this.subscribeRoom();
    this.running = true;
    this.startTime = performance.now();
    this.lastFrame = this.startTime;
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
      const screen = document.getElementById('game-screen');
      if (screen) screen.appendChild(this.canvas);
    }
    this.canvas.width = CANVAS_W;
    this.canvas.height = CANVAS_H;
    this.ctx = this.canvas.getContext('2d');
  }

  setupInput() {
    this._kd = (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) {
        e.preventDefault();
      }
      this.keys[k] = true;
    };
    this._ku = (e) => { this.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', this._kd);
    window.addEventListener('keyup', this._ku);
  }

  // Кэш каталога по id — строится один раз
  _getUpgradeIndex() {
    if (this._upgradeIndex) return this._upgradeIndex;
    const idx = new Map();
    try {
      const all = getAllUpgrades() || [];
      for (const u of all) if (u && u.id) idx.set(u.id, u);
    } catch (_) { /* ignore */ }
    this._upgradeIndex = idx;
    return idx;
  }

  // Определение типа зомби для игрока
  determineZombieType(pid, room) {
    const data = room.players[pid] || {};
    if (data.zombieType) return data.zombieType;
    if (data.role && data.role.startsWith('zombie_')) {
      return roleToZombieType(data.role);
    }
    // Фолбэк: по числу игроков
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

      // Восстанавливаем выбранные улучшения (если есть)
      this._applyUpgradesFromData(p, data);

      // Старое числовое улучшение — оставляем для совместимости
      if (data.upgrade) {
        UpgradeManager.applyUpgrade(p, data.upgrade);
        p.upgrade = data.upgrade;
      }

      // Пересобрать визуальные слои (на случай, если upgrades добавились после конструктора)
      p.refreshVisualLayers();

      // Синхронизируем HP/alive, если есть в Firebase
      if (typeof data.hp    === 'number') p.hp = data.hp;
      if (typeof data.alive === 'boolean') p.alive = data.alive;
      p._prevX = p.x;
      p._prevY = p.y;

      this.players.set(pid, p);
    }

    this.myPlayer = this.players.get(this.uid) || null;
  }

  // Восстанавливает массив улучшений из data
  // Поддерживаемые форматы:
  //   data.upgrades — массив объектов полных улучшений (новый)
  //   data.upgradesIds — массив строк id (если game.js/pickRoles так пишет)
  //   data.upgradeIds  — альтернативное имя
  _applyUpgradesFromData(p, data) {
    const idx = this._getUpgradeIndex();
    const addFromObj = (u) => { if (u) p.addUpgrade(u); };
    const addFromId  = (id) => { const u = idx.get(id); if (u) p.addUpgrade(u); };

    if (Array.isArray(data.upgrades) && data.upgrades.length) {
      for (const u of data.upgrades) {
        if (typeof u === 'string') addFromId(u);
        else addFromObj(u);
      }
      return;
    }
    if (Array.isArray(data.upgradesIds)) {
      for (const id of data.upgradesIds) addFromId(id);
      return;
    }
    if (Array.isArray(data.upgradeIds)) {
      for (const id of data.upgradeIds) addFromId(id);
    }
  }

  subscribeRoom() {
    const roomRef = ref(db, `rooms/${this.roomId}`);
    this.unsubRoom = onValue(roomRef, (snap) => {
      const room = snap.val();
      if (!room) { this.stop(); return; }
      this.roomData = room;

      if (room.state === 'finished') {
        this.checkWinCondition();
        this.stop();
        return;
      }
      if (room.state !== 'playing') return;

      const presentIds = new Set(Object.keys(room.players || {}));
      for (const [pid, data] of Object.entries(room.players || {})) {
        let p = this.players.get(pid);
        if (!p) {
          const base = { id: pid, name: data.name, canvasW: CANVAS_W, canvasH: CANVAS_H };
          if (pid === room.survivorId) p = new Player({ ...base, role: 'survivor' });
          else {
            const t = this.determineZombieType(pid, room);
            p = createZombie(t, base);
          }
          this._applyUpgradesFromData(p, data);
          if (data.upgrade) UpgradeManager.applyUpgrade(p, data.upgrade);
          p.refreshVisualLayers();
          p._prevX = p.x = data.pos ? data.pos.x : CANVAS_W / 2;
          p._prevY = p.y = data.pos ? data.pos.y : CANVAS_H / 2;
          this.players.set(pid, p);
        }
        if (data.pos && pid !== this.uid) {
          p.x = data.pos.x;
          p.y = data.pos.y;
        }
        if (typeof data.hp    === 'number')  p.hp    = data.hp;
        if (typeof data.alive === 'boolean') p.alive = data.alive;
      }
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

    let dx = 0, dy = 0;
    if (this.keys['w'] || this.keys['ц'] || this.keys['arrowup'])    dy -= 1;
    if (this.keys['s'] || this.keys['ы'] || this.keys['arrowdown'])  dy += 1;
    if (this.keys['a'] || this.keys['ф'] || this.keys['arrowleft'])  dx -= 1;
    if (this.keys['d'] || this.keys['в'] || this.keys['arrowright']) dx += 1;

    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      this.myPlayer.angle = Math.atan2(dy, dx);
      this.myPlayer.move(
        (dx / len) * this.myPlayer.speed * dt,
        (dy / len) * this.myPlayer.speed * dt
      );
    }

    this.handleCombat();
    this.handleSupportHeal(dt);
  }

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

      const isMeSurvivor    = me.id === this.roomData.survivorId;
      const isOtherSurvivor = other.id === this.roomData.survivorId;
      if (isMeSurvivor === isOtherSurvivor) continue;

      me._lastHit = now;
      this.resolveDamage(me, other);
      return;
    }
  }

  resolveDamage(attacker, target) {
    const dmg = attacker.damage * 0.5;

    // Танк-зомби защищает союзника-зомби
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

    const now = performance.now();
    const tSeconds = (now - this.startTime) / 1000;

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

    // База (если есть)
    if (this.base) drawBase(ctx, this.base, now);

    // Игроки через spriteSystem
    for (const p of this.players.values()) {
      if (!p.alive) continue;

      const dx = Math.abs(p.x - (p._prevX ?? p.x));
      const dy = Math.abs(p.y - (p._prevY ?? p.y));
      const isMoving = (dx + dy) > 0.5;

      const state = {
        t: tSeconds,
        isLocal: p.id === this.uid,
        isAttacking: p._lastHit && (now - p._lastHit) < 150,
        isMoving
      };

      drawPlayer(ctx, p, now, state);

      p._prevX = p.x;
      p._prevY = p.y;
    }

    // HUD
    if (this.myPlayer) {
      const me = this.myPlayer;
      const roleLabel =
        me.role === 'survivor'        ? 'Выживший' :
        me.role === 'zombie_tank'     ? 'Танк' :
        me.role === 'zombie_attacker' ? 'Атакующий' :
        me.role === 'zombie_support'  ? 'Помогающий' : me.role;
      const status = me.alive
        ? `${roleLabel} | HP: ${Math.round(me.hp)}/${Math.round(me.maxHp)} | WASD для движения`
        : `${roleLabel} | Вы мертвы`;
      setGameStatus(status);
    }
  }
}
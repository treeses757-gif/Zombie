// FIX 1: стартовые upgrades и их применение
// FIX 3: ввод мыши/клавиатуры, атаки, урон через Firebase
// FIX 4: карта 4000×3000, тайлы, мини-карта
// FIX 5: база, её отрисовка и победа
// FIX 6: плавная камера, интерполяция удалённых игроков, throttle синка
import { db, ref, update, onValue, get } from './firebase.js';
import { Player } from './player.js';
import {
  createZombie, roleToZombieType, createZombiesForPlayerCount
} from './zombieTypes.js';
import { setGameStatus } from './ui.js';
import { drawPlayer, drawBase, getPartsForPlayer } from './spriteSystem.js';

// FIX 4: константы мира
const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 3000;
const TILE = 200;
const SYNC_INTERVAL_MS = 50;
const ATTACK_RANGE = 34;
const SUPPORT_RANGE = 160;
const SUPPORT_HEAL = 22;
const TANK_SHIELD_RANGE = 100;
const BASE_ATTACK_RANGE = 40;
const ROUND_DURATION_MS = 180000; // 3 минуты

// Каталог улучшений (опционально)
let getUpgradeById = (id) => null;
try {
  const mod = await import('./upgrades/index.js');
  if (typeof mod.getUpgradeById === 'function') getUpgradeById = mod.getUpgradeById;
  else if (typeof mod.getAllUpgrades === 'function') {
    const idx = new Map();
    for (const u of mod.getAllUpgrades() || []) if (u?.id) idx.set(u.id, u);
    getUpgradeById = (id) => idx.get(id) || null;
  }
} catch (_) { /* нет каталога — не критично */ }

// FIX 6: lerpAngle
function lerpAngle(a, b, t) {
  const d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return a + d * t;
}
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

export class Game {
  constructor({ roomId, uid, room, onFinish }) {
    this.roomId = roomId;
    this.uid = uid;
    this.room = room;
    this.roomData = room;
    this.onFinish = onFinish || (() => {});

    this.canvas = null; this.ctx = null;
    this.players = new Map();
    this.myPlayer = null;
    this.base = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, hp: 1000, maxHp: 1000, alive: true };

    // FIX 6: камера
    this.camera = { x: 0, y: 0 };

    // FIX 3: ввод
    this.input = {
      mouseX: 0, mouseY: 0, mouseWorldX: 0, mouseWorldY: 0,
      attackCooldown: 0, isMouseDown: false, isRightDown: false
    };
    this.keys = {};

    this.running = false;
    this.rafId = null;
    this.lastFrame = 0;
    this.lastSync = 0;
    this.startTime = 0;
    this.roundStartedAt = 0;
    this.unsubRoom = null;
    this.unsubBase = null;
    this._winnerReported = false;
    this._upgradeIndex = null;
  }

  start() {
    this.setupCanvas();
    this.setupInput();
    this.buildPlayers(this.room);
    this.subscribeRoom();
    this.subscribeBase();
    // FIX 5: создать базу в Firebase, если её нет
    this.ensureBaseInFirebase();
    this.running = true;
    this.startTime = performance.now();
    this.roundStartedAt = this.startTime;
    this.lastFrame = this.startTime;
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.unsubRoom) this.unsubRoom();
    if (this.unsubBase) this.unsubBase();
    window.removeEventListener('keydown', this._kd);
    window.removeEventListener('keyup', this._ku);
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this._md);
      this.canvas.removeEventListener('mouseup', this._mu);
      this.canvas.removeEventListener('mousemove', this._mm);
      this.canvas.removeEventListener('contextmenu', this._cm);
    }
  }

  setupCanvas() {
    this.canvas = document.getElementById('gameCanvas') || document.getElementById('game-canvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'gameCanvas';
      const scr = document.getElementById('game-screen');
      if (scr) scr.appendChild(this.canvas);
    }
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.canvas.tabIndex = 0; // FIX 3
    this.ctx = this.canvas.getContext('2d');
  }

  // FIX 3: обработка мыши и клавиатуры
  setupInput() {
    this._kd = (e) => {
      const k = e.key.toLowerCase();
      if (['w','a','s','d','ц','ф','ы','в','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
      this.keys[k] = true;
      if (k === ' ') this.tryAttack(false); // space = ЛКМ
    };
    this._ku = (e) => { this.keys[e.key.toLowerCase()] = false; };
    this._mm = (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.input.mouseX = e.clientX - r.left;
      this.input.mouseY = e.clientY - r.top;
      this.input.mouseWorldX = this.input.mouseX + this.camera.x;
      this.input.mouseWorldY = this.input.mouseY + this.camera.y;
    };
    this._md = (e) => {
      if (e.button === 0) { this.input.isMouseDown = true; this.tryAttack(false); }
      else if (e.button === 2) { this.input.isRightDown = true; this.tryAttack(true); e.preventDefault(); }
    };
    this._mu = (e) => {
      if (e.button === 0) this.input.isMouseDown = false;
      if (e.button === 2) this.input.isRightDown = false;
    };
    this._cm = (e) => e.preventDefault();
    window.addEventListener('keydown', this._kd);
    window.addEventListener('keyup', this._ku);
    this.canvas.addEventListener('mousemove', this._mm);
    this.canvas.addEventListener('mousedown', this._md);
    this.canvas.addEventListener('mouseup', this._mu);
    this.canvas.addEventListener('contextmenu', this._cm);
  }

  determineZombieType(pid, room) {
    const data = room.players[pid] || {};
    if (data.zombieType) return data.zombieType;
    if (data.role && data.role.startsWith('zombie_')) return roleToZombieType(data.role);
    const totalCount = Object.keys(room.players || {}).length;
    const zids = Object.keys(room.players || {}).filter(id => id !== room.survivorId);
    const types = createZombiesForPlayerCount(totalCount);
    return types[zids.indexOf(pid)] || 'attacker';
  }

  // FIX 1: стартовые upgrades применяются, если в Firebase их нет
  applyStartingUpgrades(p) {
    for (const id of p.defaultUpgradeIds || []) {
      const upg = getUpgradeById(id);
      if (upg) p.applyUpgrade(upg);
    }
    p.refreshVisualLayers();
  }

  applyUpgradesFromData(p, data) {
    let applied = 0;
    const add = (u) => { if (u) { p.applyUpgrade(u); applied++; } };
    const addById = (id) => { add(getUpgradeById(id)); };
    if (Array.isArray(data.upgrades) && data.upgrades.length) {
      for (const u of data.upgrades) {
        if (typeof u === 'string') addById(u);
        else add(u);
      }
    }
    if (Array.isArray(data.upgradeIds)) for (const id of data.upgradeIds) addById(id);
    if (data.upgrade) { add({ effects: data.upgrade, visual: null }); applied++; }
    return applied;
  }

  buildPlayers(room) {
    const rPlayers = room.players || {};
    const survivorId = room.survivorId;
    // FIX 4: спавн по углам мира
    const corners = [
      { x: 400, y: 400 },
      { x: WORLD_WIDTH - 400, y: 400 },
      { x: 400, y: WORLD_HEIGHT - 400 },
      { x: WORLD_WIDTH - 400, y: WORLD_HEIGHT - 400 }
    ];
    let ci = 0;
    this.players.clear();

    for (const [pid, data] of Object.entries(rPlayers)) {
      const isSurvivor = pid === survivorId;
      let sx, sy;
      if (data.pos) { sx = data.pos.x; sy = data.pos.y; }
      else if (isSurvivor) { sx = WORLD_WIDTH / 2; sy = WORLD_HEIGHT / 2 + 200; }
      else { const c = corners[ci++ % 4]; sx = c.x; sy = c.y; }

      const opts = {
        id: pid, name: data.name || 'Игрок',
        x: sx, y: sy, canvasW: WORLD_WIDTH, canvasH: WORLD_HEIGHT
      };
      let p;
      if (isSurvivor) {
        p = new Player({ ...opts, role: 'survivor' });
        p.speed = 170; p.maxSpeed = 170; p.damage = 22; p.attackSpeed = 2.0;
        p.defaultUpgradeIds = ['surv_main_01', 'surv_pas_01'];
      } else {
        const t = this.determineZombieType(pid, room);
        p = createZombie(t, opts);
      }

      // FIX 1: применить сохранённые или стартовые улучшения
      const applied = this.applyUpgradesFromData(p, data);
      if (applied === 0) this.applyStartingUpgrades(p);

      if (typeof data.hp === 'number') p.hp = data.hp;
      if (typeof data.alive === 'boolean') p.alive = data.alive;
      p._prevX = p.x; p._prevY = p.y;
      p.refreshVisualLayers();
      this.players.set(pid, p);
    }
    this.myPlayer = this.players.get(this.uid) || null;
  }

  // FIX 5: гарантировать базу в Firebase
  async ensureBaseInFirebase() {
    const baseRef = ref(db, `rooms/${this.roomId}/base`);
    const snap = await get(baseRef);
    if (!snap.exists()) {
      await update(ref(db, `rooms/${this.roomId}`), {
        base: {
          x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2,
          hp: 1000, maxHp: 1000, alive: true
        }
      });
    }
  }

  subscribeBase() {
    this.unsubBase = onValue(ref(db, `rooms/${this.roomId}/base`), (snap) => {
      const b = snap.val();
      if (b) this.base = b;
    });
  }

  subscribeRoom() {
    this.unsubRoom = onValue(ref(db, `rooms/${this.roomId}`), (snap) => {
      const room = snap.val();
      if (!room) { this.stop(); return; }
      this.roomData = room;
      if (room.state === 'finished') { this.checkWinCondition(); this.stop(); return; }
      if (room.state !== 'playing') return;

      // FIX 6: интерполяция удалённых игроков
      for (const [pid, data] of Object.entries(room.players || {})) {
        let p = this.players.get(pid);
        if (!p) {
          const base = { id: pid, name: data.name, canvasW: WORLD_WIDTH, canvasH: WORLD_HEIGHT };
          if (pid === room.survivorId) p = new Player({ ...base, role: 'survivor' });
          else p = createZombie(this.determineZombieType(pid, room), base);
          const a = this.applyUpgradesFromData(p, data);
          if (a === 0) this.applyStartingUpgrades(p);
          p.refreshVisualLayers();
          this.players.set(pid, p);
        }
        if (pid !== this.uid && data.pos) {
          p.targetX = data.pos.x;
          p.targetY = data.pos.y;
          p.targetAngle = data.pos.angle;
        }
        if (typeof data.hp === 'number') p.hp = data.hp;
        if (typeof data.alive === 'boolean') p.alive = data.alive;
      }
      const present = new Set(Object.keys(room.players || {}));
      for (const pid of [...this.players.keys()]) if (!present.has(pid)) this.players.delete(pid);

      this.checkWinCondition();
    });
  }

  // FIX 5: победа по базе и таймеру
  checkWinCondition() {
    if (this._winnerReported) return;
    if (!this.roomData || this.roomData.state !== 'playing') return;
    const survivorId = this.roomData.survivorId;
    const survivorInRoom = this.roomData.players?.[survivorId];
    const survivor = this.players.get(survivorId);
    const zombies = [...this.players.values()].filter(p => p.id !== survivorId);

    let winner = null;
    if (!survivorInRoom) winner = 'zombies';
    else if (this.base && this.base.hp <= 0) winner = 'zombies';
    else if (survivor && !survivor.alive) winner = 'zombies';
    else if (zombies.length > 0 && zombies.every(z => !z.alive)) winner = 'survivor';
    else if (this.roundStartedAt > 0 && performance.now() - this.roundStartedAt >= ROUND_DURATION_MS) {
      winner = 'survivor';
    }

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
    const now = performance.now();

    // FIX 6: плавная камера
    if (this.myPlayer) {
      const tx = this.myPlayer.x - this.canvas.width / 2;
      const ty = this.myPlayer.y - this.canvas.height / 2;
      this.camera.x += (tx - this.camera.x) * 0.15;
      this.camera.y += (ty - this.camera.y) * 0.15;
      this.camera.x = clamp(this.camera.x, 0, WORLD_WIDTH - this.canvas.width);
      this.camera.y = clamp(this.camera.y, 0, WORLD_HEIGHT - this.canvas.height);
    }

    // FIX 3: обновить mouseWorld после движения камеры
    this.input.mouseWorldX = this.input.mouseX + this.camera.x;
    this.input.mouseWorldY = this.input.mouseY + this.camera.y;

    // FIX 6: локальный игрок — физика
    if (this.myPlayer && this.myPlayer.alive && this.roomData?.state === 'playing') {
      let ix = 0, iy = 0;
      if (this.keys['w'] || this.keys['ц'] || this.keys['arrowup'])    iy -= 1;
      if (this.keys['s'] || this.keys['ы'] || this.keys['arrowdown'])  iy += 1;
      if (this.keys['a'] || this.keys['ф'] || this.keys['arrowleft'])  ix -= 1;
      if (this.keys['d'] || this.keys['в'] || this.keys['arrowright']) ix += 1;
      this.myPlayer.updateMovement(dt, ix, iy);
      this.myPlayer.x = clamp(this.myPlayer.x, 0, WORLD_WIDTH);
      this.myPlayer.y = clamp(this.myPlayer.y, 0, WORLD_HEIGHT);

      // FIX 2: walkPhase
      const sp = Math.hypot(this.myPlayer.vx, this.myPlayer.vy);
      if (sp > 5) this.myPlayer.anim.walkPhase += sp * dt * 0.1;
      else this.myPlayer.anim.walkPhase *= 0.9;
    }

    // FIX 2: таймеры анимации у всех
    for (const p of this.players.values()) {
      p.anim.attackTimer = Math.max(0, p.anim.attackTimer - dt * 1000);
      p.anim.hurtTimer   = Math.max(0, p.anim.hurtTimer   - dt * 1000);
      p.anim.deathTimer  = Math.max(0, p.anim.deathTimer  - dt * 1000);
    }

    // FIX 6: интерполяция удалённых
    for (const [pid, p] of this.players) {
      if (pid === this.uid) continue;
      if (typeof p.targetX === 'number') {
        p.x += (p.targetX - p.x) * 0.2;
        p.y += (p.targetY - p.y) * 0.2;
        if (typeof p.targetAngle === 'number') p.angle = lerpAngle(p.angle, p.targetAngle, 0.2);
        const d = Math.hypot(p.targetX - p.x, p.targetY - p.y);
        if (d > 3) p.anim.walkPhase += 0.3;
        else p.anim.walkPhase *= 0.9;
      }
    }

    // FIX 3: кулдаун атаки
    this.input.attackCooldown = Math.max(0, this.input.attackCooldown - dt * 1000);

    // FIX 5: автоатака базы зомби
    for (const p of this.players.values()) {
      if (p.id === this.roomData?.survivorId) continue;
      if (!p.alive) continue;
      const dBase = Math.hypot(p.x - this.base.x, p.y - this.base.y);
      if (dBase < BASE_ATTACK_RANGE) {
        if ((p._lastBaseHit || 0) + 1000 / (p.attackSpeed || 1) < now) {
          p._lastBaseHit = now;
          p.triggerAttack();
          this.damageBase(p.damage * 0.4);
        }
      } else if (p === this.myPlayer && !this.myPlayer.targetPlayer) {
        // Локальный зомби движется к базе, если не атакует игрока
        // (управление движением — через WASD, здесь только подсказка)
      }
    }

    this.checkWinCondition();
  }

  // FIX 3: попытка атаки
  tryAttack(isSecondary) {
    const me = this.myPlayer;
    if (!me || !me.alive || this.roomData?.state !== 'playing') return;
    if (this.input.attackCooldown > 0) return;

    // Направление на мышь
    const dx = this.input.mouseWorldX - me.x;
    const dy = this.input.mouseWorldY - me.y;
    const ang = Math.atan2(dy, dx);
    me.angle = ang;
    me.triggerAttack();

    const speed = me.attackSpeed || 1;
    this.input.attackCooldown = 1000 / speed;

    // FIX 3: hit-scan по ролям
    if (me.role === 'survivor') {
      this.hitscanRay(me, ang, 600, 20);
    } else if (me.role === 'zombie_attacker') {
      this.hitscanCone(me, ang, 40, Math.PI / 3, 1.0);
    } else if (me.role === 'zombie_tank') {
      this.hitscanCone(me, ang, 50, Math.PI / 2, 1.0);
    } else if (me.role === 'zombie_support') {
      // Лечим союзника под курсором или слабый удар по врагу
      let healed = false;
      for (const p of this.players.values()) {
        if (p.id === me.id || p.id === this.roomData.survivorId || !p.alive) continue;
        if (Math.hypot(p.x - this.input.mouseWorldX, p.y - this.input.mouseWorldY) < 40) {
          p.heal(SUPPORT_HEAL);
          this.syncPlayer(p);
          healed = true;
          break;
        }
      }
      if (!healed) this.hitscanCone(me, ang, 40, Math.PI / 3, 0.5);
    }
  }

  hitscanRay(me, ang, length, hitRadius) {
    const dx = Math.cos(ang), dy = Math.sin(ang);
    for (const t of this.players.values()) {
      if (t.id === me.id || !t.alive) continue;
      const isTargetEnemy = (me.id === this.roomData.survivorId) !== (t.id === this.roomData.survivorId);
      if (!isTargetEnemy) continue;
      // Проекция на луч
      const px = t.x - me.x, py = t.y - me.y;
      const proj = px * dx + py * dy;
      if (proj < 0 || proj > length) continue;
      const perp = Math.abs(px * dy - py * dx);
      if (perp > hitRadius) continue;
      t.takeDamage(me.damage);
      this.syncPlayer(t);
      return;
    }
  }

  hitscanCone(me, ang, radius, halfAngle, mult = 1.0) {
    for (const t of this.players.values()) {
      if (t.id === me.id || !t.alive) continue;
      const isTargetEnemy = (me.id === this.roomData.survivorId) !== (t.id === this.roomData.survivorId);
      if (!isTargetEnemy) continue;
      const dx = t.x - me.x, dy = t.y - me.y;
      const dist = Math.hypot(dx, dy);
      if (dist > radius + 20) continue;
      const a = Math.atan2(dy, dx);
      let diff = ((a - ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      if (Math.abs(diff) > halfAngle) continue;
      t.takeDamage(me.damage * mult);
      this.syncPlayer(t);
      return;
    }
  }

  damageBase(amount) {
    const newHp = Math.max(0, (this.base.hp || 1000) - amount);
    update(ref(db, `rooms/${this.roomId}/base`), {
      hp: Math.round(newHp),
      alive: newHp > 0
    }).catch(() => {});
  }

  syncMyState() {
    if (!this.myPlayer) return;
    update(ref(db, `rooms/${this.roomId}/players/${this.uid}`), {
      pos: {
        x: Math.round(this.myPlayer.x),
        y: Math.round(this.myPlayer.y),
        angle: this.myPlayer.angle
      },
      hp: Math.round(this.myPlayer.hp),
      alive: this.myPlayer.alive
    }).catch(() => {});
  }

  syncPlayer(p) {
    update(ref(db, `rooms/${this.roomId}/players/${p.id}`), {
      hp: Math.round(p.hp), alive: p.alive
    }).catch(() => {});
  }

  // FIX 4: рендер видимых тайлов
  renderTiles() {
    const ctx = this.ctx;
    const cx0 = Math.floor(this.camera.x / TILE);
    const cy0 = Math.floor(this.camera.y / TILE);
    const cx1 = Math.floor((this.camera.x + this.canvas.width) / TILE);
    const cy1 = Math.floor((this.camera.y + this.canvas.height) / TILE);
    for (let ty = cy0; ty <= cy1; ty++) {
      for (let tx = cx0; tx <= cx1; tx++) {
        const wx = tx * TILE, wy = ty * TILE;
        const n = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
        const shade = (n % 3);
        ctx.fillStyle = shade === 0 ? '#1a2f1a' : shade === 1 ? '#1f291f' : '#162016';
        ctx.fillRect(wx, wy, TILE, TILE);
        // Трещины
        if (n % 7 === 0) {
          ctx.strokeStyle = '#0f1a0f'; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(wx + 30, wy + 40);
          ctx.lineTo(wx + 90, wy + 80);
          ctx.lineTo(wx + 140, wy + 60);
          ctx.stroke();
        }
        // Травинки
        if (n % 5 === 0) {
          ctx.fillStyle = '#2d4a2d';
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(wx + (i * 37 + n) % TILE, wy + (i * 53 + n) % TILE, 3, 6);
          }
        }
      }
    }
  }

  // FIX 4: мини-карта
  renderMinimap() {
    const ctx = this.ctx;
    const mw = 200, mh = 150, mx = 10, my = 10;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, mw, mh);
    const sx = mw / WORLD_WIDTH, sy = mh / WORLD_HEIGHT;
    // База
    if (this.base) {
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(mx + this.base.x * sx - 3, my + this.base.y * sy - 3, 6, 6);
    }
    // Игроки
    for (const p of this.players.values()) {
      if (!p.alive) continue;
      let col = '#ef4444';
      if (p.id === this.roomData?.survivorId) col = '#22c55e';
      if (p.id === this.uid) col = '#facc15';
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(mx + p.x * sx, my + p.y * sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = performance.now();
    const tSec = (now - this.startTime) / 1000;

    // Фон
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // FIX 6: трансформ камеры
    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);

    // FIX 4: тайлы
    this.renderTiles();

    // FIX 5: база ДО игроков
    if (this.base) drawBase(ctx, this.base, now);

    // Игроки
    for (const p of this.players.values()) {
      if (p.alive || p.anim.deathTimer > 0) {
        const state = {
          t: tSec,
          isLocal: p.id === this.uid,
          isAttacking: p.anim.attackTimer > 0,
          isMoving: (() => {
            if (p.id === this.uid) return Math.hypot(p.vx || 0, p.vy || 0) > 5;
            return Math.hypot((p.targetX || 0) - p.x, (p.targetY || 0) - p.y) > 2;
          })()
        };
        drawPlayer(ctx, p, now, state);
      }
    }
    ctx.restore();

    // FIX 4: мини-карта
    this.renderMinimap();

    // HUD
    if (this.myPlayer) {
      const me = this.myPlayer;
      const roleLabel = me.role === 'survivor' ? 'Выживший' :
        me.role === 'zombie_tank' ? 'Танк' :
        me.role === 'zombie_attacker' ? 'Атакующий' :
        me.role === 'zombie_support' ? 'Помогающий' : me.role;
      const baseHp = Math.round(this.base?.hp ?? 1000);
      setGameStatus(
        `${roleLabel} | HP: ${Math.round(me.hp)}/${Math.round(me.maxHp)} | База: ${baseHp} | ЛКМ/ПКМ/space — атака`
      );
    }
  }
}
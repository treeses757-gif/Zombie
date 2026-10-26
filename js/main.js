// js/main.js
import { ensureAuth, db, ref, update, get, onValue } from './firebase.js';
import {
  createRoom, joinRoom, listenRoom, pickRoles, startGame, MAX_PLAYERS, MIN_PLAYERS
} from './rooms.js';
import {
  showScreen, updateLobby, updateLobbyStatus, enableStartButton, setRoomIdDisplay,
  showUpgradeScreen, showUpgradeMessage, setUpgradeProgress, showEndScreen
} from './ui.js';
import { UpgradeManager } from './upgrades.js';
import { Game } from './game.js';

let getAllUpgrades = () => [];
let getUpgradeById = () => null;
try {
  const mod = await import('./upgrades/index.js');
  if (typeof mod.getAllUpgrades === 'function') getAllUpgrades = mod.getAllUpgrades;
  if (typeof mod.getUpgradeById === 'function') getUpgradeById = mod.getUpgradeById;
  else if (typeof mod.getAllUpgrades === 'function') {
    const idx = new Map();
    for (const u of mod.getAllUpgrades() || []) if (u?.id) idx.set(u.id, u);
    getUpgradeById = (id) => idx.get(id) || null;
  }
} catch (e) { console.warn('[main] Каталог улучшений недоступен:', e); }

let currentUid = null;
let currentRoomId = null;
let unlistenRoom = null;
let gameInstance = null;
let startingGame = false;

function getDefaultUpgradeIds(role) {
  switch (role) {
    case 'survivor':        return ['surv_main_01', 'surv_pas_01'];
    case 'zombie_attacker': return ['att_main_01', 'att_sec_01', 'att_pas_01'];
    case 'zombie_tank':     return ['tnk_main_01', 'tnk_sec_01', 'tnk_pas_01'];
    case 'zombie_support':  return ['sup_main_01', 'sup_sec_01', 'sup_pas_01'];
    default:                return [];
  }
}

async function init() {
  try {
    const user = await ensureAuth();
    currentUid = user.uid;
    showScreen('menu-screen');
    bindMenu();
  } catch (e) {
    alert('Ошибка авторизации: ' + (e?.message || e));
  }
}

function bindMenu() {
  const createBtn = document.getElementById('create-room-btn');
  const joinBtn   = document.getElementById('join-room-btn');
  const nameInput = document.getElementById('player-name');
  const joinInput = document.getElementById('join-room-id');

  createBtn.addEventListener('click', async () => {
    const name = ((nameInput?.value || '').trim().slice(0, 16)) || 'Игрок';
    createBtn.disabled = true;
    try {
      const res = await createRoom(name);
      await enterRoom(res.roomId);
    } catch (e) {
      alert('Не удалось создать комнату: ' + (e?.message || e));
    } finally { createBtn.disabled = false; }
  });

  joinBtn.addEventListener('click', async () => {
    const name = ((nameInput?.value || '').trim().slice(0, 16)) || 'Игрок';
    const roomId = (joinInput?.value || '').trim().toUpperCase();
    if (!roomId) return alert('Введите ID комнаты');
    joinBtn.disabled = true;
    try {
      await joinRoom(roomId, name);
      await enterRoom(roomId);
    } catch (e) {
      alert('Не удалось присоединиться: ' + (e?.message || e));
    } finally { joinBtn.disabled = false; }
  });
}

async function enterRoom(roomId) {
  currentRoomId = roomId;
  setRoomIdDisplay(roomId);
  showScreen('lobby-screen');
  bindStartButton();
  if (unlistenRoom) unlistenRoom();
  unlistenRoom = listenRoom(roomId, (room) => handleRoomUpdate(room, roomId));
}

function bindStartButton() {
  const btn = document.getElementById('start-btn');
  if (!btn) return;
  const clone = btn.cloneNode(true);
  clone.disabled = true;
  btn.parentNode.replaceChild(clone, btn);
  clone.addEventListener('click', async () => {
    if (!currentRoomId) return;
    clone.disabled = true;
    try {
      await pickRoles(currentRoomId);
      await update(ref(db, `rooms/${currentRoomId}`), { state: 'upgrade' });
    } catch (e) {
      alert('Ошибка старта: ' + (e?.message || e));
      clone.disabled = false;
    }
  });
}

async function handleRoomUpdate(room, roomId) {
  if (!room) return;
  room.id = roomId;
  const state = room.state || 'lobby';
  const isHost = room.host === currentUid;
  const players = room.players || {};
  const playersCount = Object.keys(players).length;
  const me = players[currentUid];

  if (state === 'lobby') {
    if (gameInstance) { gameInstance.stop(); gameInstance = null; }
    if (window.__currentScreen !== 'lobby-screen') showScreen('lobby-screen');
    updateLobby(room, currentUid);
    const canStart = isHost && playersCount >= MIN_PLAYERS && playersCount <= MAX_PLAYERS;
    enableStartButton(canStart);
    updateLobbyStatus(
      playersCount < MIN_PLAYERS
        ? `Ожидание игроков (${playersCount}/${MIN_PLAYERS} минимум)...`
        : isHost ? 'Нажмите «Старт», когда все готовы' : 'Ожидание хоста...'
    );
    return;
  }

  if (state === 'upgrade') {
    const allReady = playersCount > 0 && Object.values(players).every(p => p.upgradeSubmitted);

    if (window.__currentScreen !== 'upgrade-screen') {
      const myRole = me?.role;
      const defaultIds = getDefaultUpgradeIds(myRole);
      const defaultObjs = defaultIds.map(id => getUpgradeById(id)).filter(Boolean);
      showUpgradeScreen(myRole, defaultObjs, async () => {
        await handleUpgradeSubmit(myRole, defaultIds);
      });
    }

    const readyCount = Object.values(players).filter(p => p.upgradeSubmitted).length;
    setUpgradeProgress(`Готовы: ${readyCount}/${playersCount}`);

    if (me?.upgradeSubmitted) {
      const btn = document.getElementById('upgrade-submit');
      if (btn) btn.disabled = true;
      showUpgradeMessage('Улучшения приняты. Ждём остальных...');
    }

    if (allReady && isHost && !startingGame) {
      startingGame = true;
      try {
        await startGame(roomId);
        const snap = await get(ref(db, `rooms/${roomId}/state`));
        if (snap.val() !== 'playing') {
          await update(ref(db, `rooms/${roomId}`), { state: 'playing' });
        }
      } catch (e) {
        console.error('[main] startGame error:', e);
        try { await update(ref(db, `rooms/${roomId}`), { state: 'playing' }); } catch (_) {}
      } finally { startingGame = false; }
    }
    return;
  }

  if (state === 'playing') {
    if (!gameInstance) startPlaying(room, roomId);
    return;
  }

  if (state === 'finished') {
    if (gameInstance) { gameInstance.stop(); gameInstance = null; }
    showEndScreen(room.winner);
    return;
  }
}

async function handleUpgradeSubmit(role, defaultIds) {
  if (!currentRoomId || !currentUid) return;
  try {
    await update(ref(db, `rooms/${currentRoomId}/players/${currentUid}`), {
      upgradeIds: defaultIds,
      upgradeSubmitted: true
    });
    showUpgradeMessage('Улучшения приняты!', false);
  } catch (e) {
    showUpgradeMessage('Ошибка сохранения: ' + (e?.message || e), true);
  }
}

// FIX A3: сначала показать экран, потом стартовать игру
function startPlaying(room, roomId) {
  showScreen('game-screen');
  requestAnimationFrame(() => {
    gameInstance = new Game({
      roomId, uid: currentUid, room,
      onFinish: (winner) => {
        if (room.host === currentUid) {
          update(ref(db, `rooms/${roomId}`), { state: 'finished', winner }).catch(() => {});
        }
      }
    });
    gameInstance.start();
  });
}

init();
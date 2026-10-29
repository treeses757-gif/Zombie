// js/main.js
// AUTH-FIX: перед createRoom/joinRoom проверяем auth.currentUser,
// если null — повторно логинимся (Chrome/приватное окно сбрасывает сессию).
import { ensureAuth, auth, db, ref, update, get } from './firebase.js';
import {
  createRoom, joinRoom, listenRoom, pickRoles, startGame, MAX_PLAYERS, MIN_PLAYERS
} from './rooms.js';
import {
  showScreen, updateLobby, updateLobbyStatus, enableStartButton, setRoomIdDisplay,
  showUpgradeScreen, showUpgradeMessage, setUpgradeProgress, showEndScreen
} from './ui.js?v=2';
import { Game } from './game.js?v=2';

let getAllUpgrades = () => [];
let getUpgradeById = () => null;
let generateUpgradeChoices = null;
try {
  const mod = await import('./upgrades/index.js');
  if (typeof mod.getAllUpgrades === 'function') getAllUpgrades = mod.getAllUpgrades;
  if (typeof mod.getUpgradeById === 'function') getUpgradeById = mod.getUpgradeById;
  if (typeof mod.generateUpgradeChoices === 'function') generateUpgradeChoices = mod.generateUpgradeChoices;
} catch (e) { console.warn('[main] upgrades недоступны:', e); }

let currentUid = null;
let currentRoomId = null;
let unlistenRoom = null;
let gameInstance = null;
let startingGame = false;

// AUTH-FIX: гарантирует, что auth.currentUser установлен ДО вызова rooms.js
async function ensureAuthReady() {
  if (auth.currentUser?.uid) {
    currentUid = auth.currentUser.uid;
    return currentUid;
  }
  console.log('[auth] currentUser null, повторный ensureAuth...');
  const user = await ensureAuth();
  // Дать Firebase Auth микротакт на установку currentUser
  await new Promise(r => setTimeout(r, 50));
  currentUid = auth.currentUser?.uid || user.uid;
  console.log('[auth] после ensureAuth currentUid=', currentUid, 'auth.currentUser=', auth.currentUser?.uid);
  return currentUid;
}

async function init() {
  try {
    const user = await ensureAuth();
    currentUid = user.uid;
    console.log('[auth] init OK, uid=', currentUid);
    showScreen('menu-screen');
    bindMenu();
  } catch (e) {
    console.error('[auth] init error:', e);
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
      await ensureAuthReady();          // AUTH-FIX
      const res = await createRoom(name);
      await enterRoom(res.roomId);
    } catch (e) {
      console.error('[createRoom] error:', e);
      // AUTH-FIX: одноразовый retry при потере сессии
      if (String(e?.message || '').includes('Нет авторизации')) {
        try {
          await ensureAuthReady();
          const res = await createRoom(name);
          await enterRoom(res.roomId);
          return;
        } catch (e2) {
          console.error('[createRoom] retry failed:', e2);
          alert('Не удалось создать комнату: ' + (e2?.message || e2));
          return;
        }
      }
      alert('Не удалось создать комнату: ' + (e?.message || e));
    } finally { createBtn.disabled = false; }
  });

  joinBtn.addEventListener('click', async () => {
    const name = ((nameInput?.value || '').trim().slice(0, 16)) || 'Игрок';
    const roomId = (joinInput?.value || '').trim().toUpperCase();
    if (!roomId) return alert('Введите ID комнаты');
    joinBtn.disabled = true;
    try {
      await ensureAuthReady();          // AUTH-FIX
      await joinRoom(roomId, name);
      await enterRoom(roomId);
    } catch (e) {
      console.error('[joinRoom] error:', e);
      // AUTH-FIX: одноразовый retry при потере сессии
      if (String(e?.message || '').includes('Нет авторизации')) {
        try {
          await ensureAuthReady();
          await joinRoom(roomId, name);
          await enterRoom(roomId);
          return;
        } catch (e2) {
          console.error('[joinRoom] retry failed:', e2);
          alert('Не удалось присоединиться: ' + (e2?.message || e2));
          return;
        }
      }
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

async function startUpgradePhase(roomId) {
  const snap = await get(ref(db, `rooms/${roomId}/players`));
  const players = snap.val() || {};
  const updates = {};
  for (const [pid, p] of Object.entries(players)) {
    const role = p.role || 'survivor';
    const existingIds = Array.isArray(p.upgradeIds) ? p.upgradeIds : [];
    let choices;
    if (generateUpgradeChoices) {
      choices = generateUpgradeChoices(role, existingIds, 2);
    } else {
      choices = { main: [], secondary: [], passive: [] };
    }
    updates[`players/${pid}/upgradeChoices`] = choices;
    updates[`players/${pid}/upgradeSubmitted`] = false;
  }
  updates.state = 'upgrade';
  await update(ref(db, `rooms/${roomId}`), updates);
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
      await startUpgradePhase(currentRoomId);
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

    if (window.__currentScreen !== 'upgrade-screen' && me?.upgradeChoices) {
      const role = me.role;
      const choices = {};
      for (const [slot, ids] of Object.entries(me.upgradeChoices)) {
        choices[slot] = (ids || []).map(id => getUpgradeById(id)).filter(Boolean);
      }
      showUpgradeScreen(role, choices, async (selectedIds) => {
        await handleUpgradeConfirm(selectedIds);
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
        const s = await get(ref(db, `rooms/${roomId}/state`));
        if (s.val() !== 'playing') {
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

async function handleUpgradeConfirm(selectedIds) {
  if (!currentRoomId || !currentUid) return;
  try {
    const snap = await get(ref(db, `rooms/${currentRoomId}/players/${currentUid}`));
    const existing = snap.val()?.upgradeIds || [];
    const merged = [...new Set([...existing, ...selectedIds])];
    await update(ref(db, `rooms/${currentRoomId}/players/${currentUid}`), {
      upgradeIds: merged,
      upgradeSubmitted: true
    });
    showUpgradeMessage('Улучшения приняты!', false);
  } catch (e) {
    showUpgradeMessage('Ошибка сохранения: ' + (e?.message || e), true);
  }
}

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

// AUTH-FIX: глобальный лог необработанных промисов, чтобы видеть точное место
window.addEventListener('unhandledrejection', (ev) => {
  console.error('[unhandledrejection]', ev.reason);
});

init();

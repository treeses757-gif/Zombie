import { ensureAuth, db, ref, update, get, onValue } from './firebase.js';
import {
  showScreen, updateLobby, updateLobbyStatus, enableStartButton,
  setRoomIdDisplay, showUpgradeScreen, showUpgradeMessage,
  setUpgradeRole, setUpgradeProgress, showEndScreen
} from './ui.js';
import {
  createRoom, joinRoom, listenRoom,
  pickRoles, startGame, MAX_PLAYERS, MIN_PLAYERS
} from './rooms.js';
import { UpgradeManager } from './upgrades.js';
import { Game } from './game.js';

let currentRoomId = null;
let currentUid = null;
let unlistenRoom = null;
let gameInstance = null;
let upgradeHandlerAttached = false;

async function init() {
  try {
    const user = await ensureAuth();
    currentUid = user.uid;
    showScreen('menu-screen');
    bindMenu();
  } catch (e) {
    alert('Ошибка авторизации: ' + e.message);
  }
}

function bindMenu() {
  const createBtn = document.getElementById('create-room-btn');
  const joinBtn = document.getElementById('join-room-btn');
  const nameInput = document.getElementById('player-name');
  const joinInput = document.getElementById('join-room-id');

  createBtn.addEventListener('click', async () => {
    const name = (nameInput.value || 'Игрок').trim().slice(0, 16) || 'Игрок';
    try {
      const res = await createRoom(name);
      await enterRoom(res.roomId);
    } catch (e) {
      alert('Не удалось создать комнату: ' + e.message);
    }
  });

  joinBtn.addEventListener('click', async () => {
    const name = (nameInput.value || 'Игрок').trim().slice(0, 16) || 'Игрок';
    const roomId = (joinInput.value || '').trim().toUpperCase();
    if (!roomId) return alert('Введите ID комнаты');
    try {
      await joinRoom(roomId, name);
      await enterRoom(roomId);
    } catch (e) {
      alert('Не удалось присоединиться: ' + e.message);
    }
  });
}

async function enterRoom(roomId) {
  currentRoomId = roomId;
  setRoomIdDisplay(roomId);
  showScreen('lobby-screen');
  bindStartButton(roomId);

  if (unlistenRoom) unlistenRoom();
  unlistenRoom = listenRoom(roomId, (room) => handleRoomUpdate(room, roomId));
}

function bindStartButton(roomId) {
  const btn = document.getElementById('start-btn');
  if (!btn) return;
  const clone = btn.cloneNode(true);
  btn.parentNode.replaceChild(clone, btn);
  clone.disabled = true;
  clone.addEventListener('click', async () => {
    try {
      // Разделяем фазы: сначала назначаем роли, затем переводим комнату в 'upgrade'
      if (typeof pickRoles === 'function') {
        await pickRoles(roomId);
      }
      await update(ref(db, `rooms/${roomId}`), { state: 'upgrade' });
    } catch (e) {
      alert('Ошибка старта: ' + e.message);
    }
  });
}

function handleRoomUpdate(room, roomId) {
  if (!room) return;
  room.id = roomId;

  // Обновление лобби
  updateLobby(room, currentUid);

  const isHost = room.host === currentUid;
  const playersCount = room.players ? Object.keys(room.players).length : 0;
  const state = room.state || 'lobby';

  if (state === 'lobby') {
    enableStartButton(
      isHost &&
      playersCount >= (MIN_PLAYERS || 2) &&
      playersCount <= (MAX_PLAYERS || 4)
    );
    if (window.__currentScreen !== 'lobby-screen') showScreen('lobby-screen');
    updateLobbyStatus(playersCount < (MIN_PLAYERS || 2) ? 'Ожидание игроков...' : '');
    return;
  }

  if (state === 'upgrade') {
    if (window.__currentScreen !== 'upgrade-screen') {
      setupUpgradePhase(room, roomId);
    }
    updateUpgradeProgress(room);
    maybeStartGame(room, roomId, isHost);
    return;
  }

  if (state === 'playing') {
    if (!gameInstance) {
      startPlaying(room, roomId);
    }
    return;
  }

  if (state === 'finished') {
    if (gameInstance) {
      gameInstance.stop();
      gameInstance = null;
    }
    showEndScreen(room.winner);
  }
}

function setupUpgradePhase(room, roomId) {
  const me = room.players?.[currentUid];
  setUpgradeRole(me?.role);
  showUpgradeScreen(async (text) => {
    const res = UpgradeManager.validateUpgrade(text);
    if (!res.valid) {
      showUpgradeMessage(res.error, true);
      return;
    }
    showUpgradeMessage('Улучшение принято!', false);
    await update(ref(db, `rooms/${roomId}/players/${currentUid}`), {
      upgrade: res.parsed,
      upgradeSubmitted: true
    });
  });
  upgradeHandlerAttached = true;
}

function updateUpgradeProgress(room) {
  const players = room.players || {};
  const total = Object.keys(players).length;
  const done = Object.values(players).filter(p => p.upgradeSubmitted).length;
  setUpgradeProgress(`Готовы: ${done}/${total}`);

  // Заблокировать ввод, если уже отправили
  if (players[currentUid]?.upgradeSubmitted) {
    const ta = document.getElementById('upgrade-input');
    const btn = document.getElementById('upgrade-submit');
    if (ta) ta.disabled = true;
    if (btn) btn.disabled = true;
  }
}

async function maybeStartGame(room, roomId, isHost) {
  const players = room.players || {};
  const ids = Object.keys(players);
  if (ids.length === 0) return;
  const allReady = ids.every(id => players[id].upgradeSubmitted);
  if (!allReady) return;
  if (!isHost) return; // решение принимает только хост
  if (room.state !== 'upgrade') return;

  try {
    await startGame(roomId);
    // Страховка: если startGame не установил state='playing'
    const snap = await get(ref(db, `rooms/${roomId}/state`));
    if (snap.val() !== 'playing') {
      await update(ref(db, `rooms/${roomId}`), { state: 'playing' });
    }
  } catch (e) {
    console.error('startGame error:', e);
    await update(ref(db, `rooms/${roomId}`), { state: 'playing' });
  }
}

function startPlaying(room, roomId) {
  gameInstance = new Game({
    roomId,
    uid: currentUid,
    room,
    onFinish: (winner) => {
      // Хост закрывает игру — остальные узнают через onValue
      if (room.host === currentUid && room.state === 'playing') {
        update(ref(db, `rooms/${roomId}`), { state: 'finished', winner })
          .catch(() => {});
      }
    }
  });
  gameInstance.start();
  showScreen('game-screen');
}

init();
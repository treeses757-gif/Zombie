// Управление комнатами: создание, вход, подписка, распределение ролей, старт.
// Схема данных в Realtime Database:
// rooms/{roomId}/
//   host: uid
//   state: 'lobby' | 'upgrade' | 'playing' | 'finished'
//   survivorId: uid
//   winner: 'survivor' | 'zombies'
//   createdAt: ts
//   players/{uid}/
//     name, role, pos{x,y}, hp, alive, upgrade, upgradeSubmitted

import {
  db, auth, ref, set, get, update, remove,
  onValue, onDisconnect, serverTimestamp
} from './firebase.js';

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

// Генерация ID комнаты: 6 заглавных букв/цифр
function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// Создать комнату. Возвращает { roomId }.
export async function createRoom(name = 'Игрок') {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Нет авторизации');

  // Генерируем уникальный roomId (проверяем, что не занят)
  let roomId;
  let tries = 0;
  do {
    roomId = generateRoomId();
    const snap = await get(ref(db, `rooms/${roomId}`));
    if (!snap.exists()) break;
    tries++;
  } while (tries < 5);

  const roomRef = ref(db, `rooms/${roomId}`);
  await set(roomRef, {
    host: uid,
    state: 'lobby',
    createdAt: serverTimestamp(),
    players: {
      [uid]: {
        name,
        role: null,
        hp: 100,
        alive: true,
        upgradeSubmitted: false
      }
    }
  });

  // Автоудаление игрока при отключении
  const myRef = ref(db, `rooms/${roomId}/players/${uid}`);
  await onDisconnect(myRef).remove();

  return { roomId };
}

// Присоединиться к существующей комнате.
export async function joinRoom(roomId, name = 'Игрок') {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Нет авторизации');
  roomId = roomId.toUpperCase();

  const roomSnap = await get(ref(db, `rooms/${roomId}`));
  if (!roomSnap.exists()) throw new Error('Комната не найдена');

  const room = roomSnap.val();
  if (room.state !== 'lobby') throw new Error('Игра уже началась');

  const players = room.players || {};
  const count = Object.keys(players).length;
  if (count >= MAX_PLAYERS && !players[uid]) {
    throw new Error('Комната заполнена');
  }

  await update(ref(db, `rooms/${roomId}/players/${uid}`), {
    name,
    role: null,
    hp: 100,
    alive: true,
    upgradeSubmitted: false
  });

  const myRef = ref(db, `rooms/${roomId}/players/${uid}`);
  await onDisconnect(myRef).remove();

  return { roomId };
}

// Подписка на изменения комнаты. Возвращает unsubscribe.
export function listenRoom(roomId, callback) {
  const roomRef = ref(db, `rooms/${roomId}`);
  return onValue(roomRef, (snap) => {
    const data = snap.val();
    if (!data) {
      callback(null);
      return;
    }
    callback(data);
  });
}

// Случайно выбрать выжившего и назначить роли зомби.
// 2 игрока: survivor + attacker
// 3 игрока: survivor + attacker + support
// 4 игрока: survivor + attacker + tank + support
export async function pickRoles(roomId) {
  const snap = await get(ref(db, `rooms/${roomId}/players`));
  if (!snap.exists()) throw new Error('Нет игроков');
  const players = snap.val();
  const ids = Object.keys(players);
  if (ids.length < MIN_PLAYERS) throw new Error('Мало игроков');

  // Случайный выживший
  const survivorId = ids[Math.floor(Math.random() * ids.length)];
  const zombieIds = ids.filter(id => id !== survivorId);

  // Типы зомби в зависимости от числа игроков
  let zombieTypes;
  if (ids.length === 2) zombieTypes = ['attacker'];
  else if (ids.length === 3) zombieTypes = ['attacker', 'support'];
  else zombieTypes = ['attacker', 'tank', 'support'];

  const updates = {};
  updates[`survivorId`] = survivorId;

  updates[`players/${survivorId}/role`] = 'survivor';
  updates[`players/${survivorId}/hp`] = 100;
  updates[`players/${survivorId}/alive`] = true;

  // Перемешаем типы, чтобы распределение не было предсказуемым по порядку
  const shuffled = [...zombieTypes].sort(() => Math.random() - 0.5);

  zombieIds.forEach((id, idx) => {
    const type = shuffled[idx] || 'attacker';
    const role =
      type === 'tank'    ? 'zombie_tank' :
      type === 'support' ? 'zombie_support' :
                           'zombie_attacker';
    updates[`players/${id}/role`] = role;
    updates[`players/${id}/hp`] = 100;
    updates[`players/${id}/alive`] = true;
  });

  await update(ref(db, `rooms/${roomId}`), updates);
}

// Начать игру: перевод комнаты в состояние 'playing'.
export async function startGame(roomId) {
  // Проверим, что роли назначены
  const snap = await get(ref(db, `rooms/${roomId}`));
  if (!snap.exists()) throw new Error('Комната не найдена');
  const room = snap.val();
  if (!room.survivorId) throw new Error('Роли не назначены');

  // Сброс позиций, чтобы каждый клиент стартовал «с чистого листа»
  const players = room.players || {};
  const updates = { state: 'playing', winner: null };
  for (const pid of Object.keys(players)) {
    updates[`players/${pid}/pos`] = null;
    updates[`players/${pid}/alive`] = true;
  }
  await update(ref(db, `rooms/${roomId}`), updates);
}